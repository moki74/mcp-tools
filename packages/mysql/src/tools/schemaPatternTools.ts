import DatabaseConnection from "../db/connection";
import { dbConfig } from "../config/config";
import { SecurityLayer } from "../security/securityLayer";

type TableInfo = {
  TABLE_NAME: string;
  TABLE_ROWS: number | string | null;
};

type ColumnInfo = {
  TABLE_NAME: string;
  COLUMN_NAME: string;
  DATA_TYPE: string;
  COLUMN_TYPE: string;
  IS_NULLABLE: "YES" | "NO";
  COLUMN_KEY: string;
};

type StatInfo = {
  TABLE_NAME: string;
  INDEX_NAME: string;
  COLUMN_NAME: string;
  SEQ_IN_INDEX: number;
};

type FkInfo = {
  TABLE_NAME: string;
  COLUMN_NAME: string;
  REFERENCED_TABLE_NAME: string;
  REFERENCED_COLUMN_NAME: string;
};

export class SchemaPatternTools {
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
          "No database configured. Please specify a database in your connection settings.",
      };
    }

    if (requestedDatabase && requestedDatabase !== connectedDatabase) {
      return {
        valid: false,
        database: "",
        error: `Access denied: You are connected to '${connectedDatabase}' but requested '${requestedDatabase}'. Cross-database access is not permitted.`,
      };
    }

    return { valid: true, database: connectedDatabase };
  }

  /**
   * Recognize common schema patterns and anti-patterns based on INFORMATION_SCHEMA.
   */
  async analyzeSchemaPatterns(params: {
    scope?: "database" | "table";
    table_name?: string;
    database?: string;
  } = {}): Promise<{ status: string; data?: any; error?: string }> {
    try {
      const dbValidation = this.validateDatabaseAccess(params?.database);
      if (!dbValidation.valid) {
        return { status: "error", error: dbValidation.error };
      }
      const database = dbValidation.database;
      const scope = params.scope || (params.table_name ? "table" : "database");

      if (scope === "table") {
        if (!params.table_name) {
          return { status: "error", error: "table_name is required for table scope" };
        }
        if (!this.security.validateIdentifier(params.table_name).valid) {
          return { status: "error", error: "Invalid table name" };
        }
      }

      const tables = await this.db.query<TableInfo[]>(
        `
          SELECT TABLE_NAME, TABLE_ROWS
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
          ${scope === "table" ? "AND TABLE_NAME = ?" : ""}
          ORDER BY TABLE_NAME
        `,
        scope === "table" ? [database, params.table_name] : [database],
      );

      if (!tables.length) {
        return {
          status: "success",
          data: {
            database,
            scope,
            tables_analyzed: 0,
            findings: [],
            summary: { high: 0, medium: 0, low: 0 },
            message: "No tables found.",
          },
        };
      }

      const tableNames = tables.map((t) => t.TABLE_NAME);
      const placeholders = tableNames.map(() => "?").join(",");

      const columns = await this.db.query<ColumnInfo[]>(
        `
          SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME IN (${placeholders})
          ORDER BY TABLE_NAME, ORDINAL_POSITION
        `,
        [database, ...tableNames],
      );

      const stats = await this.db.query<StatInfo[]>(
        `
          SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX
          FROM INFORMATION_SCHEMA.STATISTICS
          WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME IN (${placeholders})
          ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
        `,
        [database, ...tableNames],
      );

      const fks = await this.db.query<FkInfo[]>(
        `
          SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME IN (${placeholders})
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `,
        [database, ...tableNames],
      );

      const columnsByTable = new Map<string, ColumnInfo[]>();
      for (const c of columns) {
        if (!columnsByTable.has(c.TABLE_NAME)) columnsByTable.set(c.TABLE_NAME, []);
        columnsByTable.get(c.TABLE_NAME)!.push(c);
      }

      const indexesByTable = new Map<string, StatInfo[]>();
      for (const s of stats) {
        if (!indexesByTable.has(s.TABLE_NAME)) indexesByTable.set(s.TABLE_NAME, []);
        indexesByTable.get(s.TABLE_NAME)!.push(s);
      }

      const fksByTable = new Map<string, FkInfo[]>();
      for (const fk of fks) {
        if (!fksByTable.has(fk.TABLE_NAME)) fksByTable.set(fk.TABLE_NAME, []);
        fksByTable.get(fk.TABLE_NAME)!.push(fk);
      }

      const findings: Array<{
        severity: "high" | "medium" | "low";
        table_name: string;
        pattern: string;
        description: string;
        evidence?: any;
        recommendations?: string[];
      }> = [];

      const isColumnIndexed = (table: string, column: string): boolean => {
        const idx = indexesByTable.get(table) || [];
        return idx.some((s) => s.COLUMN_NAME === column);
      };

      for (const t of tables) {
        const tCols = columnsByTable.get(t.TABLE_NAME) || [];
        const tFks = fksByTable.get(t.TABLE_NAME) || [];

        const pkCols = tCols.filter((c) => c.COLUMN_KEY === "PRI");
        if (!pkCols.length) {
          findings.push({
            severity: "high",
            table_name: t.TABLE_NAME,
            pattern: "MISSING_PRIMARY_KEY",
            description: "Table has no PRIMARY KEY.",
            recommendations: [
              "Add a surrogate primary key (e.g., BIGINT AUTO_INCREMENT) or a natural composite key.",
              "Primary keys improve replication, indexing, and ORM compatibility.",
            ],
          });
        }

        if (tCols.length > 40) {
          findings.push({
            severity: "medium",
            table_name: t.TABLE_NAME,
            pattern: "WIDE_TABLE",
            description: `Table has ${tCols.length} columns, which can indicate overloading multiple concerns.`,
            evidence: { column_count: tCols.length },
            recommendations: [
              "Consider vertical partitioning or splitting into related tables.",
              "Move sparse/optional fields into a separate table.",
            ],
          });
        }

        const nullableCount = tCols.filter((c) => c.IS_NULLABLE === "YES").length;
        if (tCols.length > 0 && nullableCount / tCols.length > 0.6) {
          findings.push({
            severity: "medium",
            table_name: t.TABLE_NAME,
            pattern: "HIGH_NULLABILITY",
            description: `More than 60% of columns are NULLable (${nullableCount}/${tCols.length}).`,
            evidence: { nullable_columns: nullableCount, total_columns: tCols.length },
            recommendations: [
              "Review whether columns should be NOT NULL with defaults.",
              "Consider splitting rarely-used columns into another table.",
            ],
          });
        }

        // Foreign key columns without any index
        for (const fk of tFks) {
          if (!isColumnIndexed(t.TABLE_NAME, fk.COLUMN_NAME)) {
            findings.push({
              severity: "medium",
              table_name: t.TABLE_NAME,
              pattern: "FK_NOT_INDEXED",
              description: `Foreign key column '${fk.COLUMN_NAME}' is not indexed.`,
              evidence: {
                column: fk.COLUMN_NAME,
                references: `${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`,
              },
              recommendations: [
                `Add an index on '${fk.COLUMN_NAME}' to improve join and delete/update performance.`,
              ],
            });
          }
        }

        // Heuristic EAV detection: entity_id + attribute_id + value-like
        const colNames = new Set(tCols.map((c) => c.COLUMN_NAME.toLowerCase()));
        const hasEntityId = colNames.has("entity_id") || colNames.has("object_id");
        const hasAttrId = colNames.has("attribute_id") || colNames.has("field_id");
        const hasValue =
          colNames.has("value") ||
          colNames.has("value_string") ||
          colNames.has("value_int") ||
          colNames.has("value_decimal");
        if (hasEntityId && hasAttrId && hasValue) {
          findings.push({
            severity: "high",
            table_name: t.TABLE_NAME,
            pattern: "EAV_PATTERN",
            description:
              "Table resembles an Entity-Attribute-Value (EAV) design, which often causes performance and integrity issues.",
            recommendations: [
              "Consider modeling attributes as real columns or separate typed tables.",
              "If EAV is required, ensure strong indexing and constraints on (entity_id, attribute_id).",
            ],
          });
        }

        // Soft delete without index
        const softDeleteCol = tCols.find((c) =>
          ["deleted_at", "is_deleted", "deleted"].includes(
            c.COLUMN_NAME.toLowerCase(),
          ),
        );
        if (softDeleteCol && !isColumnIndexed(t.TABLE_NAME, softDeleteCol.COLUMN_NAME)) {
          findings.push({
            severity: "low",
            table_name: t.TABLE_NAME,
            pattern: "SOFT_DELETE_NOT_INDEXED",
            description: `Soft-delete column '${softDeleteCol.COLUMN_NAME}' exists but is not indexed.`,
            recommendations: [
              `If queries frequently filter on '${softDeleteCol.COLUMN_NAME}', add an index (possibly composite with tenant/account keys).`,
            ],
          });
        }

        // Potential implicit relationships: *_id columns without FK constraints
        const idCols = tCols
          .filter((c) => c.COLUMN_NAME.toLowerCase().endsWith("_id"))
          .map((c) => c.COLUMN_NAME);
        if (idCols.length > 0 && tFks.length === 0) {
          findings.push({
            severity: "low",
            table_name: t.TABLE_NAME,
            pattern: "IMPLICIT_RELATIONSHIPS",
            description:
              "Table has *_id columns but no declared foreign keys; this may be intentional, but can reduce integrity and join discoverability.",
            evidence: { id_columns: idCols.slice(0, 10), total_id_columns: idCols.length },
            recommendations: [
              "If appropriate, add foreign keys for critical relationships.",
              "At minimum, ensure *_id columns are indexed.",
            ],
          });
        }
      }

      const summary = {
        high: findings.filter((f) => f.severity === "high").length,
        medium: findings.filter((f) => f.severity === "medium").length,
        low: findings.filter((f) => f.severity === "low").length,
      };

      return {
        status: "success",
        data: {
          database,
          scope,
          tables_analyzed: tables.length,
          findings,
          summary,
          notes: [
            "Heuristic-based analysis; review recommendations before changing production schema.",
          ],
        },
      };
    } catch (error: any) {
      return { status: "error", error: error.message };
    }
  }
}
