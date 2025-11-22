import DatabaseConnection from '../db/connection';
import { SecurityLayer } from '../security/securityLayer';
import { dbConfig } from '../config/config';

export class ViewTools {
  private db: DatabaseConnection;
  private security: SecurityLayer;

  constructor(security: SecurityLayer) {
    this.db = DatabaseConnection.getInstance();
    this.security = security;
  }

  /**
   * Validate database access - ensures only the connected database can be accessed
   */
  private validateDatabaseAccess(requestedDatabase?: string): { valid: boolean; database: string; error?: string } {
    const connectedDatabase = dbConfig.database;

    if (!connectedDatabase) {
      return {
        valid: false,
        database: '',
        error: 'No database specified in connection string. Cannot access any database.'
      };
    }

    if (!requestedDatabase) {
      return {
        valid: true,
        database: connectedDatabase
      };
    }

    if (requestedDatabase !== connectedDatabase) {
      return {
        valid: false,
        database: '',
        error: `Access denied. You can only access the connected database '${connectedDatabase}'. Requested database '${requestedDatabase}' is not allowed.`
      };
    }

    return {
      valid: true,
      database: connectedDatabase
    };
  }

  /**
   * List all views in the current database
   */
  async listViews(params: { database?: string }): Promise<{ status: string; data?: any[]; error?: string; queryLog?: string }> {
    try {
      const dbValidation = this.validateDatabaseAccess(params?.database);
      if (!dbValidation.valid) {
        return { status: 'error', error: dbValidation.error! };
      }

      const database = dbValidation.database;

      const query = `
        SELECT
          TABLE_NAME as view_name,
          VIEW_DEFINITION as definition,
          CHECK_OPTION as check_option,
          IS_UPDATABLE as is_updatable,
          DEFINER as definer,
          SECURITY_TYPE as security_type,
          CHARACTER_SET_CLIENT as charset,
          COLLATION_CONNECTION as collation
        FROM INFORMATION_SCHEMA.VIEWS
        WHERE TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME
      `;

      const results = await this.db.query<any[]>(query, [database]);

      return {
        status: 'success',
        data: results,
        queryLog: this.db.getFormattedQueryLogs(1)
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message,
        queryLog: this.db.getFormattedQueryLogs(1)
      };
    }
  }

