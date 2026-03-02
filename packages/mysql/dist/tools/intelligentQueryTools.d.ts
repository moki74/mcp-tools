import { SecurityLayer } from "../security/securityLayer";
/**
 * Intelligent Query Assistant
 * Converts natural language to optimized SQL with context-aware query generation
 */
export declare class IntelligentQueryTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    /**
     * Validate database access - ensures only the connected database can be accessed
     */
    private validateDatabaseAccess;
    /**
     * Build a natural language query based on intent and context
     * This is the core "Intelligent Query Assistant" feature
     */
    buildQueryFromIntent(params: {
        natural_language: string;
        context?: "analytics" | "reporting" | "data_entry" | "schema_exploration";
        max_complexity?: "simple" | "medium" | "complex";
        safety_level?: "strict" | "moderate" | "permissive";
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            generated_sql: string;
            explanation: string;
            tables_involved: string[];
            columns_involved: string[];
            estimated_complexity: string;
            safety_notes: string[];
            optimization_hints: string[];
            alternatives?: string[];
        };
        error?: string;
    }>;
    /**
     * Get database schema context for query generation
     */
    private getSchemaContext;
    /**
     * Analyze natural language intent
     */
    private analyzeIntent;
    /**
     * Check if a word is a common stop word
     */
    private isStopWord;
    /**
     * Match intent entities to actual schema objects
     */
    private matchEntitiesToSchema;
    /**
     * Calculate similarity score between two strings (simple Jaccard-like)
     */
    private similarityScore;
    /**
     * Generate SQL based on analysis
     */
    private generateSQL;
    /**
     * Estimate query complexity
     */
    private estimateComplexity;
    /**
     * Generate optimization hints
     */
    private generateOptimizationHints;
    /**
     * Generate safety notes
     */
    private generateSafetyNotes;
    /**
     * Suggest query improvements
     */
    suggestQueryImprovements(params: {
        query: string;
        optimization_goal?: "speed" | "memory" | "readability";
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            original_query: string;
            suggestions: Array<{
                type: string;
                description: string;
                improved_query?: string;
            }>;
            estimated_improvement: string;
        };
        error?: string;
    }>;
}
