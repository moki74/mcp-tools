import { SecurityLayer } from "../security/securityLayer";
export declare class PerformanceTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    /**
     * Get comprehensive performance metrics
     */
    getPerformanceMetrics(): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Get top queries by execution time
     */
    getTopQueriesByTime(params?: {
        limit?: number;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    /**
     * Get top queries by execution count
     */
    getTopQueriesByCount(params?: {
        limit?: number;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    /**
     * Get slow queries
     */
    getSlowQueries(params?: {
        limit?: number;
        threshold_seconds?: number;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    /**
     * Get table I/O statistics
     */
    getTableIOStats(params?: {
        limit?: number;
        table_schema?: string;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    /**
     * Get index usage statistics
     */
    getIndexUsageStats(params?: {
        limit?: number;
        table_schema?: string;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    /**
     * Get unused indexes
     */
    getUnusedIndexes(params?: {
        table_schema?: string;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    /**
     * Get connection pool statistics
     */
    getConnectionPoolStats(): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Get database health check
     */
    getDatabaseHealthCheck(): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Reset performance schema statistics
     */
    resetPerformanceStats(): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
}
