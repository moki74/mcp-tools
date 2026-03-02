"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLMCP = void 0;
const databaseTools_1 = require("./tools/databaseTools");
const crudTools_1 = require("./tools/crudTools");
const queryTools_1 = require("./tools/queryTools");
const utilityTools_1 = require("./tools/utilityTools");
const ddlTools_1 = require("./tools/ddlTools");
const transactionTools_1 = require("./tools/transactionTools");
const storedProcedureTools_1 = require("./tools/storedProcedureTools");
const dataExportTools_1 = require("./tools/dataExportTools");
const viewTools_1 = require("./tools/viewTools");
const triggerTools_1 = require("./tools/triggerTools");
const functionTools_1 = require("./tools/functionTools");
const indexTools_1 = require("./tools/indexTools");
const constraintTools_1 = require("./tools/constraintTools");
const maintenanceTools_1 = require("./tools/maintenanceTools");
const processTools_1 = require("./tools/processTools");
const backupRestoreTools_1 = require("./tools/backupRestoreTools");
const migrationTools_1 = require("./tools/migrationTools");
const schemaVersioningTools_1 = require("./tools/schemaVersioningTools");
const performanceTools_1 = require("./tools/performanceTools");
const analysisTools_1 = require("./tools/analysisTools");
const aiTools_1 = require("./tools/aiTools");
const macroTools_1 = require("./tools/macroTools");
const intelligentQueryTools_1 = require("./tools/intelligentQueryTools");
const smartDiscoveryTools_1 = require("./tools/smartDiscoveryTools");
const documentationGeneratorTools_1 = require("./tools/documentationGeneratorTools");
const schemaDesignTools_1 = require("./tools/schemaDesignTools");
const securityAuditTools_1 = require("./tools/securityAuditTools");
const indexRecommendationTools_1 = require("./tools/indexRecommendationTools");
const testDataTools_1 = require("./tools/testDataTools");
const schemaPatternTools_1 = require("./tools/schemaPatternTools");
const queryVisualizationTools_1 = require("./tools/queryVisualizationTools");
const forecastingTools_1 = require("./tools/forecastingTools");
const smartQueryBuilderTools_1 = require("./tools/smartQueryBuilderTools");
const fulltextSearchTools_1 = require("./tools/fulltextSearchTools");
const securityLayer_1 = __importDefault(require("./security/securityLayer"));
const connection_1 = __importDefault(require("./db/connection"));
const featureConfig_1 = require("./config/featureConfig");
/**
 * MySQL Model Context Protocol (MCP)
 * A secure interface for AI models to interact with MySQL databases
 */
