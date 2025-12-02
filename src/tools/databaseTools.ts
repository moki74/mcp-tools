import DatabaseConnection from "../db/connection";
import {
  validateListTables,
  validateReadTableSchema,
  TableInfo,
  ColumnInfo,
} from "../validation/schemas";
import { dbConfig } from "../config/config";

export class DatabaseTools {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  /**
   * List only the connected database (security restriction)
   * This prevents access to other databases on the MySQL server
   */
  async listDatabases(): Promise<{
    status: string;
    data?: string[];
    error?: string;
  }> {
    try {
      // Only return the database specified in the connection string
      // This is a security measure to prevent access to other databases
      if (!dbConfig.database) {
        return {
          status: "error",
          error:
            "No database specified in connection string. Please specify a database name in your MySQL connection URL.",
        };
      }

      // Verify the database exists and is accessible
      const results = await this.db.query<any[]>(
        "SELECT DATABASE() as current_database",
      );
      const currentDatabase = results[0]?.current_database;

      if (!currentDatabase) {
        return {
          status: "error",
          error:
            "No database selected. Please ensure your connection string includes a valid database name.",
        };
      }

      return {
        status: "success",
        data: [currentDatabase],
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message,
      };
    }
  }

  /**
   * List all tables in the selected database
   */
  async listTables(params: { database?: string }): Promise<{
    status: string;
    data?: TableInfo[];
    error?: string;
  }> {
    // Validate input
    if (!validateListTables(params)) {
      return {
        status: "error",
        error:
          "Invalid parameters: " + JSON.stringify(validateListTables.errors),
      };
    }

    try {
      // Security validation: if database is specified, ensure it matches the connected database
      if (params.database) {
        if (!dbConfig.database) {
          return {
            status: "error",
            error:
              "No database specified in connection string. Cannot access other databases.",
          };
        }

        if (params.database !== dbConfig.database) {
          return {
            status: "error",
            error: `Access denied. You can only access the connected database '${dbConfig.database}'. Requested database '${params.database}' is not allowed.`,
          };
        }
      }

      let query = "SHOW TABLES";

      // If database is specified and validated, use it
      if (params.database) {
        query = `SHOW TABLES FROM \`${params.database}\``;
      }

      const results = await this.db.query<any[]>(query);
      const tables = results.map((row) => {
        // Extract the table name from the first column (which might have different names)
        const firstColumnName = Object.keys(row)[0];
        return { table_name: row[firstColumnName] };
      });

      return {
        status: "success",
        data: tables,
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message,
      };
    }
  }

  /**
   * Read table schema (columns, types, keys, etc.)
   */
  async readTableSchema(params: { table_name: string }): Promise<{
    status: string;
    data?: ColumnInfo[];
    error?: string;
  }> {
    // Validate input
    if (!validateReadTableSchema(params)) {
      return {
        status: "error",
        error:
          "Invalid parameters: " +
          JSON.stringify(validateReadTableSchema.errors),
      };
    }

    try {
      const query = `
        SELECT
          COLUMN_NAME as column_name,
          DATA_TYPE as data_type,
          IS_NULLABLE as is_nullable,
          COLUMN_KEY as column_key,
          COLUMN_DEFAULT as column_default,
          EXTRA as extra
        FROM
          INFORMATION_SCHEMA.COLUMNS
        WHERE
          TABLE_NAME = ?
        ORDER BY
          ORDINAL_POSITION
      `;

      const results = await this.db.query<ColumnInfo[]>(query, [
        params.table_name,
      ]);

      return {
        status: "success",
        data: results,
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message,
      };
    }
  }
}
