import DatabaseConnection from "../db/connection";
import { SecurityLayer } from "../security/securityLayer";

export class DdlTools {
  private db: DatabaseConnection;
  private security: SecurityLayer;

  constructor(security: SecurityLayer) {
    this.db = DatabaseConnection.getInstance();
    this.security = security;
  }

  /**
   * Sanitize default value for SQL safety
   */
  private sanitizeDefaultValue(defaultValue: any): string {
    if (defaultValue === null || defaultValue === undefined) {
      return "NULL";
    }

    if (typeof defaultValue === "number") {
      return String(defaultValue);
    }

    if (typeof defaultValue === "boolean") {
      return defaultValue ? "1" : "0";
    }

    if (typeof defaultValue === "string") {
      // Check for dangerous SQL patterns in default values
      const dangerousPatterns = [
        /;/g, // Statement separators
        /--/g, // SQL comments
        /\/\*/g, // Block comment start
        /\*\//g, // Block comment end
        /\bUNION\b/gi, // UNION operations
        /\bSELECT\b/gi, // SELECT statements
        /\bINSERT\b/gi, // INSERT statements
        /\bUPDATE\b/gi, // UPDATE statements
        /\bDELETE\b/gi, // DELETE statements
        /\bDROP\b/gi, // DROP statements
        /\bCREATE\b/gi, // CREATE statements
        /\bALTER\b/gi, // ALTER statements
      ];

      let sanitized = defaultValue;
      for (const pattern of dangerousPatterns) {
        if (pattern.test(sanitized)) {
          throw new Error(
            `Dangerous SQL pattern detected in default value: ${pattern.source}`,
          );
        }
      }

      // Escape single quotes and backslashes
      sanitized = sanitized.replace(/\\/g, "\\\\").replace(/'/g, "''");

      return `'${sanitized}'`;
    }

    // For other types, convert to string and escape
    return `'${String(defaultValue).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
  }

  /**
   * Create a new table
   */
  async createTable(params: {
    table_name: string;
    columns: Array<{
      name: string;
      type: string;
      nullable?: boolean;
      primary_key?: boolean;
      auto_increment?: boolean;
      default?: string;
    }>;
    indexes?: Array<{
      name: string;
      columns: string[];
      unique?: boolean;
    }>;
  }): Promise<{
    status: string;
    data?: any;
    error?: string;
  }> {
    try {
      const { table_name, columns, indexes } = params;

      // Build column definitions
      const columnDefs = columns
        .map((col) => {
          let def = `\`${col.name}\` ${col.type}`;

          if (col.nullable === false) {
            def += " NOT NULL";
          }

          if (col.auto_increment) {
            def += " AUTO_INCREMENT";
          }

          if (col.default !== undefined) {
            // SECURITY: Properly sanitize default values to prevent SQL injection
            const sanitizedDefault = this.sanitizeDefaultValue(col.default);
            def += ` DEFAULT ${sanitizedDefault}`;
          }

          if (col.primary_key) {
            def += " PRIMARY KEY";
          }

          return def;
        })
        .join(", ");

      // Build the CREATE TABLE query
      let query = `CREATE TABLE \`${table_name}\` (${columnDefs})`;

      // Execute the query
      await this.db.query(query);

      // Create indexes if specified
      let queryCount = 1;
      if (indexes && indexes.length > 0) {
        for (const index of indexes) {
          const indexType = index.unique ? "UNIQUE INDEX" : "INDEX";
          const indexColumns = index.columns.map((c) => `\`${c}\``).join(", ");
          const indexQuery = `CREATE ${indexType} \`${index.name}\` ON \`${table_name}\` (${indexColumns})`;
          await this.db.query(indexQuery);
          queryCount++;
        }
      }

