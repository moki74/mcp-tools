"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessTools = void 0;
const connection_1 = __importDefault(require("../db/connection"));
class ProcessTools {
    constructor(security) {
        this.db = connection_1.default.getInstance();
        this.security = security;
    }
    /**
     * Show all running processes/connections
     */
    async showProcessList(params) {
        try {
            const query = params?.full ? "SHOW FULL PROCESSLIST" : "SHOW PROCESSLIST";
            const results = await this.db.query(query);
            // Format results for better readability
            const formattedResults = results.map((row) => ({
                id: row.Id,
                user: row.User,
                host: row.Host,
                database: row.db,
                command: row.Command,
                time: row.Time,
                state: row.State,
                info: row.Info,
                progress: row.Progress,
            }));
            return {
                status: "success",
                data: formattedResults,
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
     * Kill a specific process/connection
     */
    async killProcess(params) {
        try {
            const { process_id, type = "CONNECTION" } = params;
            // Validate process_id is a positive integer
            if (!Number.isInteger(process_id) || process_id <= 0) {
                return {
                    status: "error",
                    error: "Process ID must be a positive integer",
                };
            }
            const query = type === "QUERY" ? `KILL QUERY ${process_id}` : `KILL ${process_id}`;
            await this.db.query(query);
            return {
                status: "success",
                message: type === "QUERY"
                    ? `Query for process ${process_id} killed successfully`
                    : `Process ${process_id} killed successfully`,
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
     * Show server status variables
     */
    async showStatus(params) {
        try {
            let query = params?.global ? "SHOW GLOBAL STATUS" : "SHOW STATUS";
            if (params?.like) {
                // Validate the LIKE pattern (basic check)
                if (params.like.includes(";") || params.like.includes("--")) {
                    return { status: "error", error: "Invalid pattern" };
                }
                query += ` LIKE '${params.like}'`;
            }
            const results = await this.db.query(query);
            // Convert to object for easier access
            const statusObj = {};
            for (const row of results) {
                statusObj[row.Variable_name] = row.Value;
            }
            return {
                status: "success",
                data: params?.like
                    ? statusObj
                    : {
                        variables: statusObj,
                        count: results.length,
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
     * Show server variables
     */
    async showVariables(params) {
        try {
            let query = params?.global ? "SHOW GLOBAL VARIABLES" : "SHOW VARIABLES";
            if (params?.like) {
                // Validate the LIKE pattern (basic check)
                if (params.like.includes(";") || params.like.includes("--")) {
                    return { status: "error", error: "Invalid pattern" };
                }
                query += ` LIKE '${params.like}'`;
            }
            const results = await this.db.query(query);
            // Convert to object for easier access
            const varsObj = {};
            for (const row of results) {
                varsObj[row.Variable_name] = row.Value;
            }
            return {
                status: "success",
                data: params?.like
                    ? varsObj
                    : {
                        variables: varsObj,
                        count: results.length,
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
     * Explain a query (show execution plan)
     */
    async explainQuery(params) {
        try {
            const { query, format = "TRADITIONAL", analyze = false } = params;
            // Only allow SELECT, UPDATE, DELETE, INSERT queries to be explained
            const normalizedQuery = query.trim().toUpperCase();
            if (!normalizedQuery.startsWith("SELECT") &&
                !normalizedQuery.startsWith("UPDATE") &&
                !normalizedQuery.startsWith("DELETE") &&
                !normalizedQuery.startsWith("INSERT")) {
                return {
                    status: "error",
                    error: "EXPLAIN only supports SELECT, UPDATE, DELETE, and INSERT statements",
                };
            }
            let explainQuery = analyze ? "EXPLAIN ANALYZE " : "EXPLAIN ";
            if (format !== "TRADITIONAL") {
                explainQuery += `FORMAT=${format} `;
            }
            explainQuery += query;
            const results = await this.db.query(explainQuery);
            return {
                status: "success",
                data: format === "JSON" ? JSON.parse(results[0]["EXPLAIN"]) : results,
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
     * Show engine status (InnoDB, etc.)
     */
    async showEngineStatus(params) {
        try {
            const engine = params?.engine || "INNODB";
            // Validate engine name
            const validEngines = [
                "INNODB",
                "PERFORMANCE_SCHEMA",
                "NDB",
                "NDBCLUSTER",
            ];
            if (!validEngines.includes(engine.toUpperCase())) {
                return {
                    status: "error",
                    error: `Invalid engine. Supported: ${validEngines.join(", ")}`,
                };
            }
            const query = `SHOW ENGINE ${engine.toUpperCase()} STATUS`;
            const results = await this.db.query(query);
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
     * Get server information
     */
    async getServerInfo() {
        try {
            // Get various server info
            const queries = [
                { key: "version", query: "SELECT VERSION() as value" },
                { key: "connection_id", query: "SELECT CONNECTION_ID() as value" },
                { key: "current_user", query: "SELECT CURRENT_USER() as value" },
                { key: "database", query: "SELECT DATABASE() as value" },
            ];
            const info = {};
            for (const q of queries) {
                const result = await this.db.query(q.query);
                info[q.key] = result[0]?.value;
            }
            // Get uptime and other status
            const statusQuery = `SHOW GLOBAL STATUS WHERE Variable_name IN ('Uptime', 'Threads_connected', 'Threads_running', 'Questions', 'Slow_queries', 'Opens', 'Flush_commands', 'Open_tables', 'Queries')`;
            const statusResult = await this.db.query(statusQuery);
            for (const row of statusResult) {
                info[row.Variable_name.toLowerCase()] = row.Value;
            }
            // Format uptime
            if (info.uptime) {
                const uptimeSec = parseInt(info.uptime);
                const days = Math.floor(uptimeSec / 86400);
                const hours = Math.floor((uptimeSec % 86400) / 3600);
                const minutes = Math.floor((uptimeSec % 3600) / 60);
                info.uptime_formatted = `${days}d ${hours}h ${minutes}m`;
            }
            return {
                status: "success",
                data: info,
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
     * Show binary logs
     */
    async showBinaryLogs() {
        try {
            const query = "SHOW BINARY LOGS";
            const results = await this.db.query(query);
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
     * Show master/replica status
     */
    async showReplicationStatus(params) {
        try {
            const type = params?.type || "REPLICA";
            let query;
            if (type === "MASTER") {
                query = "SHOW MASTER STATUS";
            }
            else {
                // MySQL 8.0.22+ uses REPLICA, older versions use SLAVE
                query = type === "SLAVE" ? "SHOW SLAVE STATUS" : "SHOW REPLICA STATUS";
            }
            const results = await this.db.query(query);
            return {
                status: "success",
                data: results.length > 0 ? results[0] : null,
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
exports.ProcessTools = ProcessTools;