class MySQLMCP {
    constructor(permissionsConfig, categoriesConfig) {
        this.featureConfig = new featureConfig_1.FeatureConfig(permissionsConfig, categoriesConfig);
        this.security = new securityLayer_1.default(this.featureConfig);
        this.dbTools = new databaseTools_1.DatabaseTools();
        this.crudTools = new crudTools_1.CrudTools(this.security);
        this.queryTools = new queryTools_1.QueryTools(this.security);
        this.utilityTools = new utilityTools_1.UtilityTools();
        this.ddlTools = new ddlTools_1.DdlTools(this.security);
        this.transactionTools = new transactionTools_1.TransactionTools(this.security);
        this.storedProcedureTools = new storedProcedureTools_1.StoredProcedureTools(this.security);
        this.dataExportTools = new dataExportTools_1.DataExportTools(this.security);
        this.viewTools = new viewTools_1.ViewTools(this.security);
        this.triggerTools = new triggerTools_1.TriggerTools(this.security);
        this.functionTools = new functionTools_1.FunctionTools(this.security);
        this.indexTools = new indexTools_1.IndexTools(this.security);
        this.constraintTools = new constraintTools_1.ConstraintTools(this.security);
        this.maintenanceTools = new maintenanceTools_1.MaintenanceTools(this.security);
        this.processTools = new processTools_1.ProcessTools(this.security);
        this.backupRestoreTools = new backupRestoreTools_1.BackupRestoreTools(this.security);
        this.migrationTools = new migrationTools_1.MigrationTools(this.security);
        this.schemaVersioningTools = new schemaVersioningTools_1.SchemaVersioningTools(this.security);
        this.performanceTools = new performanceTools_1.PerformanceTools(this.security);
        this.analysisTools = new analysisTools_1.AnalysisTools(this.security);
        this.analysisTools = new analysisTools_1.AnalysisTools(this.security);
        this.aiTools = new aiTools_1.AiTools(this.security);
        this.macroTools = new macroTools_1.MacroTools(this.security);
        this.intelligentQueryTools = new intelligentQueryTools_1.IntelligentQueryTools(this.security);
        this.smartDiscoveryTools = new smartDiscoveryTools_1.SmartDiscoveryTools(this.security);
        this.documentationGeneratorTools = new documentationGeneratorTools_1.DocumentationGeneratorTools(this.security);
        this.schemaDesignTools = new schemaDesignTools_1.SchemaDesignTools(this.security);
        this.securityAuditTools = new securityAuditTools_1.SecurityAuditTools();
        this.indexRecommendationTools = new indexRecommendationTools_1.IndexRecommendationTools(this.security);
        this.testDataTools = new testDataTools_1.TestDataTools(this.security);
        this.schemaPatternTools = new schemaPatternTools_1.SchemaPatternTools(this.security);
        this.queryVisualizationTools = new queryVisualizationTools_1.QueryVisualizationTools(this.security);
        this.forecastingTools = new forecastingTools_1.ForecastingTools(this.security);
        this.smartQueryBuilderTools = new smartQueryBuilderTools_1.SmartQueryBuilderTools(this.security);
        this.fulltextSearchTools = new fulltextSearchTools_1.FulltextSearchTools(this.security);
    }
    // Helper method to check if tool is enabled
    checkToolEnabled(toolName) {
        if (!this.featureConfig.isToolEnabled(toolName)) {
            return {
                enabled: false,
                error: this.featureConfig.getPermissionError(toolName),
            };
        }
        return { enabled: true };
    }
    // Database Tools
    async listDatabases() {
        const check = this.checkToolEnabled("listDatabases");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.dbTools.listDatabases();
    }
    async listTables(params) {
        const check = this.checkToolEnabled("listTables");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.dbTools.listTables(params);
    }
    async readTableSchema(params) {
        const check = this.checkToolEnabled("readTableSchema");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.dbTools.readTableSchema(params);
    }
    async getDatabaseSummary(params) {
        const check = this.checkToolEnabled("getDatabaseSummary");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.dbTools.getDatabaseSummary(params);
    }
    async getSchemaERD(params) {
        const check = this.checkToolEnabled("getSchemaERD");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.dbTools.getSchemaERD(params);
    }
    // CRUD Tools
    async createRecord(params) {
        const check = this.checkToolEnabled("createRecord");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.crudTools.createRecord(params);
    }
    async readRecords(params) {
        const check = this.checkToolEnabled("readRecords");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.crudTools.readRecords(params);
    }
    async updateRecord(params) {
        const check = this.checkToolEnabled("updateRecord");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.crudTools.updateRecord(params);
    }
    async deleteRecord(params) {
        const check = this.checkToolEnabled("deleteRecord");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.crudTools.deleteRecord(params);
    }
    // Query Tools
    async runSelectQuery(params) {
        const check = this.checkToolEnabled("runSelectQuery");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        // Additional security check
        if (!this.security.isReadOnlyQuery(params.query)) {
            return {
                status: "error",
                error: "Only SELECT queries are allowed with run_select_query. Use execute_write_query for other operations.",
            };
        }
        return await this.queryTools.runSelectQuery(params);
    }
    async executeWriteQuery(params) {
        const check = this.checkToolEnabled("executeWriteQuery");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        // Additional security check - block DDL unless DDL permission is enabled
        if (this.security.hasDangerousOperations(params.query)) {
            // Check if DDL permission is enabled
            if (!this.featureConfig.isCategoryEnabled("ddl")) {
                return {
                    status: "error",
                    error: 'DDL operations (DROP, TRUNCATE, ALTER, CREATE) require the "ddl" permission. Use execute_ddl tool or add "ddl" to permissions.',
                };
            }
        }
        return await this.queryTools.executeWriteQuery(params);
    }
    // Analysis Tools
    async getColumnStatistics(params) {
        const check = this.checkToolEnabled("getColumnStatistics");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.analysisTools.getColumnStatistics(params);
    }
    async getSchemaRagContext(params) {
        const check = this.checkToolEnabled("getSchemaRagContext");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.analysisTools.getSchemaRagContext(params);
    }
    // DDL Tools
    async createTable(params) {
        const check = this.checkToolEnabled("createTable");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.ddlTools.createTable(params);
    }
    async alterTable(params) {
        const check = this.checkToolEnabled("alterTable");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.ddlTools.alterTable(params);
    }
    async dropTable(params) {
        const check = this.checkToolEnabled("dropTable");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.ddlTools.dropTable(params);
    }
    async executeDdl(params) {
        const check = this.checkToolEnabled("executeDdl");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.ddlTools.executeDdl(params);
    }
    // Utility Tools
    async describeConnection() {
        const check = this.checkToolEnabled("describeConnection");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.utilityTools.describeConnection();
    }
    async testConnection() {
        const check = this.checkToolEnabled("testConnection");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.utilityTools.testConnection();
    }
    async getTableRelationships(params) {
        const check = this.checkToolEnabled("getTableRelationships");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.utilityTools.getTableRelationships(params);
    }
    async getAllTablesRelationships(params) {
        const check = this.checkToolEnabled("getAllTablesRelationships");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.utilityTools.getAllTablesRelationships(params);
    }
    async readChangelog(params) {
        const check = this.checkToolEnabled("read_changelog");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.utilityTools.readChangelog(params);
    }
    async listAllTools() {
        const check = this.checkToolEnabled("list_all_tools");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.utilityTools.listAllTools();
    }
    // Transaction Tools
    async beginTransaction(params) {
        const check = this.checkToolEnabled("beginTransaction");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.transactionTools.beginTransaction(params);
    }
    async commitTransaction(params) {
        const check = this.checkToolEnabled("commitTransaction");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.transactionTools.commitTransaction(params);
    }
    async rollbackTransaction(params) {
        const check = this.checkToolEnabled("rollbackTransaction");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.transactionTools.rollbackTransaction(params);
    }
    async getTransactionStatus() {
        const check = this.checkToolEnabled("getTransactionStatus");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.transactionTools.getTransactionStatus();
    }
    async executeInTransaction(params) {
        const check = this.checkToolEnabled("executeWriteQuery"); // Use executeWriteQuery permission for transaction queries
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.transactionTools.executeInTransaction(params);
    }
    // Stored Procedure Tools
    async listStoredProcedures(params) {
        const check = this.checkToolEnabled("listStoredProcedures");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.storedProcedureTools.listStoredProcedures(params);
    }
    async getStoredProcedureInfo(params) {
        const check = this.checkToolEnabled("getStoredProcedureInfo");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.storedProcedureTools.getStoredProcedureInfo(params);
    }
    async executeStoredProcedure(params) {
        const check = this.checkToolEnabled("executeStoredProcedure");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.storedProcedureTools.executeStoredProcedure(params);
    }
    async createStoredProcedure(params) {
        const check = this.checkToolEnabled("createStoredProcedure");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.storedProcedureTools.createStoredProcedure(params);
    }
    async dropStoredProcedure(params) {
        const check = this.checkToolEnabled("dropStoredProcedure");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.storedProcedureTools.dropStoredProcedure(params);
    }
    async showCreateProcedure(params) {
        const check = this.checkToolEnabled("showCreateProcedure");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.storedProcedureTools.showCreateProcedure(params);
    }
    // Data Export Tools
    async exportTableToCSV(params) {
        const check = this.checkToolEnabled("exportTableToCSV");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.dataExportTools.exportTableToCSV(params);
    }
    async exportQueryToCSV(params) {
        const check = this.checkToolEnabled("exportQueryToCSV");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.dataExportTools.exportQueryToCSV(params);
    }
    // Extended Data Export Tools (JSON, SQL)
    async exportTableToJSON(params) {
        const check = this.checkToolEnabled("exportTableToJSON");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.dataExportTools.exportTableToJSON(params);
    }
    async exportQueryToJSON(params) {
        const check = this.checkToolEnabled("exportQueryToJSON");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.dataExportTools.exportQueryToJSON(params);
    }
    async exportTableToSql(params) {
        const check = this.checkToolEnabled("exportTableToSql");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.dataExportTools.exportTableToSql(params);
    }
    // Data Import Tools
    async importFromCSV(params) {
        const check = this.checkToolEnabled("importFromCSV");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.dataExportTools.importFromCSV(params);
    }
    async importFromJSON(params) {
        const check = this.checkToolEnabled("importFromJSON");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.dataExportTools.importFromJSON(params);
    }
    // Backup and Restore Tools
    async backupTable(params) {
        const check = this.checkToolEnabled("backupTable");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.backupRestoreTools.backupTable(params);
    }
    async backupDatabase(params) {
        const check = this.checkToolEnabled("backupDatabase");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.backupRestoreTools.backupDatabase(params);
    }
    async restoreFromSql(params) {
        const check = this.checkToolEnabled("restoreFromSql");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.backupRestoreTools.restoreFromSql(params);
    }
    async getCreateTableStatement(params) {
        const check = this.checkToolEnabled("getCreateTableStatement");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.backupRestoreTools.getCreateTableStatement(params);
    }
    async getDatabaseSchema(params) {
        const check = this.checkToolEnabled("getDatabaseSchema");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.backupRestoreTools.getDatabaseSchema(params);
    }
    // Data Migration Tools
    async copyTableData(params) {
        const check = this.checkToolEnabled("copyTableData");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.migrationTools.copyTableData(params);
    }
    async moveTableData(params) {
        const check = this.checkToolEnabled("moveTableData");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.migrationTools.moveTableData(params);
    }
    async cloneTable(params) {
        const check = this.checkToolEnabled("cloneTable");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.migrationTools.cloneTable(params);
    }
    async compareTableStructure(params) {
        const check = this.checkToolEnabled("compareTableStructure");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.migrationTools.compareTableStructure(params);
    }
    async syncTableData(params) {
        const check = this.checkToolEnabled("syncTableData");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.migrationTools.syncTableData(params);
    }
    // ==========================================
    // Schema Versioning and Migrations Tools
    // ==========================================
    /**
     * Initialize the migrations tracking table
     */
    async initMigrationsTable(params) {
        const check = this.checkToolEnabled("initMigrationsTable");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.schemaVersioningTools.initMigrationsTable(params);
    }
    /**
     * Create a new migration
     */
    async createMigration(params) {
        const check = this.checkToolEnabled("createMigration");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.schemaVersioningTools.createMigration(params);
    }
    /**
     * Apply pending migrations
     */
    async applyMigrations(params) {
        const check = this.checkToolEnabled("applyMigrations");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.schemaVersioningTools.applyMigrations(params);
    }
    /**
     * Rollback migrations
     */
    async rollbackMigration(params) {
        const check = this.checkToolEnabled("rollbackMigration");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.schemaVersioningTools.rollbackMigration(params);
    }
    /**
     * Get migration status and history
     */
    async getMigrationStatus(params) {
        const check = this.checkToolEnabled("getMigrationStatus");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.schemaVersioningTools.getMigrationStatus(params);
    }
    /**
     * Get current schema version
     */
    async getSchemaVersion(params) {
        const check = this.checkToolEnabled("getSchemaVersion");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.schemaVersioningTools.getSchemaVersion(params);
    }
    /**
     * Validate migrations for issues
     */
    async validateMigrations(params) {
        const check = this.checkToolEnabled("validateMigrations");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.schemaVersioningTools.validateMigrations(params);
    }
    /**
     * Reset a failed migration to pending status
     */
    async resetFailedMigration(params) {
        const check = this.checkToolEnabled("resetFailedMigration");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.schemaVersioningTools.resetFailedMigration(params);
    }
    /**
     * Generate a migration from table structure differences
     */
    async generateMigrationFromDiff(params) {
        const check = this.checkToolEnabled("generateMigrationFromDiff");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.schemaVersioningTools.generateMigrationFromDiff(params);
    }
    // AI Productivity Tools
    async repairQuery(params) {
        const check = this.checkToolEnabled("repairQuery");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.aiTools.repairQuery(params);
    }
    // Workflow Macros
    async safeExportTable(params) {
        const check = this.checkToolEnabled("safe_export_table");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return await this.macroTools.safeExportTable(params);
    }
    // Get feature configuration status
    getFeatureStatus() {
        const snapshot = this.featureConfig.getConfigSnapshot();
        return {
            status: "success",
            data: {
                config: snapshot,
                filteringMode: this.featureConfig.getFilteringMode(),
                enabledCategories: this.featureConfig.getEnabledCategories(),
                categoryStatus: this.featureConfig.getCategoryStatus(),
                docCategoryStatus: this.featureConfig.getDocCategoryStatus(),
            },
        };
    }
    /**
     * Check if a specific tool is enabled based on current permissions and categories
     * @param toolName - The tool name in camelCase (e.g., 'listDatabases')
     * @returns boolean indicating if the tool is enabled
     */
    isToolEnabled(toolName) {
        return this.featureConfig.isToolEnabled(toolName);
    }
    /**
     * Expose resolved access profile (resolved permissions/categories)
     */
    getAccessProfile() {
        return this.featureConfig.getConfigSnapshot();
    }
    /**
     * Bulk insert multiple records into the specified table
     */
    async bulkInsert(params) {
        const check = this.checkToolEnabled("bulkInsert");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return this.crudTools.bulkInsert(params);
    }
    /**
     * Bulk update multiple records with different conditions and data
     */
    async bulkUpdate(params) {
        const check = this.checkToolEnabled("bulkUpdate");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return this.crudTools.bulkUpdate(params);
    }
    /**
     * Bulk delete records based on multiple condition sets
     */
    async bulkDelete(params) {
        const check = this.checkToolEnabled("bulkDelete");
        if (!check.enabled) {
            return { status: "error", error: check.error };
        }
        return this.crudTools.bulkDelete(params);
    }
    // Close database connection
    async close() {
        const db = connection_1.default.getInstance();
        await db.closePool();
    }
    // ==========================================
    // Cache Management Methods
    // ==========================================
    /**
     * Get cache statistics
     */
    getCacheStats() {
        const db = connection_1.default.getInstance();
        return {
            status: "success",
            data: db.getCacheStats(),
        };
    }
    /**
     * Get cache configuration
     */
    getCacheConfig() {
        const db = connection_1.default.getInstance();
        return {
            status: "success",
            data: db.getCacheConfig(),
        };
    }
    /**
     * Configure cache settings
     */
    configureCacheSettings(params) {
        const db = connection_1.default.getInstance();
        db.setCacheConfig(params);
        return {
            status: "success",
            data: {
                message: "Cache configuration updated successfully",
                config: db.getCacheConfig(),
            },
        };
    }
    /**
     * Clear the query cache
     */
    clearCache() {
        const db = connection_1.default.getInstance();
        const clearedCount = db.clearCache();
        return {
            status: "success",
            data: {
                message: `Cache cleared successfully`,
                entriesCleared: clearedCount,
            },
        };
    }
    /**
     * Invalidate cache for a specific table
     */
    invalidateCacheForTable(params) {
        const db = connection_1.default.getInstance();
        const invalidatedCount = db.invalidateCacheForTable(params.table_name);
        return {
            status: "success",
            data: {
                message: `Cache invalidated for table '${params.table_name}'`,
                entriesInvalidated: invalidatedCount,
            },
        };
    }
    // ==========================================
    // Query Optimization Methods
    // ==========================================
    /**
     * Analyze a query and get optimization suggestions
     */
    analyzeQuery(params) {
        const analysis = this.queryTools.analyzeQuery(params.query);
        return {
            status: "success",
            data: analysis,
        };
    }
    /**
     * Get suggested optimizer hints for a specific optimization goal
     */
    getOptimizationHints(params) {
        const hints = this.queryTools.getSuggestedHints(params.goal);
        return {
            status: "success",
            data: {
                goal: params.goal,
                hints,
            },
        };
    }
    // ==========================================
    // View Tools
    // ==========================================
    async listViews(params) {
        const check = this.checkToolEnabled("listViews");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.viewTools.listViews(params);
    }
    async getViewInfo(params) {
        const check = this.checkToolEnabled("getViewInfo");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.viewTools.getViewInfo(params);
    }
    async createView(params) {
        const check = this.checkToolEnabled("createView");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.viewTools.createView(params);
    }
    async alterView(params) {
        const check = this.checkToolEnabled("alterView");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.viewTools.alterView(params);
    }
    async dropView(params) {
        const check = this.checkToolEnabled("dropView");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.viewTools.dropView(params);
    }
    async showCreateView(params) {
        const check = this.checkToolEnabled("showCreateView");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.viewTools.showCreateView(params);
    }
    // ==========================================
    // Trigger Tools
    // ==========================================
    async listTriggers(params) {
        const check = this.checkToolEnabled("listTriggers");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.triggerTools.listTriggers(params);
    }
    async getTriggerInfo(params) {
        const check = this.checkToolEnabled("getTriggerInfo");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.triggerTools.getTriggerInfo(params);
    }
    async createTrigger(params) {
        const check = this.checkToolEnabled("createTrigger");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.triggerTools.createTrigger(params);
    }
    async dropTrigger(params) {
        const check = this.checkToolEnabled("dropTrigger");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.triggerTools.dropTrigger(params);
    }
    async showCreateTrigger(params) {
        const check = this.checkToolEnabled("showCreateTrigger");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.triggerTools.showCreateTrigger(params);
    }
    // ==========================================
    // Function Tools
    // ==========================================
    async listFunctions(params) {
        const check = this.checkToolEnabled("listFunctions");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.functionTools.listFunctions(params);
    }
    async getFunctionInfo(params) {
        const check = this.checkToolEnabled("getFunctionInfo");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.functionTools.getFunctionInfo(params);
    }
    async createFunction(params) {
        const check = this.checkToolEnabled("createFunction");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.functionTools.createFunction(params);
    }
    async dropFunction(params) {
        const check = this.checkToolEnabled("dropFunction");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.functionTools.dropFunction(params);
    }
    async showCreateFunction(params) {
        const check = this.checkToolEnabled("showCreateFunction");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.functionTools.showCreateFunction(params);
    }
    async executeFunction(params) {
        const check = this.checkToolEnabled("executeFunction");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.functionTools.executeFunction(params);
    }
    // ==========================================
    // Index Tools
    // ==========================================
    async listIndexes(params) {
        const check = this.checkToolEnabled("listIndexes");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.indexTools.listIndexes(params);
    }
    async getIndexInfo(params) {
        const check = this.checkToolEnabled("getIndexInfo");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.indexTools.getIndexInfo(params);
    }
    async createIndex(params) {
        const check = this.checkToolEnabled("createIndex");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.indexTools.createIndex(params);
    }
    async dropIndex(params) {
        const check = this.checkToolEnabled("dropIndex");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.indexTools.dropIndex(params);
    }
    async analyzeIndex(params) {
        const check = this.checkToolEnabled("analyzeIndex");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.indexTools.analyzeIndex(params);
    }
    // ==========================================
    // Constraint Tools
    // ==========================================
    async listForeignKeys(params) {
        const check = this.checkToolEnabled("listForeignKeys");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.constraintTools.listForeignKeys(params);
    }
    async listConstraints(params) {
        const check = this.checkToolEnabled("listConstraints");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.constraintTools.listConstraints(params);
    }
    async addForeignKey(params) {
        const check = this.checkToolEnabled("addForeignKey");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.constraintTools.addForeignKey(params);
    }
    async dropForeignKey(params) {
        const check = this.checkToolEnabled("dropForeignKey");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.constraintTools.dropForeignKey(params);
    }
    async addUniqueConstraint(params) {
        const check = this.checkToolEnabled("addUniqueConstraint");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.constraintTools.addUniqueConstraint(params);
    }
    async dropConstraint(params) {
        const check = this.checkToolEnabled("dropConstraint");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.constraintTools.dropConstraint(params);
    }
    async addCheckConstraint(params) {
        const check = this.checkToolEnabled("addCheckConstraint");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.constraintTools.addCheckConstraint(params);
    }
    // ==========================================
    // Table Maintenance Tools
    // ==========================================
    async analyzeTable(params) {
        const check = this.checkToolEnabled("analyzeTable");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.maintenanceTools.analyzeTable(params);
    }
    async optimizeTable(params) {
        const check = this.checkToolEnabled("optimizeTable");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.maintenanceTools.optimizeTable(params);
    }
    async checkTable(params) {
        const check = this.checkToolEnabled("checkTable");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.maintenanceTools.checkTable(params);
    }
    async repairTable(params) {
        const check = this.checkToolEnabled("repairTable");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.maintenanceTools.repairTable(params);
    }
    async truncateTable(params) {
        const check = this.checkToolEnabled("truncateTable");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.maintenanceTools.truncateTable(params);
    }
    async getTableStatus(params) {
        const check = this.checkToolEnabled("getTableStatus");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.maintenanceTools.getTableStatus(params);
    }
    async flushTable(params) {
        const check = this.checkToolEnabled("flushTable");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.maintenanceTools.flushTable(params);
    }
    async getTableSize(params) {
        const check = this.checkToolEnabled("getTableSize");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.maintenanceTools.getTableSize(params);
    }
    // ==========================================
    // Process Management Tools
    // ==========================================
    async showProcessList(params) {
        const check = this.checkToolEnabled("showProcessList");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.processTools.showProcessList(params);
    }
    async killProcess(params) {
        const check = this.checkToolEnabled("killProcess");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.processTools.killProcess(params);
    }
    async showStatus(params) {
        const check = this.checkToolEnabled("showStatus");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.processTools.showStatus(params);
    }
    async showVariables(params) {
        const check = this.checkToolEnabled("showVariables");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.processTools.showVariables(params);
    }
    async explainQuery(params) {
        const check = this.checkToolEnabled("explainQuery");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.processTools.explainQuery(params);
    }
    async showEngineStatus(params) {
        const check = this.checkToolEnabled("showEngineStatus");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.processTools.showEngineStatus(params);
    }
    async getServerInfo() {
        const check = this.checkToolEnabled("getServerInfo");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.processTools.getServerInfo();
    }
    async showBinaryLogs() {
        const check = this.checkToolEnabled("showBinaryLogs");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.processTools.showBinaryLogs();
    }
    async showReplicationStatus(params) {
        const check = this.checkToolEnabled("showReplicationStatus");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.processTools.showReplicationStatus(params);
    }
    // ==========================================
    // Performance Monitoring Tools
    // ==========================================
    async getPerformanceMetrics() {
        const check = this.checkToolEnabled("getPerformanceMetrics");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.performanceTools.getPerformanceMetrics();
    }
    async getTopQueriesByTime(params) {
        const check = this.checkToolEnabled("getTopQueriesByTime");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.performanceTools.getTopQueriesByTime(params);
    }
    async getTopQueriesByCount(params) {
        const check = this.checkToolEnabled("getTopQueriesByCount");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.performanceTools.getTopQueriesByCount(params);
    }
    async getSlowQueries(params) {
        const check = this.checkToolEnabled("getSlowQueries");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.performanceTools.getSlowQueries(params);
    }
    async getTableIOStats(params) {
        const check = this.checkToolEnabled("getTableIOStats");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.performanceTools.getTableIOStats(params);
    }
    async getIndexUsageStats(params) {
        const check = this.checkToolEnabled("getIndexUsageStats");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.performanceTools.getIndexUsageStats(params);
    }
    async getUnusedIndexes(params) {
        const check = this.checkToolEnabled("getUnusedIndexes");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.performanceTools.getUnusedIndexes(params);
    }
    async getConnectionPoolStats() {
        const check = this.checkToolEnabled("getConnectionPoolStats");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.performanceTools.getConnectionPoolStats();
    }
    async getDatabaseHealthCheck() {
        const check = this.checkToolEnabled("getDatabaseHealthCheck");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.performanceTools.getDatabaseHealthCheck();
    }
    async resetPerformanceStats() {
        const check = this.checkToolEnabled("resetPerformanceStats");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.performanceTools.resetPerformanceStats();
    }
    // ==========================================
    // PHASE 1: AI Enhancement Tools
    // ==========================================
    // Intelligent Query Assistant
    async buildQueryFromIntent(params) {
        const check = this.checkToolEnabled("buildQueryFromIntent");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.intelligentQueryTools.buildQueryFromIntent(params);
    }
    async suggestQueryImprovements(params) {
        const check = this.checkToolEnabled("suggestQueryImprovements");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.intelligentQueryTools.suggestQueryImprovements(params);
    }
    // Smart Data Discovery
    async smartSearch(params) {
        const check = this.checkToolEnabled("smartSearch");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.smartDiscoveryTools.smartSearch(params);
    }
    async findSimilarColumns(params) {
        const check = this.checkToolEnabled("findSimilarColumns");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.smartDiscoveryTools.findSimilarColumns(params);
    }
    async discoverDataPatterns(params) {
        const check = this.checkToolEnabled("discoverDataPatterns");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.smartDiscoveryTools.discoverDataPatterns(params);
    }
    // Documentation Generator
    async generateDocumentation(params) {
        const check = this.checkToolEnabled("generateDocumentation");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.documentationGeneratorTools.generateDocumentation(params);
    }
    async generateDataDictionary(params) {
        const check = this.checkToolEnabled("generateDataDictionary");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.documentationGeneratorTools.generateDataDictionary(params);
    }
    async generateBusinessGlossary(params) {
        const check = this.checkToolEnabled("generateBusinessGlossary");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.documentationGeneratorTools.generateBusinessGlossaryReport(params);
    }
    // ==========================================
    // PHASE 2: AI Enhancement Tools (Schema + Security + Indexing)
    // ==========================================
    async designSchemaFromRequirements(params) {
        const check = this.checkToolEnabled("designSchemaFromRequirements");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.schemaDesignTools.designSchemaFromRequirements(params);
    }
    async auditDatabaseSecurity(params) {
        const check = this.checkToolEnabled("auditDatabaseSecurity");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.securityAuditTools.auditDatabaseSecurity(params);
    }
    async recommendIndexes(params) {
        const check = this.checkToolEnabled("recommendIndexes");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.indexRecommendationTools.recommendIndexes(params);
    }
    // ==========================================
    // PHASE 3: AI Enhancement Tools (Data Gen + Patterns + Visualization + Forecasting)
    // ==========================================
    async generateTestData(params) {
        const check = this.checkToolEnabled("generateTestData");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.testDataTools.generateTestData(params);
    }
    async analyzeSchemaPatterns(params) {
        const check = this.checkToolEnabled("analyzeSchemaPatterns");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.schemaPatternTools.analyzeSchemaPatterns(params);
    }
    async visualizeQuery(params) {
        const check = this.checkToolEnabled("visualizeQuery");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.queryVisualizationTools.visualizeQuery(params);
    }
    async predictQueryPerformance(params) {
        const check = this.checkToolEnabled("predictQueryPerformance");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.forecastingTools.predictQueryPerformance(params);
    }
    async forecastDatabaseGrowth(params) {
        const check = this.checkToolEnabled("forecastDatabaseGrowth");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.forecastingTools.forecastDatabaseGrowth(params);
    }
    // Smart Query Builder Tools
    async startQueryBuilder(params) {
        const check = this.checkToolEnabled("startQueryBuilder");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.smartQueryBuilderTools.startQueryBuilder(params);
    }
    async addTablesToQuery(params) {
        const check = this.checkToolEnabled("addTablesToQuery");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.smartQueryBuilderTools.addTablesToQuery(params);
    }
    async defineJoins(params) {
        const check = this.checkToolEnabled("defineJoins");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.smartQueryBuilderTools.defineJoins(params);
    }
    async selectColumns(params) {
        const check = this.checkToolEnabled("selectColumns");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.smartQueryBuilderTools.selectColumns(params);
    }
    async addConditions(params) {
        const check = this.checkToolEnabled("addConditions");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.smartQueryBuilderTools.addConditions(params);
    }
    async addAggregations(params) {
        const check = this.checkToolEnabled("addAggregations");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.smartQueryBuilderTools.addAggregations(params);
    }
    async configureGroupingAndOrdering(params) {
        const check = this.checkToolEnabled("configureGroupingAndOrdering");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.smartQueryBuilderTools.configureGroupingAndOrdering(params);
    }
    async previewQuery(params) {
        const check = this.checkToolEnabled("previewQuery");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.smartQueryBuilderTools.previewQuery(params);
    }
    async executeQuery(params) {
        const check = this.checkToolEnabled("executeQuery");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.smartQueryBuilderTools.executeQuery(params);
    }
    async getSessionState(params) {
        const check = this.checkToolEnabled("getSessionState");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.smartQueryBuilderTools.getSessionState(params);
    }
    async getQueryTemplates(params) {
        const check = this.checkToolEnabled("getQueryTemplates");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.smartQueryBuilderTools.getQueryTemplates(params);
    }
    async applyQueryTemplate(params) {
        const check = this.checkToolEnabled("applyQueryTemplate");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.smartQueryBuilderTools.applyQueryTemplate(params);
    }
    async suggestNextStep(params) {
        const check = this.checkToolEnabled("suggestNextStep");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.smartQueryBuilderTools.suggestNextStep(params);
    }
    async endSession(params) {
        const check = this.checkToolEnabled("endSession");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.smartQueryBuilderTools.endSession(params);
    }
    // Full-Text Search Tools
    async createFulltextIndex(params) {
        const check = this.checkToolEnabled("createFulltextIndex");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.fulltextSearchTools.createFulltextIndex(params);
    }
    async fulltextSearch(params) {
        const check = this.checkToolEnabled("fulltextSearch");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.fulltextSearchTools.fulltextSearch(params);
    }
    async getFulltextInfo(params) {
        const check = this.checkToolEnabled("getFulltextInfo");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.fulltextSearchTools.getFulltextInfo(params);
    }
    async dropFulltextIndex(params) {
        const check = this.checkToolEnabled("dropFulltextIndex");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.fulltextSearchTools.dropFulltextIndex(params);
    }
    async getFulltextStats(params) {
        const check = this.checkToolEnabled("getFulltextStats");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.fulltextSearchTools.getFulltextStats(params);
    }
    async optimizeFulltext(params) {
        const check = this.checkToolEnabled("optimizeFulltext");
        if (!check.enabled)
            return { status: "error", error: check.error };
        return await this.fulltextSearchTools.optimizeFulltext(params);
    }
}
exports.MySQLMCP = MySQLMCP;
exports.default = MySQLMCP;
