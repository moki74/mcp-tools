/**
 * Cache entry interface
 */
export interface CacheEntry {
    data: any;
    timestamp: number;
    hitCount: number;
    queryHash: string;
    sql: string;
    params?: any[];
}
/**
 * Cache statistics interface
 */
export interface CacheStats {
    totalHits: number;
    totalMisses: number;
    hitRate: number;
    currentSize: number;
    maxSize: number;
    ttlMs: number;
    enabled: boolean;
}
/**
 * Cache configuration interface
 */
export interface CacheConfig {
    enabled: boolean;
    ttlMs: number;
    maxSize: number;
    maxMemoryMB: number;
}
/**
 * LRU Query Cache with TTL support
 * Implements an in-memory cache for query results to improve performance
 */
export declare class QueryCache {
    private static instance;
    private cache;
    private config;
    private stats;
    private accessOrder;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): QueryCache;
    /**
     * Load cache configuration from environment variables
     */
    private loadConfigFromEnv;
    /**
     * Generate a unique hash for a query and its parameters
     */
    private generateHash;
    /**
     * Check if a query result is cached and valid
     */
    get(sql: string, params?: any[]): CacheEntry | null;
    /**
     * Cache a query result
     */
    set(sql: string, params: any[] | undefined, data: any): void;
    /**
     * Invalidate cache entries matching a pattern
     * Used when data is modified (INSERT, UPDATE, DELETE)
     */
    invalidate(pattern?: string | RegExp): number;
    /**
     * Escape special regex characters in a string
     */
    private escapeRegex;
    /**
     * Invalidate cache entries related to a specific table
     */
    invalidateTable(tableName: string): number;
    /**
     * Evict least recently used entries if cache is full
     */
    private evictIfNeeded;
    /**
     * Update access order for LRU tracking
     */
    private updateAccessOrder;
    /**
     * Remove hash from access order
     */
    private removeFromAccessOrder;
    /**
     * Estimate memory usage of the cache
     */
    private estimateMemoryUsage;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Get current cache configuration
     */
    getConfig(): CacheConfig;
    /**
     * Update cache configuration
     */
    setConfig(config: Partial<CacheConfig>): void;
    /**
     * Enable caching
     */
    enable(): void;
    /**
     * Disable caching
     */
    disable(): void;
    /**
     * Clear all cache entries
     */
    clear(): void;
    /**
     * Reset statistics
     */
    resetStats(): void;
    /**
     * Get all cached entries (for debugging)
     */
    getAllEntries(): CacheEntry[];
}
export default QueryCache;
