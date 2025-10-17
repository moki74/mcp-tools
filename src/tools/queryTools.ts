import DatabaseConnection from '../db/connection';
import SecurityLayer from '../security/securityLayer';
import { validateRunQuery } from '../validation/schemas';

export class QueryTools {
  private db: DatabaseConnection;
  private security: SecurityLayer;

  constructor(security: SecurityLayer) {
    this.db = DatabaseConnection.getInstance();
    this.security = security;
  }

  /**
   * Execute a safe read-only SELECT query
   */
  async runQuery(queryParams: { query: string; params?: any[] }): Promise<{ status: string; data?: any[]; error?: string }> {
    // Validate input schema
    if (!validateRunQuery(queryParams)) {
      return {
        status: 'error',
        error: 'Invalid parameters: ' + JSON.stringify(validateRunQuery.errors)
      };
    }

    try {
      const { query, params = [] } = queryParams;
      
      // Validate query using security layer
      const queryValidation = this.security.validateQuery(query);
      if (!queryValidation.valid) {
        return {
          status: 'error',
          error: `Query validation failed: ${queryValidation.error}`
        };
      }

      // Ensure it's a SELECT query
      if (queryValidation.queryType !== 'SELECT') {
        return {
          status: 'error',
          error: 'Only SELECT queries are allowed with runQuery. Use executeSql for other operations.'
        };
      }

      // Validate parameters
      const paramValidation = this.security.validateParameters(params);
      if (!paramValidation.valid) {
        return {
          status: 'error',
          error: `Parameter validation failed: ${paramValidation.error}`
        };
      }
      
      // Execute the query with sanitized parameters
      const results = await this.db.query<any[]>(query, paramValidation.sanitizedParams!);
      
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
   * Execute write operations (INSERT, UPDATE, DELETE) with validation
   * Note: DDL operations are blocked by the security layer for safety
   */
  async executeSql(queryParams: { query: string; params?: any[] }): Promise<{ status: string; data?: any; error?: string }> {
    // Validate input schema
    if (!validateRunQuery(queryParams)) {
      return {
        status: 'error',
        error: 'Invalid parameters: ' + JSON.stringify(validateRunQuery.errors)
      };
    }

    try {
      const { query, params = [] } = queryParams;
      
      // Validate query using security layer
      const queryValidation = this.security.validateQuery(query);
      if (!queryValidation.valid) {
        return {
          status: 'error',
          error: `Query validation failed: ${queryValidation.error}`
        };
      }

      // Ensure it's not a SELECT query (use runQuery for that)
      if (queryValidation.queryType === 'SELECT') {
        return {
          status: 'error',
          error: 'SELECT queries should use runQuery method instead of executeSql.'
        };
      }

      // Validate parameters
      const paramValidation = this.security.validateParameters(params);
      if (!paramValidation.valid) {
        return {
          status: 'error',
          error: `Parameter validation failed: ${paramValidation.error}`
        };
      }
      
      // Execute the query with sanitized parameters
      const result = await this.db.query<any>(query, paramValidation.sanitizedParams!);
      
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