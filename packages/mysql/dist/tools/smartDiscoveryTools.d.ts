import { SecurityLayer } from "../security/securityLayer";
/**
 * Smart Data Discovery Agent
 * Finds relevant tables/columns using semantic search and pattern matching
 * Discovers hidden relationships automatically
 */
export declare class SmartDiscoveryTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    /**
     * Validate database access - ensures only the connected database can be accessed
     */
    private validateDatabaseAccess;
    /**
     * Smart search across database objects (tables, columns, data patterns)
     */
    smartSearch(params: {
        search_term: string;
        search_type?: "column" | "table" | "data_pattern" | "relationship" | "all";
        similarity_threshold?: number;
        include_sample_data?: boolean;
        max_results?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            search_term: string;
            search_type: string;
            results: {
                tables: Array<{
                    name: string;
                    relevance_score: number;
                    match_reason: string;
                    column_count: number;
                    row_estimate: number;
                    matching_columns?: string[];
                }>;
                columns: Array<{
                    table_name: string;
                    column_name: string;
                    data_type: string;
                    relevance_score: number;
                    match_reason: string;
                    sample_values?: any[];
                }>;
                data_patterns: Array<{
                    table_name: string;
                    column_name: string;
                    pattern_type: string;
                    description: string;
                    sample_matches?: any[];
                }>;
                relationships: Array<{
                    from_table: string;
                    from_column: string;
                    to_table: string;
                    to_column: string;
                    relationship_type: string;
                    confidence: number;
                }>;
            };
            total_matches: number;
            search_time_ms: number;
        };
        error?: string;
    }>;
    /**
     * Find similar columns across tables (potential join candidates)
     */
    findSimilarColumns(params: {
        column_name?: string;
        table_name?: string;
        include_data_comparison?: boolean;
        max_results?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            reference_column?: {
                table: string;
                column: string;
                data_type: string;
            };
            similar_columns: Array<{
                table_name: string;
                column_name: string;
                data_type: string;
                similarity_score: number;
                similarity_type: string;
                data_overlap_percentage?: number;
            }>;
            potential_joins: Array<{
                table1: string;
                column1: string;
                table2: string;
                column2: string;
                confidence: number;
                reason: string;
            }>;
        };
        error?: string;
    }>;
    /**
     * Discover data relationships and patterns
     */
    discoverDataPatterns(params: {
        table_name: string;
        pattern_types?: Array<"unique" | "null" | "duplicate" | "format" | "range">;
        max_columns?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            table_name: string;
            patterns: Array<{
                column_name: string;
                pattern_type: string;
                description: string;
                metrics?: Record<string, any>;
                recommendations?: string[];
            }>;
            summary: {
                columns_analyzed: number;
                patterns_found: number;
                data_quality_score: number;
            };
        };
        error?: string;
    }>;
    /**
     * Tokenize a string into searchable tokens
     */
    private tokenize;
    /**
     * Calculate relevance score between search tokens and target
     */
    private calculateRelevanceScore;
    /**
     * Get a human-readable match reason
     */
    private getMatchReason;
    /**
     * Calculate name similarity using Levenshtein-like approach
     */
    private calculateNameSimilarity;
    /**
     * Normalize column name for comparison
     */
    private normalizeColumnName;
    /**
     * Get similarity type description
     */
    private getSimilarityType;
    /**
     * Calculate data overlap between two columns
     */
    private calculateDataOverlap;
    /**
     * Discover implicit relationships based on naming conventions
     */
    private discoverImplicitRelationships;
}
