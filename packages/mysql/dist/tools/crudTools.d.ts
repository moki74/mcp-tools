import SecurityLayer from "../security/securityLayer";
import { FilterCondition, Pagination, Sorting } from "../validation/schemas";
export declare class CrudTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    /**
     * Create a new record in the specified table
     */
    createRecord(params: {
        table_name: string;
        data: Record<string, any>;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Read records from the specified table with optional filters, pagination, and sorting
     */
    readRecords(params: {
        table_name: string;
        filters?: FilterCondition[];
        pagination?: Pagination;
        sorting?: Sorting;
    }): Promise<{
        status: string;
        data?: any[];
        total?: number;
        error?: string;
    }>;
    /**
     * Update records in the specified table based on conditions
     */
    updateRecord(params: {
        table_name: string;
        data: Record<string, any>;
        conditions: FilterCondition[];
    }): Promise<{
        status: string;
        data?: {
            affectedRows: number;
        };
        error?: string;
    }>;
    /**
     * Delete records from the specified table based on conditions
     */
    deleteRecord(params: {
        table_name: string;
        conditions: FilterCondition[];
    }): Promise<{
        status: string;
        data?: {
            affectedRows: number;
        };
        error?: string;
    }>;
    /**
     * Bulk insert multiple records into the specified table
     */
    bulkInsert(params: {
        table_name: string;
        data: Record<string, any>[];
        batch_size?: number;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Bulk update multiple records with different conditions and data
     */
    bulkUpdate(params: {
        table_name: string;
        updates: Array<{
            data: Record<string, any>;
            conditions: FilterCondition[];
        }>;
        batch_size?: number;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Bulk delete records based on multiple condition sets
     */
    bulkDelete(params: {
        table_name: string;
        condition_sets: FilterCondition[][];
        batch_size?: number;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
