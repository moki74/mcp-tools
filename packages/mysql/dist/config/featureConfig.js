"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureConfig = exports.FeatureConfig = exports.toolDocCategoryMap = exports.toolCategoryMap = exports.DocCategory = exports.ToolCategory = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
/**
 * Available MCP tool categories (Legacy - for backward compatibility)
 */
var ToolCategory;
(function (ToolCategory) {
    ToolCategory["LIST"] = "list";
    ToolCategory["READ"] = "read";
    ToolCategory["CREATE"] = "create";
    ToolCategory["UPDATE"] = "update";
    ToolCategory["DELETE"] = "delete";
    ToolCategory["EXECUTE"] = "execute";
    ToolCategory["DDL"] = "ddl";
    ToolCategory["UTILITY"] = "utility";
    ToolCategory["TRANSACTION"] = "transaction";
    ToolCategory["PROCEDURE"] = "procedure";
})(ToolCategory || (exports.ToolCategory = ToolCategory = {}));
/**
 * Documentation categories from README (21 categories)
 * More intuitive and matches user mental model
 */
var DocCategory;
(function (DocCategory) {
    DocCategory["DATABASE_DISCOVERY"] = "database_discovery";
    DocCategory["CRUD_OPERATIONS"] = "crud_operations";
    DocCategory["BULK_OPERATIONS"] = "bulk_operations";
    DocCategory["CUSTOM_QUERIES"] = "custom_queries";
    DocCategory["SCHEMA_MANAGEMENT"] = "schema_management";
    DocCategory["UTILITIES"] = "utilities";
    DocCategory["TRANSACTION_MANAGEMENT"] = "transaction_management";
    DocCategory["STORED_PROCEDURES"] = "stored_procedures";
    DocCategory["VIEWS_MANAGEMENT"] = "views_management";
    DocCategory["TRIGGERS_MANAGEMENT"] = "triggers_management";
    DocCategory["FUNCTIONS_MANAGEMENT"] = "functions_management";
    DocCategory["INDEX_MANAGEMENT"] = "index_management";
    DocCategory["CONSTRAINT_MANAGEMENT"] = "constraint_management";
    DocCategory["TABLE_MAINTENANCE"] = "table_maintenance";
    DocCategory["SERVER_MANAGEMENT"] = "server_management";
    DocCategory["PERFORMANCE_MONITORING"] = "performance_monitoring";
    DocCategory["CACHE_MANAGEMENT"] = "cache_management";
    DocCategory["QUERY_OPTIMIZATION"] = "query_optimization";
    DocCategory["BACKUP_RESTORE"] = "backup_restore";
    DocCategory["IMPORT_EXPORT"] = "import_export";
    DocCategory["DATA_MIGRATION"] = "data_migration";
    DocCategory["SCHEMA_MIGRATIONS"] = "schema_migrations";
    DocCategory["ANALYSIS"] = "analysis";
    DocCategory["AI_ENHANCEMENT"] = "ai_enhancement";
})(DocCategory || (exports.DocCategory = DocCategory = {}));
/**
 * Map of tool names to their legacy categories
 */
