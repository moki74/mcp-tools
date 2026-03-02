import { SecurityLayer } from "../security/securityLayer";
export declare class AnalysisTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    /**
     * Validate database access - ensures only the connected database can be accessed
     */
    private validateDatabaseAccess;
    /**
     * Get statistics for a specific column
     */
    getColumnStatistics(params: {
        table_name: string;
        column_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Build a compact, schema-aware context pack for RAG (tables, PK/FK, columns, row estimates)
     */
    getSchemaRagContext(params?: {
        database?: string;
        max_tables?: number;
        max_columns?: number;
        include_relationships?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
