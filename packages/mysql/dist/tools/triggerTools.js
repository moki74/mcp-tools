"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerTools = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const config_1 = require("../config/config");
class TriggerTools {
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
     * List all triggers in the current database
     */
    async listTriggers(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const database = dbValidation.database;
            let query = `
        SELECT
          TRIGGER_NAME as trigger_name,
          EVENT_MANIPULATION as event,
          EVENT_OBJECT_TABLE as table_name,
          ACTION_TIMING as timing,
          ACTION_STATEMENT as statement,
          ACTION_ORIENTATION as orientation,
          DEFINER as definer,
          CREATED as created
        FROM INFORMATION_SCHEMA.TRIGGERS
        WHERE TRIGGER_SCHEMA = ?
      `;
            const queryParams = [database];
            if (params?.table_name) {
                const identifierValidation = this.security.validateIdentifier(params.table_name);
                if (!identifierValidation.valid) {
                    return {
                        status: "error",
                        error: identifierValidation.error || "Invalid table name",
                    };
                }
                query += ` AND EVENT_OBJECT_TABLE = ?`;
                queryParams.push(params.table_name);
            }
            query += ` ORDER BY EVENT_OBJECT_TABLE, ACTION_TIMING, EVENT_MANIPULATION`;
            const results = await this.db.query(query, queryParams);
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
     * Get detailed information about a specific trigger
     */
    async getTriggerInfo(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { trigger_name } = params;
            const database = dbValidation.database;
            // Validate trigger name
            const identifierValidation = this.security.validateIdentifier(trigger_name);
            if (!identifierValidation.valid) {
                return {
                    status: "error",
                    error: identifierValidation.error || "Invalid trigger name",
                };
            }
            const query = `
        SELECT
          TRIGGER_NAME as trigger_name,
          EVENT_MANIPULATION as event,
          EVENT_OBJECT_SCHEMA as schema_name,
          EVENT_OBJECT_TABLE as table_name,
          ACTION_ORDER as action_order,
          ACTION_CONDITION as condition_value,
          ACTION_STATEMENT as statement,
          ACTION_ORIENTATION as orientation,
          ACTION_TIMING as timing,
          ACTION_REFERENCE_OLD_TABLE as old_table,
          ACTION_REFERENCE_NEW_TABLE as new_table,
          ACTION_REFERENCE_OLD_ROW as old_row,
          ACTION_REFERENCE_NEW_ROW as new_row,
          CREATED as created,
          SQL_MODE as sql_mode,
          DEFINER as definer,
          CHARACTER_SET_CLIENT as charset,
          COLLATION_CONNECTION as collation,
          DATABASE_COLLATION as db_collation
        FROM INFORMATION_SCHEMA.TRIGGERS
        WHERE TRIGGER_SCHEMA = ? AND TRIGGER_NAME = ?
      `;
            const results = await this.db.query(query, [
                database,
                trigger_name,
            ]);
            if (results.length === 0) {
                return {
                    status: "error",
                    error: `Trigger '${trigger_name}' not found in database '${database}'`,
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
     * Create a new trigger
     */
    async createTrigger(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { trigger_name, table_name, timing, event, body, definer } = params;
            const database = dbValidation.database;
            // Validate trigger name
            const triggerValidation = this.security.validateIdentifier(trigger_name);
            if (!triggerValidation.valid) {
                return {
                    status: "error",
                    error: triggerValidation.error || "Invalid trigger name",
                };
            }
            // Validate table name
            const tableValidation = this.security.validateIdentifier(table_name);
            if (!tableValidation.valid) {
                return {
                    status: "error",
                    error: tableValidation.error || "Invalid table name",
                };
            }
            // Validate timing
            if (!["BEFORE", "AFTER"].includes(timing)) {
                return { status: "error", error: "Timing must be BEFORE or AFTER" };
            }
            // Validate event
            if (!["INSERT", "UPDATE", "DELETE"].includes(event)) {
                return {
                    status: "error",
                    error: "Event must be INSERT, UPDATE, or DELETE",
                };
            }
            // Build CREATE TRIGGER statement
            let createQuery = "CREATE";
            if (definer) {
                createQuery += ` DEFINER = ${definer}`;
            }
            createQuery += ` TRIGGER \`${database}\`.\`${trigger_name}\``;
            createQuery += ` ${timing} ${event}`;
            createQuery += ` ON \`${database}\`.\`${table_name}\``;
            createQuery += ` FOR EACH ROW`;
            // Check if body already contains BEGIN/END
            const trimmedBody = body.trim();
            if (trimmedBody.toUpperCase().startsWith("BEGIN") &&
                trimmedBody.toUpperCase().endsWith("END")) {
                createQuery += `\n${body}`;
            }
            else {
                createQuery += `\nBEGIN\n${body}\nEND`;
            }
            await this.db.query(createQuery);
            return {
                status: "success",
                data: {
                    message: `Trigger '${trigger_name}' created successfully`,
                    trigger_name,
                    table_name,
                    timing,
                    event,
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
     * Drop a trigger
     */
    async dropTrigger(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { trigger_name, if_exists = false } = params;
            const database = dbValidation.database;
            // Validate trigger name
            const identifierValidation = this.security.validateIdentifier(trigger_name);
            if (!identifierValidation.valid) {
                return {
                    status: "error",
                    error: identifierValidation.error || "Invalid trigger name",
                };
            }
            const dropQuery = `DROP TRIGGER ${if_exists ? "IF EXISTS" : ""} \`${database}\`.\`${trigger_name}\``;
            await this.db.query(dropQuery);
            return {
                status: "success",
                message: `Trigger '${trigger_name}' dropped successfully`,
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
     * Show the CREATE statement for a trigger
     */
    async showCreateTrigger(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { trigger_name } = params;
            const database = dbValidation.database;
            // Validate trigger name
            const identifierValidation = this.security.validateIdentifier(trigger_name);
            if (!identifierValidation.valid) {
                return {
                    status: "error",
                    error: identifierValidation.error || "Invalid trigger name",
                };
            }
            const query = `SHOW CREATE TRIGGER \`${database}\`.\`${trigger_name}\``;
            const results = await this.db.query(query);
            if (results.length === 0) {
                return {
                    status: "error",
                    error: `Trigger '${trigger_name}' not found`,
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
exports.TriggerTools = TriggerTools;
