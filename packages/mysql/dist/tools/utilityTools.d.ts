export declare class UtilityTools {
    private db;
    constructor();
    /**
     * Returns the current database connection info
     */
    describeConnection(): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Tests the DB connection and returns latency
     */
    testConnection(): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Detects and describes foreign key relationships between tables
     */
    getTableRelationships(params: {
        table_name: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Gets foreign key relationships for ALL tables in a single call
     * Processes relationships in memory to avoid multiple queries
     */
    getAllTablesRelationships(params?: {
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Lists all available tools in this MySQL MCP server
     */
    listAllTools(): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Reads the CHANGELOG.md file from the project root
     */
    readChangelog(params?: {
        version?: string;
        limit?: number;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
