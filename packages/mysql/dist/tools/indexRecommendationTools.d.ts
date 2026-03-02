import { SecurityLayer } from "../security/securityLayer";
export declare class IndexRecommendationTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    private validateDatabaseAccess;
    recommendIndexes(params?: {
        database?: string;
        max_query_patterns?: number;
        max_recommendations?: number;
        min_execution_count?: number;
        min_avg_time_ms?: number;
        include_unused_index_warnings?: boolean;
    }): Promise<{
        status: string;
        data?: {
            database: string;
            analyzed_query_patterns: number;
            recommendations: Array<{
                table_name: string;
                columns: string[];
                proposed_index_name: string;
                create_index_sql: string;
                reason: string;
                supporting_query_patterns: Array<{
                    query_pattern: string;
                    execution_count: number;
                    avg_execution_time_ms: number;
                }>;
            }>;
            unused_index_warnings?: Array<{
                table_schema: string;
                table_name: string;
                index_name: string;
                note: string;
            }>;
            notes: string[];
        };
        error?: string;
    }>;
    private bumpCounts;
    private pickIndexColumns;
    private buildReasonString;
    private makeIndexName;
    private isCoveredByExistingIndex;
    private getExistingIndexMap;
    private getTopSelectDigests;
    private getUnusedIndexes;
    private parseQueryPattern;
}