exports.toolCategoryMap = {
    // Database tools
    listDatabases: ToolCategory.LIST,
    listTables: ToolCategory.LIST,
    readTableSchema: ToolCategory.LIST,
    list_all_tools: ToolCategory.LIST,
    // Analysis tools (added here to group with database tools)
    getDatabaseSummary: ToolCategory.LIST,
    getSchemaERD: ToolCategory.LIST,
    getSchemaRagContext: ToolCategory.LIST,
    // CRUD tools
    createRecord: ToolCategory.CREATE,
    readRecords: ToolCategory.READ,
    updateRecord: ToolCategory.UPDATE,
    deleteRecord: ToolCategory.DELETE,
    // Analysis tools (added here to group with read tools)
    getColumnStatistics: ToolCategory.READ,
    // Bulk operations
    bulkInsert: ToolCategory.CREATE,
    bulkUpdate: ToolCategory.UPDATE,
    bulkDelete: ToolCategory.DELETE,
    // Query tools
    runSelectQuery: ToolCategory.READ,
    executeWriteQuery: ToolCategory.EXECUTE,
    // DDL tools
    createTable: ToolCategory.DDL,
    alterTable: ToolCategory.DDL,
    dropTable: ToolCategory.DDL,
    executeDdl: ToolCategory.DDL,
    // Utility tools
    describeConnection: ToolCategory.UTILITY,
    testConnection: ToolCategory.UTILITY,
    getTableRelationships: ToolCategory.UTILITY,
    getAllTablesRelationships: ToolCategory.UTILITY,
    exportTableToCSV: ToolCategory.UTILITY,
    exportQueryToCSV: ToolCategory.UTILITY,
    safe_export_table: ToolCategory.UTILITY,
    read_changelog: ToolCategory.UTILITY,
    // Transaction tools
    beginTransaction: ToolCategory.TRANSACTION,
    commitTransaction: ToolCategory.TRANSACTION,
    rollbackTransaction: ToolCategory.TRANSACTION,
    getTransactionStatus: ToolCategory.TRANSACTION,
    executeInTransaction: ToolCategory.TRANSACTION,
    // Stored procedure tools
    listStoredProcedures: ToolCategory.LIST,
    getStoredProcedureInfo: ToolCategory.LIST,
    executeStoredProcedure: ToolCategory.PROCEDURE,
    createStoredProcedure: ToolCategory.PROCEDURE,
    dropStoredProcedure: ToolCategory.PROCEDURE,
    showCreateProcedure: ToolCategory.LIST,
    // Cache management tools
    getCacheStats: ToolCategory.UTILITY,
    getCacheConfig: ToolCategory.UTILITY,
    configureCacheSettings: ToolCategory.UTILITY,
    clearCache: ToolCategory.UTILITY,
    invalidateCacheForTable: ToolCategory.UTILITY,
    // Query optimization tools
    analyzeQuery: ToolCategory.UTILITY,
    getOptimizationHints: ToolCategory.UTILITY,
    // View tools
    listViews: ToolCategory.LIST,
    getViewInfo: ToolCategory.LIST,
    createView: ToolCategory.DDL,
    alterView: ToolCategory.DDL,
    dropView: ToolCategory.DDL,
    showCreateView: ToolCategory.LIST,
    // Trigger tools
    listTriggers: ToolCategory.LIST,
    getTriggerInfo: ToolCategory.LIST,
    createTrigger: ToolCategory.DDL,
    dropTrigger: ToolCategory.DDL,
    showCreateTrigger: ToolCategory.LIST,
    // Function tools
    listFunctions: ToolCategory.LIST,
    getFunctionInfo: ToolCategory.LIST,
    createFunction: ToolCategory.PROCEDURE,
    dropFunction: ToolCategory.PROCEDURE,
    showCreateFunction: ToolCategory.LIST,
    executeFunction: ToolCategory.PROCEDURE,
    // Index tools
    listIndexes: ToolCategory.LIST,
    getIndexInfo: ToolCategory.LIST,
    createIndex: ToolCategory.DDL,
    dropIndex: ToolCategory.DDL,
    analyzeIndex: ToolCategory.UTILITY,
    // Constraint tools
    listForeignKeys: ToolCategory.LIST,
    listConstraints: ToolCategory.LIST,
    addForeignKey: ToolCategory.DDL,
    dropForeignKey: ToolCategory.DDL,
    addUniqueConstraint: ToolCategory.DDL,
    dropConstraint: ToolCategory.DDL,
    addCheckConstraint: ToolCategory.DDL,
    // Table maintenance tools
    analyzeTable: ToolCategory.UTILITY,
    optimizeTable: ToolCategory.UTILITY,
    checkTable: ToolCategory.UTILITY,
    repairTable: ToolCategory.UTILITY,
    truncateTable: ToolCategory.DDL,
    getTableStatus: ToolCategory.LIST,
    flushTable: ToolCategory.UTILITY,
    getTableSize: ToolCategory.LIST,
    // Process and server management tools
    showProcessList: ToolCategory.LIST,
    killProcess: ToolCategory.EXECUTE,
    showStatus: ToolCategory.LIST,
    showVariables: ToolCategory.LIST,
    explainQuery: ToolCategory.UTILITY,
    showEngineStatus: ToolCategory.LIST,
    getServerInfo: ToolCategory.LIST,
    showBinaryLogs: ToolCategory.LIST,
    showReplicationStatus: ToolCategory.LIST,
    // Backup and restore tools
    backupTable: ToolCategory.UTILITY,
    cloneTable: ToolCategory.DDL,
    compareTableStructure: ToolCategory.LIST,
    syncTableData: ToolCategory.UPDATE,
    // Schema versioning and migrations tools
    initMigrationsTable: ToolCategory.DDL,
    createMigration: ToolCategory.DDL,
    applyMigrations: ToolCategory.DDL,
    rollbackMigration: ToolCategory.DDL,
    getMigrationStatus: ToolCategory.LIST,
    getSchemaVersion: ToolCategory.LIST,
    validateMigrations: ToolCategory.LIST,
    resetFailedMigration: ToolCategory.DDL,
    generateMigrationFromDiff: ToolCategory.DDL,
    // Analysis tools - MOVED here to avoid duplication
    // Note: keys must be unique in the object literal
    // Performance monitoring tools
    getPerformanceMetrics: ToolCategory.UTILITY,
    getTopQueriesByTime: ToolCategory.UTILITY,
    getTopQueriesByCount: ToolCategory.UTILITY,
    getSlowQueries: ToolCategory.UTILITY,
    getTableIOStats: ToolCategory.UTILITY,
    getIndexUsageStats: ToolCategory.UTILITY,
    getUnusedIndexes: ToolCategory.UTILITY,
    getConnectionPoolStats: ToolCategory.UTILITY,
    getDatabaseHealthCheck: ToolCategory.UTILITY,
    resetPerformanceStats: ToolCategory.UTILITY,
    // Phase 1: AI Enhancement Tools
    buildQueryFromIntent: ToolCategory.READ,
    suggestQueryImprovements: ToolCategory.UTILITY,
    smartSearch: ToolCategory.LIST,
    findSimilarColumns: ToolCategory.LIST,
    discoverDataPatterns: ToolCategory.READ,
    generateDocumentation: ToolCategory.UTILITY,
    generateDataDictionary: ToolCategory.UTILITY,
    generateBusinessGlossary: ToolCategory.UTILITY,
    // Phase 2: AI Enhancement Tools
    designSchemaFromRequirements: ToolCategory.UTILITY,
    auditDatabaseSecurity: ToolCategory.UTILITY,
    recommendIndexes: ToolCategory.UTILITY,
    // Phase 3: AI Enhancement Tools
    generateTestData: ToolCategory.UTILITY,
    analyzeSchemaPatterns: ToolCategory.UTILITY,
    visualizeQuery: ToolCategory.UTILITY,
    predictQueryPerformance: ToolCategory.UTILITY,
    forecastDatabaseGrowth: ToolCategory.UTILITY,
    // Full-Text Search Tools
    createFulltextIndex: ToolCategory.DDL,
    fulltextSearch: ToolCategory.READ,
    getFulltextInfo: ToolCategory.LIST,
    dropFulltextIndex: ToolCategory.DDL,
    getFulltextStats: ToolCategory.LIST,
    optimizeFulltext: ToolCategory.UTILITY,
};
/**
 * Map of tool names to their documentation categories (New Enhanced System)
 */
