import mysql from 'mysql2/promise';
import { dbConfig } from '../config/config';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: mysql.Pool;
  private activeTransactions: Map<string, mysql.PoolConnection>;

  private constructor() {
    this.pool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    this.activeTransactions = new Map();
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

  public async query<T>(sql: string, params?: any[]): Promise<T> {
    try {
      const [results] = await this.pool.query(sql, params);
      return results as T;
    } catch (error) {
      throw new Error(`Query execution failed: ${error}`);
    }
  }

  public async testConnection(): Promise<{ connected: boolean, latency: number }> {
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
        console.error('Failed to rollback after commit error:', rollbackError);
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

  public async executeInTransaction<T>(
    transactionId: string, 
    sql: string, 
    params?: any[]
  ): Promise<T> {
    const connection = this.activeTransactions.get(transactionId);
    if (!connection) {
      throw new Error(`No active transaction found with ID: ${transactionId}`);
    }

    try {
      const [results] = await connection.query(sql, params);
      return results as T;
    } catch (error) {
      throw new Error(`Query execution in transaction failed: ${error}`);
    }
  }
}

export default DatabaseConnection;