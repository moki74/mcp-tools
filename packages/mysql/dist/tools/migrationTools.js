"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationTools = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const config_1 = require("../config/config");
/**
 * Data Migration Tools for MySQL MCP Server
 * Provides utilities for copying, moving, and transforming data between tables
 */
class MigrationTools {
    constructor(security) {
        this.db = connection_1.default.getInstance();
        this.security = security;
    }
    /**
     * Validate database access
     */
    validateDatabaseAccess(requestedDatabase) {
        const connectedDatabase = config_1.dbConfig.database;
        if (!connectedDatabase) {
            return {
                valid: false,
                database: "",
                error: "No database configured. Please specify a database in your connection settings.",
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
     * Escape string value for SQL
     */
    escapeValue(value) {
        if (value === null)
            return "NULL";
        if (typeof value === "number")
            return String(value);
        if (typeof value === "boolean")
            return value ? "1" : "0";
        if (value instanceof Date) {
            return `'${value.toISOString().slice(0, 19).replace("T", " ")}'`;
        }
        if (Buffer.isBuffer(value)) {
            return `X'${value.toString("hex")}'`;
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
     * Copy data from one table to another within the same database
     */
    async copyTableData(params) {
        try {
            const { source_table, target_table, column_mapping, where_clause, truncate_target = false, batch_size = 1000, database, } = params;
            // Validate database access
            const dbValidation = this.validateDatabaseAccess(database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            // Validate table names
            const sourceValidation = this.security.validateIdentifier(source_table);
            if (!sourceValidation.valid) {
                return {
                    status: "error",
                    error: `Invalid source table name: ${sourceValidation.error}`,
                };
            }
            const targetValidation = this.security.validateIdentifier(target_table);
            if (!targetValidation.valid) {
                return {
                    status: "error",
                    error: `Invalid target table name: ${targetValidation.error}`,
                };
            }
            const escapedSource = this.security.escapeIdentifier(source_table);
            const escapedTarget = this.security.escapeIdentifier(target_table);
            let queryCount = 0;
            // Truncate target if requested
            if (truncate_target) {
                await this.db.query(`TRUNCATE TABLE ${escapedTarget}`);
                queryCount++;
            }
            // Get source columns
            const sourceColumnsQuery = `SHOW COLUMNS FROM ${escapedSource}`;
            const sourceColumns = await this.db.query(sourceColumnsQuery);
            queryCount++;
            const sourceColumnNames = sourceColumns.map((col) => col.Field);
            // Build column lists
            let selectColumns;
            let insertColumns;
            if (column_mapping && Object.keys(column_mapping).length > 0) {
                // Validate all column names in mapping
                for (const [src, tgt] of Object.entries(column_mapping)) {
                    const srcValidation = this.security.validateIdentifier(src);
                    if (!srcValidation.valid) {
                        return { status: "error", error: `Invalid source column: ${src}` };
                    }
                    const tgtValidation = this.security.validateIdentifier(tgt);
                    if (!tgtValidation.valid) {
                        return { status: "error", error: `Invalid target column: ${tgt}` };
                    }
                }
                selectColumns = Object.keys(column_mapping).map((c) => this.security.escapeIdentifier(c));
                insertColumns = Object.values(column_mapping).map((c) => this.security.escapeIdentifier(c));
            }
            else {
                // Use all source columns
                selectColumns = sourceColumnNames.map((c) => this.security.escapeIdentifier(c));
                insertColumns = selectColumns;
            }
            // Count source rows
            let countQuery = `SELECT COUNT(*) as cnt FROM ${escapedSource}`;
            if (where_clause) {
                countQuery += ` WHERE ${where_clause}`;
            }
            const countResult = await this.db.query(countQuery);
            queryCount++;
            const totalRows = countResult[0].cnt;
            if (totalRows === 0) {
                return {
                    status: "success",
                    data: {
                        message: "No rows to copy",
                        rows_copied: 0,
                        source_table,
                        target_table,
                    },
                };
            }
            // Copy data in batches
            let rowsCopied = 0;
            let offset = 0;
            while (offset < totalRows) {
                let selectQuery = `SELECT ${selectColumns.join(", ")} FROM ${escapedSource}`;
                if (where_clause) {
                    selectQuery += ` WHERE ${where_clause}`;
                }
                selectQuery += ` LIMIT ${batch_size} OFFSET ${offset}`;
                const rows = await this.db.query(selectQuery);
                queryCount++;
                if (rows.length === 0)
                    break;
                // Build INSERT statement
                const values = rows
                    .map((row) => {
                    const rowValues = Object.values(row).map((val) => this.escapeValue(val));
                    return `(${rowValues.join(", ")})`;
                })
                    .join(", ");
                const insertQuery = `INSERT INTO ${escapedTarget} (${insertColumns.join(", ")}) VALUES ${values}`;
                await this.db.query(insertQuery);
                queryCount++;
                rowsCopied += rows.length;
                offset += batch_size;
            }
            return {
                status: "success",
                data: {
                    message: `Successfully copied ${rowsCopied} rows`,
                    rows_copied: rowsCopied,
                    source_table,
                    target_table,
                    truncated_target: truncate_target,
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
     * Move data from one table to another (copy + delete from source)
     */
    async moveTableData(params) {
        try {
            const { source_table, target_table, column_mapping, where_clause, batch_size = 1000, database, } = params;
            // Validate database access
            const dbValidation = this.validateDatabaseAccess(database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            // Validate table names
            const sourceValidation = this.security.validateIdentifier(source_table);
            if (!sourceValidation.valid) {
                return {
                    status: "error",
                    error: `Invalid source table name: ${sourceValidation.error}`,
                };
            }
            const targetValidation = this.security.validateIdentifier(target_table);
            if (!targetValidation.valid) {
                return {
                    status: "error",
                    error: `Invalid target table name: ${targetValidation.error}`,
                };
            }
            // First, copy the data
            const copyResult = await this.copyTableData({
                source_table,
                target_table,
                column_mapping,
                where_clause,
                truncate_target: false,
                batch_size,
                database,
            });
            if (copyResult.status === "error") {
                return copyResult;
            }
            const rowsCopied = copyResult.data?.rows_copied || 0;
            // Then delete from source
            const escapedSource = this.security.escapeIdentifier(source_table);
            let deleteQuery = `DELETE FROM ${escapedSource}`;
            if (where_clause) {
                deleteQuery += ` WHERE ${where_clause}`;
            }
            await this.db.query(deleteQuery);
            return {
                status: "success",
                data: {
                    message: `Successfully moved ${rowsCopied} rows`,
                    rows_moved: rowsCopied,
                    source_table,
                    target_table,
                    rows_deleted_from_source: rowsCopied,
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
     * Clone a table structure (with or without data)
     */
    async cloneTable(params) {
        try {
            const { source_table, new_table_name, include_data = false, include_indexes = true, database, } = params;
            // Validate database access
            const dbValidation = this.validateDatabaseAccess(database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            // Validate table names
            const sourceValidation = this.security.validateIdentifier(source_table);
            if (!sourceValidation.valid) {
                return {
                    status: "error",
                    error: `Invalid source table name: ${sourceValidation.error}`,
                };
            }
            const newValidation = this.security.validateIdentifier(new_table_name);
            if (!newValidation.valid) {
                return {
                    status: "error",
                    error: `Invalid new table name: ${newValidation.error}`,
                };
            }
            const escapedSource = this.security.escapeIdentifier(source_table);
            const escapedNew = this.security.escapeIdentifier(new_table_name);
            let queryCount = 0;
            if (include_indexes) {
                // Use CREATE TABLE ... LIKE to preserve indexes
                const createQuery = `CREATE TABLE ${escapedNew} LIKE ${escapedSource}`;
                await this.db.query(createQuery);
                queryCount++;
                if (include_data) {
                    const insertQuery = `INSERT INTO ${escapedNew} SELECT * FROM ${escapedSource}`;
                    await this.db.query(insertQuery);
                    queryCount++;
                }
            }
            else {
                // Create table without indexes using CREATE TABLE ... AS SELECT
                if (include_data) {
                    const createQuery = `CREATE TABLE ${escapedNew} AS SELECT * FROM ${escapedSource}`;
                    await this.db.query(createQuery);
                    queryCount++;
                }
                else {
                    const createQuery = `CREATE TABLE ${escapedNew} AS SELECT * FROM ${escapedSource} WHERE 1=0`;
                    await this.db.query(createQuery);
                    queryCount++;
                }
            }
            // Get row count if data was included
            let rowCount = 0;
            if (include_data) {
                const countResult = await this.db.query(`SELECT COUNT(*) as cnt FROM ${escapedNew}`);
                queryCount++;
                rowCount = countResult[0].cnt;
            }
            return {
                status: "success",
                data: {
                    message: `Successfully cloned table '${source_table}' to '${new_table_name}'`,
                    source_table,
                    new_table_name,
                    include_data,
                    include_indexes,
                    rows_copied: rowCount,
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
     * Compare structure of two tables
     */
    async compareTableStructure(params) {
        try {
            const { table1, table2, database } = params;
            // Validate database access
            const dbValidation = this.validateDatabaseAccess(database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            // Validate table names
            const table1Validation = this.security.validateIdentifier(table1);
            if (!table1Validation.valid) {
                return {
                    status: "error",
                    error: `Invalid table1 name: ${table1Validation.error}`,
                };
            }
            const table2Validation = this.security.validateIdentifier(table2);
            if (!table2Validation.valid) {
                return {
                    status: "error",
                    error: `Invalid table2 name: ${table2Validation.error}`,
                };
            }
            const escapedTable1 = this.security.escapeIdentifier(table1);
            const escapedTable2 = this.security.escapeIdentifier(table2);
            let queryCount = 0;
            // Get columns for both tables
            const cols1 = await this.db.query(`SHOW COLUMNS FROM ${escapedTable1}`);
            queryCount++;
            const cols2 = await this.db.query(`SHOW COLUMNS FROM ${escapedTable2}`);
            queryCount++;
            const columns1 = new Map(cols1.map((c) => [c.Field, c]));
            const columns2 = new Map(cols2.map((c) => [c.Field, c]));
            const onlyInTable1 = [];
            const onlyInTable2 = [];
            const different = [];
            const identical = [];
            // Check columns in table1
            for (const [name, col1] of columns1) {
                const col2 = columns2.get(name);
                if (!col2) {
                    onlyInTable1.push(name);
                }
                else {
                    // Compare column properties
                    if (col1.Type !== col2.Type ||
                        col1.Null !== col2.Null ||
                        col1.Key !== col2.Key ||
                        col1.Default !== col2.Default) {
                        different.push({
                            column: name,
                            table1: {
                                type: col1.Type,
                                nullable: col1.Null,
                                key: col1.Key,
                                default: col1.Default,
                            },
                            table2: {
                                type: col2.Type,
                                nullable: col2.Null,
                                key: col2.Key,
                                default: col2.Default,
                            },
                        });
                    }
                    else {
                        identical.push(name);
                    }
                }
            }
            // Check columns only in table2
            for (const name of columns2.keys()) {
                if (!columns1.has(name)) {
                    onlyInTable2.push(name);
                }
            }
            const isIdentical = onlyInTable1.length === 0 &&
                onlyInTable2.length === 0 &&
                different.length === 0;
            return {
                status: "success",
                data: {
                    table1,
                    table2,
                    is_identical: isIdentical,
                    columns_only_in_table1: onlyInTable1,
                    columns_only_in_table2: onlyInTable2,
                    columns_with_differences: different,
                    identical_columns: identical,
                    summary: {
                        table1_column_count: columns1.size,
                        table2_column_count: columns2.size,
                        identical_count: identical.length,
                        different_count: different.length,
                    },
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
     * Sync data between two tables based on a key column
     */
    async syncTableData(params) {
        try {
            const { source_table, target_table, key_column, columns_to_sync, sync_mode = "upsert", batch_size = 1000, database, } = params;
            // Validate database access
            const dbValidation = this.validateDatabaseAccess(database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            // Validate identifiers
            const sourceValidation = this.security.validateIdentifier(source_table);
            if (!sourceValidation.valid) {
                return {
                    status: "error",
                    error: `Invalid source table: ${sourceValidation.error}`,
                };
            }
            const targetValidation = this.security.validateIdentifier(target_table);
            if (!targetValidation.valid) {
                return {
                    status: "error",
                    error: `Invalid target table: ${targetValidation.error}`,
                };
            }
            const keyValidation = this.security.validateIdentifier(key_column);
            if (!keyValidation.valid) {
                return {
                    status: "error",
                    error: `Invalid key column: ${keyValidation.error}`,
                };
            }
            const escapedSource = this.security.escapeIdentifier(source_table);
            const escapedTarget = this.security.escapeIdentifier(target_table);
            const escapedKey = this.security.escapeIdentifier(key_column);
            let queryCount = 0;
            // Get columns to sync
            let columnsToUse;
            if (columns_to_sync && columns_to_sync.length > 0) {
                for (const col of columns_to_sync) {
                    const colValidation = this.security.validateIdentifier(col);
                    if (!colValidation.valid) {
                        return { status: "error", error: `Invalid column: ${col}` };
                    }
                }
                columnsToUse = columns_to_sync;
            }
            else {
                // Get all columns from source
                const cols = await this.db.query(`SHOW COLUMNS FROM ${escapedSource}`);
                queryCount++;
                columnsToUse = cols.map((c) => c.Field);
            }
            const escapedColumns = columnsToUse.map((c) => this.security.escapeIdentifier(c));
            let insertedCount = 0;
            let updatedCount = 0;
            // Get source data
            const sourceData = await this.db.query(`SELECT ${escapedColumns.join(", ")} FROM ${escapedSource}`);
            queryCount++;
            // Get existing keys in target
            const targetKeys = await this.db.query(`SELECT ${escapedKey} FROM ${escapedTarget}`);
            queryCount++;
            const existingKeys = new Set(targetKeys.map((r) => r[key_column]));
            // Process in batches
            const rowsToInsert = [];
            const rowsToUpdate = [];
            for (const row of sourceData) {
                const keyValue = row[key_column];
                if (existingKeys.has(keyValue)) {
                    if (sync_mode === "update_only" || sync_mode === "upsert") {
                        rowsToUpdate.push(row);
                    }
                }
                else {
                    if (sync_mode === "insert_only" || sync_mode === "upsert") {
                        rowsToInsert.push(row);
                    }
                }
            }
            // Insert new rows
            if (rowsToInsert.length > 0) {
                for (let i = 0; i < rowsToInsert.length; i += batch_size) {
                    const batch = rowsToInsert.slice(i, i + batch_size);
                    const values = batch
                        .map((row) => {
                        const rowValues = columnsToUse.map((col) => this.escapeValue(row[col]));
                        return `(${rowValues.join(", ")})`;
                    })
                        .join(", ");
                    const insertQuery = `INSERT INTO ${escapedTarget} (${escapedColumns.join(", ")}) VALUES ${values}`;
                    await this.db.query(insertQuery);
                    queryCount++;
                    insertedCount += batch.length;
                }
            }
            // Update existing rows
            if (rowsToUpdate.length > 0) {
                for (const row of rowsToUpdate) {
                    const setClause = columnsToUse
                        .filter((col) => col !== key_column)
                        .map((col) => `${this.security.escapeIdentifier(col)} = ${this.escapeValue(row[col])}`)
                        .join(", ");
                    if (setClause) {
                        const updateQuery = `UPDATE ${escapedTarget} SET ${setClause} WHERE ${escapedKey} = ${this.escapeValue(row[key_column])}`;
                        await this.db.query(updateQuery);
                        queryCount++;
                        updatedCount++;
                    }
                }
            }
            return {
                status: "success",
                data: {
                    message: `Sync completed: ${insertedCount} inserted, ${updatedCount} updated`,
                    source_table,
                    target_table,
                    sync_mode,
                    rows_inserted: insertedCount,
                    rows_updated: updatedCount,
                    total_source_rows: sourceData.length,
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
exports.MigrationTools = MigrationTools;
