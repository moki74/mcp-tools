import DatabaseConnection from "../db/connection";
import { SecurityLayer } from "../security/securityLayer";
import { dbConfig } from "../config/config";

export class AnalysisTools {
  private db: DatabaseConnection;
  private security: SecurityLayer;

  constructor(security: SecurityLayer) {
    this.db = DatabaseConnection.getInstance();
    this.security = security;
  }

  /**
   * Validate database access - ensures only the connected database can be accessed
   */
  private validateDatabaseAccess(requestedDatabase?: string): {
    valid: boolean;
    database: string;
    error?: string;
  } {
    const connectedDatabase = dbConfig.database;

    if (!connectedDatabase) {
      return {
        valid: false,
        database: "",
        error:
          "No database specified in connection string. Cannot access any database.",
      };
    }

    if (!requestedDatabase) {
      return {
        valid: true,
        database: connectedDatabase,
      };
    }

    if (requestedDatabase !== connectedDatabase) {
      return {
        valid: false,
        database: "",
        error: `Access denied. You can only access the connected database '${connectedDatabase}'. Requested database '${requestedDatabase}' is not allowed.`,
      };
    }

    return {
      valid: true,
      database: connectedDatabase,
    };
  }

  /**
   * Get statistics for a specific column
   */
  async getColumnStatistics(params: {
    table_name: string;
    column_name: string;
    database?: string;
  }): Promise<{
    status: string;
    data?: any;
    error?: string;
  }> {
    try {
      const dbValidation = this.validateDatabaseAccess(params?.database);
      if (!dbValidation.valid) {
        return { status: "error", error: dbValidation.error! };
      }

      const { table_name, column_name } = params;
      const database = dbValidation.database;

      // Validate names
      if (!this.security.validateIdentifier(table_name).valid) {
        return { status: "error", error: "Invalid table name" };
      }
      if (!this.security.validateIdentifier(column_name).valid) {
        return { status: "error", error: "Invalid column name" };
      }

      // Check if column exists and get its type
      const colCheckQuery = `
        SELECT DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
      `;
      const colCheck = await this.db.query<any[]>(colCheckQuery, [
        database,
        table_name,
        column_name,
      ]);

      if (colCheck.length === 0) {
        return {
          status: "error",
          error: `Column '${column_name}' not found in table '${table_name}'`,
        };
      }

      const dataType = colCheck[0].DATA_TYPE;
      const isNumeric = [
        "int",
        "tinyint",
        "smallint",
        "mediumint",
        "bigint",
        "float",
        "double",
        "decimal",
      ].includes(dataType);
      const isDate = [
        "date",
        "datetime",
        "timestamp",
        "time",
        "year",
      ].includes(dataType);

      // Build statistics query
      let query = `
        SELECT
          COUNT(*) as total_rows,
          COUNT(\`${column_name}\`) as non_null_count,
          COUNT(DISTINCT \`${column_name}\`) as distinct_count,
          SUM(CASE WHEN \`${column_name}\` IS NULL THEN 1 ELSE 0 END) as null_count
      `;

      if (isNumeric || isDate) {
        query += `,
          MIN(\`${column_name}\`) as min_value,
          MAX(\`${column_name}\`) as max_value
        `;
      }

      if (isNumeric) {
        query += `,
          AVG(\`${column_name}\`) as avg_value
        `;
      }

      query += ` FROM \`${database}\`.\`${table_name}\``;

      const statsResult = await this.db.query<any[]>(query);
      const stats = statsResult[0];

      // Get top frequent values
      const topValuesQuery = `
        SELECT \`${column_name}\` as value, COUNT(*) as count
        FROM \`${database}\`.\`${table_name}\`
        GROUP BY \`${column_name}\`
        ORDER BY count DESC
        LIMIT 5
      `;
      const topValues = await this.db.query<any[]>(topValuesQuery);

      return {
        status: "success",
        data: {
          column_name,
          data_type: dataType,
          statistics: {
            total_rows: stats.total_rows,
            non_null_count: stats.non_null_count,
            null_count: stats.null_count,
            distinct_count: stats.distinct_count,
            unique_ratio:
              stats.total_rows > 0
                ? (stats.distinct_count / stats.total_rows).toFixed(4)
                : 0,
            ...(isNumeric || isDate
              ? { min_value: stats.min_value, max_value: stats.max_value }
              : {}),
            ...(isNumeric ? { avg_value: stats.avg_value } : {}),
          },
          top_values: topValues,
        },
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message,
      };
    }
  }
}
