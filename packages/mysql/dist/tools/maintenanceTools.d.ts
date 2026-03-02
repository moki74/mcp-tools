import { SecurityLayer } from "../security/securityLayer";
export declare class MaintenanceTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    /**
     * Validate database access - ensures only the connected database can be accessed
     */
    private validateDatabaseAccess;
    /**
     * Analyze table to update index statistics
     */
    analyzeTable(params: {
        table_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Optimize table to reclaim unused space and defragment
     */
    optimizeTable(params: {
        table_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Check table for errors
     */
    checkTable(params: {
        table_name: string;
        check_type?: "QUICK" | "FAST" | "MEDIUM" | "EXTENDED" | "CHANGED";
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Repair table (MyISAM, ARCHIVE, CSV only)
     */
    repairTable(params: {
        table_name: string;
        quick?: boolean;
        extended?: boolean;
        use_frm?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Truncate table (remove all rows quickly)
     */
    truncateTable(params: {
        table_name: string;
        database?: string;
    }): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
    /**
     * Get table status and statistics
     */
    getTableStatus(params: {
        table_name?: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Flush table (close and reopen)
     */
    flushTable(params: {
        table_name?: string;
        with_read_lock?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
    /**
     * Get table size information
     */
    getTableSize(params: {
        table_name?: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
