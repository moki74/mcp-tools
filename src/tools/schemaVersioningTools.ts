import DatabaseConnection from "../db/connection";
import SecurityLayer from "../security/securityLayer";
import { dbConfig } from "../config/config";

/**
 * Schema Versioning and Migrations Tools for MySQL MCP Server
 * Provides utilities for managing database schema versions and migrations
 */
export class SchemaVersioningTools {
  private db: DatabaseConnection;
  private security: SecurityLayer;
  private migrationsTable: string = "_schema_migrations";

  constructor(security: SecurityLayer) {
    this.db = DatabaseConnection.getInstance();
    this.security = security;
  }

  /**
   * Validate database access
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

    return {
      valid: true,
      database: connectedDatabase,
    };
  }

  /**
   * Generate a migration version based on timestamp
   */
  private generateVersion(): string {
    const now = new Date();
    return now.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  }

  /**
   * Escape string value for SQL
   */
  private escapeValue(value: any): string {
    if (value === null) return "NULL";
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return value ? "1" : "0";
    if (value instanceof Date) {
      return `'${value.toISOString().slice(0, 19).replace("T", " ")}'`;
    }
    // Escape string
    const escaped = String(value)
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t")
      .replace(/\0/g, "\\0");
    return `'${escaped}'`;
  }

