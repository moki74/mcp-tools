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

  /**
   * Build a compact, schema-aware context pack for RAG (tables, PK/FK, columns, row estimates)
   */
  async getSchemaRagContext(params: {
    database?: string;
    max_tables?: number;
    max_columns?: number;
    include_relationships?: boolean;
  } = {}): Promise<{
    status: string;
    data?: any;
    error?: string;
  }> {
    try {
      const dbValidation = this.validateDatabaseAccess(params?.database);
      if (!dbValidation.valid) {
        return { status: "error", error: dbValidation.error! };
      }

      const database = dbValidation.database;
      const maxTables = Math.min(Math.max(params.max_tables ?? 50, 1), 200);
      const maxColumns = Math.min(Math.max(params.max_columns ?? 12, 1), 200);
      const includeRelationships = params.include_relationships ?? true;

      // Count total tables for truncation note
      const totalTablesResult = await this.db.query<any[]>(
        `SELECT COUNT(*) as total FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
        [database],
      );
      const totalTables = totalTablesResult[0]?.total ?? 0;

      // Fetch tables limited for context pack
      const tables = await this.db.query<any[]>(
        `
          SELECT TABLE_NAME, TABLE_ROWS
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_SCHEMA = ?
          ORDER BY TABLE_NAME
          LIMIT ?
        `,
        [database, maxTables],
      );

      if (!tables.length) {
        return {
          status: "success",
          data: {
            database,
            total_tables: 0,
            tables: [],
            relationships: [],
            context_text: `Schema-Aware RAG Context Pack (${database}): no tables found.`,
          },
        };
      }

      const tableNames = tables.map((t) => t.TABLE_NAME);
      const placeholders = tableNames.map(() => "?").join(",");
      const columnParams = [database, ...tableNames];
      const columns = await this.db.query<any[]>(
        `
          SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_KEY, IS_NULLABLE
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME IN (${placeholders})
          ORDER BY TABLE_NAME, ORDINAL_POSITION
        `,
        columnParams,
      );

      let foreignKeys: any[] = [];
      if (includeRelationships) {
        const fkParams = [database, ...tableNames, ...tableNames];
        foreignKeys = await this.db.query<any[]>(
          `
            SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ?
              AND TABLE_NAME IN (${placeholders})
              AND REFERENCED_TABLE_NAME IN (${placeholders})
              AND REFERENCED_TABLE_NAME IS NOT NULL
          `,
          fkParams,
        );
      }

      const fkLookup = new Map<string, { table: string; column: string }>();
      foreignKeys.forEach((fk) => {
        fkLookup.set(`${fk.TABLE_NAME}.${fk.COLUMN_NAME}`, {
          table: fk.REFERENCED_TABLE_NAME,
          column: fk.REFERENCED_COLUMN_NAME,
        });
      });

      const tableEntries = tables.map((table) => {
        const tableColumns = columns.filter(
          (c) => c.TABLE_NAME === table.TABLE_NAME,
        );
        const truncatedColumns =
          tableColumns.length > maxColumns ? tableColumns.length - maxColumns : 0;

        const columnsForContext = tableColumns.slice(0, maxColumns).map((col) => {
          const key =
            col.COLUMN_KEY === "PRI"
              ? "PK"
              : col.COLUMN_KEY === "UNI"
                ? "UNI"
                : undefined;
          const fkRef = fkLookup.get(`${col.TABLE_NAME}.${col.COLUMN_NAME}`);

          return {
            name: col.COLUMN_NAME,
            data_type: col.DATA_TYPE,
            nullable: col.IS_NULLABLE === "YES",
            key: fkRef ? "FK" : key,
            references: fkRef
              ? `${fkRef.table}.${fkRef.column}`
              : undefined,
          };
        });

        const primaryKeys = tableColumns
          .filter((col) => col.COLUMN_KEY === "PRI")
          .map((col) => col.COLUMN_NAME);

        const foreignKeyList = foreignKeys
          .filter((fk) => fk.TABLE_NAME === table.TABLE_NAME)
          .map((fk) => ({
            column: fk.COLUMN_NAME,
            references: `${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`,
          }));

        return {
          table_name: table.TABLE_NAME,
          row_estimate: typeof table.TABLE_ROWS === "number"
            ? table.TABLE_ROWS
            : parseInt(table.TABLE_ROWS || "0", 10) || 0,
          primary_keys: primaryKeys,
          columns: columnsForContext,
          foreign_keys: foreignKeyList,
          truncated_columns: truncatedColumns > 0 ? truncatedColumns : 0,
        };
      });

      const relationships = foreignKeys.map((fk) => ({
        from_table: fk.TABLE_NAME,
        from_column: fk.COLUMN_NAME,
        to_table: fk.REFERENCED_TABLE_NAME,
        to_column: fk.REFERENCED_COLUMN_NAME,
      }));

      const lines: string[] = [];
      lines.push(`Schema-Aware RAG Context Pack (${database})`);
      lines.push(
        `Tables shown: ${tableEntries.length}/${
          totalTables || tableEntries.length
        } (rows are approximate)`,
      );
      lines.push(
        `Per-table column limit: ${maxColumns}${
          tableEntries.some((t) => t.truncated_columns > 0)
            ? " (additional columns truncated)"
            : ""
        }`,
      );
      lines.push("");

      tableEntries.forEach((t) => {
        const approxRows =
          typeof t.row_estimate === "number" && t.row_estimate >= 0
            ? `~${t.row_estimate}`
            : "~0";

        const columnSnippets = t.columns.map((c) => {
          const tags = [];
          if (c.key) tags.push(c.key);
          if (c.references) tags.push(`-> ${c.references}`);
          const nullability = c.nullable ? "null" : "not null";
          return `${c.name} ${c.data_type} (${nullability})${
            tags.length ? ` [${tags.join(", ")}]` : ""
          }`;
        });

        lines.push(
          `- ${t.table_name} (${approxRows} rows) PK: ${
            t.primary_keys.length ? t.primary_keys.join(", ") : "none"
          }`,
        );
        lines.push(`  Columns: ${columnSnippets.join("; ")}`);
        if (t.truncated_columns) {
          lines.push(`  ...and ${t.truncated_columns} more columns not shown`);
        }
      });

      if (includeRelationships && relationships.length) {
        lines.push("");
        lines.push("Relationships:");
        relationships.forEach((rel) => {
          lines.push(
            `- ${rel.from_table}.${rel.from_column} -> ${rel.to_table}.${rel.to_column}`,
          );
        });
      }

      if (totalTables > tableEntries.length) {
        lines.push(
          `\nNote: ${totalTables - tableEntries.length} table(s) omitted (max_tables=${maxTables}).`,
        );
      }

      return {
        status: "success",
        data: {
          database,
          total_tables: totalTables,
          tables: tableEntries,
          relationships: includeRelationships ? relationships : [],
          context_text: lines.join("\n"),
          limits: {
            max_tables: maxTables,
            max_columns: maxColumns,
          },
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
