import { SecurityLayer } from "../security/securityLayer";
export declare class IndexTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    /**
     * Validate database access - ensures only the connected database can be accessed
     */
    private validateDatabaseAccess;
    /**
     * List all indexes for a table
     */
    listIndexes(params: {
        table_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    /**
     * Get detailed information about a specific index
     */
    getIndexInfo(params: {
        table_name: string;
        index_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Create a new index
     */
    createIndex(params: {
        table_name: string;
        index_name: string;
        columns: Array<string | {
            column: string;
            length?: number;
            order?: "ASC" | "DESC";
        }>;
        unique?: boolean;
        index_type?: "BTREE" | "HASH" | "FULLTEXT" | "SPATIAL";
        comment?: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Drop an index
     */
    dropIndex(params: {
        table_name: string;
        index_name: string;
        database?: string;
    }): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
    /**
     * Analyze index usage and statistics
     */
    analyzeIndex(params: {
        table_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
