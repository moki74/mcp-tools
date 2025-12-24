import DatabaseConnection from "../db/connection";
import { SecurityLayer } from "../security/securityLayer";
import { dbConfig } from "../config/config";

export class FulltextSearchTools {
  private db: DatabaseConnection;
  private security: SecurityLayer;

  constructor(security: SecurityLayer) {
    this.db = DatabaseConnection.getInstance();
    this.security = security;
  }

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

  async createFulltextIndex(params: {
    table_name: string;
    columns: string[];
    index_name?: string;
    parser?: "ngram" | "mecab";
    ngram_token_size?: number;
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

      const {
        table_name,
        columns,
        index_name,
        parser,
        ngram_token_size,
      } = params;
      const database = dbValidation.database;

      if (!this.security.validateIdentifier(table_name).valid) {
        return { status: "error", error: "Invalid table name" };
      }

      if (!columns || columns.length === 0) {
        return { status: "error", error: "At least one column is required" };
      }

      for (const col of columns) {
        if (!this.security.validateIdentifier(col).valid) {
          return { status: "error", error: `Invalid column name: ${col}` };
        }
      }

      const columnList = columns.map((col) => `\`${col}\``).join(", ");
      const generatedIndexName = index_name || `ft_${table_name}_${columns.join("_")}`;

      if (!this.security.validateIdentifier(generatedIndexName).valid) {
        return { status: "error", error: "Invalid index name" };
      }

      let createQuery = `CREATE FULLTEXT INDEX \`${generatedIndexName}\` ON \`${database}\`.\`${table_name}\` (${columnList})`;

      if (parser) {
        createQuery += ` WITH PARSER ${parser}`;
      }

      if (parser === "ngram" && ngram_token_size) {
        createQuery += ` ngram_token_size=${ngram_token_size}`;
      }

      await this.db.query(createQuery);

      return {
        status: "success",
        data: {
          message: `Fulltext index '${generatedIndexName}' created successfully on table '${table_name}'`,
          index_name: generatedIndexName,
          table_name,
          columns,
          parser,
        },
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message,
      };
    }
  }