exports.toolDocCategoryMap = {
    // Database Discovery
    listDatabases: DocCategory.DATABASE_DISCOVERY,
    listTables: DocCategory.DATABASE_DISCOVERY,
    readTableSchema: DocCategory.DATABASE_DISCOVERY,
    getTableRelationships: DocCategory.DATABASE_DISCOVERY,
    getAllTablesRelationships: DocCategory.DATABASE_DISCOVERY,
    // CRUD Operations
    createRecord: DocCategory.CRUD_OPERATIONS,
    readRecords: DocCategory.CRUD_OPERATIONS,
    updateRecord: DocCategory.CRUD_OPERATIONS,
    deleteRecord: DocCategory.CRUD_OPERATIONS,
    // Bulk Operations
    bulkInsert: DocCategory.BULK_OPERATIONS,
    bulkUpdate: DocCategory.BULK_OPERATIONS,
    bulkDelete: DocCategory.BULK_OPERATIONS,
    // Custom Queries
    runSelectQuery: DocCategory.CUSTOM_QUERIES,
    executeWriteQuery: DocCategory.CUSTOM_QUERIES,
    // Schema Management (DDL)
    createTable: DocCategory.SCHEMA_MANAGEMENT,
    alterTable: DocCategory.SCHEMA_MANAGEMENT,
    dropTable: DocCategory.SCHEMA_MANAGEMENT,
    executeDdl: DocCategory.SCHEMA_MANAGEMENT,
    // Utilities
    testConnection: DocCategory.UTILITIES,
    describeConnection: DocCategory.UTILITIES,
    exportTableToCSV: DocCategory.UTILITIES,
    exportQueryToCSV: DocCategory.UTILITIES,
    read_changelog: DocCategory.UTILITIES,
    list_all_tools: DocCategory.UTILITIES,
    // Transaction Management
    beginTransaction: DocCategory.TRANSACTION_MANAGEMENT,
    commitTransaction: DocCategory.TRANSACTION_MANAGEMENT,
    rollbackTransaction: DocCategory.TRANSACTION_MANAGEMENT,
    getTransactionStatus: DocCategory.TRANSACTION_MANAGEMENT,
    executeInTransaction: DocCategory.TRANSACTION_MANAGEMENT,
    // Stored Procedures
    listStoredProcedures: DocCategory.STORED_PROCEDURES,
    getStoredProcedureInfo: DocCategory.STORED_PROCEDURES,
    executeStoredProcedure: DocCategory.STORED_PROCEDURES,
    createStoredProcedure: DocCategory.STORED_PROCEDURES,
    dropStoredProcedure: DocCategory.STORED_PROCEDURES,
    showCreateProcedure: DocCategory.STORED_PROCEDURES,
    // Views Management
    listViews: DocCategory.VIEWS_MANAGEMENT,
    getViewInfo: DocCategory.VIEWS_MANAGEMENT,
    createView: DocCategory.VIEWS_MANAGEMENT,
    alterView: DocCategory.VIEWS_MANAGEMENT,
    dropView: DocCategory.VIEWS_MANAGEMENT,
    showCreateView: DocCategory.VIEWS_MANAGEMENT,
    // Triggers Management
    listTriggers: DocCategory.TRIGGERS_MANAGEMENT,
    getTriggerInfo: DocCategory.TRIGGERS_MANAGEMENT,
    createTrigger: DocCategory.TRIGGERS_MANAGEMENT,
    dropTrigger: DocCategory.TRIGGERS_MANAGEMENT,
    showCreateTrigger: DocCategory.TRIGGERS_MANAGEMENT,
    // Functions Management
    listFunctions: DocCategory.FUNCTIONS_MANAGEMENT,
    getFunctionInfo: DocCategory.FUNCTIONS_MANAGEMENT,
    createFunction: DocCategory.FUNCTIONS_MANAGEMENT,
    dropFunction: DocCategory.FUNCTIONS_MANAGEMENT,
    showCreateFunction: DocCategory.FUNCTIONS_MANAGEMENT,
    executeFunction: DocCategory.FUNCTIONS_MANAGEMENT,
    // Index Management
    listIndexes: DocCategory.INDEX_MANAGEMENT,
    getIndexInfo: DocCategory.INDEX_MANAGEMENT,
    createIndex: DocCategory.INDEX_MANAGEMENT,
    dropIndex: DocCategory.INDEX_MANAGEMENT,
    analyzeIndex: DocCategory.INDEX_MANAGEMENT,
    // Constraint Management
    listForeignKeys: DocCategory.CONSTRAINT_MANAGEMENT,
    listConstraints: DocCategory.CONSTRAINT_MANAGEMENT,
    addForeignKey: DocCategory.CONSTRAINT_MANAGEMENT,
    dropForeignKey: DocCategory.CONSTRAINT_MANAGEMENT,
    addUniqueConstraint: DocCategory.CONSTRAINT_MANAGEMENT,
    dropConstraint: DocCategory.CONSTRAINT_MANAGEMENT,
    addCheckConstraint: DocCategory.CONSTRAINT_MANAGEMENT,
    // Table Maintenance
    analyzeTable: DocCategory.TABLE_MAINTENANCE,
    optimizeTable: DocCategory.TABLE_MAINTENANCE,
    checkTable: DocCategory.TABLE_MAINTENANCE,
    repairTable: DocCategory.TABLE_MAINTENANCE,
    truncateTable: DocCategory.TABLE_MAINTENANCE,
    getTableStatus: DocCategory.TABLE_MAINTENANCE,
    flushTable: DocCategory.TABLE_MAINTENANCE,
    getTableSize: DocCategory.TABLE_MAINTENANCE,
    // Server Management
    showProcessList: DocCategory.SERVER_MANAGEMENT,
    killProcess: DocCategory.SERVER_MANAGEMENT,
    showStatus: DocCategory.SERVER_MANAGEMENT,
    showVariables: DocCategory.SERVER_MANAGEMENT,
    explainQuery: DocCategory.SERVER_MANAGEMENT,
    showEngineStatus: DocCategory.SERVER_MANAGEMENT,
    getServerInfo: DocCategory.SERVER_MANAGEMENT,
    showBinaryLogs: DocCategory.SERVER_MANAGEMENT,
    showReplicationStatus: DocCategory.SERVER_MANAGEMENT,
    // Performance Monitoring
    getPerformanceMetrics: DocCategory.PERFORMANCE_MONITORING,
    getTopQueriesByTime: DocCategory.PERFORMANCE_MONITORING,
    getTopQueriesByCount: DocCategory.PERFORMANCE_MONITORING,
    getSlowQueries: DocCategory.PERFORMANCE_MONITORING,
    getTableIOStats: DocCategory.PERFORMANCE_MONITORING,
    getIndexUsageStats: DocCategory.PERFORMANCE_MONITORING,
    getUnusedIndexes: DocCategory.PERFORMANCE_MONITORING,
    getConnectionPoolStats: DocCategory.PERFORMANCE_MONITORING,
    getDatabaseHealthCheck: DocCategory.PERFORMANCE_MONITORING,
    resetPerformanceStats: DocCategory.PERFORMANCE_MONITORING,
    // Cache Management
    getCacheStats: DocCategory.CACHE_MANAGEMENT,
    getCacheConfig: DocCategory.CACHE_MANAGEMENT,
    configureCacheSettings: DocCategory.CACHE_MANAGEMENT,
    clearCache: DocCategory.CACHE_MANAGEMENT,
    invalidateCacheForTable: DocCategory.CACHE_MANAGEMENT,
    // Query Optimization
    analyzeQuery: DocCategory.QUERY_OPTIMIZATION,
    getOptimizationHints: DocCategory.QUERY_OPTIMIZATION,
    // Backup & Restore
    backupTable: DocCategory.BACKUP_RESTORE,
    backupDatabase: DocCategory.BACKUP_RESTORE,
    restoreFromSql: DocCategory.BACKUP_RESTORE,
    getCreateTableStatement: DocCategory.BACKUP_RESTORE,
    getDatabaseSchema: DocCategory.BACKUP_RESTORE,
    // Import/Export
    exportTableToJSON: DocCategory.IMPORT_EXPORT,
    exportQueryToJSON: DocCategory.IMPORT_EXPORT,
    exportTableToSql: DocCategory.IMPORT_EXPORT,
    safe_export_table: DocCategory.IMPORT_EXPORT,
    importFromCSV: DocCategory.IMPORT_EXPORT,
    importFromJSON: DocCategory.IMPORT_EXPORT,
    // Data Migration
    copyTableData: DocCategory.DATA_MIGRATION,
    moveTableData: DocCategory.DATA_MIGRATION,
    cloneTable: DocCategory.DATA_MIGRATION,
    compareTableStructure: DocCategory.DATA_MIGRATION,
    syncTableData: DocCategory.DATA_MIGRATION,
    // Schema Migrations
    initMigrationsTable: DocCategory.SCHEMA_MIGRATIONS,
    createMigration: DocCategory.SCHEMA_MIGRATIONS,
    applyMigrations: DocCategory.SCHEMA_MIGRATIONS,
    rollbackMigration: DocCategory.SCHEMA_MIGRATIONS,
    getMigrationStatus: DocCategory.SCHEMA_MIGRATIONS,
    getSchemaVersion: DocCategory.SCHEMA_MIGRATIONS,
    validateMigrations: DocCategory.SCHEMA_MIGRATIONS,
    resetFailedMigration: DocCategory.SCHEMA_MIGRATIONS,
    generateMigrationFromDiff: DocCategory.SCHEMA_MIGRATIONS,
    // Analysis
    getDatabaseSummary: DocCategory.ANALYSIS,
    getSchemaERD: DocCategory.ANALYSIS,
    getColumnStatistics: DocCategory.ANALYSIS,
    getSchemaRagContext: DocCategory.ANALYSIS,
    // Phase 1: AI Enhancement
    buildQueryFromIntent: DocCategory.AI_ENHANCEMENT,
    suggestQueryImprovements: DocCategory.AI_ENHANCEMENT,
    smartSearch: DocCategory.AI_ENHANCEMENT,
    findSimilarColumns: DocCategory.AI_ENHANCEMENT,
    discoverDataPatterns: DocCategory.AI_ENHANCEMENT,
    generateDocumentation: DocCategory.AI_ENHANCEMENT,
    generateDataDictionary: DocCategory.AI_ENHANCEMENT,
    generateBusinessGlossary: DocCategory.AI_ENHANCEMENT,
    // Phase 2: AI Enhancement
    designSchemaFromRequirements: DocCategory.AI_ENHANCEMENT,
    auditDatabaseSecurity: DocCategory.AI_ENHANCEMENT,
    recommendIndexes: DocCategory.AI_ENHANCEMENT,
    // Phase 3: AI Enhancement
    generateTestData: DocCategory.AI_ENHANCEMENT,
    analyzeSchemaPatterns: DocCategory.AI_ENHANCEMENT,
    visualizeQuery: DocCategory.AI_ENHANCEMENT,
    predictQueryPerformance: DocCategory.AI_ENHANCEMENT,
    forecastDatabaseGrowth: DocCategory.AI_ENHANCEMENT,
    // Full-Text Search
    createFulltextIndex: DocCategory.INDEX_MANAGEMENT,
    fulltextSearch: DocCategory.INDEX_MANAGEMENT,
    getFulltextInfo: DocCategory.INDEX_MANAGEMENT,
    dropFulltextIndex: DocCategory.INDEX_MANAGEMENT,
    getFulltextStats: DocCategory.INDEX_MANAGEMENT,
    optimizeFulltext: DocCategory.INDEX_MANAGEMENT,
};
/**
 * Mapping between legacy categories and documentation categories
 * This allows backward compatibility
 */
