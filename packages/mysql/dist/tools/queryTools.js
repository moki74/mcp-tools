"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryTools = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const queryOptimizer_1 = require("../optimization/queryOptimizer");
const inputValidation_1 = require("../validation/inputValidation");
class QueryTools {
    constructor(security) {
        this.db = connection_1.default.getInstance();
        this.security = security;
        this.optimizer = queryOptimizer_1.QueryOptimizer.getInstance();
    }
    /**
     * Execute a safe read-only SELECT query with optional optimizer hints
     */
    async runSelectQuery(queryParams) {
        try {
            const { query, params = [], hints, useCache = true } = queryParams;
            // Validate query using new input validation
            const queryValidationResult = (0, inputValidation_1.validateQuery)({ query, params });
            if (!queryValidationResult.valid) {
                return {
                    status: "error",
                    error: `Query validation failed: ${queryValidationResult.errors?.join(', ') || 'Invalid query parameters'}`,
                };
            }
            // Check if user has execute permission to bypass dangerous keyword checks
            const hasExecutePermission = this.security.hasExecutePermission();
            // Validate query using security layer
            // If user has execute permission, allow advanced SQL features
            const securityQueryValidation = this.security.validateQuery(query, hasExecutePermission);
            if (!securityQueryValidation.valid) {
                return {
                    status: "error",
                    error: `Query validation failed: ${securityQueryValidation.error}`,
                };
            }
            // Ensure it's a SELECT query
            if (securityQueryValidation.queryType !== "SELECT") {
                return {
                    status: "error",
                    error: "Only SELECT queries are allowed with run_select_query. Use execute_write_query for other operations.",
                };
            }
            // Validate parameters
            const paramValidation = this.security.validateParameters(params);
            if (!paramValidation.valid) {
                return {
                    status: "error",
                    error: `Parameter validation failed: ${paramValidation.error}`,
                };
            }
            // Apply optimizer hints if provided
            let finalQuery = query;
            let optimizedQuery;
            if (hints) {
                finalQuery = this.optimizer.applyHints(query, hints);
                if (finalQuery !== query) {
                    optimizedQuery = finalQuery;
                }
            }
            // Handle dry_run: return query plan and cost estimate without executing
            if (queryParams.dry_run) {
                const explainQuery = `EXPLAIN FORMAT=JSON ${finalQuery}`;
                const explainResult = await this.db.query(explainQuery, paramValidation.sanitizedParams);
                // Try to get cost from JSON format
                let estimatedCost = "Unknown";
                let executionPlan = explainResult;
                if (explainResult[0] && explainResult[0].EXPLAIN) {
                    try {
                        const explainJson = JSON.parse(explainResult[0].EXPLAIN);
                        estimatedCost = explainJson.query_block?.cost_info?.query_cost || "Unknown";
                        executionPlan = explainJson;
                    }
                    catch (e) {
                        // Ignore parsing error
                    }
                }
                return {
                    status: "success",
                    data: [],
                    optimizedQuery,
                    dry_run: true,
                    execution_plan: executionPlan,
                    estimated_cost: estimatedCost,
                    message: "Dry run completed. Query was not executed."
                };
            }
            // Execute the query with sanitized parameters
            const results = await this.db.query(finalQuery, paramValidation.sanitizedParams, useCache);
            const maskedResults = this.security.masking.processResults(results);
            return {
                status: "success",
                data: maskedResults,
                optimizedQuery,
            };
        }
        catch (error) {
            return {
                status: "error",
                error: error.message,
            };
        }
    }
    /**
     * Analyze a query and get optimization suggestions
     */
    analyzeQuery(query) {
        return this.optimizer.analyzeQuery(query);
    }
    /**
     * Get suggested hints for a specific optimization goal
     */
    getSuggestedHints(goal) {
        return this.optimizer.getSuggestedHints(goal);
    }
    /**
     * Execute write operations (INSERT, UPDATE, DELETE) with validation
     * Note: DDL operations are blocked by the security layer for safety
     */
    async executeWriteQuery(queryParams) {
        try {
            const { query, params = [] } = queryParams;
            // Validate query using new input validation
            const queryValidationResult = (0, inputValidation_1.validateQuery)({ query, params });
            if (!queryValidationResult.valid) {
                return {
                    status: "error",
                    error: `Query validation failed: ${queryValidationResult.errors?.join(', ') || 'Invalid query parameters'}`,
                };
            }
            // Validate query using security layer
            // Pass true for bypassDangerousCheck since this is executeWriteQuery (requires 'execute' permission)
            const securityQueryValidation = this.security.validateQuery(query, true);
            if (!securityQueryValidation.valid) {
                return {
                    status: "error",
                    error: `Query validation failed: ${securityQueryValidation.error}`,
                };
            }
            // Ensure it's not a SELECT query (use runSelectQuery for that)
            if (securityQueryValidation.queryType === "SELECT") {
                return {
                    status: "error",
                    error: "SELECT queries should use run_select_query method instead of execute_write_query.",
                };
            }
            // Validate parameters
            const paramValidation = this.security.validateParameters(params);
            if (!paramValidation.valid) {
                return {
                    status: "error",
                    error: `Parameter validation failed: ${paramValidation.error}`,
                };
            }
            // Execute the query with sanitized parameters
            const result = await this.db.query(query, paramValidation.sanitizedParams);
            return {
                status: "success",
                data: {
                    affectedRows: result.affectedRows || 0,
                    insertId: result.insertId || null,
                },
            };
        }
        catch (error) {
            return {
                status: "error",
                error: error.message,
            };
        }
    }
}
exports.QueryTools = QueryTools;
