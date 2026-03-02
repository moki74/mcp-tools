import SecurityLayer from "../security/securityLayer";
/**
 * Backup and Restore Tools for MySQL MCP Server
 * Provides database backup (SQL dump generation) and restore functionality
 */
export declare class BackupRestoreTools {
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
     * Get CREATE TABLE statement for a table
     */
    getCreateTableStatement(params: {
        table_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Backup a single table to SQL dump format
     */
    backupTable(params: {
        table_name: string;
        include_data?: boolean;
        include_drop?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Backup entire database schema and optionally data
     */
    backupDatabase(params: {
        include_data?: boolean;
        include_drop?: boolean;
        tables?: string[];
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Restore database from SQL dump
     * Executes SQL statements from the provided SQL dump string
     */
    restoreFromSql(params: {
        sql_dump: string;
        stop_on_error?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Parse SQL dump into individual statements
     */
    private parseSqlStatements;
    /**
     * Get database schema overview (all CREATE statements)
     */
    getDatabaseSchema(params: {
        database?: string;
        include_views?: boolean;
        include_procedures?: boolean;
        include_functions?: boolean;
        include_triggers?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
