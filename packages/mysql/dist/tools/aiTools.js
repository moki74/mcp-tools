"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiTools = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const explainAnalyzer_1 = require("../optimization/explainAnalyzer");
const queryOptimizer_1 = require("../optimization/queryOptimizer");
class AiTools {
    constructor(security) {
        this.db = connection_1.default.getInstance();
        this.security = security;
        this.analyzer = explainAnalyzer_1.ExplainAnalyzer.getInstance();
        this.optimizer = queryOptimizer_1.QueryOptimizer.getInstance();
    }
    /**
     * guided_query_fixer
     * Analyzes a query (and optional error) to suggest repairs or optimizations using EXPLAIN.
     */
    async repairQuery(params) {
        const { query, error_message } = params;
        // 1. If there is a syntax error provided, we can't run EXPLAIN.
        // We try to provided simple heuristics or just return the analysis of the error.
        if (error_message) {
            return {
                status: "success",
                suggestions: [
                    "Check SQL syntax matching your MySQL version.",
                    "Verify table and column names using 'list_tables' or 'read_table_schema'.",
                    "Ensure string literals are quoted correctly."
                ],
                fixed_query: query, // We can't auto-fix syntax errors reliably without an LLM
                analysis: {
                    issue: "Syntax/Execution Error",
                    details: error_message
                }
            };
        }
        // 2. Validate query generally (security check)
        // We assume this tool is used by an agent who might have 'read' permissions at least.
        // If the query is unsafe (e.g. injection), we return that.
        const validation = this.security.validateQuery(query, true); // validate with execute permission simulation to check structure
        if (!validation.valid) {
            return {
                status: "error",
                error: `Query rejected by security layer: ${validation.error}`
            };
        }
        // 3. Run EXPLAIN
        try {
            const explainQuery = `EXPLAIN FORMAT=JSON ${query}`;
            // Note: We use the raw connection or executeWriteQuery equivalent.
            // But EXPLAIN is safe-ish if the inner query is safe.
            // validation passed, so we try EXPLAIN.
            const explainResult = await this.db.query(explainQuery);
            const analysis = this.analyzer.analyze(explainResult);
            // 4. Try to apply simple fixes based on analysis (e.g. Missing Limit)
            let fixedQuery = query;
            if (analysis.complexity === "HIGH" && !query.toLowerCase().includes("limit")) {
                // Suggest adding LIMIT if not present and complexity is high
                analysis.suggestions.push("Consider adding 'LIMIT 100' to prevent massive data transfer.");
            }
            return {
                status: "success",
                analysis: analysis,
                suggestions: analysis.suggestions,
                fixed_query: fixedQuery
            };
        }
        catch (e) {
            return {
                status: "error",
                error: `Failed to analyze query: ${e.message}`,
                suggestions: ["Verify the query is valid SQL before analyzing."]
            };
        }
    }
}
exports.AiTools = AiTools;
