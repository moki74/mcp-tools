/**
 * MySQL Query Optimization Hints
 *
 * Supports MySQL 8.0+ optimizer hints and provides query analysis
 * for performance optimization suggestions.
 */
/**
 * Available optimizer hint types for MySQL 8.0+
 */
export type OptimizerHintType = "JOIN_FIXED_ORDER" | "JOIN_ORDER" | "JOIN_PREFIX" | "JOIN_SUFFIX" | "BKA" | "NO_BKA" | "BNL" | "NO_BNL" | "HASH_JOIN" | "NO_HASH_JOIN" | "MERGE" | "NO_MERGE" | "INDEX" | "NO_INDEX" | "INDEX_MERGE" | "NO_INDEX_MERGE" | "MRR" | "NO_MRR" | "NO_ICP" | "NO_RANGE_OPTIMIZATION" | "SKIP_SCAN" | "NO_SKIP_SCAN" | "SEMIJOIN" | "NO_SEMIJOIN" | "SUBQUERY" | "SQL_NO_CACHE" | "SQL_CACHE" | "MAX_EXECUTION_TIME" | "RESOURCE_GROUP" | "SET_VAR";
/**
 * Optimizer hint configuration
 */
export interface OptimizerHint {
    type: OptimizerHintType;
    table?: string;
    index?: string | string[];
    value?: string | number;
    tables?: string[];
    strategy?: string;
}
/**
 * Query optimization hints configuration
 */
export interface QueryHints {
    hints?: OptimizerHint[];
    forceIndex?: string | string[];
    ignoreIndex?: string | string[];
    useIndex?: string | string[];
    maxExecutionTime?: number;
    straightJoin?: boolean;
    noCache?: boolean;
    highPriority?: boolean;
    sqlBigResult?: boolean;
    sqlSmallResult?: boolean;
    sqlBufferResult?: boolean;
    sqlCalcFoundRows?: boolean;
}
/**
 * Query analysis result
 */
export interface QueryAnalysis {
    originalQuery: string;
    queryType: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "OTHER";
    tables: string[];
    hasJoins: boolean;
    hasSubqueries: boolean;
    hasGroupBy: boolean;
    hasOrderBy: boolean;
    hasLimit: boolean;
    estimatedComplexity: "LOW" | "MEDIUM" | "HIGH";
    suggestions: OptimizationSuggestion[];
}
/**
 * Optimization suggestion
 */
export interface OptimizationSuggestion {
    type: "INDEX" | "HINT" | "REWRITE" | "STRUCTURE";
    priority: "LOW" | "MEDIUM" | "HIGH";
    description: string;
    suggestedAction: string;
    hint?: OptimizerHint;
}
/**
 * Query Optimizer class
 * Provides MySQL query optimization hints and analysis
 */
export declare class QueryOptimizer {
    private static instance;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): QueryOptimizer;
    /**
     * Escape special regex characters in a string
     */
    private escapeRegex;
    /**
     * Sanitize identifier (table name, index name) to prevent injection
     * Only allows alphanumeric characters, underscores, and dots (for schema.table)
     */
    private sanitizeIdentifier;
    /**
     * Validate that an identifier is safe to use
     */
    private isValidIdentifier;
    /**
     * Apply optimizer hints to a SELECT query
     */
    applyHints(query: string, hints: QueryHints): string;
    /**
     * Build the optimizer hint block string
     */
    private buildHintBlock;
    /**
     * Format a single optimizer hint
     */
    private formatHint;
    /**
     * Apply traditional USE INDEX / FORCE INDEX / IGNORE INDEX syntax
     */
    private applyIndexHintsTraditional;
    /**
     * Analyze a query and provide optimization suggestions
     */
    analyzeQuery(query: string): QueryAnalysis;
    /**
     * Extract table names from a query
     */
    private extractTables;
    /**
     * Check if a word is a SQL keyword
     */
    private isKeyword;
    /**
     * Generate optimization suggestions based on query analysis
     */
    private generateSuggestions;
    /**
     * Get suggested hints for a specific optimization goal
     */
    getSuggestedHints(goal: "SPEED" | "MEMORY" | "STABILITY"): QueryHints;
}
export default QueryOptimizer;
