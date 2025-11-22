import DatabaseConnection from '../db/connection';
import { SecurityLayer } from '../security/securityLayer';
import { dbConfig } from '../config/config';

export class IndexTools {
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
   * List all indexes for a table
   */
  async listIndexes(params: { table_name: string; database?: string }): Promise<{ status: string; data?: any[]; error?: string; queryLog?: string }> {
    try {
      const dbValidation = this.validateDatabaseAccess(params?.database);
      if (!dbValidation.valid) {
        return { status: 'error', error: dbValidation.error! };
      }

      const { table_name } = params;
      const database = dbValidation.database;

      // Validate table name
      const identifierValidation = this.security.validateIdentifier(table_name);
      if (!identifierValidation.valid) {
        return { status: 'error', error: identifierValidation.error || 'Invalid table name' };
      }

      const query = `SHOW INDEX FROM \`${database}\`.\`${table_name}\``;
      const results = await this.db.query<any[]>(query);

      // Group indexes by name for better readability
      const indexMap = new Map<string, any>();
      for (const row of results) {
        const indexName = row.Key_name;
        if (!indexMap.has(indexName)) {
          indexMap.set(indexName, {
            index_name: indexName,
            table_name: row.Table,
            is_unique: !row.Non_unique,
            is_primary: indexName === 'PRIMARY',
            index_type: row.Index_type,
            columns: [],
            cardinality: row.Cardinality,
            nullable: row.Null === 'YES',
            comment: row.Index_comment || null,
            visible: row.Visible === 'YES'
          });
        }
        indexMap.get(indexName)!.columns.push({
          column_name: row.Column_name,
          seq_in_index: row.Seq_in_index,
          collation: row.Collation,
          sub_part: row.Sub_part,
          expression: row.Expression || null
        });
      }

      return {
        status: 'success',
        data: Array.from(indexMap.values()),
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
   * Get detailed information about a specific index
   */
  async getIndexInfo(params: { table_name: string; index_name: string; database?: string }): Promise<{ status: string; data?: any; error?: string; queryLog?: string }> {
    try {
      const dbValidation = this.validateDatabaseAccess(params?.database);
      if (!dbValidation.valid) {
        return { status: 'error', error: dbValidation.error! };
      }

      const { table_name, index_name } = params;
      const database = dbValidation.database;

      // Validate names
      if (!this.security.validateIdentifier(table_name).valid) {
        return { status: 'error', error: 'Invalid table name' };
      }
      if (!this.security.validateIdentifier(index_name).valid) {
        return { status: 'error', error: 'Invalid index name' };
      }

      const query = `
        SELECT
          s.INDEX_NAME as index_name,
          s.TABLE_NAME as table_name,
          s.NON_UNIQUE as non_unique,
          s.SEQ_IN_INDEX as seq_in_index,
          s.COLUMN_NAME as column_name,
          s.COLLATION as collation,
          s.CARDINALITY as cardinality,
          s.SUB_PART as sub_part,
          s.PACKED as packed,
          s.NULLABLE as nullable,
          s.INDEX_TYPE as index_type,
          s.COMMENT as comment,
          s.INDEX_COMMENT as index_comment
        FROM INFORMATION_SCHEMA.STATISTICS s
        WHERE s.TABLE_SCHEMA = ? AND s.TABLE_NAME = ? AND s.INDEX_NAME = ?
        ORDER BY s.SEQ_IN_INDEX
      `;

      const results = await this.db.query<any[]>(query, [database, table_name, index_name]);

      if (results.length === 0) {
        return {
          status: 'error',
          error: `Index '${index_name}' not found on table '${table_name}'`,
          queryLog: this.db.getFormattedQueryLogs(1)
        };
      }

      // Compile index info
      const firstRow = results[0];
      const indexInfo = {
        index_name: firstRow.index_name,
        table_name: firstRow.table_name,
        is_unique: !firstRow.non_unique,
        is_primary: firstRow.index_name === 'PRIMARY',
        index_type: firstRow.index_type,
        comment: firstRow.index_comment || null,
        columns: results.map(r => ({
          column_name: r.column_name,
          seq_in_index: r.seq_in_index,
          collation: r.collation,
          cardinality: r.cardinality,
          sub_part: r.sub_part,
          nullable: r.nullable === 'YES'
        }))
      };

      return {
        status: 'success',
        data: indexInfo,
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
   * Create a new index
   */
  async createIndex(params: {
    table_name: string;
    index_name: string;
    columns: Array<string | { column: string; length?: number; order?: 'ASC' | 'DESC' }>;
    unique?: boolean;
    index_type?: 'BTREE' | 'HASH' | 'FULLTEXT' | 'SPATIAL';
    comment?: string;
    database?: string;
  }): Promise<{ status: string; data?: any; error?: string; queryLog?: string }> {
    try {
      const dbValidation = this.validateDatabaseAccess(params?.database);
      if (!dbValidation.valid) {
        return { status: 'error', error: dbValidation.error! };
      }

      const { table_name, index_name, columns, unique = false, index_type, comment } = params;
      const database = dbValidation.database;

      // Validate names
      if (!this.security.validateIdentifier(table_name).valid) {
        return { status: 'error', error: 'Invalid table name' };
      }
      if (!this.security.validateIdentifier(index_name).valid) {
        return { status: 'error', error: 'Invalid index name' };
      }

      // Build column list
      const columnList = columns.map(col => {
        if (typeof col === 'string') {
          if (!this.security.validateIdentifier(col).valid) {
            throw new Error(`Invalid column name: ${col}`);
          }
          return `\`${col}\``;
        } else {
          if (!this.security.validateIdentifier(col.column).valid) {
            throw new Error(`Invalid column name: ${col.column}`);
          }
          let colDef = `\`${col.column}\``;
          if (col.length) {
            colDef += `(${col.length})`;
          }
          if (col.order) {
            colDef += ` ${col.order}`;
          }
          return colDef;
        }
      }).join(', ');

      // Build CREATE INDEX statement
      let createQuery = 'CREATE ';

      if (index_type === 'FULLTEXT') {
        createQuery += 'FULLTEXT ';
      } else if (index_type === 'SPATIAL') {
        createQuery += 'SPATIAL ';
      } else if (unique) {
        createQuery += 'UNIQUE ';
      }

      createQuery += `INDEX \`${index_name}\` ON \`${database}\`.\`${table_name}\` (${columnList})`;

      if (index_type && index_type !== 'FULLTEXT' && index_type !== 'SPATIAL') {
        createQuery += ` USING ${index_type}`;
      }

      if (comment) {
        createQuery += ` COMMENT '${comment.replace(/'/g, "''")}'`;
      }

      await this.db.query(createQuery);

      return {
        status: 'success',
        data: {
          message: `Index '${index_name}' created successfully on table '${table_name}'`,
          index_name,
          table_name,
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
   * Drop an index
   */
  async dropIndex(params: { table_name: string; index_name: string; database?: string }): Promise<{ status: string; message?: string; error?: string; queryLog?: string }> {
    try {
      const dbValidation = this.validateDatabaseAccess(params?.database);
      if (!dbValidation.valid) {
        return { status: 'error', error: dbValidation.error! };
      }

      const { table_name, index_name } = params;
      const database = dbValidation.database;

      // Validate names
      if (!this.security.validateIdentifier(table_name).valid) {
        return { status: 'error', error: 'Invalid table name' };
      }
      if (!this.security.validateIdentifier(index_name).valid) {
        return { status: 'error', error: 'Invalid index name' };
      }

      // Cannot drop PRIMARY KEY with DROP INDEX
      if (index_name.toUpperCase() === 'PRIMARY') {
        return { status: 'error', error: 'Cannot drop PRIMARY KEY using drop_index. Use ALTER TABLE DROP PRIMARY KEY instead.' };
      }

      const dropQuery = `DROP INDEX \`${index_name}\` ON \`${database}\`.\`${table_name}\``;

      await this.db.query(dropQuery);

      return {
        status: 'success',
        message: `Index '${index_name}' dropped successfully from table '${table_name}'`,
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
   * Analyze index usage and statistics
   */
  async analyzeIndex(params: { table_name: string; database?: string }): Promise<{ status: string; data?: any; error?: string; queryLog?: string }> {
    try {
      const dbValidation = this.validateDatabaseAccess(params?.database);
      if (!dbValidation.valid) {
        return { status: 'error', error: dbValidation.error! };
      }

      const { table_name } = params;
      const database = dbValidation.database;

      // Validate table name
      if (!this.security.validateIdentifier(table_name).valid) {
        return { status: 'error', error: 'Invalid table name' };
      }

      // Run ANALYZE TABLE to update index statistics
      const analyzeQuery = `ANALYZE TABLE \`${database}\`.\`${table_name}\``;
      const analyzeResult = await this.db.query<any[]>(analyzeQuery);

      // Get updated index statistics
      const statsQuery = `
        SELECT
          INDEX_NAME as index_name,
          COLUMN_NAME as column_name,
          SEQ_IN_INDEX as seq_in_index,
          CARDINALITY as cardinality,
          INDEX_TYPE as index_type,
          NULLABLE as nullable
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY INDEX_NAME, SEQ_IN_INDEX
      `;

      const stats = await this.db.query<any[]>(statsQuery, [database, table_name]);

      return {
        status: 'success',
        data: {
          analyze_result: analyzeResult[0],
          index_statistics: stats
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
