import mysql from "mysql2/promise";
import { dbConfig } from "../config/config";
import { QueryLogger } from "./queryLogger";
import { QueryCache } from "../cache/queryCache";

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: mysql.Pool;
  private activeTransactions: Map<string, mysql.PoolConnection>;
  private queryCache: QueryCache;

  private constructor() {
    this.pool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    this.activeTransactions = new Map();
    this.queryCache = QueryCache.getInstance();
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async getConnection(): Promise<mysql.PoolConnection> {
    try {
      return await this.pool.getConnection();
    } catch (error) {
      throw new Error(`Failed to get database connection: ${error}`);
    }
  }

  public async query<T>(
    sql: string,
    params?: any[],
    useCache: boolean = true,
  ): Promise<T> {
    const normalizedSql = sql.trim().toUpperCase();
    const isSelectQuery = normalizedSql.startsWith("SELECT");

    // Check cache for SELECT queries
    if (useCache && isSelectQuery) {
      const cachedEntry = this.queryCache.get(sql, params);
      if (cachedEntry) {
        // Log cache hit
        QueryLogger.log(sql, params, 0, "success", undefined, true);
        return cachedEntry.data as T;
      }
    }

    const startTime = Date.now();
    try {
      const [results] = await this.pool.query(sql, params);
      const duration = Date.now() - startTime;
      QueryLogger.log(sql, params, duration, "success");

      // Cache SELECT query results
      if (useCache && isSelectQuery) {
        this.queryCache.set(sql, params, results);
      }

      // Invalidate cache for write operations
      if (!isSelectQuery) {
        this.invalidateCacheForWriteOperation(sql);
      }

      return results as T;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      QueryLogger.log(sql, params, duration, "error", error.message);
      throw new Error(`Query execution failed: ${error}`);
    }
  }

  /**
   * Invalidate cache entries when write operations occur
   */
  private invalidateCacheForWriteOperation(sql: string): void {
    // Extract table name from INSERT, UPDATE, DELETE statements
    const insertMatch = sql.match(/INSERT\s+INTO\s+[\`"']?(\w+)[\`"']?/i);
    const updateMatch = sql.match(/UPDATE\s+[\`"']?(\w+)[\`"']?/i);
    const deleteMatch = sql.match(/DELETE\s+FROM\s+[\`"']?(\w+)[\`"']?/i);
    const truncateMatch = sql.match(
      /TRUNCATE\s+(?:TABLE\s+)?[\`"']?(\w+)[\`"']?/i,
    );
    const dropMatch = sql.match(
      /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?[\`"']?(\w+)[\`"']?/i,
    );

    const match =
      insertMatch || updateMatch || deleteMatch || truncateMatch || dropMatch;
    if (match && match[1]) {
      this.queryCache.invalidateTable(match[1]);
    }
  }

  public async testConnection(): Promise<{
    connected: boolean;
    latency: number;
  }> {
    const startTime = Date.now();
    try {
      const connection = await this.getConnection();
      connection.release();
      const endTime = Date.now();
      return { connected: true, latency: endTime - startTime };
    } catch (error) {
      return { connected: false, latency: -1 };
    }
  }

  public async closePool(): Promise<void> {
    try {
      await this.pool.end();
    } catch (error) {
      throw new Error(`Failed to close connection pool: ${error}`);
    }
  }

  // Transaction Management Methods
  public async beginTransaction(transactionId: string): Promise<void> {
    try {
      const connection = await this.getConnection();
      await connection.beginTransaction();
      this.activeTransactions.set(transactionId, connection);
    } catch (error) {
      throw new Error(`Failed to begin transaction: ${error}`);
    }
  }

  public async commitTransaction(transactionId: string): Promise<void> {
    const connection = this.activeTransactions.get(transactionId);
    if (!connection) {
      throw new Error(`No active transaction found with ID: ${transactionId}`);
    }

    try {
      await connection.commit();
      connection.release();
      this.activeTransactions.delete(transactionId);
    } catch (error) {
      // If commit fails, rollback and release connection
      try {
        await connection.rollback();
        connection.release();
      } catch (rollbackError) {
        console.error("Failed to rollback after commit error:", rollbackError);
      }
      this.activeTransactions.delete(transactionId);
      throw new Error(`Failed to commit transaction: ${error}`);
    }
  }

  public async rollbackTransaction(transactionId: string): Promise<void> {
    const connection = this.activeTransactions.get(transactionId);
    if (!connection) {
      throw new Error(`No active transaction found with ID: ${transactionId}`);
    }

    try {
      await connection.rollback();
      connection.release();
      this.activeTransactions.delete(transactionId);
    } catch (error) {
      connection.release();
      this.activeTransactions.delete(transactionId);
      throw new Error(`Failed to rollback transaction: ${error}`);
    }
  }

  public getActiveTransactionIds(): string[] {
    return Array.from(this.activeTransactions.keys());
  }

  public hasActiveTransaction(transactionId: string): boolean {
    return this.activeTransactions.has(transactionId);
  }

  public getQueryLogs() {
    return QueryLogger.getLogs();
  }

  public getLastQueryLog() {
    return QueryLogger.getLastLog();
  }

  public getFormattedQueryLogs(count: number = 1) {
    return QueryLogger.formatLogs(QueryLogger.getLastLogs(count));
  }

  // Cache Management Methods
  public getCacheStats() {
    return this.queryCache.getStats();
  }

  public getCacheConfig() {
    return this.queryCache.getConfig();
  }

  public setCacheConfig(config: {
    enabled?: boolean;
    ttlMs?: number;
    maxSize?: number;
    maxMemoryMB?: number;
  }) {
    this.queryCache.setConfig(config);
  }

  public clearCache(): number {
    const previousSize = this.queryCache.getStats().currentSize;
    this.queryCache.clear();
    return previousSize;
  }

  public invalidateCache(pattern?: string | RegExp): number {
    return this.queryCache.invalidate(pattern);
  }

  public invalidateCacheForTable(tableName: string): number {
    return this.queryCache.invalidateTable(tableName);
  }

  public enableCache(): void {
    this.queryCache.enable();
  }

  public disableCache(): void {
    this.queryCache.disable();
  }

  public resetCacheStats(): void {
    this.queryCache.resetStats();
  }

  public async executeInTransaction<T>(
    transactionId: string,
    sql: string,
    params?: any[],
  ): Promise<T> {
    const connection = this.activeTransactions.get(transactionId);
    if (!connection) {
      throw new Error(`No active transaction found with ID: ${transactionId}`);
    }

    const startTime = Date.now();
    try {
      const [results] = await connection.query(sql, params);
      const duration = Date.now() - startTime;
      QueryLogger.log(sql, params, duration, "success");
      return results as T;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      QueryLogger.log(sql, params, duration, "error", error.message);
      throw new Error(`Query execution in transaction failed: ${error}`);
    }
  }
}

export default DatabaseConnection;
