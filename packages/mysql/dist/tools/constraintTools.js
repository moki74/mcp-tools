"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConstraintTools = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const config_1 = require("../config/config");
class ConstraintTools {
    constructor(security) {
        this.db = connection_1.default.getInstance();
        this.security = security;
    }
    /**
     * Validate database access - ensures only the connected database can be accessed
     */
    validateDatabaseAccess(requestedDatabase) {
        const connectedDatabase = config_1.dbConfig.database;
        if (!connectedDatabase) {
            return {
                valid: false,
                database: "",
                error: "No database specified in connection string. Cannot access any database.",
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
     * List all foreign keys for a table
     */
    async listForeignKeys(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { table_name } = params;
            const database = dbValidation.database;
            // Validate table name
            if (!this.security.validateIdentifier(table_name).valid) {
                return { status: "error", error: "Invalid table name" };
            }
            const query = `
        SELECT
          kcu.CONSTRAINT_NAME as constraint_name,
          kcu.COLUMN_NAME as column_name,
          kcu.REFERENCED_TABLE_SCHEMA as referenced_schema,
          kcu.REFERENCED_TABLE_NAME as referenced_table,
          kcu.REFERENCED_COLUMN_NAME as referenced_column,
          kcu.ORDINAL_POSITION as ordinal_position,
          rc.UPDATE_RULE as on_update,
          rc.DELETE_RULE as on_delete
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
        JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
          ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
          AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
        WHERE kcu.TABLE_SCHEMA = ?
          AND kcu.TABLE_NAME = ?
          AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
        ORDER BY kcu.CONSTRAINT_NAME, kcu.ORDINAL_POSITION
      `;
            const results = await this.db.query(query, [database, table_name]);
            // Group by constraint name
            const fkMap = new Map();
            for (const row of results) {
                const constraintName = row.constraint_name;
                if (!fkMap.has(constraintName)) {
                    fkMap.set(constraintName, {
                        constraint_name: constraintName,
                        table_name: table_name,
                        referenced_schema: row.referenced_schema,
                        referenced_table: row.referenced_table,
                        on_update: row.on_update,
                        on_delete: row.on_delete,
                        columns: [],
                    });
                }
                fkMap.get(constraintName).columns.push({
                    column_name: row.column_name,
                    referenced_column: row.referenced_column,
                    ordinal_position: row.ordinal_position,
                });
            }
            return {
                status: "success",
                data: Array.from(fkMap.values()),
            };
        }
        catch (error) {
            return {
                status: "error",
                error: error.message,
            };
        }
    }
    /**
     * List all constraints (PK, FK, UNIQUE, CHECK) for a table
     */
    async listConstraints(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { table_name } = params;
            const database = dbValidation.database;
            // Validate table name
            if (!this.security.validateIdentifier(table_name).valid) {
                return { status: "error", error: "Invalid table name" };
            }
            const query = `
        SELECT
          tc.CONSTRAINT_NAME as constraint_name,
          tc.CONSTRAINT_TYPE as constraint_type,
          GROUP_CONCAT(kcu.COLUMN_NAME ORDER BY kcu.ORDINAL_POSITION) as columns,
          kcu.REFERENCED_TABLE_NAME as referenced_table,
          GROUP_CONCAT(kcu.REFERENCED_COLUMN_NAME ORDER BY kcu.ORDINAL_POSITION) as referenced_columns
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
          ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
          AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
          AND tc.TABLE_NAME = kcu.TABLE_NAME
        WHERE tc.TABLE_SCHEMA = ? AND tc.TABLE_NAME = ?
        GROUP BY tc.CONSTRAINT_NAME, tc.CONSTRAINT_TYPE, kcu.REFERENCED_TABLE_NAME
        ORDER BY tc.CONSTRAINT_TYPE, tc.CONSTRAINT_NAME
      `;
            const results = await this.db.query(query, [database, table_name]);
            // Format results
            const constraints = results.map((row) => ({
                constraint_name: row.constraint_name,
                constraint_type: row.constraint_type,
                columns: row.columns ? row.columns.split(",") : [],
                referenced_table: row.referenced_table || null,
                referenced_columns: row.referenced_columns
                    ? row.referenced_columns.split(",")
                    : null,
            }));
            return {
                status: "success",
                data: constraints,
            };
        }
        catch (error) {
            return {
                status: "error",
                error: error.message,
            };
        }
    }
    /**
     * Add a foreign key constraint
     */
    async addForeignKey(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { table_name, constraint_name, columns, referenced_table, referenced_columns, on_delete = "RESTRICT", on_update = "RESTRICT", } = params;
            const database = dbValidation.database;
            // Validate names
            if (!this.security.validateIdentifier(table_name).valid) {
                return { status: "error", error: "Invalid table name" };
            }
            if (!this.security.validateIdentifier(constraint_name).valid) {
                return { status: "error", error: "Invalid constraint name" };
            }
            if (!this.security.validateIdentifier(referenced_table).valid) {
                return { status: "error", error: "Invalid referenced table name" };
            }
            // Validate column names
            for (const col of columns) {
                if (!this.security.validateIdentifier(col).valid) {
                    return { status: "error", error: `Invalid column name: ${col}` };
                }
            }
            for (const col of referenced_columns) {
                if (!this.security.validateIdentifier(col).valid) {
                    return {
                        status: "error",
                        error: `Invalid referenced column name: ${col}`,
                    };
                }
            }
            // Column counts must match
            if (columns.length !== referenced_columns.length) {
                return {
                    status: "error",
                    error: "Column count must match referenced column count",
                };
            }
            const columnList = columns.map((c) => `\`${c}\``).join(", ");
            const refColumnList = referenced_columns
                .map((c) => `\`${c}\``)
                .join(", ");
            const alterQuery = `
        ALTER TABLE \`${database}\`.\`${table_name}\`
        ADD CONSTRAINT \`${constraint_name}\`
        FOREIGN KEY (${columnList})
        REFERENCES \`${database}\`.\`${referenced_table}\` (${refColumnList})
        ON DELETE ${on_delete}
        ON UPDATE ${on_update}
      `;
            await this.db.query(alterQuery);
            return {
                status: "success",
                data: {
                    message: `Foreign key '${constraint_name}' added successfully`,
                    constraint_name,
                    table_name,
                    referenced_table,
                    database,
                },
            };
        }
        catch (error) {
            return {
                status: "error",
                error: error.message,
            };
        }
    }
    /**
     * Drop a foreign key constraint
     */
    async dropForeignKey(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { table_name, constraint_name } = params;
            const database = dbValidation.database;
            // Validate names
            if (!this.security.validateIdentifier(table_name).valid) {
                return { status: "error", error: "Invalid table name" };
            }
            if (!this.security.validateIdentifier(constraint_name).valid) {
                return { status: "error", error: "Invalid constraint name" };
            }
            const alterQuery = `ALTER TABLE \`${database}\`.\`${table_name}\` DROP FOREIGN KEY \`${constraint_name}\``;
            await this.db.query(alterQuery);
            return {
                status: "success",
                message: `Foreign key '${constraint_name}' dropped successfully from table '${table_name}'`,
            };
        }
        catch (error) {
            return {
                status: "error",
                error: error.message,
            };
        }
    }
    /**
     * Add a unique constraint
     */
    async addUniqueConstraint(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { table_name, constraint_name, columns } = params;
            const database = dbValidation.database;
            // Validate names
            if (!this.security.validateIdentifier(table_name).valid) {
                return { status: "error", error: "Invalid table name" };
            }
            if (!this.security.validateIdentifier(constraint_name).valid) {
                return { status: "error", error: "Invalid constraint name" };
            }
            // Validate column names
            for (const col of columns) {
                if (!this.security.validateIdentifier(col).valid) {
                    return { status: "error", error: `Invalid column name: ${col}` };
                }
            }
            const columnList = columns.map((c) => `\`${c}\``).join(", ");
            const alterQuery = `ALTER TABLE \`${database}\`.\`${table_name}\` ADD CONSTRAINT \`${constraint_name}\` UNIQUE (${columnList})`;
            await this.db.query(alterQuery);
            return {
                status: "success",
                data: {
                    message: `Unique constraint '${constraint_name}' added successfully`,
                    constraint_name,
                    table_name,
                    columns,
                    database,
                },
            };
        }
        catch (error) {
            return {
                status: "error",
                error: error.message,
            };
        }
    }
    /**
     * Drop a constraint (UNIQUE or CHECK)
     */
    async dropConstraint(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { table_name, constraint_name, constraint_type } = params;
            const database = dbValidation.database;
            // Validate names
            if (!this.security.validateIdentifier(table_name).valid) {
                return { status: "error", error: "Invalid table name" };
            }
            if (!this.security.validateIdentifier(constraint_name).valid) {
                return { status: "error", error: "Invalid constraint name" };
            }
            let alterQuery;
            if (constraint_type === "UNIQUE") {
                // UNIQUE constraints are implemented as indexes in MySQL
                alterQuery = `ALTER TABLE \`${database}\`.\`${table_name}\` DROP INDEX \`${constraint_name}\``;
            }
            else if (constraint_type === "CHECK") {
                alterQuery = `ALTER TABLE \`${database}\`.\`${table_name}\` DROP CHECK \`${constraint_name}\``;
            }
            else {
                return {
                    status: "error",
                    error: "Invalid constraint type. Use UNIQUE or CHECK.",
                };
            }
            await this.db.query(alterQuery);
            return {
                status: "success",
                message: `${constraint_type} constraint '${constraint_name}' dropped successfully from table '${table_name}'`,
            };
        }
        catch (error) {
            return {
                status: "error",
                error: error.message,
            };
        }
    }
    /**
     * Add a check constraint (MySQL 8.0.16+)
     */
    async addCheckConstraint(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { table_name, constraint_name, expression, enforced = true, } = params;
            const database = dbValidation.database;
            // Validate names
            if (!this.security.validateIdentifier(table_name).valid) {
                return { status: "error", error: "Invalid table name" };
            }
            if (!this.security.validateIdentifier(constraint_name).valid) {
                return { status: "error", error: "Invalid constraint name" };
            }
            let alterQuery = `ALTER TABLE \`${database}\`.\`${table_name}\` ADD CONSTRAINT \`${constraint_name}\` CHECK (${expression})`;
            if (!enforced) {
                alterQuery += " NOT ENFORCED";
            }
            await this.db.query(alterQuery);
            return {
                status: "success",
                data: {
                    message: `Check constraint '${constraint_name}' added successfully`,
                    constraint_name,
                    table_name,
                    expression,
                    enforced,
                    database,
                },
            };
        }
        catch (error) {
            return {
                status: "error",
                error: error.message,
            };
        }
    }
}
exports.ConstraintTools = ConstraintTools;
