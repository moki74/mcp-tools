import { SecurityLayer } from "../security/securityLayer";
export declare class DdlTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    /**
     * Sanitize default value for SQL safety
     */
    private sanitizeDefaultValue;
    /**
     * Create a new table
     */
    createTable(params: {
        table_name: string;
        columns: Array<{
            name: string;
            type: string;
            nullable?: boolean;
            primary_key?: boolean;
            auto_increment?: boolean;
            default?: string;
        }>;
        indexes?: Array<{
            name: string;
            columns: string[];
            unique?: boolean;
        }>;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Alter an existing table
     */
    alterTable(params: {
        table_name: string;
        operations: Array<{
            type: "add_column" | "drop_column" | "modify_column" | "rename_column" | "add_index" | "drop_index";
            column_name?: string;
            new_column_name?: string;
            column_type?: string;
            nullable?: boolean;
            default?: string;
            index_name?: string;
            index_columns?: string[];
            unique?: boolean;
        }>;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Drop a table
     */
    dropTable(params: {
        table_name: string;
        if_exists?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Execute raw DDL SQL
     */
    executeDdl(params: {
        query: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