const legacyToDocCategoryMap = {
    list: [
        DocCategory.DATABASE_DISCOVERY,
        DocCategory.STORED_PROCEDURES,
        DocCategory.VIEWS_MANAGEMENT,
        DocCategory.TRIGGERS_MANAGEMENT,
        DocCategory.FUNCTIONS_MANAGEMENT,
        DocCategory.INDEX_MANAGEMENT,
        DocCategory.CONSTRAINT_MANAGEMENT,
        DocCategory.TABLE_MAINTENANCE,
        DocCategory.SERVER_MANAGEMENT,
        DocCategory.SCHEMA_MIGRATIONS,
        DocCategory.ANALYSIS,
        DocCategory.UTILITIES,
    ],
    read: [DocCategory.CRUD_OPERATIONS, DocCategory.CUSTOM_QUERIES, DocCategory.ANALYSIS],
    create: [
        DocCategory.CRUD_OPERATIONS,
        DocCategory.BULK_OPERATIONS,
        DocCategory.IMPORT_EXPORT,
        DocCategory.DATA_MIGRATION,
    ],
    update: [
        DocCategory.CRUD_OPERATIONS,
        DocCategory.BULK_OPERATIONS,
        DocCategory.DATA_MIGRATION,
    ],
    delete: [
        DocCategory.CRUD_OPERATIONS,
        DocCategory.BULK_OPERATIONS,
        DocCategory.DATA_MIGRATION,
    ],
    execute: [DocCategory.CUSTOM_QUERIES, DocCategory.SERVER_MANAGEMENT],
    ddl: [
        DocCategory.SCHEMA_MANAGEMENT,
        DocCategory.VIEWS_MANAGEMENT,
        DocCategory.TRIGGERS_MANAGEMENT,
        DocCategory.INDEX_MANAGEMENT,
        DocCategory.CONSTRAINT_MANAGEMENT,
        DocCategory.TABLE_MAINTENANCE,
        DocCategory.BACKUP_RESTORE,
        DocCategory.DATA_MIGRATION,
        DocCategory.SCHEMA_MIGRATIONS,
    ],
    utility: [
        DocCategory.UTILITIES,
        DocCategory.TABLE_MAINTENANCE,
        DocCategory.PERFORMANCE_MONITORING,
        DocCategory.CACHE_MANAGEMENT,
        DocCategory.QUERY_OPTIMIZATION,
        DocCategory.BACKUP_RESTORE,
        DocCategory.IMPORT_EXPORT,
    ],
    transaction: [DocCategory.TRANSACTION_MANAGEMENT],
    procedure: [DocCategory.STORED_PROCEDURES, DocCategory.FUNCTIONS_MANAGEMENT],
};
/**
 * Class to manage feature configuration based on runtime or environment variables
 * Supports dual-layer filtering:
 * - Layer 1 (Permissions): Legacy categories (broad control)
 * - Layer 2 (Categories): Documentation categories (fine-grained control, optional)
 */