      return {
        status: "success",
        data: {
          message: `Table '${table_name}' created successfully`,
          table_name,
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
   * Alter an existing table
   */
  async alterTable(params: {
    table_name: string;
    operations: Array<{
      type:
        | "add_column"
        | "drop_column"
        | "modify_column"
        | "rename_column"
        | "add_index"
        | "drop_index";
      column_name?: string;
      new_column_name?: string;
      column_type?: string;
      nullable?: boolean;
      default?: string;
      index_name?: string;
      index_columns?: string[];
      unique?: boolean;
    }>;
  }): Promise<{
    status: string;
    data?: any;
    error?: string;
  }> {
    try {
      const { table_name, operations } = params;

      for (const op of operations) {
        let query = `ALTER TABLE \`${table_name}\``;

        switch (op.type) {
          case "add_column":
            if (!op.column_name || !op.column_type) {
              return {
                status: "error",
                error: "column_name and column_type required for add_column",
              };
            }
            query += ` ADD COLUMN \`${op.column_name}\` ${op.column_type}`;
            if (op.nullable === false) query += " NOT NULL";
            if (op.default !== undefined) {
              // SECURITY: Properly sanitize default values to prevent SQL injection
              const sanitizedDefault = this.sanitizeDefaultValue(op.default);
              query += ` DEFAULT ${sanitizedDefault}`;
            }
            break;

          case "drop_column":
            if (!op.column_name) {
              return {
                status: "error",
                error: "column_name required for drop_column",
              };
            }
            query += ` DROP COLUMN \`${op.column_name}\``;
            break;

          case "modify_column":
            if (!op.column_name || !op.column_type) {
              return {
                status: "error",
                error: "column_name and column_type required for modify_column",
              };
            }
            query += ` MODIFY COLUMN \`${op.column_name}\` ${op.column_type}`;
            if (op.nullable === false) query += " NOT NULL";
            if (op.default !== undefined) {
              // SECURITY: Properly sanitize default values to prevent SQL injection
              const sanitizedDefault = this.sanitizeDefaultValue(op.default);
              query += ` DEFAULT ${sanitizedDefault}`;
            }
            break;

          case "rename_column":
            if (!op.column_name || !op.new_column_name || !op.column_type) {
              return {
                status: "error",
                error:
                  "column_name, new_column_name, and column_type required for rename_column",
              };
            }
            query += ` CHANGE COLUMN \`${op.column_name}\` \`${op.new_column_name}\` ${op.column_type}`;
            break;

          case "add_index":
            if (!op.index_name || !op.index_columns) {
              return {
                status: "error",
                error: "index_name and index_columns required for add_index",
              };
            }
            const indexType = op.unique ? "UNIQUE INDEX" : "INDEX";
            const columns = op.index_columns.map((c) => `\`${c}\``).join(", ");
            query += ` ADD ${indexType} \`${op.index_name}\` (${columns})`;
            break;

          case "drop_index":
            if (!op.index_name) {
              return {
                status: "error",
                error: "index_name required for drop_index",
              };
            }
            query += ` DROP INDEX \`${op.index_name}\``;
            break;

          default:
            return {
              status: "error",
              error: `Unknown operation type: ${op.type}`,
            };
        }

        await this.db.query(query);
      }

      return {
        status: "success",
        data: {
          message: `Table '${table_name}' altered successfully`,
          table_name,
          operations_count: operations.length,
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
   * Drop a table
   */
  async dropTable(params: {
    table_name: string;
    if_exists?: boolean;
  }): Promise<{
    status: string;
    data?: any;
    error?: string;
  }> {
    try {
      const { table_name, if_exists } = params;

      const ifExistsClause = if_exists ? "IF EXISTS " : "";
      const query = `DROP TABLE ${ifExistsClause}\`${table_name}\``;

      await this.db.query(query);

      return {
        status: "success",
        data: {
          message: `Table '${table_name}' dropped successfully`,
          table_name,
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
   * Execute raw DDL SQL
   */
  async executeDdl(params: { query: string }): Promise<{
    status: string;
    data?: any;
    error?: string;
  }> {
    try {
      const { query } = params;

      // Basic validation - ensure it's a DDL query
      const upperQuery = query.trim().toUpperCase();
      const isDdl =
        upperQuery.startsWith("CREATE") ||
        upperQuery.startsWith("ALTER") ||
        upperQuery.startsWith("DROP") ||
        upperQuery.startsWith("TRUNCATE") ||
        upperQuery.startsWith("RENAME");

      if (!isDdl) {
        return {
          status: "error",
          error:
            "Only DDL operations (CREATE, ALTER, DROP, TRUNCATE, RENAME) are allowed with execute_ddl. For SELECT queries, use the 'run_query' tool instead. For INSERT/UPDATE/DELETE, use the 'execute_sql' tool.",
        };
      }

      const result = await this.db.query<any>(query);

      return {
        status: "success",
        data: {
          message: "DDL query executed successfully",
          affected_rows: result.affectedRows || 0,
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
