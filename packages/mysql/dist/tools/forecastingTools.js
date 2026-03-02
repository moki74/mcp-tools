"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForecastingTools = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const config_1 = require("../config/config");
class ForecastingTools {
    constructor(security) {
        this.db = connection_1.default.getInstance();
        this.security = security;
    }
    validateDatabaseAccess(requestedDatabase) {
        const connectedDatabase = config_1.dbConfig.database;
        if (!connectedDatabase) {
            return {
                valid: false,
                database: "",
                error: "No database configured. Please specify a database in your connection settings.",
            };
        }
        if (requestedDatabase && requestedDatabase !== connectedDatabase) {
            return {
                valid: false,
                database: "",
                error: `Access denied: You are connected to '${connectedDatabase}' but requested '${requestedDatabase}'. Cross-database access is not permitted.`,
            };
        }
        return { valid: true, database: connectedDatabase };
    }
    extractExplainNodes(explainJson) {
        const nodes = [];
        const visit = (obj) => {
            if (!obj || typeof obj !== "object")
                return;
            if (obj.table && typeof obj.table === "object") {
                const t = obj.table;
                nodes.push({
                    table_name: t.table_name,
                    access_type: t.access_type,
                    key: t.key,
                    rows_examined_per_scan: t.rows_examined_per_scan,
                    rows_produced_per_join: t.rows_produced_per_join,
                    filtered: t.filtered,
                });
            }
            for (const v of Object.values(obj)) {
                if (Array.isArray(v))
                    v.forEach(visit);
                else if (v && typeof v === "object")
                    visit(v);
            }
        };
        visit(explainJson);
        return nodes;
    }
    /**
     * Predict how query cost/scan volume might change under table growth assumptions.
     * This is heuristic-based and uses EXPLAIN FORMAT=JSON estimates.
     */
    async predictQueryPerformance(params) {
        try {
            const query = params.query;
            if (!query || typeof query !== "string") {
                return { status: "error", error: "query is required" };
            }
            if (!this.security.isReadOnlyQuery(query)) {
                return {
                    status: "error",
                    error: "Only read-only queries (SELECT/SHOW/DESCRIBE/EXPLAIN) are supported for prediction.",
                };
            }
            const growth = params.row_growth_multiplier ?? 2;
            if (!Number.isFinite(growth) || growth <= 0) {
                return { status: "error", error: "row_growth_multiplier must be > 0" };
            }
            const explainRows = await this.db.query(`EXPLAIN FORMAT=JSON ${query}`);
            let explainJson = null;
            let queryCost = null;
            if (explainRows[0] && explainRows[0].EXPLAIN) {
                try {
                    explainJson = JSON.parse(explainRows[0].EXPLAIN);
                    const qc = explainJson?.query_block?.cost_info?.query_cost;
                    queryCost = qc !== undefined ? parseFloat(String(qc)) : null;
                }
                catch {
                    explainJson = explainRows;
                }
            }
            const nodes = explainJson ? this.extractExplainNodes(explainJson) : [];
            const perTable = params.per_table_row_growth || {};
            const tablePredictions = nodes
                .filter((n) => !!n.table_name)
                .map((n) => {
                const t = n.table_name;
                const factor = typeof perTable[t] === "number" && perTable[t] > 0
                    ? perTable[t]
                    : growth;
                const baseRows = n.rows_examined_per_scan ?? n.rows_produced_per_join ?? null;
                const predictedRows = typeof baseRows === "number" ? Math.round(baseRows * factor) : null;
                return {
                    table_name: t,
                    access_type: n.access_type,
                    key: n.key,
                    base_rows_estimate: baseRows,
                    growth_factor: factor,
                    predicted_rows_estimate: predictedRows,
                };
            });
            const avgFactor = tablePredictions.length > 0
                ? tablePredictions.reduce((acc, t) => acc + t.growth_factor, 0) /
                    tablePredictions.length
                : growth;
            const predictedCost = typeof queryCost === "number" && Number.isFinite(queryCost)
                ? parseFloat((queryCost * avgFactor).toFixed(4))
                : null;
            const worstScan = tablePredictions.reduce((max, t) => Math.max(max, t.predicted_rows_estimate || 0), 0);
            let risk = "low";
            if (worstScan > 1000000)
                risk = "high";
            else if (worstScan > 100000)
                risk = "medium";
            const recommendations = [];
            for (const t of tablePredictions) {
                if ((t.access_type || "").toUpperCase() === "ALL") {
                    recommendations.push(`Table '${t.table_name}' is using a full scan (access_type=ALL). Consider adding an index aligned with WHERE/JOIN predicates.`);
                }
                if (!t.key && (t.predicted_rows_estimate || 0) > 100000) {
                    recommendations.push(`Table '${t.table_name}' has no chosen index in EXPLAIN and predicted scan is large; review indexing and query predicates.`);
                }
            }
            const data = {
                current_estimate: {
                    query_cost: queryCost,
                },
                growth_assumptions: {
                    row_growth_multiplier: growth,
                    per_table_row_growth: perTable,
                    cost_scaling_model: "cost ~ linear in average growth factor (heuristic)",
                },
                predicted_estimate: {
                    query_cost: predictedCost,
                },
                table_estimates: tablePredictions,
                risk,
                recommendations,
                notes: [
                    "This is an estimate based on MySQL EXPLAIN and simple scaling assumptions.",
                    "Validate with production-like data volumes and real timings.",
                ],
            };
            if (params.include_explain_json ?? false) {
                data.explain_json = explainJson;
            }
            return { status: "success", data };
        }
        catch (error) {
            return { status: "error", error: error.message };
        }
    }
    /**
     * Forecast database/table growth based on current sizes and user-supplied growth rate assumptions.
     */
    async forecastDatabaseGrowth(params = {}) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const database = dbValidation.database;
            const horizonDays = Math.min(Math.max(params.horizon_days ?? 30, 1), 3650);
            let baseDailyRate = null;
            if (typeof params.growth_rate_percent_per_day === "number") {
                baseDailyRate = params.growth_rate_percent_per_day / 100;
            }
            else if (typeof params.growth_rate_percent_per_month === "number") {
                const monthly = params.growth_rate_percent_per_month / 100;
                // Convert to approx daily compound rate assuming 30-day month
                baseDailyRate = Math.pow(1 + monthly, 1 / 30) - 1;
            }
            const perTableRates = params.per_table_growth_rate_percent_per_day || {};
            if (baseDailyRate === null && Object.keys(perTableRates).length === 0) {
                return {
                    status: "error",
                    error: "Provide growth_rate_percent_per_day or growth_rate_percent_per_month, or per_table_growth_rate_percent_per_day.",
                };
            }
            const rows = await this.db.query(`
          SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
          ORDER BY TABLE_NAME
        `, [database]);
            const tableForecasts = rows.map((r) => {
                const table = r.TABLE_NAME;
                const currentRows = typeof r.TABLE_ROWS === "number"
                    ? r.TABLE_ROWS
                    : parseInt(String(r.TABLE_ROWS || "0"), 10) || 0;
                const dataBytes = typeof r.DATA_LENGTH === "number"
                    ? r.DATA_LENGTH
                    : parseInt(String(r.DATA_LENGTH || "0"), 10) || 0;
                const indexBytes = typeof r.INDEX_LENGTH === "number"
                    ? r.INDEX_LENGTH
                    : parseInt(String(r.INDEX_LENGTH || "0"), 10) || 0;
                const totalBytes = dataBytes + indexBytes;
                const dailyRate = typeof perTableRates[table] === "number"
                    ? perTableRates[table] / 100
                    : baseDailyRate || 0;
                const growthFactor = Math.pow(1 + dailyRate, horizonDays);
                const forecastRows = Math.round(currentRows * growthFactor);
                const forecastTotalBytes = Math.round(totalBytes * growthFactor);
                return {
                    table_name: table,
                    current: {
                        row_estimate: currentRows,
                        total_size_bytes: totalBytes,
                        data_size_bytes: dataBytes,
                        index_size_bytes: indexBytes,
                    },
                    assumptions: {
                        daily_growth_rate_percent: dailyRate * 100,
                        horizon_days: horizonDays,
                    },
                    forecast: {
                        row_estimate: forecastRows,
                        total_size_bytes: forecastTotalBytes,
                    },
                };
            });
            const totals = {
                current_total_bytes: tableForecasts.reduce((acc, t) => acc + t.current.total_size_bytes, 0),
                forecast_total_bytes: tableForecasts.reduce((acc, t) => acc + t.forecast.total_size_bytes, 0),
            };
            return {
                status: "success",
                data: {
                    database,
                    horizon_days: horizonDays,
                    base_growth_rate_percent_per_day: baseDailyRate === null ? null : baseDailyRate * 100,
                    per_table_growth_rate_percent_per_day: perTableRates,
                    totals,
                    tables: tableForecasts,
                    notes: [
                        "Forecast uses simple exponential growth from current INFORMATION_SCHEMA sizes.",
                        "Row counts and sizes are estimates and may be stale depending on storage engine/statistics.",
                    ],
                },
            };
        }
        catch (error) {
            return { status: "error", error: error.message };
        }
    }
}
exports.ForecastingTools = ForecastingTools;