class FeatureConfig {
    constructor(permissionsStr, categoriesStr) {
        // Support both old single-parameter and new dual-parameter signatures
        const permissionsInput = permissionsStr ||
            process.env.MCP_PERMISSIONS ||
            process.env.MCP_CONFIG ||
            "";
        const categoriesInput = categoriesStr || process.env.MCP_CATEGORIES || "";
        const mergedPermissions = this.mergeConfigStrings("", permissionsInput);
        const mergedCategories = this.mergeConfigStrings("", categoriesInput);
        this.originalPermissionsString = mergedPermissions;
        this.originalCategoriesString = mergedCategories;
        this.useDualLayer = !!mergedCategories.trim();
        const parsed = this.parseConfig(mergedPermissions, mergedCategories);
        this.enabledLegacyCategories = parsed.legacy;
        this.enabledDocCategories = parsed.doc;
    }
    /**
     * Normalize and merge preset + user-supplied configuration lists
     */
    mergeConfigStrings(base, override) {
        const items = [...(base || "").split(","), ...(override || "").split(",")]
            .map((c) => c.trim().toLowerCase())
            .filter(Boolean);
        return Array.from(new Set(items)).join(",");
    }
    /**
     * Parse permissions and categories for dual-layer filtering
     * Layer 1 (permissions): Broad control using legacy categories
     * Layer 2 (categories): Fine-grained control using documentation categories (optional)
     */
    parseConfig(permissionsStr, categoriesStr) {
        // If both are empty, enable all features
        if (!permissionsStr.trim() && !categoriesStr.trim()) {
            return {
                legacy: new Set(Object.values(ToolCategory)),
                doc: new Set(Object.values(DocCategory)),
            };
        }
        // Parse Layer 1: Permissions (legacy categories)
        let legacySet = new Set();
        if (permissionsStr.trim()) {
            const items = permissionsStr
                .split(",")
                .map((c) => c.trim().toLowerCase());
            const validLegacyCategories = items.filter((c) => Object.values(ToolCategory).includes(c));
            legacySet = new Set(validLegacyCategories);
        }
        else {
            // If no permissions specified but categories are, allow all permissions
            legacySet = new Set(Object.values(ToolCategory));
        }
        // Parse Layer 2: Categories (documentation categories)
        let docSet = new Set();
        if (categoriesStr.trim()) {
            // Categories specified - use them for fine-grained filtering
            const items = categoriesStr.split(",").map((c) => c.trim().toLowerCase());
            const validDocCategories = items.filter((c) => Object.values(DocCategory).includes(c));
            docSet = new Set(validDocCategories);
        }
        else {
            // No categories specified - derive from permissions
            legacySet.forEach((legacyCat) => {
                const docCats = legacyToDocCategoryMap[legacyCat] || [];
                docCats.forEach((dc) => docSet.add(dc));
            });
        }
        return {
            legacy: legacySet,
            doc: docSet,
        };
    }
    /**
     * Update configuration at runtime
     */
    setConfig(permissionsStr, categoriesStr) {
        const mergedPermissions = this.mergeConfigStrings("", permissionsStr);
        const mergedCategories = this.mergeConfigStrings("", categoriesStr || "");
        this.originalPermissionsString = mergedPermissions;
        this.originalCategoriesString = mergedCategories;
        this.useDualLayer = !!(mergedCategories && mergedCategories.trim());
        const parsed = this.parseConfig(mergedPermissions, mergedCategories || "");
        this.enabledLegacyCategories = parsed.legacy;
        this.enabledDocCategories = parsed.doc;
    }
    /**
     * Check if a specific tool is enabled
     * Dual-layer logic:
     * - Layer 1 (Permission): Tool must be allowed by its legacy category
     * - Layer 2 (Category): If categories specified, tool must also be in allowed doc category
     */
    isToolEnabled(toolName) {
        const docCategory = exports.toolDocCategoryMap[toolName];
        const legacyCategory = exports.toolCategoryMap[toolName];
        // If tool is not in either map, default to disabled
        if (!docCategory && !legacyCategory) {
            console.warn(`Unknown tool: ${toolName}`);
            return false;
        }
        // Layer 1: Check permission (legacy category)
        const hasPermission = legacyCategory
            ? this.enabledLegacyCategories.has(legacyCategory)
            : false;
        if (!hasPermission) {
            return false;
        }
        // Layer 2: Check category (documentation category) if dual-layer mode
        if (this.useDualLayer) {
            const hasCategory = docCategory
                ? this.enabledDocCategories.has(docCategory)
                : false;
            return hasCategory;
        }
        // Single-layer mode: permission is sufficient
        return true;
    }
    /**
     * Get detailed permission error message for a specific tool
     */
    getPermissionError(toolName) {
        const docCategory = exports.toolDocCategoryMap[toolName];
        const legacyCategory = exports.toolCategoryMap[toolName];
        if (!docCategory && !legacyCategory) {
            return `Unknown tool '${toolName}'. This tool is not recognized by the MCP server.`;
        }
        const isAllEnabled = !this.originalPermissionsString.trim() &&
            !this.originalCategoriesString.trim();
        if (isAllEnabled) {
            return `Unknown error: All tools should be enabled but '${toolName}' was blocked.`;
        }
        // Build error message based on dual-layer or single-layer mode
        if (this.useDualLayer) {
            const hasPermission = legacyCategory
                ? this.enabledLegacyCategories.has(legacyCategory)
                : false;
            const hasCategory = docCategory
                ? this.enabledDocCategories.has(docCategory)
                : false;
            if (!hasPermission) {
                return (`Permission denied: This tool requires '${legacyCategory}' permission (Layer 1). ` +
                    `Your current permissions: ${this.originalPermissionsString || "none"}. ` +
                    `Add '${legacyCategory}' to the permissions argument.`);
            }
            if (!hasCategory) {
                return (`Permission denied: This tool requires '${docCategory}' category (Layer 2). ` +
                    `Your current categories: ${this.originalCategoriesString || "none"}. ` +
                    `Add '${docCategory}' to the categories argument.`);
            }
        }
        else {
            // Single-layer mode
            return (`Permission denied: This tool requires '${legacyCategory}' permission. ` +
                `Your current configuration allows: ${this.originalPermissionsString || "all"}. ` +
                `Add '${legacyCategory}' to enable this tool.`);
        }
        return `Permission denied for tool '${toolName}'.`;
    }
    /**
     * Check if a legacy category is enabled
     */
    isCategoryEnabled(category) {
        return this.enabledLegacyCategories.has(category);
    }
    /**
     * Check if a documentation category is enabled
     */
    isDocCategoryEnabled(category) {
        return this.enabledDocCategories.has(category);
    }
    /**
     * Get all enabled legacy categories
     */
    getEnabledCategories() {
        return Array.from(this.enabledLegacyCategories);
    }
    /**
     * Get all enabled documentation categories
     */
    getEnabledDocCategories() {
        return Array.from(this.enabledDocCategories);
    }
    /**
     * Get all available categories with their status
     */
    getCategoryStatus() {
        const result = {};
        for (const category of Object.values(ToolCategory)) {
            result[category] = this.enabledLegacyCategories.has(category);
        }
        return result;
    }
    /**
     * Get all available documentation categories with their status
     */
    getDocCategoryStatus() {
        const result = {};
        for (const category of Object.values(DocCategory)) {
            result[category] = this.enabledDocCategories.has(category);
        }
        return result;
    }
    /**
     * Check if using dual-layer filtering mode
     */
    isUsingDualLayer() {
        return this.useDualLayer;
    }
    /**
     * Snapshot of the resolved configuration for logging/telemetry
     */
    getConfigSnapshot() {
        return {
            permissions: this.originalPermissionsString || "all",
            categories: this.originalCategoriesString ||
                (this.useDualLayer ? "" : "derived from permissions"),
            filteringMode: this.getFilteringMode(),
            enabledLegacy: this.getEnabledCategories(),
            enabledDoc: this.getEnabledDocCategories(),
        };
    }
    /**
     * Get filtering mode description
     */
    getFilteringMode() {
        if (!this.originalPermissionsString.trim() &&
            !this.originalCategoriesString.trim()) {
            return "No filtering (all tools enabled)";
        }
        if (this.useDualLayer) {
            return "Dual-layer (Permissions + Categories)";
        }
        return "Single-layer (Permissions only)";
    }
}
exports.FeatureConfig = FeatureConfig;
// Export singleton instance
exports.featureConfig = new FeatureConfig();
