import DatabaseConnection from '../db/connection';
import { dbConfig } from '../config/config';
import { validateGetTableRelationships } from '../validation/schemas';

export class UtilityTools {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  /**
   * Returns the current database connection info
   */
  async describeConnection(): Promise<{ status: string; data?: any; error?: string }> {
    try {
      // Return connection info without sensitive data
      const connectionInfo = {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        database: dbConfig.database,
        // Exclude password for security
      };
      
      return {
        status: 'success',
        data: connectionInfo
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Tests the DB connection and returns latency
   */
  async testConnection(): Promise<{ status: string; data?: any; error?: string }> {
    try {
      const result = await this.db.testConnection();
      
      return {
        status: result.connected ? 'success' : 'error',
        data: {
          connected: result.connected,
          latency: result.latency
        }
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Detects and describes foreign key relationships between tables
   */
  async getTableRelationships(params: { table_name: string }): Promise<{ status: string; data?: any; error?: string; queryLog?: string }> {
    // Validate input
    if (!validateGetTableRelationships(params)) {
      return {
        status: 'error',
        error: 'Invalid parameters: ' + JSON.stringify(validateGetTableRelationships.errors)
      };
    }

    try {
      const { table_name } = params;
      
      // Query to get foreign keys where this table is the parent
      const parentQuery = `
        SELECT 
          TABLE_NAME as child_table,
          COLUMN_NAME as child_column,
          REFERENCED_TABLE_NAME as parent_table,
          REFERENCED_COLUMN_NAME as parent_column,
          CONSTRAINT_NAME as constraint_name
        FROM 
          INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE 
          REFERENCED_TABLE_NAME = ?
          AND REFERENCED_TABLE_SCHEMA = DATABASE()
      `;
      
      // Query to get foreign keys where this table is the child
      const childQuery = `
        SELECT 
          TABLE_NAME as child_table,
          COLUMN_NAME as child_column,
          REFERENCED_TABLE_NAME as parent_table,
          REFERENCED_COLUMN_NAME as parent_column,
          CONSTRAINT_NAME as constraint_name
        FROM 
          INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE 
          TABLE_NAME = ?
          AND REFERENCED_TABLE_NAME IS NOT NULL
          AND TABLE_SCHEMA = DATABASE()
      `;
      
      // Execute both queries
      const parentRelationships = await this.db.query<any[]>(parentQuery, [table_name]);
      const childRelationships = await this.db.query<any[]>(childQuery, [table_name]);
      
      return {
        status: 'success',
        data: {
          as_parent: parentRelationships,
          as_child: childRelationships
        },
        queryLog: this.db.getFormattedQueryLogs(2)
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message,
        queryLog: this.db.getFormattedQueryLogs(2)
      };
    }
  }
}