  async fulltextSearch(params: {
    table_name: string;
    search_term: string;
    columns?: string[];
    mode?:
      | "natural_language"
      | "natural_language_with_query_expansion"
      | "boolean"
      | "query_expansion";
    limit?: number;
    offset?: number;
    order_by?: string;
    order_direction?: "ASC" | "DESC";
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

      const {
        table_name,
        search_term,
        columns,
        mode = "natural_language",
        limit = 100,
        offset = 0,
        order_by,
        order_direction = "DESC",
      } = params;
      const database = dbValidation.database;

      if (!this.security.validateIdentifier(table_name).valid) {
        return { status: "error", error: "Invalid table name" };
      }

      if (!search_term || typeof search_term !== "string") {
        return { status: "error", error: "Search term is required" };
      }

      const searchTermEscaped = search_term.replace(/'/g, "''");

      let searchColumns: string[];
      if (columns && columns.length > 0) {
        searchColumns = columns;
        for (const col of columns) {
          if (!this.security.validateIdentifier(col).valid) {
            return { status: "error", error: `Invalid column name: ${col}` };
          }
        }
      } else {
        const existingIndexesQuery = `
          SELECT DISTINCT INDEX_NAME, COLUMN_NAME
          FROM INFORMATION_SCHEMA.STATISTICS
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_TYPE = 'FULLTEXT'
          ORDER BY INDEX_NAME, SEQ_IN_INDEX
        `;
        const indexColumns = await this.db.query<any[]>(existingIndexesQuery, [
          database,
          table_name,
        ]);

        if (indexColumns.length === 0) {
          return {
            status: "error",
            error:
              "No fulltext index found on table. Please specify columns or create a fulltext index first.",
          };
        }

        const indexMap = new Map<string, string[]>();
        for (const row of indexColumns) {
          if (!indexMap.has(row.INDEX_NAME)) {
            indexMap.set(row.INDEX_NAME, []);
          }
          indexMap.get(row.INDEX_NAME)!.push(row.COLUMN_NAME);
        }

        const firstIndex = Array.from(indexMap.values())[0];
        if (!firstIndex) {
          return {
            status: "error",
            error:
              "No fulltext index found on table. Please specify columns or create a fulltext index first.",
          };
        }
        searchColumns = firstIndex;
      }

      const columnList = searchColumns.map((col) => `\`${col}\``).join(", ");

      let matchClause = "";
      switch (mode) {
        case "natural_language":
          matchClause = `MATCH(${columnList}) AGAINST('${searchTermEscaped}')`;
          break;
        case "natural_language_with_query_expansion":
          matchClause = `MATCH(${columnList}) AGAINST('${searchTermEscaped}' WITH QUERY EXPANSION)`;
          break;
        case "boolean":
          matchClause = `MATCH(${columnList}) AGAINST('${searchTermEscaped}' IN BOOLEAN MODE)`;
          break;
        case "query_expansion":
          matchClause = `MATCH(${columnList}) AGAINST('${searchTermEscaped}' WITH QUERY EXPANSION)`;
          break;
        default:
          matchClause = `MATCH(${columnList}) AGAINST('${searchTermEscaped}')`;
      }

      let selectQuery = `SELECT *, ${matchClause} as relevance_score FROM \`${database}\`.\`${table_name}\` WHERE ${matchClause} > 0`;

      if (order_by) {
        if (this.security.validateIdentifier(order_by).valid) {
          selectQuery += ` ORDER BY \`${order_by}\` ${order_direction}`;
        } else {
          return { status: "error", error: "Invalid order_by column name" };
        }
      } else {
        selectQuery += ` ORDER BY relevance_score ${order_direction}`;
      }

      selectQuery += ` LIMIT ${Math.min(limit, 10000)} OFFSET ${Math.max(offset, 0)}`;

      const results = await this.db.query<any[]>(selectQuery);

      return {
        status: "success",
        data: {
          results,
          search_term,
          search_columns: searchColumns,
          mode,
          total_results: results.length,
          limit,
          offset,
        },
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message,
      };
    }
  }

  async getFulltextInfo(params: {
    table_name: string;
    index_name?: string;
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

      const { table_name, index_name } = params;
      const database = dbValidation.database;

      if (!this.security.validateIdentifier(table_name).valid) {
        return { status: "error", error: "Invalid table name" };
      }

      let query = `
        SELECT
          INDEX_NAME as index_name,
          TABLE_NAME as table_name,
          COLUMN_NAME as column_name,
          SEQ_IN_INDEX as seq_in_index,
          COLLATION as collation,
          CARDINALITY as cardinality,
          SUB_PART as sub_part,
          NULLABLE as nullable,
          INDEX_TYPE as index_type,
          COMMENT as comment
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_TYPE = 'FULLTEXT'
      `;

      const queryParams: any[] = [database, table_name];

      if (index_name) {
        if (!this.security.validateIdentifier(index_name).valid) {
          return { status: "error", error: "Invalid index name" };
        }
        query += " AND INDEX_NAME = ?";
        queryParams.push(index_name);
      }

      query += " ORDER BY INDEX_NAME, SEQ_IN_INDEX";

      const results = await this.db.query<any[]>(query, queryParams);

      if (results.length === 0) {
        return {
          status: "success",
          data: {
            message: index_name
              ? `No fulltext index named '${index_name}' found on table '${table_name}'`
              : `No fulltext indexes found on table '${table_name}'`,
            indexes: [],
          },
        };
      }

      const indexMap = new Map<string, any>();
      for (const row of results) {
        const idxName = row.index_name;
        if (!indexMap.has(idxName)) {
          indexMap.set(idxName, {
            index_name: idxName,
            table_name: row.table_name,
            columns: [],
            comment: row.comment || null,
          });
        }
        indexMap.get(idxName)!.columns.push({
          column_name: row.column_name,
          seq_in_index: row.seq_in_index,
          collation: row.collation,
          sub_part: row.sub_part,
          nullable: row.nullable === "YES",
        });
      }

      return {
        status: "success",
        data: {
          indexes: Array.from(indexMap.values()),
          total_count: indexMap.size,
        },
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message,
      };
    }
  }

  async dropFulltextIndex(params: {
    table_name: string;
    index_name?: string;
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

      const { table_name, index_name } = params;
      const database = dbValidation.database;

      if (!this.security.validateIdentifier(table_name).valid) {
        return { status: "error", error: "Invalid table name" };
      }

      let targetIndexName = index_name;

      if (!targetIndexName) {
        const existingQuery = `
          SELECT INDEX_NAME
          FROM INFORMATION_SCHEMA.STATISTICS
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_TYPE = 'FULLTEXT'
          LIMIT 1
        `;
        const existingResult = await this.db.query<any[]>(existingQuery, [
          database,
          table_name,
        ]);

        if (existingResult.length === 0) {
          return {
            status: "error",
            error: `No fulltext index found on table '${table_name}'`,
          };
        }
        targetIndexName = existingResult[0].INDEX_NAME;
      }

      if (!targetIndexName || !this.security.validateIdentifier(targetIndexName).valid) {
        return { status: "error", error: "Invalid index name" };
      }

      const dropQuery = `DROP INDEX \`${targetIndexName}\` ON \`${database}\`.\`${table_name}\``;
      await this.db.query(dropQuery);

      return {
        status: "success",
        data: {
          message: `Fulltext index '${targetIndexName}' dropped successfully from table '${table_name}'`,
          index_name: targetIndexName,
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

  async getFulltextStats(params: {
    table_name: string;
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

      const { table_name } = params;
      const database = dbValidation.database;

      if (!this.security.validateIdentifier(table_name).valid) {
        return { status: "error", error: "Invalid table name" };
      }

      const tableStatsQuery = `
        SELECT
          TABLE_ROWS as estimated_rows,
          DATA_LENGTH as data_length,
          INDEX_LENGTH as index_length,
          AVG_ROW_LENGTH as avg_row_length,
          UPDATE_TIME as last_updated
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      `;

      const tableStats = await this.db.query<any[]>(tableStatsQuery, [
        database,
        table_name,
      ]);

      const indexStatsQuery = `
        SELECT
          INDEX_NAME as index_name,
          COLUMN_NAME as column_name,
          CARDINALITY as cardinality
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_TYPE = 'FULLTEXT'
        ORDER BY INDEX_NAME, SEQ_IN_INDEX
      `;

      const indexStats = await this.db.query<any[]>(indexStatsQuery, [
        database,
        table_name,
      ]);

      const globalStatsQuery = `
        SELECT
          @@ft_min_word_len as min_word_len,
          @@ft_max_word_len as max_word_len,
          @@ft_query_expansion_limit as query_expansion_limit,
          @@ft_stopword_file as stopword_file
      `;

      const globalStats = await this.db.query<any[]>(globalStatsQuery);

      const indexMap = new Map<string, any>();
      for (const row of indexStats) {
        const idxName = row.index_name;
        if (!indexMap.has(idxName)) {
          indexMap.set(idxName, {
            index_name: idxName,
            columns: [],
            total_cardinality: 0,
          });
        }
        indexMap.get(idxName)!.columns.push({
          column_name: row.column_name,
          cardinality: row.cardinality,
        });
        if (row.cardinality) {
          indexMap.get(idxName)!.total_cardinality += Number(
            row.cardinality
          );
        }
      }

      return {
        status: "success",
        data: {
          table_name,
          table_stats: tableStats[0] || null,
          fulltext_indexes: Array.from(indexMap.values()),
          fulltext_count: indexMap.size,
          global_settings: globalStats[0] || null,
        },
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message,
      };
    }
  }

  async optimizeFulltext(params: {
    table_name: string;
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

      const { table_name } = params;
      const database = dbValidation.database;

      if (!this.security.validateIdentifier(table_name).valid) {
        return { status: "error", error: "Invalid table name" };
      }

      const optimizeQuery = `OPTIMIZE TABLE \`${database}\`.\`${table_name}\``;
      const optimizeResult = await this.db.query<any[]>(optimizeQuery);

      return {
        status: "success",
        data: {
          message: `Table '${table_name}' optimized successfully`,
          table_name,
          optimization_result: optimizeResult[0],
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
