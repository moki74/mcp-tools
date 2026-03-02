"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const config_1 = require("../config/config");
const queryLogger_1 = require("./queryLogger");
const queryCache_1 = require("../cache/queryCache");
class DatabaseConnection {
    constructor() {
        this.TRANSACTION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes default timeout
        this.TRANSACTION_MONITOR_INTERVAL_MS = 60 * 1000; // 1 minute monitoring interval
        this.MAX_TRANSACTION_DURATION_MS = 60 * 60 * 1000; // 1 hour maximum duration
        this.pool = promise_1.default.createPool({
            host: config_1.dbConfig.host,
            port: config_1.dbConfig.port,
            user: config_1.dbConfig.user,
            password: config_1.dbConfig.password,
            database: config_1.dbConfig.database,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });
        this.activeTransactions = new Map();
        this.queryCache = queryCache_1.QueryCache.getInstance();
        // Start transaction monitoring
        this.startTransactionMonitor();
        // Set up periodic cleanup of expired transactions
        setInterval(() => {
            this.cleanupExpiredTransactions();
        }, 5 * 60 * 1000); // Check every 5 minutes
    }
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    async getConnection() {
        try {
            return await this.pool.getConnection();
        }
        catch (error) {
            throw new Error(`Failed to get database connection: ${error}`);
        }
    }
    async query(sql, params, useCache = true) {
        const normalizedSql = sql.trim().toUpperCase();
        const isSelectQuery = normalizedSql.startsWith("SELECT");
        // Check cache for SELECT queries
        if (useCache && isSelectQuery) {
            const cachedEntry = this.queryCache.get(sql, params);
            if (cachedEntry) {
                // Log cache hit
                queryLogger_1.QueryLogger.log(sql, params, 0, "success", undefined, true);
                return cachedEntry.data;
            }
        }
        const startTime = Date.now();
        try {
            const [results] = await this.pool.query(sql, params);
            const duration = Date.now() - startTime;
            queryLogger_1.QueryLogger.log(sql, params, duration, "success");
            // Cache SELECT query results
            if (useCache && isSelectQuery) {
                this.queryCache.set(sql, params, results);
            }
            // Invalidate cache for write operations
            if (!isSelectQuery) {
                this.invalidateCacheForWriteOperation(sql);
            }
            return results;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            queryLogger_1.QueryLogger.log(sql, params, duration, "error", error.message);
            throw new Error(`Query execution failed: ${error}`);
        }
    }
    /**
     * Invalidate cache entries when write operations occur
     */
    invalidateCacheForWriteOperation(sql) {
        // Extract table name from INSERT, UPDATE, DELETE statements
        const insertMatch = sql.match(/INSERT\s+INTO\s+[\`"']?(\w+)[\`"']?/i);
        const updateMatch = sql.match(/UPDATE\s+[\`"']?(\w+)[\`"']?/i);
        const deleteMatch = sql.match(/DELETE\s+FROM\s+[\`"']?(\w+)[\`"']?/i);
        const truncateMatch = sql.match(/TRUNCATE\s+(?:TABLE\s+)?[\`"']?(\w+)[\`"']?/i);
        const dropMatch = sql.match(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?[\`"']?(\w+)[\`"']?/i);
        const match = insertMatch || updateMatch || deleteMatch || truncateMatch || dropMatch;
        if (match && match[1]) {
            this.queryCache.invalidateTable(match[1]);
        }
    }
    async testConnection() {
        const startTime = Date.now();
        try {
            const connection = await this.getConnection();
            connection.release();
            const endTime = Date.now();
            return { connected: true, latency: endTime - startTime };
        }
        catch (error) {
            // Return detailed error information for diagnostics
            return {
                connected: false,
                latency: -1,
                error: error?.message || "Unknown connection error",
                errorCode: error?.code || error?.errno || "UNKNOWN",
            };
        }
    }
    async closePool() {
        try {
            await this.pool.end();
        }
        catch (error) {
            throw new Error(`Failed to close connection pool: ${error}`);
        }
    }
    /**
     * Start transaction monitoring system
     */
    startTransactionMonitor() {
        this.transactionMonitorInterval = setInterval(() => {
            this.monitorTransactions();
        }, this.TRANSACTION_MONITOR_INTERVAL_MS);
    }
    /**
     * Monitor all active transactions for timeout and security violations
     */
    monitorTransactions() {
        const now = Date.now();
        const transactionsToCleanup = [];
        for (const [transactionId, transaction] of this.activeTransactions) {
            const age = now - transaction.createdAt.getTime();
            const inactivity = now - transaction.lastActivity.getTime();
            // Check for maximum duration violation
            if (age > this.MAX_TRANSACTION_DURATION_MS) {
                console.warn(`Transaction ${transactionId} exceeded maximum duration, forcing rollback`);
                transactionsToCleanup.push(transactionId);
                continue;
            }
            // Check for inactivity timeout (server-side verification)
            if (inactivity > this.TRANSACTION_TIMEOUT_MS) {
                console.warn(`Transaction ${transactionId} timed out due to inactivity, forcing rollback`);
                transactionsToCleanup.push(transactionId);
                continue;
            }
            // Check for suspicious activity patterns
            if (this.detectSuspiciousActivity(transaction)) {
                console.warn(`Transaction ${transactionId} shows suspicious activity patterns, forcing rollback`);
                transactionsToCleanup.push(transactionId);
                continue;
            }
        }
        // Clean up flagged transactions
        for (const transactionId of transactionsToCleanup) {
            this.forceRollbackTransaction(transactionId, "Security violation or timeout");
        }
    }
    /**
     * Detect suspicious transaction activity patterns
     */
    detectSuspiciousActivity(transaction) {
        const now = Date.now();
        const age = now - transaction.createdAt.getTime();
        // Very new transactions with excessive activity could indicate automated attacks
        if (age < 60000 && transaction.queryCount > 100) { // More than 100 queries in first minute
            return true;
        }
        // Transactions with extremely high query count could indicate resource exhaustion attacks
        if (transaction.queryCount > 10000) {
            return true;
        }
        // Check for rapid-fire queries (potential DoS)
        if (transaction.lastQueryTime && (now - transaction.lastQueryTime.getTime()) < 10) { // Less than 10ms between queries
            transaction.rapidQueryCount = (transaction.rapidQueryCount || 0) + 1;
            if (transaction.rapidQueryCount > 50) { // More than 50 rapid queries
                return true;
            }
        }
        return false;
    }
    /**
     * Enhanced cleanup of expired transactions with security checks
     */
    cleanupExpiredTransactions() {
        const now = Date.now();
        const transactionsToCleanup = [];
        for (const [transactionId, transaction] of this.activeTransactions) {
            const age = now - transaction.createdAt.getTime();
            const inactivity = now - transaction.lastActivity.getTime();
            // Multiple cleanup criteria for security
            if (inactivity > this.TRANSACTION_TIMEOUT_MS ||
                age > this.MAX_TRANSACTION_DURATION_MS ||
                this.detectSuspiciousActivity(transaction)) {
                transactionsToCleanup.push(transactionId);
            }
        }
        for (const transactionId of transactionsToCleanup) {
            this.forceRollbackTransaction(transactionId, "Automatic cleanup");
        }
    }
    /**
     * Force rollback a transaction (used for timeout handling)
     */
    forceRollbackTransaction(transactionId, reason) {
        const transaction = this.activeTransactions.get(transactionId);
        if (!transaction)
            return;
        try {
            // Clear timeout if exists
            if (transaction.timeout) {
                clearTimeout(transaction.timeout);
            }
            // Attempt to rollback
            transaction.connection.rollback();
            transaction.connection.release();
        }
        catch (error) {
            console.error(`Failed to rollback expired transaction ${transactionId}:`, error);
            try {
                // Force release connection even if rollback fails
                transaction.connection.release();
            }
            catch (releaseError) {
                console.error(`Failed to release connection for expired transaction ${transactionId}:`, releaseError);
            }
        }
        this.activeTransactions.delete(transactionId);
        console.warn(`Transaction ${transactionId} force rolled back: ${reason}`);
    }
    /**
     * Reset transaction timeout (call this when there's activity)
     */
    resetTransactionTimeout(transactionId) {
        const transaction = this.activeTransactions.get(transactionId);
        if (!transaction)
            return;
        // Clear existing timeout
        if (transaction.timeout) {
            clearTimeout(transaction.timeout);
        }
        // Update last activity
        transaction.lastActivity = new Date();
        // Set new timeout
        transaction.timeout = setTimeout(() => {
            this.forceRollbackTransaction(transactionId, "Transaction timeout");
        }, this.TRANSACTION_TIMEOUT_MS);
    }
    // Transaction Management Methods
    async beginTransaction(transactionId) {
        try {
            const connection = await this.getConnection();
            await connection.beginTransaction();
            const now = new Date();
            const timeout = setTimeout(() => {
                this.forceRollbackTransaction(transactionId, "Transaction timeout");
            }, this.TRANSACTION_TIMEOUT_MS);
            this.activeTransactions.set(transactionId, {
                connection,
                createdAt: now,
                lastActivity: now,
                lastQueryTime: now,
                timeout,
                queryCount: 0,
                rapidQueryCount: 0,
            });
        }
        catch (error) {
            throw new Error(`Failed to begin transaction: ${error}`);
        }
    }
    async commitTransaction(transactionId) {
        const transaction = this.activeTransactions.get(transactionId);
        if (!transaction) {
            throw new Error(`No active transaction found with ID: ${transactionId}`);
        }
        try {
            // Clear timeout
            if (transaction.timeout) {
                clearTimeout(transaction.timeout);
            }
            await transaction.connection.commit();
            transaction.connection.release();
            this.activeTransactions.delete(transactionId);
        }
        catch (error) {
            // If commit fails, rollback and release connection
            try {
                await transaction.connection.rollback();
                transaction.connection.release();
            }
            catch (rollbackError) {
                console.error("Failed to rollback after commit error:", rollbackError);
            }
            this.activeTransactions.delete(transactionId);
            throw new Error(`Failed to commit transaction: ${error}`);
        }
    }
    async rollbackTransaction(transactionId) {
        const transaction = this.activeTransactions.get(transactionId);
        if (!transaction) {
            throw new Error(`No active transaction found with ID: ${transactionId}`);
        }
        try {
            // Clear timeout
            if (transaction.timeout) {
                clearTimeout(transaction.timeout);
            }
            await transaction.connection.rollback();
            transaction.connection.release();
            this.activeTransactions.delete(transactionId);
        }
        catch (error) {
            transaction.connection.release();
            this.activeTransactions.delete(transactionId);
            throw new Error(`Failed to rollback transaction: ${error}`);
        }
    }
    getActiveTransactionIds() {
        return Array.from(this.activeTransactions.keys());
    }
    hasActiveTransaction(transactionId) {
        return this.activeTransactions.has(transactionId);
    }
    /**
     * Get transaction information for debugging/monitoring
     */
    getTransactionInfo(transactionId) {
        const transaction = this.activeTransactions.get(transactionId);
        if (!transaction) {
            return { exists: false };
        }
        const now = new Date();
        return {
            exists: true,
            createdAt: transaction.createdAt,
            lastActivity: transaction.lastActivity,
            ageMs: now.getTime() - transaction.createdAt.getTime(),
        };
    }
    getQueryLogs() {
        return queryLogger_1.QueryLogger.getLogs();
    }
    getLastQueryLog() {
        return queryLogger_1.QueryLogger.getLastLog();
    }
    getFormattedQueryLogs(count = 1) {
        return queryLogger_1.QueryLogger.formatLogs(queryLogger_1.QueryLogger.getLastLogs(count));
    }
    // Cache Management Methods
    getCacheStats() {
        return this.queryCache.getStats();
    }
    getCacheConfig() {
        return this.queryCache.getConfig();
    }
    setCacheConfig(config) {
        this.queryCache.setConfig(config);
    }
    clearCache() {
        const previousSize = this.queryCache.getStats().currentSize;
        this.queryCache.clear();
        return previousSize;
    }
    invalidateCache(pattern) {
        return this.queryCache.invalidate(pattern);
    }
    invalidateCacheForTable(tableName) {
        return this.queryCache.invalidateTable(tableName);
    }
    enableCache() {
        this.queryCache.enable();
    }
    disableCache() {
        this.queryCache.disable();
    }
    resetCacheStats() {
        this.queryCache.resetStats();
    }
    async executeInTransaction(transactionId, sql, params) {
        const transaction = this.activeTransactions.get(transactionId);
        if (!transaction) {
            throw new Error(`No active transaction found with ID: ${transactionId}`);
        }
        // Update query tracking before execution
        const now = new Date();
        transaction.lastQueryTime = now;
        transaction.queryCount++;
        const startTime = Date.now();
        try {
            const [results] = await transaction.connection.query(sql, params);
            const duration = Date.now() - startTime;
            queryLogger_1.QueryLogger.log(sql, params, duration, "success");
            // Reset timeout on successful activity and update last activity
            this.resetTransactionTimeout(transactionId);
            transaction.lastActivity = now;
            return results;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            queryLogger_1.QueryLogger.log(sql, params, duration, "error", error.message);
            throw new Error(`Query execution in transaction failed: ${error}`);
        }
    }
}
exports.default = DatabaseConnection;
