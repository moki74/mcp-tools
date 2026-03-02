import SecurityLayer from "../security/securityLayer";
/**
 * Data Migration Tools for MySQL MCP Server
 * Provides utilities for copying, moving, and transforming data between tables
 */
export declare class MigrationTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    /**
     * Validate database access
     */
    private validateDatabaseAccess;
    /**
     * Escape string value for SQL
     */
    private escapeValue;
    /**
     * Copy data from one table to another within the same database
     */
    copyTableData(params: {
        source_table: string;
        target_table: string;
        column_mapping?: Record<string, string>;
        where_clause?: string;
        truncate_target?: boolean;
        batch_size?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Move data from one table to another (copy + delete from source)
     */
    moveTableData(params: {
        source_table: string;
        target_table: string;
        column_mapping?: Record<string, string>;
        where_clause?: string;
        batch_size?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Clone a table structure (with or without data)
     */
    cloneTable(params: {
        source_table: string;
        new_table_name: string;
        include_data?: boolean;
        include_indexes?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Compare structure of two tables
     */
    compareTableStructure(params: {
        table1: string;
        table2: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Sync data between two tables based on a key column
     */
    syncTableData(params: {
        source_table: string;
        target_table: string;
        key_column: string;
        columns_to_sync?: string[];
        sync_mode?: "insert_only" | "update_only" | "upsert";
        batch_size?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
