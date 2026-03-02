"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataExportTools = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const config_1 = require("../config/config");
const inputValidation_1 = require("../validation/inputValidation");
class DataExportTools {
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
     * Escape string value for SQL INSERT statements
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
     * Export table data to CSV format
     */
    async exportTableToCSV(params) {
        try {
            const { table_name, filters = [], pagination, sorting, include_headers = true, } = params;
            // Validate table name
            const tableValidation = this.security.validateIdentifier(table_name);
            if (!tableValidation.valid) {
                return {
                    status: "error",
                    error: tableValidation.error,
                };
            }
            // Build WHERE clause
            let whereClause = "";
            const whereParams = [];
            if (filters && filters.length > 0) {
                const whereConditions = [];
                for (const filter of filters) {
                    // Validate field name
                    const fieldValidation = this.security.validateIdentifier(filter.field);
                    if (!fieldValidation.valid) {
                        return {
                            status: "error",
                            error: `Invalid field name: ${filter.field}`,
                        };
                    }
                    const fieldName = this.security.escapeIdentifier(filter.field);
                    switch (filter.operator) {
                        case "eq":
                            whereConditions.push(`${fieldName} = ?`);
                            whereParams.push(filter.value);
                            break;
                        case "neq":
                            whereConditions.push(`${fieldName} != ?`);
                            whereParams.push(filter.value);
                            break;
                        case "gt":
                            whereConditions.push(`${fieldName} > ?`);
                            whereParams.push(filter.value);
                            break;
                        case "gte":
                            whereConditions.push(`${fieldName} >= ?`);
                            whereParams.push(filter.value);
                            break;
                        case "lt":
                            whereConditions.push(`${fieldName} < ?`);
                            whereParams.push(filter.value);
                            break;
                        case "lte":
                            whereConditions.push(`${fieldName} <= ?`);
                            whereParams.push(filter.value);
                            break;
                        case "like":
                            whereConditions.push(`${fieldName} LIKE ?`);
                            whereParams.push(filter.value);
                            break;
                        case "in":
                            if (Array.isArray(filter.value)) {
                                const placeholders = filter.value.map(() => "?").join(", ");
                                whereConditions.push(`${fieldName} IN (${placeholders})`);
                                whereParams.push(...filter.value);
                            }
                            else {
                                return {
                                    status: "error",
                                    error: "IN operator requires an array of values",
                                };
                            }
                            break;
                        default:
                            return {
                                status: "error",
                                error: `Unsupported operator: ${filter.operator}`,
                            };
                    }
                }
                if (whereConditions.length > 0) {
                    whereClause = "WHERE " + whereConditions.join(" AND ");
                }
            }
            // Build ORDER BY clause
            let orderByClause = "";
            if (sorting) {
                const fieldValidation = this.security.validateIdentifier(sorting.field);
                if (!fieldValidation.valid) {
                    return {
                        status: "error",
                        error: `Invalid sort field name: ${sorting.field}`,
                    };
                }
                const fieldName = this.security.escapeIdentifier(sorting.field);
                const direction = sorting.direction.toUpperCase() === "DESC" ? "DESC" : "ASC";
                orderByClause = `ORDER BY ${fieldName} ${direction}`;
            }
            // Build LIMIT clause
            let limitClause = "";
            if (pagination) {
                const offset = (pagination.page - 1) * pagination.limit;
                limitClause = `LIMIT ${offset}, ${pagination.limit}`;
            }
            // Construct the query
            const escapedTableName = this.security.escapeIdentifier(table_name);
            const query = `SELECT * FROM ${escapedTableName} ${whereClause} ${orderByClause} ${limitClause}`;
            // Execute query
            const results = await this.db.query(query, whereParams);
            // If no results, return empty CSV
            if (results.length === 0) {
                return {
                    status: "success",
                    data: {
                        csv: include_headers ? "" : "",
                        row_count: 0,
                    },
                };
            }
            // Generate CSV
            let csv = "";
            // Add headers if requested
            if (include_headers) {
                const headers = Object.keys(results[0]).join(",");
                csv += headers + "\n";
            }
            // Add data rows
            for (const row of results) {
                const values = Object.values(row)
                    .map((value) => {
                    if (value === null)
                        return "";
                    if (typeof value === "string") {
                        // Escape quotes and wrap in quotes if contains comma or newline
                        if (value.includes(",") ||
                            value.includes("\n") ||
                            value.includes('"')) {
                            return `"${value.replace(/"/g, '""')}"`;
                        }
                        return value;
                    }
                    return String(value);
                })
                    .join(",");
                csv += values + "\n";
            }
            return {
                status: "success",
                data: {
                    csv: csv,
                    row_count: results.length,
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
     * Export query results to CSV format
     */
    async exportQueryToCSV(params) {
        try {
            const { query, params: queryParams = [], include_headers = true, } = params;
            // Validate query is a SELECT statement
            if (!this.security.isReadOnlyQuery(query)) {
                return {
                    status: "error",
                    error: "Only SELECT queries can be exported to CSV",
                };
            }
            // Validate parameters
            const paramValidation = this.security.validateParameters(queryParams);
            if (!paramValidation.valid) {
                return {
                    status: "error",
                    error: paramValidation.error,
                };
            }
            // Execute query
            const results = await this.db.query(query, queryParams);
            // If no results, return empty CSV
            if (results.length === 0) {
                return {
                    status: "success",
                    data: {
                        csv: include_headers ? "" : "",
                        row_count: 0,
                    },
                };
            }
            // Generate CSV
            let csv = "";
            // Add headers if requested
            if (include_headers) {
                const headers = Object.keys(results[0]).join(",");
                csv += headers + "\n";
            }
            // Add data rows
            for (const row of results) {
                const values = Object.values(row)
                    .map((value) => {
                    if (value === null)
                        return "";
                    if (typeof value === "string") {
                        // Escape quotes and wrap in quotes if contains comma or newline
                        if (value.includes(",") ||
                            value.includes("\n") ||
                            value.includes('"')) {
                            return `"${value.replace(/"/g, '""')}"`;
                        }
                        return value;
                    }
                    return String(value);
                })
                    .join(",");
                csv += values + "\n";
            }
            return {
                status: "success",
                data: {
                    csv: csv,
                    row_count: results.length,
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
     * Export table data to JSON format
     */
    async exportTableToJSON(params) {
        try {
            const { table_name, filters = [], pagination, sorting, pretty = true, database, } = params;
            // Validate database access
            const dbValidation = this.validateDatabaseAccess(database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            // Validate table name
            const tableValidation = this.security.validateIdentifier(table_name);
            if (!tableValidation.valid) {
                return { status: "error", error: tableValidation.error };
            }
            // Build WHERE clause
            let whereClause = "";
            const whereParams = [];
            if (filters && filters.length > 0) {
                const whereConditions = [];
                for (const filter of filters) {
                    const fieldValidation = this.security.validateIdentifier(filter.field);
                    if (!fieldValidation.valid) {
                        return {
                            status: "error",
                            error: `Invalid field name: ${filter.field}`,
                        };
                    }
                    const fieldName = this.security.escapeIdentifier(filter.field);
                    switch (filter.operator) {
                        case "eq":
                            whereConditions.push(`${fieldName} = ?`);
                            whereParams.push(filter.value);
                            break;
                        case "neq":
                            whereConditions.push(`${fieldName} != ?`);
                            whereParams.push(filter.value);
                            break;
                        case "gt":
                            whereConditions.push(`${fieldName} > ?`);
                            whereParams.push(filter.value);
                            break;
                        case "gte":
                            whereConditions.push(`${fieldName} >= ?`);
                            whereParams.push(filter.value);
                            break;
                        case "lt":
                            whereConditions.push(`${fieldName} < ?`);
                            whereParams.push(filter.value);
                            break;
                        case "lte":
                            whereConditions.push(`${fieldName} <= ?`);
                            whereParams.push(filter.value);
                            break;
                        case "like":
                            whereConditions.push(`${fieldName} LIKE ?`);
                            whereParams.push(filter.value);
                            break;
                        case "in":
                            if (Array.isArray(filter.value)) {
                                const placeholders = filter.value.map(() => "?").join(", ");
                                whereConditions.push(`${fieldName} IN (${placeholders})`);
                                whereParams.push(...filter.value);
                            }
                            else {
                                return {
                                    status: "error",
                                    error: "IN operator requires an array of values",
                                };
                            }
                            break;
                        default:
                            return {
                                status: "error",
                                error: `Unsupported operator: ${filter.operator}`,
                            };
                    }
                }
                if (whereConditions.length > 0) {
                    whereClause = "WHERE " + whereConditions.join(" AND ");
                }
            }
            // Build ORDER BY clause
            let orderByClause = "";
            if (sorting) {
                const fieldValidation = this.security.validateIdentifier(sorting.field);
                if (!fieldValidation.valid) {
                    return {
                        status: "error",
                        error: `Invalid sort field name: ${sorting.field}`,
                    };
                }
                const fieldName = this.security.escapeIdentifier(sorting.field);
                const direction = sorting.direction.toUpperCase() === "DESC" ? "DESC" : "ASC";
                orderByClause = `ORDER BY ${fieldName} ${direction}`;
            }
            // Build LIMIT clause
            let limitClause = "";
            if (pagination) {
                const offset = (pagination.page - 1) * pagination.limit;
                limitClause = `LIMIT ${offset}, ${pagination.limit}`;
            }
            // Construct and execute query
            const escapedTableName = this.security.escapeIdentifier(table_name);
            const query = `SELECT * FROM ${escapedTableName} ${whereClause} ${orderByClause} ${limitClause}`;
            const results = await this.db.query(query, whereParams);
            // Generate JSON
            const json = pretty
                ? JSON.stringify(results, null, 2)
                : JSON.stringify(results);
            return {
                status: "success",
                data: {
                    json: json,
                    row_count: results.length,
                    table_name: table_name,
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
     * Export query results to JSON format
     */
    async exportQueryToJSON(params) {
        try {
            const { query, params: queryParams = [], pretty = true } = params;
            // Validate query is a SELECT statement
            if (!this.security.isReadOnlyQuery(query)) {
                return {
                    status: "error",
                    error: "Only SELECT queries can be exported to JSON",
                };
            }
            // Validate parameters
            const paramValidation = this.security.validateParameters(queryParams);
            if (!paramValidation.valid) {
                return { status: "error", error: paramValidation.error };
            }
            // Execute query
            const results = await this.db.query(query, queryParams);
            // Generate JSON
            const json = pretty
                ? JSON.stringify(results, null, 2)
                : JSON.stringify(results);
            return {
                status: "success",
                data: {
                    json: json,
                    row_count: results.length,
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
     * Export table data to SQL INSERT statements
     */
    async exportTableToSql(params) {
        try {
            const { table_name, filters = [], include_create_table = false, batch_size = 100, database, } = params;
            // Validate database access
            const dbValidation = this.validateDatabaseAccess(database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            // Validate table name
            const tableValidation = this.security.validateIdentifier(table_name);
            if (!tableValidation.valid) {
                return { status: "error", error: tableValidation.error };
            }
            const escapedTableName = this.security.escapeIdentifier(table_name);
            let sql = "";
            let queryCount = 0;
            // Add CREATE TABLE if requested
            if (include_create_table) {
                const createQuery = `SHOW CREATE TABLE ${escapedTableName}`;
                const createResults = await this.db.query(createQuery);
                queryCount++;
                if (createResults.length > 0) {
                    sql += `-- Table structure for ${table_name}\n`;
                    sql += `${createResults[0]["Create Table"]};\n\n`;
                }
            }
            // Build WHERE clause
            let whereClause = "";
            const whereParams = [];
            if (filters && filters.length > 0) {
                const whereConditions = [];
                for (const filter of filters) {
                    const fieldValidation = this.security.validateIdentifier(filter.field);
                    if (!fieldValidation.valid) {
                        return {
                            status: "error",
                            error: `Invalid field name: ${filter.field}`,
                        };
                    }
                    const fieldName = this.security.escapeIdentifier(filter.field);
                    switch (filter.operator) {
                        case "eq":
                            whereConditions.push(`${fieldName} = ?`);
                            whereParams.push(filter.value);
                            break;
                        case "neq":
                            whereConditions.push(`${fieldName} != ?`);
                            whereParams.push(filter.value);
                            break;
                        case "gt":
                            whereConditions.push(`${fieldName} > ?`);
                            whereParams.push(filter.value);
                            break;
                        case "gte":
                            whereConditions.push(`${fieldName} >= ?`);
                            whereParams.push(filter.value);
                            break;
                        case "lt":
                            whereConditions.push(`${fieldName} < ?`);
                            whereParams.push(filter.value);
                            break;
                        case "lte":
                            whereConditions.push(`${fieldName} <= ?`);
                            whereParams.push(filter.value);
                            break;
                        case "like":
                            whereConditions.push(`${fieldName} LIKE ?`);
                            whereParams.push(filter.value);
                            break;
                        case "in":
                            if (Array.isArray(filter.value)) {
                                const placeholders = filter.value.map(() => "?").join(", ");
                                whereConditions.push(`${fieldName} IN (${placeholders})`);
                                whereParams.push(...filter.value);
                            }
                            else {
                                return {
                                    status: "error",
                                    error: "IN operator requires an array of values",
                                };
                            }
                            break;
                        default:
                            return {
                                status: "error",
                                error: `Unsupported operator: ${filter.operator}`,
                            };
                    }
                }
                if (whereConditions.length > 0) {
                    whereClause = "WHERE " + whereConditions.join(" AND ");
                }
            }
            // Get data
            const dataQuery = `SELECT * FROM ${escapedTableName} ${whereClause}`;
            const results = await this.db.query(dataQuery, whereParams);
            queryCount++;
            if (results.length > 0) {
                const columns = Object.keys(results[0]);
                const escapedColumns = columns
                    .map((c) => this.security.escapeIdentifier(c))
                    .join(", ");
                sql += `-- Data for table ${table_name} (${results.length} rows)\n`;
                // Generate INSERT statements in batches
                for (let i = 0; i < results.length; i += batch_size) {
                    const batch = results.slice(i, i + batch_size);
                    const values = batch
                        .map((row) => {
                        const rowValues = columns.map((col) => this.escapeValue(row[col]));
                        return `(${rowValues.join(", ")})`;
                    })
                        .join(",\n");
                    sql += `INSERT INTO ${escapedTableName} (${escapedColumns}) VALUES\n${values};\n\n`;
                }
            }
            return {
                status: "success",
                data: {
                    sql: sql,
                    row_count: results.length,
                    table_name: table_name,
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
     * Import data from CSV string
     */
    async importFromCSV(params) {
        try {
            const { table_name, csv_data, has_headers = true, column_mapping, skip_errors = false, batch_size = 100, database, } = params;
            // Validate database access
            const dbValidation = this.validateDatabaseAccess(database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            // Validate table name
            const tableValidation = this.security.validateIdentifier(table_name);
            if (!tableValidation.valid) {
                return { status: "error", error: tableValidation.error };
            }
            // Parse CSV
            const rows = this.parseCSV(csv_data);
            if (rows.length === 0) {
                return { status: "error", error: "CSV data is empty" };
            }
            let headers;
            let dataRows;
            if (has_headers) {
                headers = rows[0];
                dataRows = rows.slice(1);
            }
            else {
                // If no headers, we need column_mapping or use column indexes
                if (!column_mapping) {
                    return {
                        status: "error",
                        error: "Column mapping is required when CSV has no headers",
                    };
                }
                headers = Object.keys(column_mapping);
                dataRows = rows;
            }
            // Apply column mapping if provided
            const finalHeaders = column_mapping
                ? headers.map((h) => column_mapping[h] || h)
                : headers;
            // Validate all column names
            for (const col of finalHeaders) {
                const colValidation = this.security.validateIdentifier(col);
                if (!colValidation.valid) {
                    return { status: "error", error: `Invalid column name: ${col}` };
                }
            }
            const escapedTableName = this.security.escapeIdentifier(table_name);
            const escapedColumns = finalHeaders
                .map((c) => this.security.escapeIdentifier(c))
                .join(", ");
            let successCount = 0;
            let errorCount = 0;
            const errors = [];
            let queryCount = 0;
            // Insert in batches
            for (let i = 0; i < dataRows.length; i += batch_size) {
                const batch = dataRows.slice(i, i + batch_size);
                try {
                    const values = batch
                        .map((row) => {
                        const rowValues = row.map((val) => {
                            if (val === "" || val === null || val === undefined)
                                return "NULL";
                            return this.escapeValue(val);
                        });
                        return `(${rowValues.join(", ")})`;
                    })
                        .join(", ");
                    const query = `INSERT INTO ${escapedTableName} (${escapedColumns}) VALUES ${values}`;
                    await this.db.query(query);
                    queryCount++;
                    successCount += batch.length;
                }
                catch (error) {
                    if (skip_errors) {
                        // Try inserting rows one by one
                        for (let j = 0; j < batch.length; j++) {
                            try {
                                const rowValues = batch[j].map((val) => {
                                    if (val === "" || val === null || val === undefined)
                                        return "NULL";
                                    return this.escapeValue(val);
                                });
                                const query = `INSERT INTO ${escapedTableName} (${escapedColumns}) VALUES (${rowValues.join(", ")})`;
                                await this.db.query(query);
                                queryCount++;
                                successCount++;
                            }
                            catch (rowError) {
                                errorCount++;
                                errors.push({
                                    row: i + j + (has_headers ? 2 : 1),
                                    error: rowError.message,
                                });
                            }
                        }
                    }
                    else {
                        return {
                            status: "error",
                            error: `Import failed at row ${i + 1}: ${error.message}`,
                            data: { rows_imported: successCount },
                        };
                    }
                }
            }
            return {
                status: errorCount > 0 ? "partial" : "success",
                data: {
                    message: errorCount > 0
                        ? `Import completed with ${errorCount} errors`
                        : "Import completed successfully",
                    rows_imported: successCount,
                    rows_failed: errorCount,
                    errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
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
     * Parse CSV string into array of arrays
     */
    parseCSV(csv) {
        const rows = [];
        const lines = csv.split(/\r?\n/);
        for (const line of lines) {
            if (!line.trim())
                continue;
            const row = [];
            let current = "";
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1];
                if (inQuotes) {
                    if (char === '"' && nextChar === '"') {
                        current += '"';
                        i++; // Skip next quote
                    }
                    else if (char === '"') {
                        inQuotes = false;
                    }
                    else {
                        current += char;
                    }
                }
                else {
                    if (char === '"') {
                        inQuotes = true;
                    }
                    else if (char === ",") {
                        row.push(current);
                        current = "";
                    }
                    else {
                        current += char;
                    }
                }
            }
            row.push(current);
            rows.push(row);
        }
        return rows;
    }
    /**
     * Import data from JSON string
     */
    async importFromJSON(params) {
        // Validate input parameters using the new validation function
        const validation = (0, inputValidation_1.validateImportFromJSON)(params);
        if (!validation.valid) {
            return {
                status: "error",
                error: `Validation failed: ${validation.errors?.join(', ') || 'Invalid parameters'}`
            };
        }
        try {
            const { table_name, json_data, column_mapping, skip_errors = false, batch_size = 100, database, } = params;
            // Validate database access
            const dbValidation = this.validateDatabaseAccess(database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            // Validate table name using security layer
            const tableValidation = this.security.validateIdentifier(table_name);
            if (!tableValidation.valid) {
                return { status: "error", error: tableValidation.error };
            }
            // Parse JSON - this should already be validated by validateImportFromJSON
            let data;
            try {
                data = JSON.parse(json_data);
            }
            catch (e) {
                return { status: "error", error: "Invalid JSON data" };
            }
            if (!Array.isArray(data)) {
                return {
                    status: "error",
                    error: "JSON data must be an array of objects",
                };
            }
            if (data.length === 0) {
                return { status: "error", error: "JSON data is empty" };
            }
            // Get columns from first object
            let columns = Object.keys(data[0]);
            // Apply column mapping if provided
            if (column_mapping) {
                columns = columns.map((c) => column_mapping[c] || c);
            }
            // Validate all column names
            for (const col of columns) {
                const colValidation = this.security.validateIdentifier(col);
                if (!colValidation.valid) {
                    return { status: "error", error: `Invalid column name: ${col}` };
                }
            }
            const escapedTableName = this.security.escapeIdentifier(table_name);
            const originalColumns = Object.keys(data[0]);
            const escapedColumns = columns
                .map((c) => this.security.escapeIdentifier(c))
                .join(", ");
            let successCount = 0;
            let errorCount = 0;
            const errors = [];
            let queryCount = 0;
            // Insert in batches
            for (let i = 0; i < data.length; i += batch_size) {
                const batch = data.slice(i, i + batch_size);
                try {
                    const values = batch
                        .map((row) => {
                        const rowValues = originalColumns.map((col) => this.escapeValue(row[col]));
                        return `(${rowValues.join(", ")})`;
                    })
                        .join(", ");
                    const query = `INSERT INTO ${escapedTableName} (${escapedColumns}) VALUES ${values}`;
                    await this.db.query(query);
                    queryCount++;
                    successCount += batch.length;
                }
                catch (error) {
                    if (skip_errors) {
                        // Try inserting rows one by one
                        for (let j = 0; j < batch.length; j++) {
                            try {
                                const rowValues = originalColumns.map((col) => this.escapeValue(batch[j][col]));
                                const query = `INSERT INTO ${escapedTableName} (${escapedColumns}) VALUES (${rowValues.join(", ")})`;
                                await this.db.query(query);
                                queryCount++;
                                successCount++;
                            }
                            catch (rowError) {
                                errorCount++;
                                errors.push({ row: i + j + 1, error: rowError.message });
                            }
                        }
                    }
                    else {
                        return {
                            status: "error",
                            error: `Import failed at row ${i + 1}: ${error.message}`,
                            data: { rows_imported: successCount },
                        };
                    }
                }
            }
            return {
                status: errorCount > 0 ? "partial" : "success",
                data: {
                    message: errorCount > 0
                        ? `Import completed with ${errorCount} errors`
                        : "Import completed successfully",
                    rows_imported: successCount,
                    rows_failed: errorCount,
                    errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
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
exports.DataExportTools = DataExportTools;
