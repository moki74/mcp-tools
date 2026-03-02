/**
 * Available MCP tool categories (Legacy - for backward compatibility)
 */
export declare enum ToolCategory {
    LIST = "list",// List databases, tables, etc.
    READ = "read",// Read/select data from tables
    CREATE = "create",// Insert new records
    UPDATE = "update",// Update existing records
    DELETE = "delete",// Delete records
    EXECUTE = "execute",// Execute custom SQL
    DDL = "ddl",// Data Definition Language (CREATE/ALTER/DROP tables)
    UTILITY = "utility",// Utility functions like connection testing
    TRANSACTION = "transaction",// Transaction management (BEGIN, COMMIT, ROLLBACK)
    PROCEDURE = "procedure"
}
/**
 * Documentation categories from README (21 categories)
 * More intuitive and matches user mental model
 */
export declare enum DocCategory {
    DATABASE_DISCOVERY = "database_discovery",
    CRUD_OPERATIONS = "crud_operations",
    BULK_OPERATIONS = "bulk_operations",
    CUSTOM_QUERIES = "custom_queries",
    SCHEMA_MANAGEMENT = "schema_management",
    UTILITIES = "utilities",
    TRANSACTION_MANAGEMENT = "transaction_management",
    STORED_PROCEDURES = "stored_procedures",
    VIEWS_MANAGEMENT = "views_management",
    TRIGGERS_MANAGEMENT = "triggers_management",
    FUNCTIONS_MANAGEMENT = "functions_management",
    INDEX_MANAGEMENT = "index_management",
    CONSTRAINT_MANAGEMENT = "constraint_management",
    TABLE_MAINTENANCE = "table_maintenance",
    SERVER_MANAGEMENT = "server_management",
    PERFORMANCE_MONITORING = "performance_monitoring",
    CACHE_MANAGEMENT = "cache_management",
    QUERY_OPTIMIZATION = "query_optimization",
    BACKUP_RESTORE = "backup_restore",
    IMPORT_EXPORT = "import_export",
    DATA_MIGRATION = "data_migration",
    SCHEMA_MIGRATIONS = "schema_migrations",
    ANALYSIS = "analysis",
    AI_ENHANCEMENT = "ai_enhancement"
}
/**
 * Map of tool names to their legacy categories
 */
export declare const toolCategoryMap: Record<string, ToolCategory>;
/**
 * Map of tool names to their documentation categories (New Enhanced System)
 */
export declare const toolDocCategoryMap: Record<string, DocCategory>;
/**
 * Class to manage feature configuration based on runtime or environment variables
 * Supports dual-layer filtering:
 * - Layer 1 (Permissions): Legacy categories (broad control)
 * - Layer 2 (Categories): Documentation categories (fine-grained control, optional)
 */
export declare class FeatureConfig {
    private enabledLegacyCategories;
    private enabledDocCategories;
    private originalPermissionsString;
    private originalCategoriesString;
    private useDualLayer;
    constructor(permissionsStr?: string, categoriesStr?: string);
    /**
     * Normalize and merge preset + user-supplied configuration lists
     */
    private mergeConfigStrings;
    /**
     * Parse permissions and categories for dual-layer filtering
     * Layer 1 (permissions): Broad control using legacy categories
     * Layer 2 (categories): Fine-grained control using documentation categories (optional)
     */
    private parseConfig;
    /**
     * Update configuration at runtime
     */
    setConfig(permissionsStr: string, categoriesStr?: string): void;
    /**
     * Check if a specific tool is enabled
     * Dual-layer logic:
     * - Layer 1 (Permission): Tool must be allowed by its legacy category
     * - Layer 2 (Category): If categories specified, tool must also be in allowed doc category
     */
    isToolEnabled(toolName: string): boolean;
    /**
     * Get detailed permission error message for a specific tool
     */
    getPermissionError(toolName: string): string;
    /**
     * Check if a legacy category is enabled
     */
    isCategoryEnabled(category: ToolCategory): boolean;
    /**
     * Check if a documentation category is enabled
     */
    isDocCategoryEnabled(category: DocCategory): boolean;
    /**
     * Get all enabled legacy categories
     */
    getEnabledCategories(): ToolCategory[];
    /**
     * Get all enabled documentation categories
     */
    getEnabledDocCategories(): DocCategory[];
    /**
     * Get all available categories with their status
     */
    getCategoryStatus(): Record<ToolCategory, boolean>;
    /**
     * Get all available documentation categories with their status
     */
    getDocCategoryStatus(): Record<DocCategory, boolean>;
    /**
     * Check if using dual-layer filtering mode
     */
    isUsingDualLayer(): boolean;
    /**
     * Snapshot of the resolved configuration for logging/telemetry
     */
    getConfigSnapshot(): {
        permissions: string;
        categories: string;
        filteringMode: string;
        enabledLegacy: ToolCategory[];
        enabledDoc: DocCategory[];
    };
    /**
     * Get filtering mode description
     */
    getFilteringMode(): string;
}
export declare const featureConfig: FeatureConfig;
