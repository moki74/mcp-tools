"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryCache = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Default cache configuration
 */
const DEFAULT_CONFIG = {
    enabled: true,
    ttlMs: 60000, // 1 minute default TTL
    maxSize: 100, // Maximum 100 cached queries
    maxMemoryMB: 50, // Maximum 50MB memory usage
};
/**
 * LRU Query Cache with TTL support
 * Implements an in-memory cache for query results to improve performance
 */
class QueryCache {
    constructor() {
        this.cache = new Map();
        this.config = { ...DEFAULT_CONFIG };
        this.stats = { totalHits: 0, totalMisses: 0 };
        this.accessOrder = [];
        // Load config from environment if available
        this.loadConfigFromEnv();
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!QueryCache.instance) {
            QueryCache.instance = new QueryCache();
        }
        return QueryCache.instance;
    }
    /**
     * Load cache configuration from environment variables
     */
    loadConfigFromEnv() {
        if (process.env.CACHE_ENABLED !== undefined) {
            this.config.enabled = process.env.CACHE_ENABLED === "true";
        }
        if (process.env.CACHE_TTL_MS) {
            const ttl = parseInt(process.env.CACHE_TTL_MS, 10);
            if (!isNaN(ttl) && ttl > 0) {
                this.config.ttlMs = ttl;
            }
        }
        if (process.env.CACHE_MAX_SIZE) {
            const maxSize = parseInt(process.env.CACHE_MAX_SIZE, 10);
            if (!isNaN(maxSize) && maxSize > 0) {
                this.config.maxSize = maxSize;
            }
        }
        if (process.env.CACHE_MAX_MEMORY_MB) {
            const maxMemory = parseInt(process.env.CACHE_MAX_MEMORY_MB, 10);
            if (!isNaN(maxMemory) && maxMemory > 0) {
                this.config.maxMemoryMB = maxMemory;
            }
        }
    }
    /**
     * Generate a unique hash for a query and its parameters
     */
    generateHash(sql, params) {
        const normalized = sql.trim().toLowerCase();
        let paramsStr = "";
        if (params) {
            try {
                paramsStr = JSON.stringify(params);
            }
            catch {
                // Handle circular references or non-serializable values
                paramsStr = params
                    .map((p) => {
                    if (p === null)
                        return "null";
                    if (p === undefined)
                        return "undefined";
                    if (typeof p === "object") {
                        try {
                            return JSON.stringify(p);
                        }
                        catch {
                            return String(p);
                        }
                    }
                    return String(p);
                })
                    .join(",");
            }
        }
        const combined = `${normalized}:${paramsStr}`;
        return crypto_1.default.createHash("md5").update(combined).digest("hex");
    }
    /**
     * Check if a query result is cached and valid
     */
    get(sql, params) {
        if (!this.config.enabled) {
            return null;
        }
        const hash = this.generateHash(sql, params);
        const entry = this.cache.get(hash);
        if (!entry) {
            this.stats.totalMisses++;
            return null;
        }
        // Check if entry has expired
        const now = Date.now();
        if (now - entry.timestamp > this.config.ttlMs) {
            this.cache.delete(hash);
            this.removeFromAccessOrder(hash);
            this.stats.totalMisses++;
            return null;
        }
        // Update hit count and access order
        entry.hitCount++;
        this.updateAccessOrder(hash);
        this.stats.totalHits++;
        // Return a deep copy to prevent mutation of cached data
        return {
            ...entry,
            data: JSON.parse(JSON.stringify(entry.data)),
        };
    }
    /**
     * Cache a query result
     */
    set(sql, params, data) {
        if (!this.config.enabled) {
            return;
        }
        // Only cache SELECT queries
        const normalizedSql = sql.trim().toUpperCase();
        if (!normalizedSql.startsWith("SELECT")) {
            return;
        }
        const hash = this.generateHash(sql, params);
        // Check if we need to evict entries
        this.evictIfNeeded();
        const entry = {
            data,
            timestamp: Date.now(),
            hitCount: 0,
            queryHash: hash,
            sql,
            params,
        };
        this.cache.set(hash, entry);
        this.updateAccessOrder(hash);
    }
    /**
     * Invalidate cache entries matching a pattern
     * Used when data is modified (INSERT, UPDATE, DELETE)
     */
    invalidate(pattern) {
        let invalidatedCount = 0;
        if (!pattern) {
            // Clear all cache
            invalidatedCount = this.cache.size;
            this.cache.clear();
            this.accessOrder = [];
            return invalidatedCount;
        }
        const regex = typeof pattern === "string" ? new RegExp(pattern, "i") : pattern;
        for (const [hash, entry] of this.cache.entries()) {
            if (regex.test(entry.sql)) {
                this.cache.delete(hash);
                this.removeFromAccessOrder(hash);
                invalidatedCount++;
            }
        }
        return invalidatedCount;
    }
    /**
     * Escape special regex characters in a string
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    /**
     * Invalidate cache entries related to a specific table
     */
    invalidateTable(tableName) {
        // Escape special regex characters in table name to prevent regex injection
        const escapedTableName = this.escapeRegex(tableName);
        // Match table name in various SQL patterns
        const patterns = [
            new RegExp(`\\bFROM\\s+[\`"']?${escapedTableName}[\`"']?\\b`, "i"),
            new RegExp(`\\bJOIN\\s+[\`"']?${escapedTableName}[\`"']?\\b`, "i"),
            new RegExp(`\\b${escapedTableName}\\b`, "i"),
        ];
        let invalidatedCount = 0;
        for (const [hash, entry] of this.cache.entries()) {
            for (const pattern of patterns) {
                if (pattern.test(entry.sql)) {
                    this.cache.delete(hash);
                    this.removeFromAccessOrder(hash);
                    invalidatedCount++;
                    break;
                }
            }
        }
        return invalidatedCount;
    }
    /**
     * Evict least recently used entries if cache is full
     */
    evictIfNeeded() {
        // Check size limit
        while (this.cache.size >= this.config.maxSize &&
            this.accessOrder.length > 0) {
            const lruHash = this.accessOrder.shift();
            if (lruHash) {
                this.cache.delete(lruHash);
            }
        }
        // Check memory limit (approximate) - recalculate each iteration
        const maxMemoryBytes = this.config.maxMemoryMB * 1024 * 1024;
        while (this.estimateMemoryUsage() > maxMemoryBytes &&
            this.accessOrder.length > 0) {
            const lruHash = this.accessOrder.shift();
            if (lruHash) {
                this.cache.delete(lruHash);
            }
        }
        // Also evict expired entries
        const now = Date.now();
        const expiredHashes = [];
        for (const [hash, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.config.ttlMs) {
                expiredHashes.push(hash);
            }
        }
        // Delete after iteration to avoid modifying map during iteration
        for (const hash of expiredHashes) {
            this.cache.delete(hash);
            this.removeFromAccessOrder(hash);
        }
    }
    /**
     * Update access order for LRU tracking
     */
    updateAccessOrder(hash) {
        this.removeFromAccessOrder(hash);
        this.accessOrder.push(hash);
    }
    /**
     * Remove hash from access order
     */
    removeFromAccessOrder(hash) {
        const index = this.accessOrder.indexOf(hash);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
    }
    /**
     * Estimate memory usage of the cache
     */
    estimateMemoryUsage() {
        let totalSize = 0;
        for (const [, entry] of this.cache.entries()) {
            totalSize += JSON.stringify(entry).length * 2; // UTF-16 encoding
        }
        return totalSize;
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const totalRequests = this.stats.totalHits + this.stats.totalMisses;
        return {
            totalHits: this.stats.totalHits,
            totalMisses: this.stats.totalMisses,
            hitRate: totalRequests > 0 ? this.stats.totalHits / totalRequests : 0,
            currentSize: this.cache.size,
            maxSize: this.config.maxSize,
            ttlMs: this.config.ttlMs,
            enabled: this.config.enabled,
        };
    }
    /**
     * Get current cache configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update cache configuration
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
        // If cache is disabled, clear it
        if (!this.config.enabled) {
            this.clear();
        }
    }
    /**
     * Enable caching
     */
    enable() {
        this.config.enabled = true;
    }
    /**
     * Disable caching
     */
    disable() {
        this.config.enabled = false;
        this.clear();
    }
    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
        this.accessOrder = [];
    }
    /**
     * Reset statistics
     */
    resetStats() {
        this.stats.totalHits = 0;
        this.stats.totalMisses = 0;
    }
    /**
     * Get all cached entries (for debugging)
     */
    getAllEntries() {
        return Array.from(this.cache.values());
    }
}
exports.QueryCache = QueryCache;
exports.default = QueryCache;
