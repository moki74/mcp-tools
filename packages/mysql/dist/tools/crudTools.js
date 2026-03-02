"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrudTools = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const schemas_1 = require("../validation/schemas");
const inputValidation_1 = require("../validation/inputValidation");
class CrudTools {
    constructor(security) {
        this.db = connection_1.default.getInstance();
        this.security = security;
    }
    /**
     * Create a new record in the specified table
     */
    async createRecord(params) {
        // Validate input schema
        const validation = (0, inputValidation_1.validateCreateRecord)(params);
        if (!validation.valid) {
            return {
                status: "error",
                error: "Invalid parameters: " + (validation.errors?.join(", ") || "Unknown validation error"),
            };
        }
        try {
            const { table_name, data } = params;
            // Enhanced validation using new validation functions
            const tableNameValidation = (0, inputValidation_1.validateTableName)(table_name);
            if (!tableNameValidation.valid) {
                return {
                    status: "error",
                    error: `Invalid table name: ${tableNameValidation.error}`,
                };
            }
            // Sanitize table name
            const sanitizedTableName = (0, inputValidation_1.sanitizeTableName)(table_name);
            if (!sanitizedTableName) {
                return {
                    status: "error",
                    error: "Failed to sanitize table name",
                };
            }
            // Validate column names and values
            for (const [key, value] of Object.entries(data)) {
                const fieldValidation = (0, inputValidation_1.validateFieldName)(key);
                if (!fieldValidation.valid) {
                    return {
                        status: "error",
                        error: `Invalid column name '${key}': ${fieldValidation.error}`,
                    };
                }
                const valueValidation = (0, inputValidation_1.validateValue)(value);
                if (!valueValidation.valid) {
                    return {
                        status: "error",
                        error: `Invalid value for column '${key}': ${valueValidation.error}`,
                    };
                }
            }
            // Validate and sanitize parameter values
            const values = Object.values(data);
            const paramValidation = this.security.validateParameters(values);
            if (!paramValidation.valid) {
                return {
                    status: "error",
                    error: `Invalid parameter values: ${paramValidation.error}`,
                };
            }
            // Build the query with escaped identifiers
            const escapedTableName = this.security.escapeIdentifier(sanitizedTableName);
            const columns = Object.keys(data);
            const escapedColumns = columns.map((col) => this.security.escapeIdentifier((0, inputValidation_1.sanitizeFieldName)(col)));
            const placeholders = columns.map(() => "?").join(", ");
            const query = `INSERT INTO ${escapedTableName} (${escapedColumns.join(", ")}) VALUES (${placeholders})`;
            // Execute the query with sanitized parameters
            const result = await this.db.query(query, paramValidation.sanitizedParams);
            return {
                status: "success",
                data: {
                    insertId: result.insertId,
                    affectedRows: result.affectedRows,
                },
            };
        }
        catch (error) {
            return {
                status: "error",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Read records from the specified table with optional filters, pagination, and sorting
     */
    async readRecords(params) {
        // Validate input schema
        const validation = (0, inputValidation_1.validateReadRecords)(params);
        if (!validation.valid) {
            return {
                status: "error",
                error: "Invalid parameters: " + (validation.errors?.join(", ") || "Unknown validation error"),
            };
        }
        try {
            const { table_name, filters, pagination, sorting } = params;
            // Enhanced validation using new validation functions
            const tableNameValidation = (0, inputValidation_1.validateTableName)(table_name);
            if (!tableNameValidation.valid) {
                return {
                    status: "error",
                    error: `Invalid table name: ${tableNameValidation.error}`,
                };
            }
            // Sanitize table name
            const sanitizedTableName = (0, inputValidation_1.sanitizeTableName)(table_name);
            if (!sanitizedTableName) {
                return {
                    status: "error",
                    error: "Failed to sanitize table name",
                };
            }
            // Validate sorting field if provided
            if (sorting) {
                const sortFieldValidation = (0, inputValidation_1.validateFieldName)(sorting.field);
                if (!sortFieldValidation.valid) {
                    return {
                        status: "error",
                        error: `Invalid sorting field: ${sortFieldValidation.error}`,
                    };
                }
            }
            // Validate filter fields and values if provided
            if (filters && filters.length > 0) {
                for (const filter of filters) {
                    const fieldValidation = (0, inputValidation_1.validateFieldName)(filter.field);
                    if (!fieldValidation.valid) {
                        return {
                            status: "error",
                            error: `Invalid filter field '${filter.field}': ${fieldValidation.error}`,
                        };
                    }
                    const valueValidation = (0, inputValidation_1.validateValue)(filter.value);
                    if (!valueValidation.valid) {
                        return {
                            status: "error",
                            error: `Invalid filter value for field '${filter.field}': ${valueValidation.error}`,
                        };
                    }
                }
            }
            // Build the WHERE clause if filters are provided
            let whereClause = "";
            let queryParams = [];
            if (filters && filters.length > 0) {
                const conditions = filters.map((filter) => {
                    const escapedField = this.security.escapeIdentifier(filter.field);
                    switch (filter.operator) {
                        case "eq":
                            queryParams.push(filter.value);
                            return `${escapedField} = ?`;
                        case "neq":
                            queryParams.push(filter.value);
                            return `${escapedField} != ?`;
                        case "gt":
                            queryParams.push(filter.value);
                            return `${escapedField} > ?`;
                        case "gte":
                            queryParams.push(filter.value);
                            return `${escapedField} >= ?`;
                        case "lt":
                            queryParams.push(filter.value);
                            return `${escapedField} < ?`;
                        case "lte":
                            queryParams.push(filter.value);
                            return `${escapedField} <= ?`;
                        case "like":
                            queryParams.push(`%${filter.value}%`);
                            return `${escapedField} LIKE ?`;
                        case "in":
                            if (Array.isArray(filter.value)) {
                                const placeholders = filter.value.map(() => "?").join(", ");
                                queryParams.push(...filter.value);
                                return `${escapedField} IN (${placeholders})`;
                            }
                            return "1=1"; // Default true condition if value is not an array
                        default:
                            return "1=1"; // Default true condition
                    }
                });
                whereClause = "WHERE " + conditions.join(" AND ");
            }
            // Validate all query parameters
            const paramValidation = this.security.validateParameters(queryParams);
            if (!paramValidation.valid) {
                return {
                    status: "error",
                    error: `Invalid query parameters: ${paramValidation.error}`,
                };
            }
            // Build the ORDER BY clause if sorting is provided
            let orderByClause = "";
            if (sorting) {
                const escapedSortField = this.security.escapeIdentifier((0, inputValidation_1.sanitizeFieldName)(sorting.field));
                orderByClause = `ORDER BY ${escapedSortField} ${sorting.direction.toUpperCase()}`;
            }
            // Build the LIMIT clause if pagination is provided
            let limitClause = "";
            const escapedTableName = this.security.escapeIdentifier(sanitizedTableName);
            if (pagination) {
                const offset = (pagination.page - 1) * pagination.limit;
                limitClause = `LIMIT ${offset}, ${pagination.limit}`;
                // Get total count for pagination
                const countQuery = `SELECT COUNT(*) as total FROM ${escapedTableName} ${whereClause}`;
                const countResult = await this.db.query(countQuery, paramValidation.sanitizedParams);
                const total = countResult[0].total;
                // Execute the main query with pagination
                const query = `SELECT * FROM ${escapedTableName} ${whereClause} ${orderByClause} ${limitClause}`;
                const results = await this.db.query(query, paramValidation.sanitizedParams);
                return {
                    status: "success",
                    data: this.security.masking.processResults(results),
                    total,
                };
            }
            else {
                // Execute the query without pagination
                const query = `SELECT * FROM ${escapedTableName} ${whereClause} ${orderByClause}`;
                const results = await this.db.query(query, paramValidation.sanitizedParams);
                return {
                    status: "success",
                    data: this.security.masking.processResults(results),
                    total: results.length,
                };
            }
        }
        catch (error) {
            return {
                status: "error",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Update records in the specified table based on conditions
     */
    async updateRecord(params) {
        // Validate input schema
        const validation = (0, inputValidation_1.validateUpdateRecord)(params);
        if (!validation.valid) {
            return {
                status: "error",
                error: "Invalid parameters: " + (validation.errors?.join(", ") || "Unknown validation error"),
            };
        }
        try {
            const { table_name, data, conditions } = params;
            // Enhanced validation using new validation functions
            const tableNameValidation = (0, inputValidation_1.validateTableName)(table_name);
            if (!tableNameValidation.valid) {
                return {
                    status: "error",
                    error: `Invalid table name: ${tableNameValidation.error}`,
                };
            }
            // Sanitize table name
            const sanitizedTableName = (0, inputValidation_1.sanitizeTableName)(table_name);
            if (!sanitizedTableName) {
                return {
                    status: "error",
                    error: "Failed to sanitize table name",
                };
            }
            // Validate column names and values in data
            for (const [key, value] of Object.entries(data)) {
                const fieldValidation = (0, inputValidation_1.validateFieldName)(key);
                if (!fieldValidation.valid) {
                    return {
                        status: "error",
                        error: `Invalid column name '${key}': ${fieldValidation.error}`,
                    };
                }
                const valueValidation = (0, inputValidation_1.validateValue)(value);
                if (!valueValidation.valid) {
                    return {
                        status: "error",
                        error: `Invalid value for column '${key}': ${valueValidation.error}`,
                    };
                }
            }
            // Validate condition fields and values
            for (const condition of conditions) {
                const fieldValidation = (0, inputValidation_1.validateFieldName)(condition.field);
                if (!fieldValidation.valid) {
                    return {
                        status: "error",
                        error: `Invalid condition field '${condition.field}': ${fieldValidation.error}`,
                    };
                }
                const valueValidation = (0, inputValidation_1.validateValue)(condition.value);
                if (!valueValidation.valid) {
                    return {
                        status: "error",
                        error: `Invalid condition value for field '${condition.field}': ${valueValidation.error}`,
                    };
                }
            }
            // Build SET clause with escaped identifiers
            const setClause = Object.entries(data)
                .map(([column, _]) => `${this.security.escapeIdentifier(column)} = ?`)
                .join(", ");
            const setValues = Object.values(data);
            // Build the WHERE clause
            const whereConditions = [];
            const whereValues = [];
            conditions.forEach((condition) => {
                const escapedField = this.security.escapeIdentifier(condition.field);
                switch (condition.operator) {
                    case "eq":
                        whereConditions.push(`${escapedField} = ?`);
                        whereValues.push(condition.value);
                        break;
                    case "neq":
                        whereConditions.push(`${escapedField} != ?`);
                        whereValues.push(condition.value);
                        break;
                    case "gt":
                        whereConditions.push(`${escapedField} > ?`);
                        whereValues.push(condition.value);
                        break;
                    case "gte":
                        whereConditions.push(`${escapedField} >= ?`);
                        whereValues.push(condition.value);
                        break;
                    case "lt":
                        whereConditions.push(`${escapedField} < ?`);
                        whereValues.push(condition.value);
                        break;
                    case "lte":
                        whereConditions.push(`${escapedField} <= ?`);
                        whereValues.push(condition.value);
                        break;
                    case "like":
                        whereConditions.push(`${escapedField} LIKE ?`);
                        whereValues.push(`%${condition.value}%`);
                        break;
                    case "in":
                        if (Array.isArray(condition.value)) {
                            const placeholders = condition.value.map(() => "?").join(", ");
                            whereConditions.push(`${escapedField} IN (${placeholders})`);
                            whereValues.push(...condition.value);
                        }
                        break;
                }
            });
            const whereClause = whereConditions.length > 0
                ? "WHERE " + whereConditions.join(" AND ")
                : "";
            // Validate all parameters
            const allParams = [...setValues, ...whereValues];
            const paramValidation = this.security.validateParameters(allParams);
            if (!paramValidation.valid) {
                return {
                    status: "error",
                    error: `Invalid parameters: ${paramValidation.error}`,
                };
            }
            // Build the query with escaped table name
            const escapedTableName = this.security.escapeIdentifier(sanitizedTableName);
            const query = `UPDATE ${escapedTableName} SET ${setClause} ${whereClause}`;
            // Execute the query with sanitized parameters
            const result = await this.db.query(query, paramValidation.sanitizedParams);
            return {
                status: "success",
                data: {
                    affectedRows: result.affectedRows,
                },
            };
        }
        catch (error) {
            return {
                status: "error",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Delete records from the specified table based on conditions
     */
    async deleteRecord(params) {
        // Validate input schema
        const validation = (0, inputValidation_1.validateDeleteRecord)(params);
        if (!validation.valid) {
            return {
                status: "error",
                error: "Invalid parameters: " + (validation.errors?.join(", ") || "Unknown validation error"),
            };
        }
        try {
            const { table_name, conditions } = params;
            // Enhanced validation using new validation functions
            const tableNameValidation = (0, inputValidation_1.validateTableName)(table_name);
            if (!tableNameValidation.valid) {
                return {
                    status: "error",
                    error: `Invalid table name: ${tableNameValidation.error}`,
                };
            }
            // Sanitize table name
            const sanitizedTableName = (0, inputValidation_1.sanitizeTableName)(table_name);
            if (!sanitizedTableName) {
                return {
                    status: "error",
                    error: "Failed to sanitize table name",
                };
            }
            // Ensure there are conditions for safety
            if (!conditions || conditions.length === 0) {
                return {
                    status: "error",
                    error: "DELETE operations require at least one condition for safety",
                };
            }
            // Validate condition fields and values
            for (const condition of conditions) {
                const fieldValidation = (0, inputValidation_1.validateFieldName)(condition.field);
                if (!fieldValidation.valid) {
                    return {
                        status: "error",
                        error: `Invalid condition field '${condition.field}': ${fieldValidation.error}`,
                    };
                }
                const valueValidation = (0, inputValidation_1.validateValue)(condition.value);
                if (!valueValidation.valid) {
                    return {
                        status: "error",
                        error: `Invalid condition value for field '${condition.field}': ${valueValidation.error}`,
                    };
                }
            }
            // Build the WHERE clause
            const whereConditions = [];
            const whereValues = [];
            conditions.forEach((condition) => {
                const escapedField = this.security.escapeIdentifier(condition.field);
                switch (condition.operator) {
                    case "eq":
                        whereConditions.push(`${escapedField} = ?`);
                        whereValues.push(condition.value);
                        break;
                    case "neq":
                        whereConditions.push(`${escapedField} != ?`);
                        whereValues.push(condition.value);
                        break;
                    case "gt":
                        whereConditions.push(`${escapedField} > ?`);
                        whereValues.push(condition.value);
                        break;
                    case "gte":
                        whereConditions.push(`${escapedField} >= ?`);
                        whereValues.push(condition.value);
                        break;
                    case "lt":
                        whereConditions.push(`${escapedField} < ?`);
                        whereValues.push(condition.value);
                        break;
                    case "lte":
                        whereConditions.push(`${escapedField} <= ?`);
                        whereValues.push(condition.value);
                        break;
                    case "like":
                        whereConditions.push(`${escapedField} LIKE ?`);
                        whereValues.push(`%${condition.value}%`);
                        break;
                    case "in":
                        if (Array.isArray(condition.value)) {
                            const placeholders = condition.value.map(() => "?").join(", ");
                            whereConditions.push(`${escapedField} IN (${placeholders})`);
                            whereValues.push(...condition.value);
                        }
                        break;
                }
            });
            const whereClause = "WHERE " + whereConditions.join(" AND ");
            // Validate all parameters
            const paramValidation = this.security.validateParameters(whereValues);
            if (!paramValidation.valid) {
                return {
                    status: "error",
                    error: `Invalid parameters: ${paramValidation.error}`,
                };
            }
            // Build the query with escaped table name
            const escapedTableName = this.security.escapeIdentifier(sanitizedTableName);
            const query = `DELETE FROM ${escapedTableName} ${whereClause}`;
            // Execute the query with sanitized parameters
            const result = await this.db.query(query, paramValidation.sanitizedParams);
            return {
                status: "success",
                data: {
                    affectedRows: result.affectedRows,
                },
            };
        }
        catch (error) {
            return {
                status: "error",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Bulk insert multiple records into the specified table
     */
    async bulkInsert(params) {
        // Validate input schema
        const validation = (0, inputValidation_1.validateBulkInsert)(params);
        if (!validation.valid) {
            return {
                status: "error",
                error: "Invalid parameters: " + (validation.errors?.join(", ") || "Unknown validation error"),
            };
        }
        try {
            const { table_name, data, batch_size = 1000 } = params;
            // Enhanced validation using new validation functions
            const tableNameValidation = (0, inputValidation_1.validateTableName)(table_name);
            if (!tableNameValidation.valid) {
                return {
                    status: "error",
                    error: `Invalid table name: ${tableNameValidation.error}`,
                };
            }
            // Sanitize table name
            const sanitizedTableName = (0, inputValidation_1.sanitizeTableName)(table_name);
            if (!sanitizedTableName) {
                return {
                    status: "error",
                    error: "Failed to sanitize table name",
                };
            }
            // Ensure data is not empty
            if (!data || data.length === 0) {
                return {
                    status: "error",
                    error: "Data array cannot be empty",
                };
            }
            // Validate that all records have the same columns
            const firstRecord = data[0];
            const columns = Object.keys(firstRecord);
            for (let i = 1; i < data.length; i++) {
                const recordColumns = Object.keys(data[i]);
                if (recordColumns.length !== columns.length ||
                    !recordColumns.every((col) => columns.includes(col))) {
                    return {
                        status: "error",
                        error: `All records must have the same columns. Record ${i + 1} has different columns.`,
                    };
                }
            }
            // Validate column names and values
            for (const column of columns) {
                const columnValidation = (0, inputValidation_1.validateFieldName)(column);
                if (!columnValidation.valid) {
                    return {
                        status: "error",
                        error: `Invalid column name '${column}': ${columnValidation.error}`,
                    };
                }
            }
            // Validate all values in the data
            for (let i = 0; i < data.length; i++) {
                const record = data[i];
                for (const [key, value] of Object.entries(record)) {
                    const valueValidation = (0, inputValidation_1.validateValue)(value);
                    if (!valueValidation.valid) {
                        return {
                            status: "error",
                            error: `Invalid value for column '${key}' in record ${i + 1}: ${valueValidation.error}`,
                        };
                    }
                }
            }
            // Process in batches
            const results = [];
            let totalInserted = 0;
            for (let i = 0; i < data.length; i += batch_size) {
                const batch = data.slice(i, i + batch_size);
                // Prepare batch values
                const batchValues = [];
                for (const record of batch) {
                    const values = columns.map((col) => record[col]);
                    // Validate and sanitize parameter values for this record
                    const paramValidation = this.security.validateParameters(values);
                    if (!paramValidation.valid) {
                        return {
                            status: "error",
                            error: `Invalid parameter values in record ${i + batchValues.length / columns.length + 1}: ${paramValidation.error}`,
                        };
                    }
                    batchValues.push(...paramValidation.sanitizedParams);
                }
                // Build the query with escaped identifiers
                const escapedTableName = this.security.escapeIdentifier(sanitizedTableName);
                const escapedColumns = columns.map((col) => this.security.escapeIdentifier((0, inputValidation_1.sanitizeFieldName)(col)));
                const valueGroups = batch
                    .map(() => `(${columns.map(() => "?").join(", ")})`)
                    .join(", ");
                const query = `INSERT INTO ${escapedTableName} (${escapedColumns.join(", ")}) VALUES ${valueGroups}`;
                // Execute the batch query
                const result = await this.db.query(query, batchValues);
                results.push({
                    batchNumber: Math.floor(i / batch_size) + 1,
                    recordsInserted: batch.length,
                    firstInsertId: result.insertId,
                    affectedRows: result.affectedRows,
                });
                totalInserted += result.affectedRows;
            }
            return {
                status: "success",
                data: {
                    totalRecords: data.length,
                    totalInserted,
                    batches: results.length,
                    batchResults: results,
                },
            };
        }
        catch (error) {
            return {
                status: "error",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Bulk update multiple records with different conditions and data
     */
    async bulkUpdate(params) {
        // Validate input schema
        if (!(0, schemas_1.validateBulkUpdate)(params)) {
            return {
                status: "error",
                error: "Invalid parameters: " + JSON.stringify(schemas_1.validateBulkUpdate.errors),
            };
        }
        try {
            const { table_name, updates, batch_size = 100 } = params;
            // Enhanced validation using new validation functions
            const tableNameValidation = (0, inputValidation_1.validateTableName)(table_name);
            if (!tableNameValidation.valid) {
                return {
                    status: "error",
                    error: `Invalid table name: ${tableNameValidation.error}`,
                };
            }
            // Sanitize table name
            const sanitizedTableName = (0, inputValidation_1.sanitizeTableName)(table_name);
            if (!sanitizedTableName) {
                return {
                    status: "error",
                    error: "Failed to sanitize table name",
                };
            }
            // Ensure updates is not empty
            if (!updates || updates.length === 0) {
                return {
                    status: "error",
                    error: "Updates array cannot be empty",
                };
            }
            // Validate each update operation
            for (let i = 0; i < updates.length; i++) {
                const update = updates[i];
                // Validate column names and values in data
                for (const [key, value] of Object.entries(update.data)) {
                    const fieldValidation = (0, inputValidation_1.validateFieldName)(key);
                    if (!fieldValidation.valid) {
                        return {
                            status: "error",
                            error: `Invalid column name '${key}' in update ${i + 1}: ${fieldValidation.error}`,
                        };
                    }
                    const valueValidation = (0, inputValidation_1.validateValue)(value);
                    if (!valueValidation.valid) {
                        return {
                            status: "error",
                            error: `Invalid value for column '${key}' in update ${i + 1}: ${valueValidation.error}`,
                        };
                    }
                }
                // Validate condition fields and values
                for (const condition of update.conditions) {
                    const fieldValidation = (0, inputValidation_1.validateFieldName)(condition.field);
                    if (!fieldValidation.valid) {
                        return {
                            status: "error",
                            error: `Invalid condition field '${condition.field}' in update ${i + 1}: ${fieldValidation.error}`,
                        };
                    }
                    const valueValidation = (0, inputValidation_1.validateValue)(condition.value);
                    if (!valueValidation.valid) {
                        return {
                            status: "error",
                            error: `Invalid condition value for field '${condition.field}' in update ${i + 1}: ${valueValidation.error}`,
                        };
                    }
                }
            }
            // Process in batches using transactions for consistency
            const results = [];
            let totalAffected = 0;
            for (let i = 0; i < updates.length; i += batch_size) {
                const batch = updates.slice(i, i + batch_size);
                // Start a transaction for this batch
                await this.db.query("START TRANSACTION");
                try {
                    const batchResults = [];
                    for (const update of batch) {
                        // Build SET clause
                        const setClause = Object.entries(update.data)
                            .map(([column, _]) => `${this.security.escapeIdentifier(column)} = ?`)
                            .join(", ");
                        const setValues = Object.values(update.data);
                        // Build WHERE clause
                        const whereConditions = [];
                        const whereValues = [];
                        update.conditions.forEach((condition) => {
                            const escapedField = this.security.escapeIdentifier(condition.field);
                            switch (condition.operator) {
                                case "eq":
                                    whereConditions.push(`${escapedField} = ?`);
                                    whereValues.push(condition.value);
                                    break;
                                case "neq":
                                    whereConditions.push(`${escapedField} != ?`);
                                    whereValues.push(condition.value);
                                    break;
                                case "gt":
                                    whereConditions.push(`${escapedField} > ?`);
                                    whereValues.push(condition.value);
                                    break;
                                case "gte":
                                    whereConditions.push(`${escapedField} >= ?`);
                                    whereValues.push(condition.value);
                                    break;
                                case "lt":
                                    whereConditions.push(`${escapedField} < ?`);
                                    whereValues.push(condition.value);
                                    break;
                                case "lte":
                                    whereConditions.push(`${escapedField} <= ?`);
                                    whereValues.push(condition.value);
                                    break;
                                case "like":
                                    whereConditions.push(`${escapedField} LIKE ?`);
                                    whereValues.push(`%${condition.value}%`);
                                    break;
                                case "in":
                                    if (Array.isArray(condition.value)) {
                                        const placeholders = condition.value
                                            .map(() => "?")
                                            .join(", ");
                                        whereConditions.push(`${escapedField} IN (${placeholders})`);
                                        whereValues.push(...condition.value);
                                    }
                                    break;
                            }
                        });
                        const whereClause = whereConditions.length > 0
                            ? "WHERE " + whereConditions.join(" AND ")
                            : "";
                        // Validate all parameters
                        const allParams = [...setValues, ...whereValues];
                        const paramValidation = this.security.validateParameters(allParams);
                        if (!paramValidation.valid) {
                            throw new Error(`Invalid parameters: ${paramValidation.error}`);
                        }
                        // Build and execute the query
                        const escapedTableName = this.security.escapeIdentifier(sanitizedTableName);
                        const query = `UPDATE ${escapedTableName} SET ${setClause} ${whereClause}`;
                        const result = await this.db.query(query, paramValidation.sanitizedParams);
                        batchResults.push({
                            affectedRows: result.affectedRows,
                        });
                        totalAffected += result.affectedRows;
                    }
                    // Commit the transaction
                    await this.db.query("COMMIT");
                    results.push({
                        batchNumber: Math.floor(i / batch_size) + 1,
                        updatesProcessed: batch.length,
                        results: batchResults,
                    });
                }
                catch (error) {
                    // Rollback on error
                    await this.db.query("ROLLBACK");
                    throw error;
                }
            }
            return {
                status: "success",
                data: {
                    totalUpdates: updates.length,
                    totalAffectedRows: totalAffected,
                    batches: results.length,
                    batchResults: results,
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
     * Bulk delete records based on multiple condition sets
     */
    async bulkDelete(params) {
        // Validate input schema
        if (!(0, schemas_1.validateBulkDelete)(params)) {
            return {
                status: "error",
                error: "Invalid parameters: " + JSON.stringify(schemas_1.validateBulkDelete.errors),
            };
        }
        try {
            const { table_name, condition_sets, batch_size = 100 } = params;
            // Enhanced validation using new validation functions
            const tableNameValidation = (0, inputValidation_1.validateTableName)(table_name);
            if (!tableNameValidation.valid) {
                return {
                    status: "error",
                    error: `Invalid table name: ${tableNameValidation.error}`,
                };
            }
            // Sanitize table name
            const sanitizedTableName = (0, inputValidation_1.sanitizeTableName)(table_name);
            if (!sanitizedTableName) {
                return {
                    status: "error",
                    error: "Failed to sanitize table name",
                };
            }
            // Ensure condition_sets is not empty
            if (!condition_sets || condition_sets.length === 0) {
                return {
                    status: "error",
                    error: "Condition sets array cannot be empty",
                };
            }
            // Validate each condition set
            for (let i = 0; i < condition_sets.length; i++) {
                const conditions = condition_sets[i];
                // Ensure there are conditions for safety
                if (!conditions || conditions.length === 0) {
                    return {
                        status: "error",
                        error: `DELETE operations require at least one condition for safety. Condition set ${i + 1} is empty.`,
                    };
                }
                // Validate condition fields and values
                for (const condition of conditions) {
                    const fieldValidation = (0, inputValidation_1.validateFieldName)(condition.field);
                    if (!fieldValidation.valid) {
                        return {
                            status: "error",
                            error: `Invalid condition field '${condition.field}' in condition set ${i + 1}: ${fieldValidation.error}`,
                        };
                    }
                    const valueValidation = (0, inputValidation_1.validateValue)(condition.value);
                    if (!valueValidation.valid) {
                        return {
                            status: "error",
                            error: `Invalid condition value for field '${condition.field}' in condition set ${i + 1}: ${valueValidation.error}`,
                        };
                    }
                }
            }
            // Process in batches using transactions for consistency
            const results = [];
            let totalDeleted = 0;
            for (let i = 0; i < condition_sets.length; i += batch_size) {
                const batch = condition_sets.slice(i, i + batch_size);
                // Start a transaction for this batch
                await this.db.query("START TRANSACTION");
                try {
                    const batchResults = [];
                    for (const conditions of batch) {
                        // Build WHERE clause
                        const whereConditions = [];
                        const whereValues = [];
                        conditions.forEach((condition) => {
                            const escapedField = this.security.escapeIdentifier(condition.field);
                            switch (condition.operator) {
                                case "eq":
                                    whereConditions.push(`${escapedField} = ?`);
                                    whereValues.push(condition.value);
                                    break;
                                case "neq":
                                    whereConditions.push(`${escapedField} != ?`);
                                    whereValues.push(condition.value);
                                    break;
                                case "gt":
                                    whereConditions.push(`${escapedField} > ?`);
                                    whereValues.push(condition.value);
                                    break;
                                case "gte":
                                    whereConditions.push(`${escapedField} >= ?`);
                                    whereValues.push(condition.value);
                                    break;
                                case "lt":
                                    whereConditions.push(`${escapedField} < ?`);
                                    whereValues.push(condition.value);
                                    break;
                                case "lte":
                                    whereConditions.push(`${escapedField} <= ?`);
                                    whereValues.push(condition.value);
                                    break;
                                case "like":
                                    whereConditions.push(`${escapedField} LIKE ?`);
                                    whereValues.push(`%${condition.value}%`);
                                    break;
                                case "in":
                                    if (Array.isArray(condition.value)) {
                                        const placeholders = condition.value
                                            .map(() => "?")
                                            .join(", ");
                                        whereConditions.push(`${escapedField} IN (${placeholders})`);
                                        whereValues.push(...condition.value);
                                    }
                                    break;
                            }
                        });
                        const whereClause = "WHERE " + whereConditions.join(" AND ");
                        // Validate all parameters
                        const paramValidation = this.security.validateParameters(whereValues);
                        if (!paramValidation.valid) {
                            throw new Error(`Invalid parameters: ${paramValidation.error}`);
                        }
                        // Build and execute the query
                        const escapedTableName = this.security.escapeIdentifier(sanitizedTableName);
                        const query = `DELETE FROM ${escapedTableName} ${whereClause}`;
                        const result = await this.db.query(query, paramValidation.sanitizedParams);
                        batchResults.push({
                            affectedRows: result.affectedRows,
                        });
                        totalDeleted += result.affectedRows;
                    }
                    // Commit the transaction
                    await this.db.query("COMMIT");
                    results.push({
                        batchNumber: Math.floor(i / batch_size) + 1,
                        deletesProcessed: batch.length,
                        results: batchResults,
                    });
                }
                catch (error) {
                    // Rollback on error
                    await this.db.query("ROLLBACK");
                    throw error;
                }
            }
            return {
                status: "success",
                data: {
                    totalDeletes: condition_sets.length,
                    totalDeletedRows: totalDeleted,
                    batches: results.length,
                    batchResults: results,
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
exports.CrudTools = CrudTools;
