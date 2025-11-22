import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Available MCP tool categories
 */
export enum ToolCategory {
  LIST = "list", // List databases, tables, etc.
  READ = "read", // Read/select data from tables
  CREATE = "create", // Insert new records
  UPDATE = "update", // Update existing records
  DELETE = "delete", // Delete records
  EXECUTE = "execute", // Execute custom SQL
  DDL = "ddl", // Data Definition Language (CREATE/ALTER/DROP tables)
  UTILITY = "utility", // Utility functions like connection testing
  TRANSACTION = "transaction", // Transaction management (BEGIN, COMMIT, ROLLBACK)
  PROCEDURE = "procedure", // Stored procedure operations (CREATE, EXECUTE, DROP procedures)
}

/**
 * Map of tool names to their categories
 */
export const toolCategoryMap: Record<string, ToolCategory> = {
  // Database tools
  listDatabases: ToolCategory.LIST,
  listTables: ToolCategory.LIST,
  readTableSchema: ToolCategory.LIST,

  // CRUD tools
  createRecord: ToolCategory.CREATE,
  readRecords: ToolCategory.READ,
  updateRecord: ToolCategory.UPDATE,
  deleteRecord: ToolCategory.DELETE,

  // Bulk operations
  bulkInsert: ToolCategory.CREATE,
  bulkUpdate: ToolCategory.UPDATE,
  bulkDelete: ToolCategory.DELETE,

  // Query tools
  runQuery: ToolCategory.READ,
  executeSql: ToolCategory.EXECUTE,

  // DDL tools
  createTable: ToolCategory.DDL,
  alterTable: ToolCategory.DDL,
  dropTable: ToolCategory.DDL,
  executeDdl: ToolCategory.DDL,

  // Utility tools
  describeConnection: ToolCategory.UTILITY,
  testConnection: ToolCategory.UTILITY,
  getTableRelationships: ToolCategory.UTILITY,
  exportTableToCSV: ToolCategory.UTILITY,
  exportQueryToCSV: ToolCategory.UTILITY,

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
};

/**
 * Class to manage feature configuration based on runtime or environment variables
 */
export class FeatureConfig {
  private enabledCategories: Set<ToolCategory>;
  private originalConfigString: string;

  constructor(configStr?: string) {
    this.originalConfigString = configStr || process.env.MCP_CONFIG || "";
    this.enabledCategories = this.parseConfig(configStr);
  }

  /**
   * Parse MCP_CONFIG from provided string or environment variables
   */
  private parseConfig(configStr?: string): Set<ToolCategory> {
    // Priority: 1. Provided config, 2. Environment variable, 3. Enable all
    const config = configStr || process.env.MCP_CONFIG || "";

    // If config is empty, enable all features
    if (!config.trim()) {
      return new Set(Object.values(ToolCategory));
    }

    // Parse comma-separated list
    const categories = config.split(",").map((c) => c.trim().toLowerCase());
    const validCategories = categories.filter((c) =>
      Object.values(ToolCategory).includes(c as ToolCategory),
    ) as ToolCategory[];

    return new Set(validCategories);
  }

  /**
   * Update configuration at runtime
   */
  setConfig(configStr: string): void {
    this.originalConfigString = configStr;
    this.enabledCategories = this.parseConfig(configStr);
  }

  /**
   * Check if a specific tool is enabled
   */
  isToolEnabled(toolName: string): boolean {
    const category = toolCategoryMap[toolName];

    // If tool is not in the map, default to disabled
    if (!category) {
      console.warn(`Unknown tool: ${toolName}`);
      return false;
    }

    return this.enabledCategories.has(category);
  }

  /**
   * Get detailed permission error message for a specific tool
   */
  getPermissionError(toolName: string): string {
    const category = toolCategoryMap[toolName];

    if (!category) {
      return `Unknown tool '${toolName}'. This tool is not recognized by the MCP server.`;
    }

    const isAllPermissions = !this.originalConfigString.trim();
    const currentPermissions = isAllPermissions
      ? "all"
      : this.originalConfigString;

    const actionDescriptions: Record<ToolCategory, string> = {
      [ToolCategory.LIST]: "list databases and tables",
      [ToolCategory.READ]: "read data from tables",
      [ToolCategory.CREATE]: "create new records",
      [ToolCategory.UPDATE]: "update existing records",
      [ToolCategory.DELETE]: "delete records",
      [ToolCategory.EXECUTE]: "execute custom SQL queries",
      [ToolCategory.DDL]: "create, alter, or drop tables (schema changes)",
      [ToolCategory.UTILITY]: "use utility functions",
      [ToolCategory.TRANSACTION]: "manage database transactions",
      [ToolCategory.PROCEDURE]: "manage stored procedures",
    };

    const toolDescriptions: Record<string, string> = {
      createTable: "create new tables",
      alterTable: "modify table structure",
      dropTable: "delete tables",
      executeDdl: "execute DDL statements",
      createRecord: "insert new records",
      updateRecord: "update existing records",
      deleteRecord: "delete records",
      bulkInsert: "insert multiple records in batches",
      bulkUpdate: "update multiple records in batches",
      bulkDelete: "delete multiple records in batches",
      executeSql: "execute custom SQL statements",
      runQuery: "run SELECT queries",
      beginTransaction: "start database transactions",
      commitTransaction: "commit database transactions",
      rollbackTransaction: "rollback database transactions",
      executeInTransaction: "execute queries within transactions",
      createStoredProcedure: "create stored procedures",
      dropStoredProcedure: "delete stored procedures",
      executeStoredProcedure: "execute stored procedures",
      exportTableToCSV: "export table data to CSV",
      exportQueryToCSV: "export query results to CSV",
    };

    const toolDescription =
      toolDescriptions[toolName] || actionDescriptions[category];
    const requiredPermission = category;

    return (
      `Permission denied: Cannot ${toolDescription}. ` +
      `This action requires '${requiredPermission}' permission, but your current MCP configuration only allows: ${currentPermissions}. ` +
      `To enable this feature, update your MCP server configuration to include '${requiredPermission}' in the permissions list.`
    );
  }

  /**
   * Check if a category is enabled
   */
  isCategoryEnabled(category: ToolCategory): boolean {
    return this.enabledCategories.has(category);
  }

  /**
   * Get all enabled categories
   */
  getEnabledCategories(): ToolCategory[] {
    return Array.from(this.enabledCategories);
  }

  /**
   * Get all available categories with their status
   */
  getCategoryStatus(): Record<ToolCategory, boolean> {
    const result = {} as Record<ToolCategory, boolean>;

    for (const category of Object.values(ToolCategory)) {
      result[category] = this.enabledCategories.has(category);
    }

    return result;
  }
}

// Export singleton instance
export const featureConfig = new FeatureConfig();