  /**
   * Get detailed information about a specific view
   */
  async getViewInfo(params: { view_name: string; database?: string }): Promise<{ status: string; data?: any; error?: string; queryLog?: string }> {
    try {
      const dbValidation = this.validateDatabaseAccess(params?.database);
      if (!dbValidation.valid) {
        return { status: 'error', error: dbValidation.error! };
      }

      const { view_name } = params;
      const database = dbValidation.database;

      // Validate view name
      const identifierValidation = this.security.validateIdentifier(view_name);
      if (!identifierValidation.valid) {
        return { status: 'error', error: identifierValidation.error || 'Invalid view name' };
      }

      // Get view information
      const viewQuery = `
        SELECT
          TABLE_NAME as view_name,
          VIEW_DEFINITION as definition,
          CHECK_OPTION as check_option,
          IS_UPDATABLE as is_updatable,
          DEFINER as definer,
          SECURITY_TYPE as security_type,
          CHARACTER_SET_CLIENT as charset,
          COLLATION_CONNECTION as collation
        FROM INFORMATION_SCHEMA.VIEWS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      `;

      // Get view columns
      const columnsQuery = `
        SELECT
          COLUMN_NAME as column_name,
          DATA_TYPE as data_type,
          COLUMN_TYPE as column_type,
          IS_NULLABLE as is_nullable,
          COLUMN_DEFAULT as column_default,
          ORDINAL_POSITION as position
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `;

      const [viewInfo, columns] = await Promise.all([
        this.db.query<any[]>(viewQuery, [database, view_name]),
        this.db.query<any[]>(columnsQuery, [database, view_name])
      ]);

      if (viewInfo.length === 0) {
        return {
          status: 'error',
          error: `View '${view_name}' not found in database '${database}'`,
          queryLog: this.db.getFormattedQueryLogs(2)
        };
      }

      return {
        status: 'success',
        data: {
          ...viewInfo[0],
          columns: columns
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

  /**
   * Create a new view
   */
  async createView(params: {
    view_name: string;
    definition: string;
    or_replace?: boolean;
    algorithm?: 'UNDEFINED' | 'MERGE' | 'TEMPTABLE';
    security?: 'DEFINER' | 'INVOKER';
    check_option?: 'CASCADED' | 'LOCAL';
    database?: string;
  }): Promise<{ status: string; data?: any; error?: string; queryLog?: string }> {
    try {
      const dbValidation = this.validateDatabaseAccess(params?.database);
      if (!dbValidation.valid) {
        return { status: 'error', error: dbValidation.error! };
      }

      const { view_name, definition, or_replace = false, algorithm, security, check_option } = params;
      const database = dbValidation.database;

      // Validate view name
      const identifierValidation = this.security.validateIdentifier(view_name);
      if (!identifierValidation.valid) {
        return { status: 'error', error: identifierValidation.error || 'Invalid view name' };
      }

      // Validate that definition is a SELECT statement
      const trimmedDef = definition.trim().toUpperCase();
      if (!trimmedDef.startsWith('SELECT')) {
        return { status: 'error', error: 'View definition must be a SELECT statement' };
      }

      // Build CREATE VIEW statement
      let createQuery = or_replace ? 'CREATE OR REPLACE ' : 'CREATE ';

      if (algorithm) {
        createQuery += `ALGORITHM = ${algorithm} `;
      }

      if (security) {
        createQuery += `SQL SECURITY ${security} `;
      }

      createQuery += `VIEW \`${database}\`.\`${view_name}\` AS ${definition}`;

      if (check_option) {
        createQuery += ` WITH ${check_option} CHECK OPTION`;
      }

      await this.db.query(createQuery);

      return {
        status: 'success',
        data: {
          message: `View '${view_name}' created successfully`,
          view_name,
          database
        },
        queryLog: this.db.getFormattedQueryLogs(1)
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message,
        queryLog: this.db.getFormattedQueryLogs(1)
      };
    }
  }

  /**
   * Alter an existing view
   */
  async alterView(params: {
    view_name: string;
    definition: string;
    algorithm?: 'UNDEFINED' | 'MERGE' | 'TEMPTABLE';
    security?: 'DEFINER' | 'INVOKER';
    check_option?: 'CASCADED' | 'LOCAL';
    database?: string;
  }): Promise<{ status: string; data?: any; error?: string; queryLog?: string }> {
    try {
      const dbValidation = this.validateDatabaseAccess(params?.database);
      if (!dbValidation.valid) {
        return { status: 'error', error: dbValidation.error! };
      }

      const { view_name, definition, algorithm, security, check_option } = params;
      const database = dbValidation.database;

      // Validate view name
      const identifierValidation = this.security.validateIdentifier(view_name);
      if (!identifierValidation.valid) {
        return { status: 'error', error: identifierValidation.error || 'Invalid view name' };
      }

      // Validate that definition is a SELECT statement
      const trimmedDef = definition.trim().toUpperCase();
      if (!trimmedDef.startsWith('SELECT')) {
        return { status: 'error', error: 'View definition must be a SELECT statement' };
      }

      // Build ALTER VIEW statement
      let alterQuery = 'ALTER ';

      if (algorithm) {
        alterQuery += `ALGORITHM = ${algorithm} `;
      }

      if (security) {
        alterQuery += `SQL SECURITY ${security} `;
      }

      alterQuery += `VIEW \`${database}\`.\`${view_name}\` AS ${definition}`;

      if (check_option) {
        alterQuery += ` WITH ${check_option} CHECK OPTION`;
      }

      await this.db.query(alterQuery);

      return {
        status: 'success',
        data: {
          message: `View '${view_name}' altered successfully`,
          view_name,
          database
        },
        queryLog: this.db.getFormattedQueryLogs(1)
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message,
        queryLog: this.db.getFormattedQueryLogs(1)
      };
    }
  }

  /**
   * Drop a view
   */
  async dropView(params: { view_name: string; if_exists?: boolean; database?: string }): Promise<{ status: string; message?: string; error?: string; queryLog?: string }> {
    try {
      const dbValidation = this.validateDatabaseAccess(params?.database);
      if (!dbValidation.valid) {
        return { status: 'error', error: dbValidation.error! };
      }

      const { view_name, if_exists = false } = params;
      const database = dbValidation.database;

      // Validate view name
      const identifierValidation = this.security.validateIdentifier(view_name);
      if (!identifierValidation.valid) {
        return { status: 'error', error: identifierValidation.error || 'Invalid view name' };
      }

      const dropQuery = `DROP VIEW ${if_exists ? 'IF EXISTS' : ''} \`${database}\`.\`${view_name}\``;

      await this.db.query(dropQuery);

      return {
        status: 'success',
        message: `View '${view_name}' dropped successfully`,
        queryLog: this.db.getFormattedQueryLogs(1)
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message,
        queryLog: this.db.getFormattedQueryLogs(1)
      };
    }
  }

  /**
   * Show the CREATE statement for a view
   */
  async showCreateView(params: { view_name: string; database?: string }): Promise<{ status: string; data?: any; error?: string; queryLog?: string }> {
    try {
      const dbValidation = this.validateDatabaseAccess(params?.database);
      if (!dbValidation.valid) {
        return { status: 'error', error: dbValidation.error! };
      }

      const { view_name } = params;
      const database = dbValidation.database;

      // Validate view name
      const identifierValidation = this.security.validateIdentifier(view_name);
      if (!identifierValidation.valid) {
        return { status: 'error', error: identifierValidation.error || 'Invalid view name' };
      }

      const query = `SHOW CREATE VIEW \`${database}\`.\`${view_name}\``;
      const results = await this.db.query<any[]>(query);

      if (results.length === 0) {
        return {
          status: 'error',
          error: `View '${view_name}' not found`,
          queryLog: this.db.getFormattedQueryLogs(1)
        };
      }

      return {
        status: 'success',
        data: results[0],
        queryLog: this.db.getFormattedQueryLogs(1)
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message,
        queryLog: this.db.getFormattedQueryLogs(1)
      };
    }
  }
}
