"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionTools = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const config_1 = require("../config/config");
class FunctionTools {
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
     * List all functions in the current database
     */
    async listFunctions(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const database = dbValidation.database;
            const query = `
        SELECT
          ROUTINE_NAME as function_name,
          DATA_TYPE as return_type,
          DTD_IDENTIFIER as return_type_full,
          ROUTINE_DEFINITION as definition,
          IS_DETERMINISTIC as is_deterministic,
          SQL_DATA_ACCESS as data_access,
          SECURITY_TYPE as security_type,
          DEFINER as definer,
          CREATED as created,
          LAST_ALTERED as last_altered,
          ROUTINE_COMMENT as comment
        FROM INFORMATION_SCHEMA.ROUTINES
        WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'FUNCTION'
        ORDER BY ROUTINE_NAME
      `;
            const results = await this.db.query(query, [database]);
            return {
                status: "success",
                data: results,
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
     * Get detailed information about a specific function
     */
    async getFunctionInfo(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { function_name } = params;
            const database = dbValidation.database;
            // Validate function name
            const identifierValidation = this.security.validateIdentifier(function_name);
            if (!identifierValidation.valid) {
                return {
                    status: "error",
                    error: identifierValidation.error || "Invalid function name",
                };
            }
            // Get function information
            const functionQuery = `
        SELECT
          ROUTINE_NAME as function_name,
          DATA_TYPE as return_type,
          DTD_IDENTIFIER as return_type_full,
          ROUTINE_DEFINITION as definition,
          IS_DETERMINISTIC as is_deterministic,
          SQL_DATA_ACCESS as data_access,
          SECURITY_TYPE as security_type,
          DEFINER as definer,
          CREATED as created,
          LAST_ALTERED as last_altered,
          ROUTINE_COMMENT as comment,
          SQL_MODE as sql_mode,
          CHARACTER_SET_CLIENT as charset,
          COLLATION_CONNECTION as collation,
          DATABASE_COLLATION as db_collation
        FROM INFORMATION_SCHEMA.ROUTINES
        WHERE ROUTINE_SCHEMA = ? AND ROUTINE_NAME = ? AND ROUTINE_TYPE = 'FUNCTION'
      `;
            // Get function parameters
            const parametersQuery = `
        SELECT
          PARAMETER_NAME as name,
          DATA_TYPE as data_type,
          DTD_IDENTIFIER as data_type_full,
          CHARACTER_MAXIMUM_LENGTH as max_length,
          NUMERIC_PRECISION as numeric_precision,
          NUMERIC_SCALE as numeric_scale,
          ORDINAL_POSITION as position
        FROM INFORMATION_SCHEMA.PARAMETERS
        WHERE SPECIFIC_SCHEMA = ? AND SPECIFIC_NAME = ? AND PARAMETER_MODE IS NOT NULL
        ORDER BY ORDINAL_POSITION
      `;
            const [functionInfo, parameters] = await Promise.all([
                this.db.query(functionQuery, [database, function_name]),
                this.db.query(parametersQuery, [database, function_name]),
            ]);
            if (functionInfo.length === 0) {
                return {
                    status: "error",
                    error: `Function '${function_name}' not found in database '${database}'`,
                };
            }
            return {
                status: "success",
                data: {
                    ...functionInfo[0],
                    parameters: parameters,
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
     * Create a new function
     */
    async createFunction(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { function_name, parameters = [], returns, body, deterministic = false, data_access, security, comment, } = params;
            const database = dbValidation.database;
            // Validate function name
            const identifierValidation = this.security.validateIdentifier(function_name);
            if (!identifierValidation.valid) {
                return {
                    status: "error",
                    error: identifierValidation.error || "Invalid function name",
                };
            }
            // Build parameter list
            const parameterList = parameters
                .map((param) => {
                if (!this.security.validateIdentifier(param.name).valid) {
                    throw new Error(`Invalid parameter name: ${param.name}`);
                }
                return `\`${param.name}\` ${param.data_type}`;
            })
                .join(", ");
            // Build CREATE FUNCTION statement
            let createQuery = `CREATE FUNCTION \`${database}\`.\`${function_name}\`(${parameterList})\n`;
            createQuery += `RETURNS ${returns}\n`;
            if (deterministic) {
                createQuery += `DETERMINISTIC\n`;
            }
            else {
                createQuery += `NOT DETERMINISTIC\n`;
            }
            if (data_access) {
                createQuery += `${data_access}\n`;
            }
            if (security) {
                createQuery += `SQL SECURITY ${security}\n`;
            }
            if (comment) {
                createQuery += `COMMENT '${comment.replace(/'/g, "''")}'\n`;
            }
            // Check if body already contains BEGIN/END
            const trimmedBody = body.trim();
            if (trimmedBody.toUpperCase().startsWith("BEGIN") &&
                trimmedBody.toUpperCase().endsWith("END")) {
                createQuery += body;
            }
            else if (trimmedBody.toUpperCase().startsWith("RETURN")) {
                // Simple one-liner function
                createQuery += body;
            }
            else {
                createQuery += `BEGIN\n${body}\nEND`;
            }
            await this.db.query(createQuery);
            return {
                status: "success",
                data: {
                    message: `Function '${function_name}' created successfully`,
                    function_name,
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
     * Drop a function
     */
    async dropFunction(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { function_name, if_exists = false } = params;
            const database = dbValidation.database;
            // Validate function name
            const identifierValidation = this.security.validateIdentifier(function_name);
            if (!identifierValidation.valid) {
                return {
                    status: "error",
                    error: identifierValidation.error || "Invalid function name",
                };
            }
            const dropQuery = `DROP FUNCTION ${if_exists ? "IF EXISTS" : ""} \`${database}\`.\`${function_name}\``;
            await this.db.query(dropQuery);
            return {
                status: "success",
                message: `Function '${function_name}' dropped successfully`,
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
     * Show the CREATE statement for a function
     */
    async showCreateFunction(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { function_name } = params;
            const database = dbValidation.database;
            // Validate function name
            const identifierValidation = this.security.validateIdentifier(function_name);
            if (!identifierValidation.valid) {
                return {
                    status: "error",
                    error: identifierValidation.error || "Invalid function name",
                };
            }
            const query = `SHOW CREATE FUNCTION \`${database}\`.\`${function_name}\``;
            const results = await this.db.query(query);
            if (results.length === 0) {
                return {
                    status: "error",
                    error: `Function '${function_name}' not found`,
                };
            }
            return {
                status: "success",
                data: results[0],
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
     * Execute a function and return its result
     */
    async executeFunction(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { function_name, parameters = [] } = params;
            const database = dbValidation.database;
            // Validate function name
            const identifierValidation = this.security.validateIdentifier(function_name);
            if (!identifierValidation.valid) {
                return {
                    status: "error",
                    error: identifierValidation.error || "Invalid function name",
                };
            }
            // Validate parameters
            const paramValidation = this.security.validateParameters(parameters);
            if (!paramValidation.valid) {
                return {
                    status: "error",
                    error: `Parameter validation failed: ${paramValidation.error}`,
                };
            }
            // Build SELECT query to call the function
            const placeholders = parameters.map(() => "?").join(", ");
            const selectQuery = `SELECT \`${database}\`.\`${function_name}\`(${placeholders}) AS result`;
            const results = await this.db.query(selectQuery, paramValidation.sanitizedParams);
            return {
                status: "success",
                data: {
                    function_name,
                    result: results[0]?.result,
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
exports.FunctionTools = FunctionTools;