  /**
   * Initialize the migrations tracking table if it doesn't exist
   */
  async initMigrationsTable(params: {
    database?: string;
  }): Promise<{ status: string; data?: any; error?: string; queryLog?: string }> {
    try {
      const { database } = params;

      // Validate database access
      const dbValidation = this.validateDatabaseAccess(database);
      if (!dbValidation.valid) {
        return { status: "error", error: dbValidation.error };
      }

      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
          id INT AUTO_INCREMENT PRIMARY KEY,
          version VARCHAR(14) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          up_sql LONGTEXT NOT NULL,
          down_sql LONGTEXT,
          checksum VARCHAR(64),
          applied_at TIMESTAMP NULL DEFAULT NULL,
          applied_by VARCHAR(255),
          execution_time_ms INT,
          status ENUM('pending', 'applied', 'failed', 'rolled_back') DEFAULT 'pending',
          error_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_version (version),
          INDEX idx_status (status),
          INDEX idx_applied_at (applied_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;

      await this.db.query(createTableQuery);

      return {
        status: "success",
        data: {
          message: `Migrations table '${this.migrationsTable}' initialized successfully`,
          table_name: this.migrationsTable,
        },
        queryLog: this.db.getFormattedQueryLogs(1),
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message,
        queryLog: this.db.getFormattedQueryLogs(1),
      };
    }
  }

  /**
   * Create a new migration entry
   */
  async createMigration(params: {
    name: string;
    up_sql: string;
    down_sql?: string;
    description?: string;
    version?: string;
    database?: string;
  }): Promise<{ status: string; data?: any; error?: string; queryLog?: string }> {
    try {
      const {
        name,
        up_sql,
        down_sql,
        description,
        version,
        database,
      } = params;

      // Validate database access
      const dbValidation = this.validateDatabaseAccess(database);
      if (!dbValidation.valid) {
        return { status: "error", error: dbValidation.error };
      }

      // Validate name
      if (!name || name.trim().length === 0) {
        return { status: "error", error: "Migration name is required" };
      }

      if (!up_sql || up_sql.trim().length === 0) {
        return { status: "error", error: "up_sql is required for migration" };
      }

      // Ensure migrations table exists
      await this.initMigrationsTable({ database });

      // Generate version if not provided
      const migrationVersion = version || this.generateVersion();

      // Generate checksum for the up_sql
      const checksum = this.generateChecksum(up_sql);

      // Check if version already exists
      const existingQuery = `SELECT id FROM ${this.migrationsTable} WHERE version = ?`;
      const existing: any[] = await this.db.query(existingQuery, [migrationVersion]);

      if (existing.length > 0) {
        return {
          status: "error",
          error: `Migration version '${migrationVersion}' already exists`,
        };
      }

      // Insert the migration
      const insertQuery = `
        INSERT INTO ${this.migrationsTable}
        (version, name, description, up_sql, down_sql, checksum, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `;

      await this.db.query(insertQuery, [
        migrationVersion,
        name.trim(),
        description || null,
        up_sql,
        down_sql || null,
        checksum,
      ]);

      return {
        status: "success",
        data: {
          message: `Migration '${name}' created successfully`,
          version: migrationVersion,
          name: name.trim(),
          checksum,
          status: "pending",
        },
        queryLog: this.db.getFormattedQueryLogs(3),
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message,
        queryLog: this.db.getFormattedQueryLogs(1),
      };
    }
  }

  /**
   * Generate a simple checksum for SQL content
   */
  private generateChecksum(sql: string): string {
    let hash = 0;
    const str = sql.trim();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Apply pending migrations
   */
  async applyMigrations(params: {
    target_version?: string;
    dry_run?: boolean;
    database?: string;
  }): Promise<{ status: string; data?: any; error?: string; queryLog?: string }> {
    try {
      const { target_version, dry_run = false, database } = params;

      // Validate database access
      const dbValidation = this.validateDatabaseAccess(database);
      if (!dbValidation.valid) {
        return { status: "error", error: dbValidation.error };
      }

      // Ensure migrations table exists
      await this.initMigrationsTable({ database });

      let queryCount = 1;

      // Get pending migrations
      let pendingQuery = `
        SELECT id, version, name, up_sql, checksum
        FROM ${this.migrationsTable}
        WHERE status = 'pending'
      `;

      if (target_version) {
        pendingQuery += ` AND version <= ?`;
      }

      pendingQuery += ` ORDER BY version ASC`;

      const pendingMigrations: any[] = target_version
        ? await this.db.query(pendingQuery, [target_version])
        : await this.db.query(pendingQuery);
      queryCount++;

      if (pendingMigrations.length === 0) {
        return {
          status: "success",
          data: {
            message: "No pending migrations to apply",
            applied_count: 0,
            migrations: [],
          },
          queryLog: this.db.getFormattedQueryLogs(queryCount),
        };
      }

      if (dry_run) {
        return {
          status: "success",
          data: {
            message: `Dry run: ${pendingMigrations.length} migration(s) would be applied`,
            dry_run: true,
            migrations: pendingMigrations.map((m) => ({
              version: m.version,
              name: m.name,
              up_sql_preview: m.up_sql.substring(0, 200) + (m.up_sql.length > 200 ? "..." : ""),
            })),
          },
          queryLog: this.db.getFormattedQueryLogs(queryCount),
        };
      }

      const appliedMigrations: any[] = [];
      const failedMigrations: any[] = [];
      const currentUser = dbConfig.user || "unknown";

      for (const migration of pendingMigrations) {
        const startTime = Date.now();

        try {
          // Split SQL by semicolons and execute each statement
          const statements = this.splitSqlStatements(migration.up_sql);

          for (const statement of statements) {
            if (statement.trim()) {
              await this.db.query(statement);
              queryCount++;
            }
          }

          const executionTime = Date.now() - startTime;

          // Update migration status to applied
          const updateQuery = `
            UPDATE ${this.migrationsTable}
            SET status = 'applied',
                applied_at = NOW(),
                applied_by = ?,
                execution_time_ms = ?,
                error_message = NULL
            WHERE id = ?
          `;

          await this.db.query(updateQuery, [currentUser, executionTime, migration.id]);
          queryCount++;

          appliedMigrations.push({
            version: migration.version,
            name: migration.name,
            execution_time_ms: executionTime,
          });
        } catch (error: any) {
          const executionTime = Date.now() - startTime;

          // Update migration status to failed
          const updateQuery = `
            UPDATE ${this.migrationsTable}
            SET status = 'failed',
                execution_time_ms = ?,
                error_message = ?
            WHERE id = ?
          `;

          await this.db.query(updateQuery, [
            executionTime,
            error.message,
            migration.id,
          ]);
          queryCount++;

          failedMigrations.push({
            version: migration.version,
            name: migration.name,
            error: error.message,
            execution_time_ms: executionTime,
          });

          // Stop applying further migrations on failure
          break;
        }
      }

      return {
        status: failedMigrations.length > 0 ? "partial" : "success",
        data: {
          message:
            failedMigrations.length > 0
              ? `Applied ${appliedMigrations.length} migration(s), ${failedMigrations.length} failed`
              : `Successfully applied ${appliedMigrations.length} migration(s)`,
          applied_count: appliedMigrations.length,
          failed_count: failedMigrations.length,
          applied_migrations: appliedMigrations,
          failed_migrations: failedMigrations,
        },
        queryLog: this.db.getFormattedQueryLogs(queryCount),
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message,
        queryLog: this.db.getFormattedQueryLogs(1),
      };
    }
  }

  /**
   * Split SQL content into individual statements
   */
  private splitSqlStatements(sql: string): string[] {
    const statements: string[] = [];
    let currentStatement = "";
    let inString = false;
    let stringChar = "";
    let inComment = false;
    let inMultiLineComment = false;

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      const nextChar = sql[i + 1] || "";

      // Handle multi-line comments
      if (!inString && char === "/" && nextChar === "*") {
        inMultiLineComment = true;
        currentStatement += char;
        continue;
      }

      if (inMultiLineComment && char === "*" && nextChar === "/") {
        inMultiLineComment = false;
        currentStatement += char + nextChar;
        i++;
        continue;
      }

      if (inMultiLineComment) {
        currentStatement += char;
        continue;
      }

      // Handle single-line comments
      if (!inString && char === "-" && nextChar === "-") {
        inComment = true;
        currentStatement += char;
        continue;
      }

      if (inComment && char === "\n") {
        inComment = false;
        currentStatement += char;
        continue;
      }

      if (inComment) {
        currentStatement += char;
        continue;
      }

      // Handle strings
      if ((char === "'" || char === '"') && sql[i - 1] !== "\\") {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      // Handle statement separator
      if (char === ";" && !inString) {
        currentStatement += char;
        const trimmed = currentStatement.trim();
        if (trimmed && trimmed !== ";") {
          statements.push(trimmed);
        }
        currentStatement = "";
        continue;
      }

      currentStatement += char;
    }

    // Add any remaining statement
    const trimmed = currentStatement.trim();
    if (trimmed && trimmed !== ";") {
      statements.push(trimmed);
    }

    return statements;
  }

  /**
   * Rollback the last applied migration or to a specific version
   */
  async rollbackMigration(params: {
    target_version?: string;
    steps?: number;
    dry_run?: boolean;
    database?: string;
  }): Promise<{ status: string; data?: any; error?: string; queryLog?: string }> {
    try {
      const { target_version, steps = 1, dry_run = false, database } = params;

      // Validate database access
      const dbValidation = this.validateDatabaseAccess(database);
      if (!dbValidation.valid) {
        return { status: "error", error: dbValidation.error };
      }

      let queryCount = 0;

      // Get applied migrations to rollback
      let rollbackQuery: string;
      let queryParams: any[] = [];

      if (target_version) {
        rollbackQuery = `
          SELECT id, version, name, down_sql
          FROM ${this.migrationsTable}
          WHERE status = 'applied' AND version > ?
          ORDER BY version DESC
        `;
        queryParams = [target_version];
      } else {
        rollbackQuery = `
          SELECT id, version, name, down_sql
          FROM ${this.migrationsTable}
          WHERE status = 'applied'
          ORDER BY version DESC
          LIMIT ?
        `;
        queryParams = [steps];
      }

      const migrationsToRollback: any[] = await this.db.query(rollbackQuery, queryParams);
      queryCount++;

      if (migrationsToRollback.length === 0) {
        return {
          status: "success",
          data: {
            message: "No migrations to rollback",
            rolled_back_count: 0,
            migrations: [],
          },
          queryLog: this.db.getFormattedQueryLogs(queryCount),
        };
      }

      // Check if all migrations have down_sql
      const migrationsWithoutDown = migrationsToRollback.filter((m) => !m.down_sql);
      if (migrationsWithoutDown.length > 0 && !dry_run) {
        return {
          status: "error",
          error: `Cannot rollback: ${migrationsWithoutDown.length} migration(s) do not have down_sql defined: ${migrationsWithoutDown.map((m) => m.version).join(", ")}`,
        };
      }

      if (dry_run) {
        return {
          status: "success",
          data: {
            message: `Dry run: ${migrationsToRollback.length} migration(s) would be rolled back`,
            dry_run: true,
            migrations: migrationsToRollback.map((m) => ({
              version: m.version,
              name: m.name,
              has_down_sql: !!m.down_sql,
              down_sql_preview: m.down_sql
                ? m.down_sql.substring(0, 200) + (m.down_sql.length > 200 ? "..." : "")
                : null,
            })),
          },
          queryLog: this.db.getFormattedQueryLogs(queryCount),
        };
      }

      const rolledBackMigrations: any[] = [];
      const failedRollbacks: any[] = [];

      for (const migration of migrationsToRollback) {
        const startTime = Date.now();

        try {
          // Execute down_sql statements
          const statements = this.splitSqlStatements(migration.down_sql);

          for (const statement of statements) {
            if (statement.trim()) {
              await this.db.query(statement);
              queryCount++;
            }
          }

          const executionTime = Date.now() - startTime;

          // Update migration status to rolled_back
          const updateQuery = `
            UPDATE ${this.migrationsTable}
            SET status = 'rolled_back',
                applied_at = NULL,
                applied_by = NULL,
                execution_time_ms = ?,
                error_message = NULL
            WHERE id = ?
          `;

          await this.db.query(updateQuery, [executionTime, migration.id]);
          queryCount++;

          rolledBackMigrations.push({
            version: migration.version,
            name: migration.name,
            execution_time_ms: executionTime,
          });
        } catch (error: any) {
          const executionTime = Date.now() - startTime;

          failedRollbacks.push({
            version: migration.version,
            name: migration.name,
            error: error.message,
            execution_time_ms: executionTime,
          });

          // Stop rolling back on failure
          break;
        }
      }

      return {
        status: failedRollbacks.length > 0 ? "partial" : "success",
        data: {
          message:
            failedRollbacks.length > 0
              ? `Rolled back ${rolledBackMigrations.length} migration(s), ${failedRollbacks.length} failed`
              : `Successfully rolled back ${rolledBackMigrations.length} migration(s)`,
          rolled_back_count: rolledBackMigrations.length,
          failed_count: failedRollbacks.length,
          rolled_back_migrations: rolledBackMigrations,
          failed_rollbacks: failedRollbacks,
        },
        queryLog: this.db.getFormattedQueryLogs(queryCount),
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message,
        queryLog: this.db.getFormattedQueryLogs(1),
      };
    }
  }

  /**
   * Get migration history and status
   */
  async getMigrationStatus(params: {
    version?: string;
    status?: "pending" | "applied" | "failed" | "rolled_back";
    limit?: number;
    database?: string;
  }): Promise<{ status: string; data?: any; error?: string; queryLog?: string }> {
    try {
      const { version, status, limit = 50, database } = params;

      // Validate database access
      const dbValidation = this.validateDatabaseAccess(database);
      if (!dbValidation.valid) {
        return { status: "error", error: dbValidation.error };
      }

      // Ensure migrations table exists
      await this.initMigrationsTable({ database });

      let queryCount = 1;

      // Build query
      let query = `
        SELECT
          id,
          version,
          name,
          description,
          checksum,
          status,
          applied_at,
          applied_by,
          execution_time_ms,
          error_message,
          created_at
        FROM ${this.migrationsTable}
        WHERE 1=1
      `;
      const queryParams: any[] = [];

      if (version) {
        query += ` AND version = ?`;
        queryParams.push(version);
      }

      if (status) {
        query += ` AND status = ?`;
        queryParams.push(status);
      }

      query += ` ORDER BY version DESC LIMIT ?`;
      queryParams.push(limit);

      const migrations: any[] = await this.db.query(query, queryParams);
      queryCount++;

      // Get summary statistics
      const summaryQuery = `
        SELECT
          status,
          COUNT(*) as count
        FROM ${this.migrationsTable}
        GROUP BY status
      `;
      const summary: any[] = await this.db.query(summaryQuery);
      queryCount++;

      const summaryMap: Record<string, number> = {};
      for (const row of summary) {
        summaryMap[row.status] = row.count;
      }

      // Get current schema version
      const currentVersionQuery = `
        SELECT version
        FROM ${this.migrationsTable}
        WHERE status = 'applied'
        ORDER BY version DESC
        LIMIT 1
      `;
      const currentVersionResult: any[] = await this.db.query(currentVersionQuery);
      queryCount++;

      const currentVersion = currentVersionResult.length > 0
        ? currentVersionResult[0].version
        : null;

      return {
        status: "success",
        data: {
          current_version: currentVersion,
          summary: {
            total: Object.values(summaryMap).reduce((a, b) => a + b, 0),
            pending: summaryMap.pending || 0,
            applied: summaryMap.applied || 0,
            failed: summaryMap.failed || 0,
            rolled_back: summaryMap.rolled_back || 0,
          },
          migrations: migrations.map((m) => ({
            ...m,
            applied_at: m.applied_at ? m.applied_at.toISOString() : null,
            created_at: m.created_at ? m.created_at.toISOString() : null,
          })),
        },
        queryLog: this.db.getFormattedQueryLogs(queryCount),
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message,
        queryLog: this.db.getFormattedQueryLogs(1),
      };
    }
  }

  /**
   * Get the current schema version
   */
  async getSchemaVersion(params: {
    database?: string;
  }): Promise<{ status: string; data?: any; error?: string; queryLog?: string }> {
    try {
      const { database } = params;

      // Validate database access
      const dbValidation = this.validateDatabaseAccess(database);
      if (!dbValidation.valid) {
        return { status: "error", error: dbValidation.error };
      }

      // Check if migrations table exists
      const tableExistsQuery = `
        SELECT COUNT(*) as cnt
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
        AND table_name = ?
      `;
      const tableExists: any[] = await this.db.query(tableExistsQuery, [this.migrationsTable]);

      if (tableExists[0].cnt === 0) {
        return {
          status: "success",
          data: {
            current_version: null,
            message: "No migrations have been tracked yet",
            migrations_table_exists: false,
          },
          queryLog: this.db.getFormattedQueryLogs(1),
        };
      }

      // Get current version
      const versionQuery = `
        SELECT
          version,
          name,
          applied_at
        FROM ${this.migrationsTable}
        WHERE status = 'applied'
        ORDER BY version DESC
        LIMIT 1
      `;
      const versionResult: any[] = await this.db.query(versionQuery);

      if (versionResult.length === 0) {
        return {
          status: "success",
          data: {
            current_version: null,
            message: "No migrations have been applied yet",
            migrations_table_exists: true,
          },
          queryLog: this.db.getFormattedQueryLogs(2),
        };
      }

      const current = versionResult[0];

      // Count pending migrations
      const pendingQuery = `
        SELECT COUNT(*) as cnt
        FROM ${this.migrationsTable}
        WHERE status = 'pending'
      `;
      const pendingResult: any[] = await this.db.query(pendingQuery);

      return {
        status: "success",
        data: {
          current_version: current.version,
          current_migration_name: current.name,
          applied_at: current.applied_at ? current.applied_at.toISOString() : null,
          pending_migrations: pendingResult[0].cnt,
          migrations_table_exists: true,
        },
        queryLog: this.db.getFormattedQueryLogs(3),
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message,
        queryLog: this.db.getFormattedQueryLogs(1),
      };
    }
  }

  /**
   * Validate pending migrations (check for conflicts or issues)
   */
  async validateMigrations(params: {
    database?: string;
  }): Promise<{ status: string; data?: any; error?: string; queryLog?: string }> {
    try {
      const { database } = params;

      // Validate database access
      const dbValidation = this.validateDatabaseAccess(database);
      if (!dbValidation.valid) {
        return { status: "error", error: dbValidation.error };
      }

      // Ensure migrations table exists
      await this.initMigrationsTable({ database });

      let queryCount = 1;

      // Get all migrations
      const migrationsQuery = `
        SELECT
          id,
          version,
          name,
          up_sql,
          down_sql,
          checksum,
          status
        FROM ${this.migrationsTable}
        ORDER BY version ASC
      `;
      const migrations: any[] = await this.db.query(migrationsQuery);
      queryCount++;

      const issues: any[] = [];
      const warnings: any[] = [];

      // Check for duplicate versions
      const versionCounts = new Map<string, number>();
      for (const m of migrations) {
        versionCounts.set(m.version, (versionCounts.get(m.version) || 0) + 1);
      }
      for (const [version, count] of versionCounts) {
        if (count > 1) {
          issues.push({
            type: "duplicate_version",
            version,
            message: `Version '${version}' appears ${count} times`,
          });
        }
      }

      // Check for missing down_sql
      for (const m of migrations) {
        if (!m.down_sql) {
          warnings.push({
            type: "missing_down_sql",
            version: m.version,
            name: m.name,
            message: `Migration '${m.name}' (${m.version}) has no down_sql - rollback will not be possible`,
          });
        }
      }

      // Verify checksums for applied migrations
      for (const m of migrations) {
        if (m.status === "applied") {
          const expectedChecksum = this.generateChecksum(m.up_sql);
          if (m.checksum !== expectedChecksum) {
            issues.push({
              type: "checksum_mismatch",
              version: m.version,
              name: m.name,
              message: `Migration '${m.name}' (${m.version}) checksum mismatch - migration may have been modified after being applied`,
              stored_checksum: m.checksum,
              calculated_checksum: expectedChecksum,
            });
          }
        }
      }

      // Check for failed migrations that block pending ones
      const failedMigrations = migrations.filter((m) => m.status === "failed");
      if (failedMigrations.length > 0) {
        const pendingAfterFailed = migrations.filter(
          (m) => m.status === "pending" && m.version > failedMigrations[0].version
        );
        if (pendingAfterFailed.length > 0) {
          warnings.push({
            type: "blocked_migrations",
            message: `${pendingAfterFailed.length} pending migration(s) are blocked by failed migration '${failedMigrations[0].name}' (${failedMigrations[0].version})`,
            failed_version: failedMigrations[0].version,
            blocked_versions: pendingAfterFailed.map((m) => m.version),
          });
        }
      }

      const isValid = issues.length === 0;

      return {
        status: "success",
        data: {
          valid: isValid,
          total_migrations: migrations.length,
          issues_count: issues.length,
          warnings_count: warnings.length,
          issues,
          warnings,
          summary: {
            pending: migrations.filter((m) => m.status === "pending").length,
            applied: migrations.filter((m) => m.status === "applied").length,
            failed: migrations.filter((m) => m.status === "failed").length,
            rolled_back: migrations.filter((m) => m.status === "rolled_back").length,
          },
        },
        queryLog: this.db.getFormattedQueryLogs(queryCount),
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message,
        queryLog: this.db.getFormattedQueryLogs(1),
      };
    }
  }

  /**
   * Mark a failed migration as resolved (reset to pending status)
   */
  async resetFailedMigration(params: {
    version: string;
    database?: string;
  }): Promise<{ status: string; data?: any; error?: string; queryLog?: string }> {
    try {
      const { version, database } = params;

      // Validate database access
      const dbValidation = this.validateDatabaseAccess(database);
      if (!dbValidation.valid) {
        return { status: "error", error: dbValidation.error };
      }

      // Check if migration exists and is failed
      const checkQuery = `
        SELECT id, name, status
        FROM ${this.migrationsTable}
        WHERE version = ?
      `;
      const migration: any[] = await this.db.query(checkQuery, [version]);

      if (migration.length === 0) {
        return {
          status: "error",
          error: `Migration version '${version}' not found`,
        };
      }

      if (migration[0].status !== "failed") {
        return {
          status: "error",
          error: `Migration '${version}' is not in failed status (current status: ${migration[0].status})`,
        };
      }

      // Reset to pending
      const updateQuery = `
        UPDATE ${this.migrationsTable}
        SET status = 'pending',
            error_message = NULL,
            execution_time_ms = NULL
        WHERE version = ?
      `;
      await this.db.query(updateQuery, [version]);

      return {
        status: "success",
        data: {
          message: `Migration '${migration[0].name}' (${version}) has been reset to pending status`,
          version,
          name: migration[0].name,
          previous_status: "failed",
          new_status: "pending",
        },
        queryLog: this.db.getFormattedQueryLogs(2),
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message,
        queryLog: this.db.getFormattedQueryLogs(1),
      };
    }
  }

  /**
   * Generate a migration from table comparison
   */
  async generateMigrationFromDiff(params: {
    table1: string;
    table2: string;
    migration_name: string;
    database?: string;
  }): Promise<{ status: string; data?: any; error?: string; queryLog?: string }> {
    try {
      const { table1, table2, migration_name, database } = params;

      // Validate database access
      const dbValidation = this.validateDatabaseAccess(database);
      if (!dbValidation.valid) {
        return { status: "error", error: dbValidation.error };
      }

      // Validate table names
      const table1Validation = this.security.validateIdentifier(table1);
      if (!table1Validation.valid) {
        return { status: "error", error: `Invalid table1 name: ${table1Validation.error}` };
      }

      const table2Validation = this.security.validateIdentifier(table2);
      if (!table2Validation.valid) {
        return { status: "error", error: `Invalid table2 name: ${table2Validation.error}` };
      }

      const escapedTable1 = this.security.escapeIdentifier(table1);
      const escapedTable2 = this.security.escapeIdentifier(table2);

      // Get columns for both tables
      const cols1: any[] = await this.db.query(`SHOW COLUMNS FROM ${escapedTable1}`);
      const cols2: any[] = await this.db.query(`SHOW COLUMNS FROM ${escapedTable2}`);

      const columns1 = new Map(cols1.map((c) => [c.Field, c]));
      const columns2 = new Map(cols2.map((c) => [c.Field, c]));

      const upStatements: string[] = [];
      const downStatements: string[] = [];

      // Find columns only in table1 (to add to table2)
      for (const [name, col] of columns1) {
        if (!columns2.has(name)) {
          const nullable = col.Null === "YES" ? "NULL" : "NOT NULL";
          const defaultVal = col.Default !== null ? ` DEFAULT ${this.escapeValue(col.Default)}` : "";
          upStatements.push(
            `ALTER TABLE ${escapedTable2} ADD COLUMN \`${name}\` ${col.Type} ${nullable}${defaultVal};`
          );
          downStatements.push(`ALTER TABLE ${escapedTable2} DROP COLUMN \`${name}\`;`);
        }
      }

      // Find columns only in table2 (to remove from table2 to match table1)
      for (const [name, col] of columns2) {
        if (!columns1.has(name)) {
          upStatements.push(`ALTER TABLE ${escapedTable2} DROP COLUMN \`${name}\`;`);
          const nullable = col.Null === "YES" ? "NULL" : "NOT NULL";
          const defaultVal = col.Default !== null ? ` DEFAULT ${this.escapeValue(col.Default)}` : "";
          downStatements.push(
            `ALTER TABLE ${escapedTable2} ADD COLUMN \`${name}\` ${col.Type} ${nullable}${defaultVal};`
          );
        }
      }

      // Find columns with different types
      for (const [name, col1] of columns1) {
        const col2 = columns2.get(name);
        if (col2 && col1.Type !== col2.Type) {
          const nullable1 = col1.Null === "YES" ? "NULL" : "NOT NULL";
          const nullable2 = col2.Null === "YES" ? "NULL" : "NOT NULL";
          upStatements.push(
            `ALTER TABLE ${escapedTable2} MODIFY COLUMN \`${name}\` ${col1.Type} ${nullable1};`
          );
          downStatements.push(
            `ALTER TABLE ${escapedTable2} MODIFY COLUMN \`${name}\` ${col2.Type} ${nullable2};`
          );
        }
      }

      if (upStatements.length === 0) {
        return {
          status: "success",
          data: {
            message: "No differences found between tables - no migration needed",
            table1,
            table2,
            differences: 0,
          },
          queryLog: this.db.getFormattedQueryLogs(2),
        };
      }

      const upSql = upStatements.join("\n");
      const downSql = downStatements.join("\n");

      // Create the migration
      const createResult = await this.createMigration({
        name: migration_name,
        up_sql: upSql,
        down_sql: downSql,
        description: `Auto-generated migration to transform ${table2} structure to match ${table1}`,
        database,
      });

      if (createResult.status === "error") {
        return createResult;
      }

      return {
        status: "success",
        data: {
          message: `Migration '${migration_name}' generated with ${upStatements.length} change(s)`,
          version: createResult.data?.version,
          changes_count: upStatements.length,
          up_sql: upSql,
          down_sql: downSql,
          source_table: table1,
          target_table: table2,
        },
        queryLog: this.db.getFormattedQueryLogs(4),
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message,
        queryLog: this.db.getFormattedQueryLogs(1),
      };
    }
  }
}
