import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Available MCP tool categories
 */
export enum ToolCategory {
  LIST = 'list',       // List databases, tables, etc.
  READ = 'read',       // Read/select data from tables
  CREATE = 'create',   // Insert new records
  UPDATE = 'update',   // Update existing records
  DELETE = 'delete',   // Delete records
  EXECUTE = 'execute', // Execute custom SQL
  DDL = 'ddl',         // Data Definition Language (CREATE/ALTER/DROP tables)
  UTILITY = 'utility'  // Utility functions like connection testing
}

/**
 * Map of tool names to their categories
 */
export const toolCategoryMap: Record<string, ToolCategory> = {
  // Database tools
  'listDatabases': ToolCategory.LIST,
  'listTables': ToolCategory.LIST,
  'readTableSchema': ToolCategory.LIST,
  
  // CRUD tools
  'createRecord': ToolCategory.CREATE,
  'readRecords': ToolCategory.READ,
  'updateRecord': ToolCategory.UPDATE,
  'deleteRecord': ToolCategory.DELETE,
  
  // Query tools
  'runQuery': ToolCategory.READ,
  'executeSql': ToolCategory.EXECUTE,
  
  // DDL tools
  'createTable': ToolCategory.DDL,
  'alterTable': ToolCategory.DDL,
  'dropTable': ToolCategory.DDL,
  'executeDdl': ToolCategory.DDL,
  
  // Utility tools
  'describeConnection': ToolCategory.UTILITY,
  'testConnection': ToolCategory.UTILITY,
  'getTableRelationships': ToolCategory.UTILITY
};

/**
 * Class to manage feature configuration based on runtime or environment variables
 */
export class FeatureConfig {
  private enabledCategories: Set<ToolCategory>;
  
  constructor(configStr?: string) {
    this.enabledCategories = this.parseConfig(configStr);
  }
  
  /**
   * Parse MCP_CONFIG from provided string or environment variables
   */
  private parseConfig(configStr?: string): Set<ToolCategory> {
    // Priority: 1. Provided config, 2. Environment variable, 3. Enable all
    const config = configStr || process.env.MCP_CONFIG || '';
    
    // If config is empty, enable all features
    if (!config.trim()) {
      return new Set(Object.values(ToolCategory));
    }
    
    // Parse comma-separated list
    const categories = config.split(',').map(c => c.trim().toLowerCase());
    const validCategories = categories.filter(c => 
      Object.values(ToolCategory).includes(c as ToolCategory)
    ) as ToolCategory[];
    
    return new Set(validCategories);
  }
  
  /**
   * Update configuration at runtime
   */
  setConfig(configStr: string): void {
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