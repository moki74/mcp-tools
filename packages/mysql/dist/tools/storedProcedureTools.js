"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoredProcedureTools = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const config_1 = require("../config/config");
const schemas_1 = require("../validation/schemas");
class StoredProcedureTools {
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
        // If no database is requested, use the connected database
        if (!requestedDatabase) {
            return {
                valid: true,
                database: connectedDatabase,
            };
        }
        // If a specific database is requested, ensure it matches the connected database
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
     * List all stored procedures in the current database
     */
    async listStoredProcedures(params) {
        try {
            // Validate input
            if (!(0, schemas_1.validateListStoredProcedures)(params)) {
                return {
                    status: "error",
                    error: "Invalid parameters: " +
                        JSON.stringify(schemas_1.validateListStoredProcedures.errors),
                };
            }
            // Validate database access
            const dbValidation = this.validateDatabaseAccess(params.database);
            if (!dbValidation.valid) {
                return {
                    status: "error",
                    error: dbValidation.error,
                };
            }
            const database = dbValidation.database;
            const query = `
        SELECT
          ROUTINE_NAME as name,
          ROUTINE_TYPE as type,
          DATA_TYPE as return_type,
          ROUTINE_DEFINITION as definition,
          CREATED,
          LAST_ALTERED,
          ROUTINE_COMMENT as comment,
          DEFINER,
          SQL_MODE,
          SECURITY_TYPE
        FROM INFORMATION_SCHEMA.ROUTINES
        WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'
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
     * Get detailed information about a specific stored procedure
     */
    async getStoredProcedureInfo(params) {
        try {
            // Validate input
            if (!(0, schemas_1.validateGetStoredProcedureInfo)(params)) {
                return {
                    status: "error",
                    error: "Invalid parameters: " +
                        JSON.stringify(schemas_1.validateGetStoredProcedureInfo.errors),
                };
            }
            // Validate database access
            const dbValidation = this.validateDatabaseAccess(params.database);
            if (!dbValidation.valid) {
                return {
                    status: "error",
                    error: dbValidation.error,
                };
            }
            const { procedure_name } = params;
            const database = dbValidation.database;
            // Get procedure information
            const procedureQuery = `
        SELECT
          ROUTINE_NAME as name,
          ROUTINE_TYPE as type,
          DATA_TYPE as return_type,
          ROUTINE_DEFINITION as definition,
          CREATED,
          LAST_ALTERED,
          ROUTINE_COMMENT as comment,
          DEFINER,
          SQL_MODE,
          SECURITY_TYPE,
          IS_DETERMINISTIC,
          SQL_DATA_ACCESS,
          ROUTINE_BODY
        FROM INFORMATION_SCHEMA.ROUTINES
        WHERE ROUTINE_SCHEMA = ? AND ROUTINE_NAME = ? AND ROUTINE_TYPE = 'PROCEDURE'
      `;
            // Get procedure parameters
            const parametersQuery = `
        SELECT
          PARAMETER_NAME as name,
          PARAMETER_MODE as mode,
          DATA_TYPE as data_type,
          CHARACTER_MAXIMUM_LENGTH as max_length,
          ORDINAL_POSITION as position
        FROM INFORMATION_SCHEMA.PARAMETERS
        WHERE SPECIFIC_SCHEMA = ? AND SPECIFIC_NAME = ?
        ORDER BY ORDINAL_POSITION
      `;
            const [procedureInfo, parameters] = await Promise.all([
                this.db.query(procedureQuery, [database, procedure_name]),
                this.db.query(parametersQuery, [database, procedure_name]),
            ]);
            if (procedureInfo.length === 0) {
                return {
                    status: "error",
                    error: `Stored procedure '${procedure_name}' not found in database '${database}'`,
                };
            }
            return {
                status: "success",
                data: {
                    ...procedureInfo[0],
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
     * Execute a stored procedure with parameters
     */
    async executeStoredProcedure(params) {
        // Validate input schema
        if (!(0, schemas_1.validateStoredProcedureExecution)(params)) {
            return {
                status: "error",
                error: "Invalid parameters: " +
                    JSON.stringify(schemas_1.validateStoredProcedureExecution.errors),
            };
        }
        try {
            // Validate database access
            const dbValidation = this.validateDatabaseAccess(params.database);
            if (!dbValidation.valid) {
                return {
                    status: "error",
                    error: dbValidation.error,
                };
            }
            const { procedure_name, parameters = [] } = params;
            const database = dbValidation.database;
            // Validate procedure name
            const identifierValidation = this.security.validateIdentifier(procedure_name);
            if (!identifierValidation.valid) {
                return {
                    status: "error",
                    error: identifierValidation.error || "Invalid procedure name",
                };
            }
            // Get procedure parameter information to handle OUT/INOUT parameters
            const procInfo = await this.getStoredProcedureInfo({
                procedure_name,
                database,
            });
            if (procInfo.status !== "success" || !procInfo.data) {
                return {
                    status: "error",
                    error: `Could not retrieve procedure information: ${procInfo.error || "Unknown error"}`,
                };
            }
            const procedureParams = procInfo.data.parameters || [];
            // Validate parameter count
            if (parameters.length > procedureParams.length) {
                return {
                    status: "error",
                    error: `Too many parameters provided. Expected ${procedureParams.length}, got ${parameters.length}`,
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
            // Build parameter list for CALL statement
            const callParams = [];
            const sessionVars = [];
            let paramIndex = 0;
            for (let i = 0; i < procedureParams.length; i++) {
                const procParam = procedureParams[i];
                if (procParam.mode === "IN") {
                    // IN parameters use provided values or NULL if not provided
                    if (paramIndex < parameters.length) {
                        callParams.push("?");
                        paramIndex++;
                    }
                    else {
                        callParams.push("NULL");
                    }
                }
                else if (procParam.mode === "OUT" || procParam.mode === "INOUT") {
                    // OUT/INOUT parameters use session variables
                    const varName = `@${procParam.name}_${Date.now()}_${i}`;
                    sessionVars.push(varName);
                    if (procParam.mode === "INOUT" && paramIndex < parameters.length) {
                        // For INOUT, set the session variable to the input value first
                        await this.db.query(`SET ${varName} = ?`, [
                            paramValidation.sanitizedParams[paramIndex],
                        ]);
                        paramIndex++;
                    }
                    callParams.push(varName);
                }
            }
            // Build and execute CALL statement
            const callQuery = `CALL \`${database}\`.\`${procedure_name}\`(${callParams.join(", ")})`;
            const callResults = await this.db.query(callQuery, paramValidation.sanitizedParams.slice(0, paramIndex));
            // Get OUT/INOUT parameter values
            const outputValues = {};
            if (sessionVars.length > 0) {
                const selectQuery = `SELECT ${sessionVars.join(", ")}`;
                const outputResults = await this.db.query(selectQuery);
                if (outputResults && outputResults.length > 0) {
                    const outputRow = outputResults[0];
                    sessionVars.forEach((varName, index) => {
                        const paramName = procedureParams.find((p) => (p.mode === "OUT" || p.mode === "INOUT") &&
                            varName.includes(p.name))?.name || `param_${index}`;
                        outputValues[paramName] = outputRow[varName];
                    });
                }
            }
            return {
                status: "success",
                data: {
                    results: callResults,
                    outputParameters: Object.keys(outputValues).length > 0 ? outputValues : undefined,
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
     * Validate stored procedure body content for security
     */
    validateProcedureBody(body) {
        if (!body || typeof body !== "string") {
            return {
                valid: false,
                error: "Procedure body must be a non-empty string",
            };
        }
        const trimmedBody = body.trim();
        // Check for dangerous SQL patterns in procedure body
        const dangerousPatterns = [
            /\bGRANT\b/i,
            /\bREVOKE\b/i,
            /\bDROP\s+USER\b/i,
            /\bCREATE\s+USER\b/i,
            /\bALTER\s+USER\b/i,
            /\bSET\s+PASSWORD\b/i,
            /\bINTO\s+OUTFILE\b/i,
            /\bINTO\s+DUMPFILE\b/i,
            /\bLOAD\s+DATA\b/i,
            /\bLOAD_FILE\s*\(/i,
            /\bSYSTEM\s*\(/i,
            /\bEXEC\s*\(/i,
            /\bEVAL\s*\(/i,
        ];
        for (const pattern of dangerousPatterns) {
            if (pattern.test(trimmedBody)) {
                return {
                    valid: false,
                    error: `Dangerous SQL pattern detected: ${pattern.source}`,
                };
            }
        }
        // Check for multiple statement separators that might indicate injection attempts
        const semicolonCount = (trimmedBody.match(/;/g) || []).length;
        if (semicolonCount > 50) {
            return {
                valid: false,
                error: "Too many statements in procedure body",
            };
        }
        return { valid: true };
    }
    /**
     * Create a new stored procedure
     */
    async createStoredProcedure(params) {
        // Validate input schema
        if (!(0, schemas_1.validateStoredProcedureCreation)(params)) {
            return {
                status: "error",
                error: "Invalid parameters: " +
                    JSON.stringify(schemas_1.validateStoredProcedureCreation.errors),
            };
        }
        try {
            // Validate database access
            const dbValidation = this.validateDatabaseAccess(params.database);
            if (!dbValidation.valid) {
                return {
                    status: "error",
                    error: dbValidation.error,
                };
            }
            const { procedure_name, parameters = [], body, comment } = params;
            const database = dbValidation.database;
            // Validate procedure name
            const identifierValidation = this.security.validateIdentifier(procedure_name);
            if (!identifierValidation.valid) {
                return {
                    status: "error",
                    error: identifierValidation.error || "Invalid procedure name",
                };
            }
            // SECURITY VALIDATION: Validate procedure body content
            const bodyValidation = this.validateProcedureBody(body);
            if (!bodyValidation.valid) {
                return {
                    status: "error",
                    error: bodyValidation.error || "Invalid procedure body",
                };
            }
            // Sanitize comment to prevent SQL injection
            const sanitizedComment = comment
                ? comment.replace(/'/g, "''").replace(/\\/g, "\\\\")
                : "";
            // Build parameter list
            const parameterList = parameters
                .map((param) => {
                if (!this.security.validateIdentifier(param.name).valid) {
                    throw new Error(`Invalid parameter name: ${param.name}`);
                }
                return `${param.mode} \`${param.name}\` ${param.data_type}`;
            })
                .join(", ");
            // Build CREATE PROCEDURE statement
            let createQuery = `CREATE PROCEDURE \`${database}\`.\`${procedure_name}\`(${parameterList})\n`;
            if (sanitizedComment) {
                createQuery += `COMMENT '${sanitizedComment}'\n`;
            }
            // Check if body already contains BEGIN/END, if not add them
            const trimmedBody = body.trim();
            if (trimmedBody.toUpperCase().startsWith("BEGIN") &&
                trimmedBody.toUpperCase().endsWith("END")) {
                createQuery += `\n${body}`;
            }
            else {
                createQuery += `BEGIN\n${body}\nEND`;
            }
            // Execute the CREATE PROCEDURE statement
            await this.db.query(createQuery);
            return {
                status: "success",
                data: {
                    message: `Stored procedure '${procedure_name}' created successfully`,
                    procedure_name,
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
     * Drop a stored procedure
     */
    async dropStoredProcedure(params) {
        try {
            // Validate input
            if (!(0, schemas_1.validateDropStoredProcedure)(params)) {
                return {
                    status: "error",
                    error: "Invalid parameters: " +
                        JSON.stringify(schemas_1.validateDropStoredProcedure.errors),
                };
            }
            // Validate database access
            const dbValidation = this.validateDatabaseAccess(params.database);
            if (!dbValidation.valid) {
                return {
                    status: "error",
                    error: dbValidation.error,
                };
            }
            const { procedure_name, if_exists = false } = params;
            const database = dbValidation.database;
            // Validate procedure name
            const identifierValidation = this.security.validateIdentifier(procedure_name);
            if (!identifierValidation.valid) {
                return {
                    status: "error",
                    error: identifierValidation.error || "Invalid procedure name",
                };
            }
            // Build DROP PROCEDURE statement
            const dropQuery = `DROP PROCEDURE ${if_exists ? "IF EXISTS" : ""} \`${database}\`.\`${procedure_name}\``;
            // Execute the DROP PROCEDURE statement
            await this.db.query(dropQuery);
            return {
                status: "success",
                message: `Stored procedure '${procedure_name}' dropped successfully`,
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
     * Show the CREATE statement for a stored procedure
     */
    async showCreateProcedure(params) {
        try {
            // Validate input
            if (!(0, schemas_1.validateShowCreateProcedure)(params)) {
                return {
                    status: "error",
                    error: "Invalid parameters: " +
                        JSON.stringify(schemas_1.validateShowCreateProcedure.errors),
                };
            }
            // Validate database access
            const dbValidation = this.validateDatabaseAccess(params.database);
            if (!dbValidation.valid) {
                return {
                    status: "error",
                    error: dbValidation.error,
                };
            }
            const { procedure_name } = params;
            const database = dbValidation.database;
            // Validate procedure name
            const identifierValidation = this.security.validateIdentifier(procedure_name);
            if (!identifierValidation.valid) {
                return {
                    status: "error",
                    error: identifierValidation.error || "Invalid procedure name",
                };
            }
            const query = `SHOW CREATE PROCEDURE \`${database}\`.\`${procedure_name}\``;
            const results = await this.db.query(query);
            if (results.length === 0) {
                return {
                    status: "error",
                    error: `Stored procedure '${procedure_name}' not found`,
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
}
exports.StoredProcedureTools = StoredProcedureTools;
