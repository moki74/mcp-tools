import DatabaseConnection from '../db/connection';
import { validateRunQuery } from '../validation/schemas';

export class QueryTools {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  /**
   * Execute a safe read-only SELECT query
   */
  async runQuery(queryParams: { query: string; params?: any[] }): Promise<{ status: string; data?: any[]; error?: string }> {
    // Validate input
    if (!validateRunQuery(queryParams)) {
      return {
        status: 'error',
        error: 'Invalid parameters: ' + JSON.stringify(validateRunQuery.errors)
      };
    }

    try {
      const { query, params = [] } = queryParams;
      
      // Security check: Only allow SELECT queries
      if (!query.trim().toUpperCase().startsWith('SELECT')) {
        return {
          status: 'error',
          error: 'Only SELECT queries are allowed with runQuery. Use executeSql for other operations.'
        };
      }
      
      // Execute the query
      const results = await this.db.query<any[]>(query, params);
      
      return {
        status: 'success',
        data: results
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Execute write operations (INSERT, UPDATE, DELETE, and DDL if permitted) with validation
   * Note: DDL permission checks are performed at a higher level (MySQLMCP class)
   */
  async executeSql(queryParams: { query: string; params?: any[] }): Promise<{ status: string; data?: any; error?: string }> {
    // Validate input
    if (!validateRunQuery(queryParams)) {
      return {
        status: 'error',
        error: 'Invalid parameters: ' + JSON.stringify(validateRunQuery.errors)
      };
    }

    try {
      const { query, params = [] } = queryParams;
      
      // Execute the query (permission checks done at higher level)
      const result = await this.db.query<any>(query, params);
      
      return {
        status: 'success',
        data: {
          affectedRows: result.affectedRows || 0,
          insertId: result.insertId || null
        }
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}