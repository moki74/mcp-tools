"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtilityTools = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const config_1 = require("../config/config");
const schemas_1 = require("../validation/schemas");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class UtilityTools {
    constructor() {
        this.db = connection_1.default.getInstance();
    }
    /**
     * Returns the current database connection info
     */
    async describeConnection() {
        try {
            // Return connection info without sensitive data
            const connectionInfo = {
                host: config_1.dbConfig.host,
                port: config_1.dbConfig.port,
                user: config_1.dbConfig.user,
                database: config_1.dbConfig.database,
                // Exclude password for security
            };
            return {
                status: "success",
                data: connectionInfo,
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
     * Tests the DB connection and returns latency
     */
    async testConnection() {
        try {
            const result = await this.db.testConnection();
            if (!result.connected) {
                // Provide detailed diagnostics based on error code
                const errorCode = result.errorCode || "UNKNOWN";
                const errorMessage = result.error || "Unknown connection error";
                let diagnosticMessage = "❌ Database Connection Failed\n\n";
                diagnosticMessage += `Error: ${errorMessage}\n`;
                diagnosticMessage += `Error Code: ${errorCode}\n\n`;
                // Provide specific guidance based on error code
                if (errorCode === "ECONNREFUSED" ||
                    errorCode === "ER_CONNECTION_REFUSED") {
                    diagnosticMessage +=
                        "🔍 Diagnosis: MySQL server is not accepting connections\n\n";
                    diagnosticMessage += "✅ Troubleshooting Steps:\n";
                    diagnosticMessage += "1. Check if MySQL server is running:\n";
                    diagnosticMessage +=
                        '   • Windows: Open Services and look for "MySQL" service\n';
                    diagnosticMessage +=
                        "   • Linux/Mac: Run `sudo systemctl status mysql` or `brew services list`\n";
                    diagnosticMessage += "2. Start MySQL server if it's stopped:\n";
                    diagnosticMessage +=
                        "   • Windows: Start the MySQL service from Services panel\n";
                    diagnosticMessage += "   • Linux: `sudo systemctl start mysql`\n";
                    diagnosticMessage += "   • Mac: `brew services start mysql`\n";
                    diagnosticMessage +=
                        "3. Verify server is listening on the correct port (default: 3306)\n";
                }
                else if (errorCode === "ENOTFOUND" || errorCode === "EAI_AGAIN") {
                    diagnosticMessage += "🔍 Diagnosis: Cannot resolve database host\n\n";
                    diagnosticMessage += "✅ Troubleshooting Steps:\n";
                    diagnosticMessage += "1. Check your DB_HOST configuration\n";
                    diagnosticMessage += "2. Verify network connectivity\n";
                    diagnosticMessage +=
                        '3. If using "localhost", try "127.0.0.1" instead\n';
                }
                else if (errorCode === "ER_ACCESS_DENIED_ERROR") {
                    diagnosticMessage += "🔍 Diagnosis: Authentication failed\n\n";
                    diagnosticMessage += "✅ Troubleshooting Steps:\n";
                    diagnosticMessage +=
                        "1. Verify DB_USER and DB_PASSWORD in your configuration\n";
                    diagnosticMessage += "2. Check MySQL user permissions\n";
                    diagnosticMessage += "3. Ensure user has access from your host\n";
                }
                else if (errorCode === "ER_BAD_DB_ERROR") {
                    diagnosticMessage += "🔍 Diagnosis: Database does not exist\n\n";
                    diagnosticMessage += "✅ Troubleshooting Steps:\n";
                    diagnosticMessage += "1. Verify DB_NAME in your configuration\n";
                    diagnosticMessage += "2. Create the database if it doesn't exist\n";
                    diagnosticMessage +=
                        "3. Check database name spelling and case sensitivity\n";
                }
                else if (errorCode === "ETIMEDOUT" || errorCode === "ECONNABORTED") {
                    diagnosticMessage += "🔍 Diagnosis: Connection timeout\n\n";
                    diagnosticMessage += "✅ Troubleshooting Steps:\n";
                    diagnosticMessage +=
                        "1. Check if firewall is blocking MySQL port (3306)\n";
                    diagnosticMessage +=
                        "2. Verify MySQL is configured to accept remote connections\n";
                    diagnosticMessage +=
                        "3. Check network connectivity to database server\n";
                }
                else {
                    diagnosticMessage += "✅ General Troubleshooting Steps:\n";
                    diagnosticMessage += "1. Verify MySQL server is running\n";
                    diagnosticMessage +=
                        "2. Check connection settings in your .env file:\n";
                    diagnosticMessage +=
                        "   • DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME\n";
                    diagnosticMessage += "3. Review MySQL server logs for details\n";
                }
                diagnosticMessage += "\n📋 Current Configuration:\n";
                diagnosticMessage += `   Host: ${this.db.pool.pool.config.connectionConfig.host}\n`;
                diagnosticMessage += `   Port: ${this.db.pool.pool.config.connectionConfig.port}\n`;
                diagnosticMessage += `   User: ${this.db.pool.pool.config.connectionConfig.user}\n`;
                diagnosticMessage += `   Database: ${this.db.pool.pool.config.connectionConfig.database}\n`;
                return {
                    status: "error",
                    error: diagnosticMessage,
                    data: {
                        connected: false,
                        latency: -1,
                        errorCode: errorCode,
                        rawError: errorMessage,
                    },
                };
            }
            return {
                status: "success",
                data: {
                    connected: result.connected,
                    latency: result.latency,
                    message: `✅ Successfully connected to database in ${result.latency}ms`,
                },
            };
        }
        catch (error) {
            return {
                status: "error",
                error: `❌ Unexpected error while testing connection: ${error?.message || "Unknown error"}`,
            };
        }
    }
    /**
     * Detects and describes foreign key relationships between tables
     */
    async getTableRelationships(params) {
        // Validate input
        if (!(0, schemas_1.validateGetTableRelationships)(params)) {
            return {
                status: "error",
                error: "Invalid parameters: " +
                    JSON.stringify(schemas_1.validateGetTableRelationships.errors),
            };
        }
        try {
            const { table_name } = params;
            // Query to get foreign keys where this table is the parent
            const parentQuery = `
        SELECT
          TABLE_NAME as child_table,
          COLUMN_NAME as child_column,
          REFERENCED_TABLE_NAME as parent_table,
          REFERENCED_COLUMN_NAME as parent_column,
          CONSTRAINT_NAME as constraint_name
        FROM
          INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE
          REFERENCED_TABLE_NAME = ?
          AND REFERENCED_TABLE_SCHEMA = DATABASE()
      `;
            // Query to get foreign keys where this table is the child
            const childQuery = `
        SELECT
          TABLE_NAME as child_table,
          COLUMN_NAME as child_column,
          REFERENCED_TABLE_NAME as parent_table,
          REFERENCED_COLUMN_NAME as parent_column,
          CONSTRAINT_NAME as constraint_name
        FROM
          INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE
          TABLE_NAME = ?
          AND REFERENCED_TABLE_NAME IS NOT NULL
          AND TABLE_SCHEMA = DATABASE()
      `;
            // Execute both queries
            const parentRelationships = await this.db.query(parentQuery, [
                table_name,
            ]);
            const childRelationships = await this.db.query(childQuery, [
                table_name,
            ]);
            return {
                status: "success",
                data: {
                    as_parent: parentRelationships,
                    as_child: childRelationships,
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
     * Gets foreign key relationships for ALL tables in a single call
     * Processes relationships in memory to avoid multiple queries
     */
    async getAllTablesRelationships(params) {
        try {
            const databaseName = params?.database || this.db.pool.pool.config.connectionConfig.database;
            // Get all tables in the database
            const tablesQuery = `
        SELECT TABLE_NAME as table_name
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = ?
        AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `;
            const tablesResult = await this.db.query(tablesQuery, [databaseName]);
            const tableNames = tablesResult.map(row => row.table_name);
            // Get ALL foreign key relationships in a single query
            const relationshipsQuery = `
        SELECT
          TABLE_NAME as child_table,
          COLUMN_NAME as child_column,
          REFERENCED_TABLE_NAME as parent_table,
          REFERENCED_COLUMN_NAME as parent_column,
          CONSTRAINT_NAME as constraint_name
        FROM
          INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE
          TABLE_SCHEMA = ?
          AND REFERENCED_TABLE_NAME IS NOT NULL
        ORDER BY
          REFERENCED_TABLE_NAME, TABLE_NAME
      `;
            const allRelationships = await this.db.query(relationshipsQuery, [databaseName]);
            // Initialize result object with all tables having empty relationships
            const result = {};
            tableNames.forEach(tableName => {
                result[tableName] = {
                    as_parent: [],
                    as_child: []
                };
            });
            // Process relationships in memory
            allRelationships.forEach(relationship => {
                const { child_table, parent_table } = relationship;
                // Add to parent table's "as_parent" array
                if (result[parent_table]) {
                    result[parent_table].as_parent.push({
                        child_table: relationship.child_table,
                        child_column: relationship.child_column,
                        parent_table: relationship.parent_table,
                        parent_column: relationship.parent_column,
                        constraint_name: relationship.constraint_name
                    });
                }
                // Add to child table's "as_child" array
                if (result[child_table]) {
                    result[child_table].as_child.push({
                        child_table: relationship.child_table,
                        child_column: relationship.child_column,
                        parent_table: relationship.parent_table,
                        parent_column: relationship.parent_column,
                        constraint_name: relationship.constraint_name
                    });
                }
            });
            return {
                status: "success",
                data: {
                    total_tables: tableNames.length,
                    total_relationships: allRelationships.length,
                    relationships: result
                }
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
     * Lists all available tools in this MySQL MCP server
     */
    async listAllTools() {
        try {
            // Read manifest.json to get tool definitions
            const manifestPath = path_1.default.resolve(__dirname, "..", "..", "manifest.json");
            if (!fs_1.default.existsSync(manifestPath)) {
                return {
                    status: "error",
                    error: "manifest.json not found in project root.",
                };
            }
            const manifestContent = fs_1.default.readFileSync(manifestPath, "utf-8");
            const manifest = JSON.parse(manifestContent);
            const tools = manifest.tools.map((tool) => ({
                name: tool.name,
                description: tool.description,
                input_schema: tool.input_schema,
                output_schema: tool.output_schema
            }));
            return {
                status: "success",
                data: {
                    total_tools: tools.length,
                    server_name: manifest.name,
                    server_version: manifest.version,
                    server_description: manifest.description,
                    tools: tools
                }
            };
        }
        catch (error) {
            return {
                status: "error",
                error: `Failed to list tools: ${error.message}`,
            };
        }
    }
    /**
     * Reads the CHANGELOG.md file from the project root
     */
    async readChangelog(params) {
        try {
            // Resolve path relative to the built file (dist/tools/utilityTools.js -> ../../CHANGELOG.md)
            // or source file (src/tools/utilityTools.ts -> ../../CHANGELOG.md)
            const changelogPath = path_1.default.resolve(__dirname, "..", "..", "CHANGELOG.md");
            if (!fs_1.default.existsSync(changelogPath)) {
                return {
                    status: "error",
                    error: "CHANGELOG.md not found in the project root.",
                };
            }
            const content = fs_1.default.readFileSync(changelogPath, "utf-8");
            // If version specified, try to parse and find it
            if (params?.version) {
                // Simple parsing - look for headers like "## [1.2.3]"
                const versionHeader = `## [${params.version}]`;
                const lines = content.split("\n");
                let found = false;
                let versionContent = "";
                for (const line of lines) {
                    if (line.startsWith(versionHeader)) {
                        found = true;
                        versionContent += line + "\n";
                        continue;
                    }
                    if (found) {
                        if (line.startsWith("## ["))
                            break; // Next version starts
                        versionContent += line + "\n";
                    }
                }
                if (!found) {
                    return {
                        status: "error",
                        error: `Version ${params.version} not found in CHANGELOG.md`,
                    };
                }
                return {
                    status: "success",
                    data: {
                        version: params.version,
                        content: versionContent.trim(),
                    },
                };
            }
            // If no version, return the whole file or top N characters/lines?
            // For now, let's return the most recent versions.
            // Limit default to 3000 chars to avoid overflowing context
            const maxLength = params?.limit || 5000;
            const truncated = content.length > maxLength
                ? content.substring(0, maxLength) + "\n... (truncated)"
                : content;
            return {
                status: "success",
                data: {
                    content: truncated,
                },
            };
        }
        catch (error) {
            return {
                status: "error",
                error: `Failed to read changelog: ${error.message}`,
            };
        }
    }
}
exports.UtilityTools = UtilityTools;
