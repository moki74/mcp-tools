"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexRecommendationTools = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const config_1 = require("../config/config");
class IndexRecommendationTools {
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
                error: "No database specified in connection string. Cannot access any database.",
            };
        }
        if (!requestedDatabase) {
            return {
                valid: true,
                database: connectedDatabase,
            };
        }
        if (requestedDatabase !== connectedDatabase) {
            return {
                valid: false,
                database: "",
                error: `Access denied. You can only access the connected database '${connectedDatabase}'. Requested database '${requestedDatabase}' is not allowed.`,
            };
        }
        return {
            valid: true,
            database: connectedDatabase,
        };
    }
    async recommendIndexes(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const database = dbValidation.database;
            const maxQueryPatterns = Math.min(Math.max(params?.max_query_patterns ?? 25, 1), 200);
            const maxRecommendations = Math.min(Math.max(params?.max_recommendations ?? 25, 1), 200);
            const minExecCount = Math.max(params?.min_execution_count ?? 5, 1);
            const minAvgMs = Math.max(params?.min_avg_time_ms ?? 5, 0);
            const includeUnused = params?.include_unused_index_warnings ?? false;
            const notes = [
                "Recommendations are heuristic-based and should be validated with EXPLAIN and real workload testing.",
                "Composite index order matters: equality predicates first, then range/order/group columns.",
            ];
            // 1) Collect query patterns from performance_schema digests
            let digests = [];
            try {
                digests = await this.getTopSelectDigests(maxQueryPatterns);
            }
            catch (e) {
                return {
                    status: "error",
                    error: "Unable to read performance_schema digests. Ensure performance_schema is enabled and the MySQL user has access.",
                };
            }
            const filteredDigests = digests.filter((d) => (d.execution_count || 0) >= minExecCount &&
                (d.avg_execution_time_sec || 0) * 1000 >= minAvgMs);
            if (filteredDigests.length === 0) {
                return {
                    status: "success",
                    data: {
                        database,
                        analyzed_query_patterns: 0,
                        recommendations: [],
                        notes: [
                            ...notes,
                            "No qualifying SELECT query patterns found (consider lowering min_execution_count/min_avg_time_ms or generating workload).",
                        ],
                    },
                };
            }
            // 2) Load schema columns + existing indexes
            const existingIndexes = await this.getExistingIndexMap(database);
            // 3) Parse query patterns, build per-table column usage signals
            const usageByTable = new Map();
            for (const d of filteredDigests) {
                const parsed = this.parseQueryPattern(d.query_pattern);
                for (const [table, signals] of Object.entries(parsed.byTable)) {
                    const tableLower = table;
                    if (!usageByTable.has(tableLower)) {
                        usageByTable.set(tableLower, {
                            equalityCols: new Map(),
                            rangeCols: new Map(),
                            orderCols: new Map(),
                            groupCols: new Map(),
                            supporting: [],
                        });
                    }
                    const agg = usageByTable.get(tableLower);
                    agg.supporting.push(d);
                    this.bumpCounts(agg.equalityCols, signals.equalityCols);
                    this.bumpCounts(agg.rangeCols, signals.rangeCols);
                    this.bumpCounts(agg.orderCols, signals.orderCols);
                    this.bumpCounts(agg.groupCols, signals.groupCols);
                }
            }
            // 4) Generate candidate indexes
            const recommendations = [];
            for (const [table, agg] of usageByTable.entries()) {
                // Only recommend for tables in the connected schema
                if (!existingIndexes.has(table)) {
                    continue;
                }
                const columns = this.pickIndexColumns(agg);
                if (columns.length === 0)
                    continue;
                // Validate identifier safety
                if (!this.security.validateIdentifier(table).valid)
                    continue;
                const safeCols = columns.filter((c) => this.security.validateIdentifier(c).valid);
                if (safeCols.length === 0)
                    continue;
                // Skip if an existing index already covers the prefix
                const existing = existingIndexes.get(table);
                if (this.isCoveredByExistingIndex(existing, safeCols)) {
                    continue;
                }
                const proposedName = this.makeIndexName(table, safeCols);
                const createSql = "CREATE INDEX `" +
                    proposedName +
                    "` ON `" +
                    database +
                    "`.`" +
                    table +
                    "` (" +
                    safeCols.map((c) => "`" + c + "`").join(", ") +
                    ");";
                const reason = this.buildReasonString(agg, safeCols);
                const supporting = agg.supporting
                    .slice(0, 5)
                    .map((s) => ({
                    query_pattern: s.query_pattern,
                    execution_count: s.execution_count,
                    avg_execution_time_ms: Math.round((s.avg_execution_time_sec || 0) * 1000 * 1000) / 1000,
                }));
                recommendations.push({
                    table_name: table,
                    columns: safeCols,
                    proposed_index_name: proposedName,
                    create_index_sql: createSql,
                    reason,
                    supporting_query_patterns: supporting,
                });
            }
            // Simple prioritization: tables with more supporting patterns first
            recommendations.sort((a, b) => b.supporting_query_patterns.length - a.supporting_query_patterns.length);
            const sliced = recommendations.slice(0, maxRecommendations);
            let unusedIndexWarnings;
            if (includeUnused) {
                try {
                    const unused = await this.getUnusedIndexes();
                    unusedIndexWarnings = unused.map((u) => ({
                        table_schema: u.table_schema,
                        table_name: u.table_name,
                        index_name: u.index_name,
                        note: "Index appears unused per performance_schema. Validate before dropping; stats reset will affect this.",
                    }));
                }
                catch (e) {
                    notes.push(`Unused index warnings unavailable: ${e.message || "failed to query"}`);
                }
            }
            return {
                status: "success",
                data: {
                    database,
                    analyzed_query_patterns: filteredDigests.length,
                    recommendations: sliced,
                    ...(unusedIndexWarnings ? { unused_index_warnings: unusedIndexWarnings } : {}),
                    notes,
                },
            };
        }
        catch (error) {
            return { status: "error", error: error.message };
        }
    }
    bumpCounts(target, cols) {
        for (const c of cols) {
            target.set(c, (target.get(c) || 0) + 1);
        }
    }
    pickIndexColumns(agg) {
        const pickTop = (m, n) => Array.from(m.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, n)
            .map(([k]) => k);
        const eq = pickTop(agg.equalityCols, 3);
        const range = pickTop(agg.rangeCols, 1);
        const order = pickTop(agg.orderCols, 1);
        const group = pickTop(agg.groupCols, 1);
        const out = [];
        for (const c of [...eq, ...range, ...group, ...order]) {
            if (!out.includes(c))
                out.push(c);
            if (out.length >= 4)
                break;
        }
        return out;
    }
    buildReasonString(agg, cols) {
        const parts = [];
        const colSet = new Set(cols);
        const hits = (m) => Array.from(m.entries())
            .filter(([c]) => colSet.has(c))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([c, n]) => `${c}(${n})`);
        const eqHits = hits(agg.equalityCols);
        if (eqHits.length)
            parts.push(`frequent equality filters: ${eqHits.join(", ")}`);
        const rangeHits = hits(agg.rangeCols);
        if (rangeHits.length)
            parts.push(`range filters: ${rangeHits.join(", ")}`);
        const groupHits = hits(agg.groupCols);
        if (groupHits.length)
            parts.push(`GROUP BY: ${groupHits.join(", ")}`);
        const orderHits = hits(agg.orderCols);
        if (orderHits.length)
            parts.push(`ORDER BY: ${orderHits.join(", ")}`);
        return parts.length
            ? parts.join("; ")
            : "Based on observed query patterns in performance_schema";
    }
    makeIndexName(table, cols) {
        const base = `idx_${table}_${cols.join("_")}`;
        const name = base.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 64);
        return name;
    }
    isCoveredByExistingIndex(existing, proposedCols) {
        for (const idx of existing) {
            const prefix = idx.columns.slice(0, proposedCols.length);
            if (prefix.length === proposedCols.length &&
                prefix.every((c, i) => c === proposedCols[i])) {
                return true;
            }
        }
        return false;
    }
    async getExistingIndexMap(database) {
        const rows = await this.db.query(`
      SELECT TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX, COLUMN_NAME
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
    `, [database]);
        const byTable = new Map();
        for (const r of rows) {
            const table = r.TABLE_NAME;
            const idx = r.INDEX_NAME;
            const col = r.COLUMN_NAME;
            if (!table || !idx || !col)
                continue;
            if (!byTable.has(table))
                byTable.set(table, new Map());
            const byIndex = byTable.get(table);
            if (!byIndex.has(idx))
                byIndex.set(idx, []);
            byIndex.get(idx).push(col);
        }
        const out = new Map();
        for (const [table, idxMap] of byTable.entries()) {
            out.set(table, Array.from(idxMap.entries()).map(([index_name, columns]) => ({
                index_name,
                columns,
            })));
        }
        return out;
    }
    async getTopSelectDigests(limit) {
        // Note: performance_schema access may require extra privileges.
        const query = `
      SELECT
        DIGEST_TEXT as query_pattern,
        COUNT_STAR as execution_count,
        ROUND(AVG_TIMER_WAIT / 1000000000000, 6) as avg_execution_time_sec,
        ROUND(SUM_TIMER_WAIT / 1000000000000, 6) as total_execution_time_sec,
        SUM_ROWS_EXAMINED as rows_examined,
        SUM_ROWS_SENT as rows_sent,
        FIRST_SEEN as first_seen,
        LAST_SEEN as last_seen
      FROM performance_schema.events_statements_summary_by_digest
      WHERE DIGEST_TEXT IS NOT NULL
        AND DIGEST_TEXT LIKE 'SELECT %'
      ORDER BY SUM_TIMER_WAIT DESC
      LIMIT ${limit}
    `;
        const rows = await this.db.query(query);
        return rows.map((r) => ({
            query_pattern: r.query_pattern,
            execution_count: parseInt(r.execution_count || "0", 10) || 0,
            avg_execution_time_sec: parseFloat(r.avg_execution_time_sec || "0") || 0,
            total_execution_time_sec: parseFloat(r.total_execution_time_sec || "0") || 0,
            rows_examined: parseInt(r.rows_examined || "0", 10) || 0,
            rows_sent: parseInt(r.rows_sent || "0", 10) || 0,
            first_seen: r.first_seen,
            last_seen: r.last_seen,
        }));
    }
    async getUnusedIndexes() {
        const query = `
      SELECT
        t.TABLE_SCHEMA as table_schema,
        t.TABLE_NAME as table_name,
        s.INDEX_NAME as index_name
      FROM information_schema.STATISTICS s
      LEFT JOIN performance_schema.table_io_waits_summary_by_index_usage p
        ON s.TABLE_SCHEMA = p.OBJECT_SCHEMA
        AND s.TABLE_NAME = p.OBJECT_NAME
        AND s.INDEX_NAME = p.INDEX_NAME
      JOIN information_schema.TABLES t
        ON s.TABLE_SCHEMA = t.TABLE_SCHEMA
        AND s.TABLE_NAME = t.TABLE_NAME
      WHERE s.TABLE_SCHEMA NOT IN ('mysql', 'performance_schema', 'information_schema', 'sys')
        AND s.INDEX_NAME != 'PRIMARY'
        AND (p.INDEX_NAME IS NULL OR p.COUNT_STAR = 0)
        AND t.TABLE_TYPE = 'BASE TABLE'
      GROUP BY t.TABLE_SCHEMA, t.TABLE_NAME, s.INDEX_NAME
      ORDER BY t.TABLE_SCHEMA, t.TABLE_NAME, s.INDEX_NAME
    `;
        const rows = await this.db.query(query);
        return rows.map((r) => ({
            table_schema: r.table_schema,
            table_name: r.table_name,
            index_name: r.index_name,
        }));
    }
    parseQueryPattern(queryPattern) {
        const qp = (queryPattern || "").replace(/\s+/g, " ").trim();
        const upper = qp.toUpperCase();
        const byTable = {};
        // Very lightweight SQL-ish parsing (digest text is normalized already)
        const tableAliases = new Map(); // alias -> table
        const addTable = (table, alias) => {
            const t = table.replace(/[`"\[\]]/g, "");
            if (!t)
                return;
            if (!byTable[t]) {
                byTable[t] = { equalityCols: [], rangeCols: [], orderCols: [], groupCols: [] };
            }
            if (alias)
                tableAliases.set(alias, t);
            tableAliases.set(t, t);
        };
        const fromMatch = qp.match(/\bFROM\s+([a-zA-Z0-9_\.]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?/i);
        if (fromMatch)
            addTable(fromMatch[1], fromMatch[2]);
        for (const m of qp.matchAll(/\bJOIN\s+([a-zA-Z0-9_\.]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?/gi)) {
            addTable(m[1], m[2]);
        }
        const segment = (keyword, stop) => {
            const start = upper.indexOf(keyword);
            if (start === -1)
                return "";
            const after = start + keyword.length;
            const rest = qp.slice(after);
            const restUpper = rest.toUpperCase();
            let end = rest.length;
            for (const s of stop) {
                const idx = restUpper.indexOf(s);
                if (idx !== -1 && idx < end)
                    end = idx;
            }
            return rest.slice(0, end).trim();
        };
        const whereSeg = segment("WHERE", [" GROUP BY ", " ORDER BY ", " LIMIT "]);
        const groupSeg = segment("GROUP BY", [" ORDER BY ", " LIMIT "]);
        const orderSeg = segment("ORDER BY", [" LIMIT "]);
        const extractCols = (seg) => {
            if (!seg)
                return [];
            const out = [];
            // Try alias.column patterns first
            for (const m of seg.matchAll(/\b([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\b/g)) {
                const alias = m[1];
                const col = m[2];
                out.push({ table: tableAliases.get(alias) || alias, column: col });
            }
            // Fallback: bare columns in GROUP/ORDER lists (best-effort)
            if (out.length === 0) {
                for (const token of seg.split(/\s*,\s*/)) {
                    const c = token
                        .trim()
                        .replace(/\bASC\b|\bDESC\b/gi, "")
                        .replace(/[^a-zA-Z0-9_]/g, "")
                        .trim();
                    if (c)
                        out.push({ column: c });
                }
            }
            return out;
        };
        // WHERE: equality vs range-ish heuristics
        if (whereSeg) {
            // equality patterns
            for (const m of whereSeg.matchAll(/\b([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)\s*(=|IN\b|IS\b)\s*/gi)) {
                const [alias, col] = m[1].split(".");
                const table = tableAliases.get(alias) || alias;
                if (byTable[table])
                    byTable[table].equalityCols.push(col);
            }
            for (const m of whereSeg.matchAll(/\b([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)\s*(<|>|<=|>=|BETWEEN\b|LIKE\b)\s*/gi)) {
                const [alias, col] = m[1].split(".");
                const table = tableAliases.get(alias) || alias;
                if (byTable[table])
                    byTable[table].rangeCols.push(col);
            }
        }
        // JOIN ON clauses
        for (const m of qp.matchAll(/\bON\s+([^\n]+?)(?=\bJOIN\b|\bWHERE\b|\bGROUP\s+BY\b|\bORDER\s+BY\b|\bLIMIT\b|$)/gi)) {
            const onSeg = m[1];
            for (const colRef of extractCols(onSeg)) {
                if (colRef.table && byTable[colRef.table]) {
                    byTable[colRef.table].equalityCols.push(colRef.column);
                }
            }
        }
        // GROUP BY / ORDER BY
        for (const colRef of extractCols(groupSeg)) {
            if (colRef.table && byTable[colRef.table])
                byTable[colRef.table].groupCols.push(colRef.column);
        }
        for (const colRef of extractCols(orderSeg)) {
            if (colRef.table && byTable[colRef.table])
                byTable[colRef.table].orderCols.push(colRef.column);
        }
        // De-dup per table
        for (const t of Object.keys(byTable)) {
            byTable[t] = {
                equalityCols: Array.from(new Set(byTable[t].equalityCols)),
                rangeCols: Array.from(new Set(byTable[t].rangeCols)),
                orderCols: Array.from(new Set(byTable[t].orderCols)),
                groupCols: Array.from(new Set(byTable[t].groupCols)),
            };
        }
        return { byTable };
    }
}
exports.IndexRecommendationTools = IndexRecommendationTools;
