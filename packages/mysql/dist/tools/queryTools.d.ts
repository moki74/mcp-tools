import SecurityLayer from "../security/securityLayer";
import { QueryHints, QueryAnalysis } from "../optimization/queryOptimizer";
export declare class QueryTools {
    private db;
    private security;
    private optimizer;
    constructor(security: SecurityLayer);
    /**
     * Execute a safe read-only SELECT query with optional optimizer hints
     */
    runSelectQuery(queryParams: {
        query: string;
        params?: any[];
        hints?: QueryHints;
        useCache?: boolean;
        dry_run?: boolean;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
        optimizedQuery?: string;
        dry_run?: boolean;
        execution_plan?: any;
        estimated_cost?: string;
        message?: string;
    }>;
    /**
     * Analyze a query and get optimization suggestions
     */
    analyzeQuery(query: string): QueryAnalysis;
    /**
     * Get suggested hints for a specific optimization goal
     */
    getSuggestedHints(goal: "SPEED" | "MEMORY" | "STABILITY"): QueryHints;
    /**
     * Execute write operations (INSERT, UPDATE, DELETE) with validation
     * Note: DDL operations are blocked by the security layer for safety
     */
    executeWriteQuery(queryParams: {
        query: string;
        params?: any[];
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
