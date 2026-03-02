import { FilterCondition, Pagination, Sorting } from "../validation/schemas";
import SecurityLayer from "../security/securityLayer";
export declare class DataExportTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    /**
     * Validate database access
     */
    private validateDatabaseAccess;
    /**
     * Escape string value for SQL INSERT statements
     */
    private escapeValue;
    /**
     * Export table data to CSV format
     */
    exportTableToCSV(params: {
        table_name: string;
        filters?: FilterCondition[];
        pagination?: Pagination;
        sorting?: Sorting;
        include_headers?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Export query results to CSV format
     */
    exportQueryToCSV(params: {
        query: string;
        params?: any[];
        include_headers?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Export table data to JSON format
     */
    exportTableToJSON(params: {
        table_name: string;
        filters?: FilterCondition[];
        pagination?: Pagination;
        sorting?: Sorting;
        pretty?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Export query results to JSON format
     */
    exportQueryToJSON(params: {
        query: string;
        params?: any[];
        pretty?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Export table data to SQL INSERT statements
     */
    exportTableToSql(params: {
        table_name: string;
        filters?: FilterCondition[];
        include_create_table?: boolean;
        batch_size?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Import data from CSV string
     */
    importFromCSV(params: {
        table_name: string;
        csv_data: string;
        has_headers?: boolean;
        column_mapping?: Record<string, string>;
        skip_errors?: boolean;
        batch_size?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Parse CSV string into array of arrays
     */
    private parseCSV;
    /**
     * Import data from JSON string
     */
    importFromJSON(params: {
        table_name: string;
        json_data: string;
        column_mapping?: Record<string, string>;
        skip_errors?: boolean;
        batch_size?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
