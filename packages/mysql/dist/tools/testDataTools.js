"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestDataTools = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const config_1 = require("../config/config");
class TestDataTools {
    constructor(security) {
        this.db = connection_1.default.getInstance();
        this.security = security;
    }
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
    escapeValue(value) {
        if (value === null || value === undefined)
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
    parseEnumValues(columnType) {
        const m = columnType.match(/^enum\((.*)\)$/i);
        if (!m)
            return [];
        // values are single-quoted and may contain escaped quotes
        const inner = m[1];
        const values = [];
        let current = "";
        let inQuote = false;
        for (let i = 0; i < inner.length; i++) {
            const ch = inner[i];
            const prev = inner[i - 1];
            if (ch === "'" && prev !== "\\") {
                inQuote = !inQuote;
                if (!inQuote) {
                    values.push(current);
                    current = "";
                }
                continue;
            }
            if (inQuote)
                current += ch;
        }
        return values;
    }
    clampString(value, maxLen) {
        if (!maxLen || maxLen <= 0)
            return value;
        if (value.length <= maxLen)
            return value;
        return value.slice(0, Math.max(1, maxLen));
    }
    generateValueForColumn(col, rowIndex, fkSamples) {
        const dataType = (col.DATA_TYPE || "").toLowerCase();
        const colNameLower = col.COLUMN_NAME.toLowerCase();
        // If FK sample values exist, use them
        if (fkSamples && fkSamples.length > 0) {
            const sample = fkSamples[rowIndex % fkSamples.length];
            if (sample !== undefined && sample !== null)
                return sample;
        }
        // Handle enums
        if (dataType === "enum") {
            const values = this.parseEnumValues(col.COLUMN_TYPE);
            if (values.length > 0)
                return values[rowIndex % values.length];
            return col.IS_NULLABLE === "YES" ? null : "";
        }
        // Numeric types
        if ([
            "int",
            "tinyint",
            "smallint",
            "mediumint",
            "bigint",
        ].includes(dataType)) {
            if (colNameLower.includes("is_") || colNameLower.startsWith("is")) {
                return rowIndex % 2;
            }
            if (colNameLower.endsWith("_id")) {
                return rowIndex + 1;
            }
            return rowIndex + 1;
        }
        if (["decimal", "float", "double"].includes(dataType)) {
            return parseFloat(((rowIndex + 1) * 1.11).toFixed(2));
        }
        // Date/time types
        if (["date", "datetime", "timestamp"].includes(dataType)) {
            const now = Date.now();
            const daysAgo = rowIndex % 30;
            const dt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
            if (dataType === "date")
                return dt.toISOString().slice(0, 10);
            return dt;
        }
        // JSON
        if (dataType === "json") {
            return JSON.stringify({ seed: rowIndex + 1 });
        }
        // Binary
        if (["blob", "tinyblob", "mediumblob", "longblob"].includes(dataType)) {
            return Buffer.from([rowIndex % 256]);
        }
        // Text/string types
        if (["varchar", "char", "text", "tinytext", "mediumtext", "longtext"].includes(dataType)) {
            let v = "";
            if (colNameLower.includes("email"))
                v = `user${rowIndex + 1}@example.com`;
            else if (colNameLower.includes("phone"))
                v = `+1555000${String(rowIndex + 1).padStart(4, "0")}`;
            else if (colNameLower.includes("url"))
                v = `https://example.com/item/${rowIndex + 1}`;
            else if (colNameLower.includes("name"))
                v = `Sample ${col.COLUMN_NAME} ${rowIndex + 1}`;
            else if (colNameLower.includes("title"))
                v = `Title ${rowIndex + 1}`;
            else if (colNameLower.includes("description"))
                v = `Description for row ${rowIndex + 1}`;
            else
                v = `${col.COLUMN_NAME}_${rowIndex + 1}`;
            return this.clampString(v, col.CHARACTER_MAXIMUM_LENGTH);
        }
        // Fallback: string
        const fallback = `${col.COLUMN_NAME}_${rowIndex + 1}`;
        return this.clampString(fallback, col.CHARACTER_MAXIMUM_LENGTH);
    }
    /**
     * Generate SQL INSERT statements (does not execute) for synthetic test data.
     * Attempts to maintain referential integrity by sampling referenced keys when foreign keys exist.
     */
    async generateTestData(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const database = dbValidation.database;
            const { table_name, row_count } = params;
            const batchSize = Math.min(Math.max(params.batch_size ?? 100, 1), 1000);
            const includeNulls = params.include_nulls ?? true;
            if (!this.security.validateIdentifier(table_name).valid) {
                return { status: "error", error: "Invalid table name" };
            }
            if (!Number.isFinite(row_count) || row_count <= 0) {
                return { status: "error", error: "row_count must be a positive number" };
            }
            if (row_count > 5000) {
                return {
                    status: "error",
                    error: "row_count too large (max 5000) to avoid oversized responses",
                };
            }
            // Read column metadata
            const columns = await this.db.query(`
          SELECT
            COLUMN_NAME,
            DATA_TYPE,
            COLUMN_TYPE,
            IS_NULLABLE,
            COLUMN_DEFAULT,
            EXTRA,
            COLUMN_KEY,
            CHARACTER_MAXIMUM_LENGTH
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `, [database, table_name]);
            if (!columns.length) {
                return {
                    status: "error",
                    error: `Table '${table_name}' not found or has no columns`,
                };
            }
            // Foreign keys for the table
            const fks = await this.db.query(`
          SELECT
            COLUMN_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = ?
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `, [database, table_name]);
            const fkSamplesByColumn = new Map();
            const warnings = [];
            for (const fk of fks) {
                const refTable = fk.REFERENCED_TABLE_NAME;
                const refCol = fk.REFERENCED_COLUMN_NAME;
                if (!this.security.validateIdentifier(refTable).valid)
                    continue;
                if (!this.security.validateIdentifier(refCol).valid)
                    continue;
                const escapedRefTable = this.security.escapeIdentifier(refTable);
                const escapedRefCol = this.security.escapeIdentifier(refCol);
                const sampleRows = await this.db.query(`SELECT ${escapedRefCol} as v FROM ${escapedRefTable} WHERE ${escapedRefCol} IS NOT NULL LIMIT 200`);
                const sampleValues = sampleRows.map((r) => r.v).filter((v) => v !== null);
                if (sampleValues.length === 0) {
                    warnings.push(`Foreign key '${table_name}.${fk.COLUMN_NAME}' references '${refTable}.${refCol}' but no referenced key samples were found (referenced table may be empty).`);
                }
                fkSamplesByColumn.set(fk.COLUMN_NAME, sampleValues);
            }
            // Determine insertable columns (skip auto-increment and generated columns)
            const insertColumns = columns.filter((c) => {
                const extra = (c.EXTRA || "").toLowerCase();
                if (extra.includes("auto_increment"))
                    return false;
                if (extra.includes("generated"))
                    return false;
                return true;
            });
            if (!insertColumns.length) {
                return {
                    status: "error",
                    error: `No insertable columns found for '${table_name}' (all columns are auto-increment/generated?)`,
                };
            }
            const escapedDb = this.security.escapeIdentifier(database);
            const escapedTable = this.security.escapeIdentifier(table_name);
            const escapedCols = insertColumns.map((c) => this.security.escapeIdentifier(c.COLUMN_NAME));
            const previewRows = [];
            const statements = [];
            for (let start = 0; start < row_count; start += batchSize) {
                const end = Math.min(start + batchSize, row_count);
                const valuesSql = [];
                for (let i = start; i < end; i++) {
                    const rowObj = {};
                    const rowVals = [];
                    for (const col of insertColumns) {
                        const fkSamples = fkSamplesByColumn.get(col.COLUMN_NAME);
                        let v = this.generateValueForColumn(col, i, fkSamples);
                        // Null handling
                        if (!includeNulls && col.IS_NULLABLE === "YES") {
                            // avoid NULLs unless needed
                            if (v === null)
                                v = this.generateValueForColumn(col, i, undefined);
                        }
                        if ((v === null || v === undefined) && col.IS_NULLABLE === "NO") {
                            if (col.COLUMN_DEFAULT !== null && col.COLUMN_DEFAULT !== undefined) {
                                // Let DB default apply by omitting value where possible.
                                // We can't omit per-column in multi-row insert safely, so materialize a value.
                                v = col.COLUMN_DEFAULT;
                            }
                            else {
                                // Last resort: generate non-null fallback
                                v = this.generateValueForColumn({ ...col, IS_NULLABLE: "YES" }, i);
                                if (v === null || v === undefined) {
                                    return {
                                        status: "error",
                                        error: `Cannot generate non-null value for NOT NULL column '${col.COLUMN_NAME}'`,
                                    };
                                }
                            }
                        }
                        rowObj[col.COLUMN_NAME] = v;
                        rowVals.push(this.escapeValue(v));
                    }
                    if (previewRows.length < 20)
                        previewRows.push(rowObj);
                    valuesSql.push(`(${rowVals.join(", ")})`);
                }
                const stmt = `INSERT INTO ${escapedDb}.${escapedTable} (${escapedCols.join(", ")}) VALUES\n${valuesSql.join(",\n")};`;
                statements.push(stmt);
            }
            return {
                status: "success",
                data: {
                    database,
                    table_name,
                    row_count,
                    batch_size: batchSize,
                    insert_sql: statements.join("\n\n"),
                    preview_rows: previewRows,
                    warnings,
                    notes: [
                        "This tool only generates SQL (does not execute).",
                        "Foreign key columns will use sampled referenced keys when available.",
                    ],
                },
            };
        }
        catch (error) {
            return { status: "error", error: error.message };
        }
    }
}
exports.TestDataTools = TestDataTools;
