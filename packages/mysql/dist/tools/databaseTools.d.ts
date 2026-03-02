import { TableInfo, ColumnInfo } from "../validation/schemas";
export declare class DatabaseTools {
    private db;
    constructor();
    /**
     * List only the connected database (security restriction)
     * This prevents access to other databases on the MySQL server
     */
    listDatabases(): Promise<{
        status: string;
        data?: string[];
        error?: string;
    }>;
    /**
     * List all tables in the selected database
     */
    listTables(params: {
        database?: string;
    }): Promise<{
        status: string;
        data?: TableInfo[];
        error?: string;
    }>;
    /**
     * Read table schema (columns, types, keys, etc.)
     */
    readTableSchema(params: {
        table_name: string;
    }): Promise<{
        status: string;
        data?: ColumnInfo[];
        error?: string;
    }>;
    /**
     * Get a high-level summary of the database (tables, columns, row counts)
     * Optimized for AI context window with better formatting and optional limits
     */
    getDatabaseSummary(params: {
        database?: string;
        max_tables?: number;
        include_relationships?: boolean;
    }): Promise<{
        status: string;
        data?: string;
        error?: string;
    }>;
    /**
     * Get a Mermaid.js ER diagram for the database schema
     */
    getSchemaERD(params: {
        database?: string;
    }): Promise<{
        status: string;
        data?: string;
        error?: string;
    }>;
}
