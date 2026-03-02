"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewTools = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const config_1 = require("../config/config");
class ViewTools {
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
     * List all views in the current database
     */
    async listViews(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const database = dbValidation.database;
            const query = `
        SELECT
          TABLE_NAME as view_name,
          VIEW_DEFINITION as definition,
          CHECK_OPTION as check_option,
          IS_UPDATABLE as is_updatable,
          DEFINER as definer,
          SECURITY_TYPE as security_type,
          CHARACTER_SET_CLIENT as charset,
          COLLATION_CONNECTION as collation
        FROM INFORMATION_SCHEMA.VIEWS
        WHERE TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME
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
     * Get detailed information about a specific view
     */
    async getViewInfo(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { view_name } = params;
            const database = dbValidation.database;
            // Validate view name
            const identifierValidation = this.security.validateIdentifier(view_name);
            if (!identifierValidation.valid) {
                return {
                    status: "error",
                    error: identifierValidation.error || "Invalid view name",
                };
            }
            // Get view information
            const viewQuery = `
        SELECT
          TABLE_NAME as view_name,
          VIEW_DEFINITION as definition,
          CHECK_OPTION as check_option,
          IS_UPDATABLE as is_updatable,
          DEFINER as definer,
          SECURITY_TYPE as security_type,
          CHARACTER_SET_CLIENT as charset,
          COLLATION_CONNECTION as collation
        FROM INFORMATION_SCHEMA.VIEWS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      `;
            // Get view columns
            const columnsQuery = `
        SELECT
          COLUMN_NAME as column_name,
          DATA_TYPE as data_type,
          COLUMN_TYPE as column_type,
          IS_NULLABLE as is_nullable,
          COLUMN_DEFAULT as column_default,
          ORDINAL_POSITION as position
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `;
            const [viewInfo, columns] = await Promise.all([
                this.db.query(viewQuery, [database, view_name]),
                this.db.query(columnsQuery, [database, view_name]),
            ]);
            if (viewInfo.length === 0) {
                return {
                    status: "error",
                    error: `View '${view_name}' not found in database '${database}'`,
                };
            }
            return {
                status: "success",
                data: {
                    ...viewInfo[0],
                    columns: columns,
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
     * Create a new view
     */
    async createView(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { view_name, definition, or_replace = false, algorithm, security, check_option, } = params;
            const database = dbValidation.database;
            // Validate view name
            const identifierValidation = this.security.validateIdentifier(view_name);
            if (!identifierValidation.valid) {
                return {
                    status: "error",
                    error: identifierValidation.error || "Invalid view name",
                };
            }
            // Validate that definition is a SELECT statement
            const trimmedDef = definition.trim().toUpperCase();
            if (!trimmedDef.startsWith("SELECT")) {
                return {
                    status: "error",
                    error: "View definition must be a SELECT statement",
                };
            }
            // Build CREATE VIEW statement
            let createQuery = or_replace ? "CREATE OR REPLACE " : "CREATE ";
            if (algorithm) {
                createQuery += `ALGORITHM = ${algorithm} `;
            }
            if (security) {
                createQuery += `SQL SECURITY ${security} `;
            }
            createQuery += `VIEW \`${database}\`.\`${view_name}\` AS ${definition}`;
            if (check_option) {
                createQuery += ` WITH ${check_option} CHECK OPTION`;
            }
            await this.db.query(createQuery);
            return {
                status: "success",
                data: {
                    message: `View '${view_name}' created successfully`,
                    view_name,
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
     * Alter an existing view
     */
    async alterView(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { view_name, definition, algorithm, security, check_option } = params;
            const database = dbValidation.database;
            // Validate view name
            const identifierValidation = this.security.validateIdentifier(view_name);
            if (!identifierValidation.valid) {
                return {
                    status: "error",
                    error: identifierValidation.error || "Invalid view name",
                };
            }
            // Validate that definition is a SELECT statement
            const trimmedDef = definition.trim().toUpperCase();
            if (!trimmedDef.startsWith("SELECT")) {
                return {
                    status: "error",
                    error: "View definition must be a SELECT statement",
                };
            }
            // Build ALTER VIEW statement
            let alterQuery = "ALTER ";
            if (algorithm) {
                alterQuery += `ALGORITHM = ${algorithm} `;
            }
            if (security) {
                alterQuery += `SQL SECURITY ${security} `;
            }
            alterQuery += `VIEW \`${database}\`.\`${view_name}\` AS ${definition}`;
            if (check_option) {
                alterQuery += ` WITH ${check_option} CHECK OPTION`;
            }
            await this.db.query(alterQuery);
            return {
                status: "success",
                data: {
                    message: `View '${view_name}' altered successfully`,
                    view_name,
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
     * Drop a view
     */
    async dropView(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { view_name, if_exists = false } = params;
            const database = dbValidation.database;
            // Validate view name
            const identifierValidation = this.security.validateIdentifier(view_name);
            if (!identifierValidation.valid) {
                return {
                    status: "error",
                    error: identifierValidation.error || "Invalid view name",
                };
            }
            const dropQuery = `DROP VIEW ${if_exists ? "IF EXISTS" : ""} \`${database}\`.\`${view_name}\``;
            await this.db.query(dropQuery);
            return {
                status: "success",
                message: `View '${view_name}' dropped successfully`,
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
     * Show the CREATE statement for a view
     */
    async showCreateView(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { view_name } = params;
            const database = dbValidation.database;
            // Validate view name
            const identifierValidation = this.security.validateIdentifier(view_name);
            if (!identifierValidation.valid) {
                return {
                    status: "error",
                    error: identifierValidation.error || "Invalid view name",
                };
            }
            const query = `SHOW CREATE VIEW \`${database}\`.\`${view_name}\``;
            const results = await this.db.query(query);
            if (results.length === 0) {
                return {
                    status: "error",
                    error: `View '${view_name}' not found`,
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
exports.ViewTools = ViewTools;
