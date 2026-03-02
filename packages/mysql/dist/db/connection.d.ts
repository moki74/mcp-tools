import mysql from "mysql2/promise";
declare class DatabaseConnection {
    private static instance;
    private pool;
    private activeTransactions;
    private queryCache;
    private readonly TRANSACTION_TIMEOUT_MS;
    private readonly TRANSACTION_MONITOR_INTERVAL_MS;
    private readonly MAX_TRANSACTION_DURATION_MS;
    private transactionMonitorInterval?;
    private constructor();
    static getInstance(): DatabaseConnection;
    getConnection(): Promise<mysql.PoolConnection>;
    query<T>(sql: string, params?: any[], useCache?: boolean): Promise<T>;
    /**
     * Invalidate cache entries when write operations occur
     */
    private invalidateCacheForWriteOperation;
    testConnection(): Promise<{
        connected: boolean;
        latency: number;
        error?: string;
        errorCode?: string;
    }>;
    closePool(): Promise<void>;
    /**
     * Start transaction monitoring system
     */
    private startTransactionMonitor;
    /**
     * Monitor all active transactions for timeout and security violations
     */
    private monitorTransactions;
    /**
     * Detect suspicious transaction activity patterns
     */
    private detectSuspiciousActivity;
    /**
     * Enhanced cleanup of expired transactions with security checks
     */
    private cleanupExpiredTransactions;
    /**
     * Force rollback a transaction (used for timeout handling)
     */
    private forceRollbackTransaction;
    /**
     * Reset transaction timeout (call this when there's activity)
     */
    private resetTransactionTimeout;
    beginTransaction(transactionId: string): Promise<void>;
    commitTransaction(transactionId: string): Promise<void>;
    rollbackTransaction(transactionId: string): Promise<void>;
    getActiveTransactionIds(): string[];
    hasActiveTransaction(transactionId: string): boolean;
    /**
     * Get transaction information for debugging/monitoring
     */
    getTransactionInfo(transactionId: string): {
        exists: boolean;
        createdAt?: Date;
        lastActivity?: Date;
        ageMs?: number;
    };
    getQueryLogs(): import("./queryLogger").QueryLog[];
    getLastQueryLog(): import("./queryLogger").QueryLog | undefined;
    getFormattedQueryLogs(count?: number): string;
    getCacheStats(): import("../cache/queryCache").CacheStats;
    getCacheConfig(): import("../cache/queryCache").CacheConfig;
    setCacheConfig(config: {
        enabled?: boolean;
        ttlMs?: number;
        maxSize?: number;
        maxMemoryMB?: number;
    }): void;
    clearCache(): number;
    invalidateCache(pattern?: string | RegExp): number;
    invalidateCacheForTable(tableName: string): number;
    enableCache(): void;
    disableCache(): void;
    resetCacheStats(): void;
    executeInTransaction<T>(transactionId: string, sql: string, params?: any[]): Promise<T>;
}
export default DatabaseConnection;
