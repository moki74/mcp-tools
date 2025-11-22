import { DatabaseTools } from "./tools/databaseTools";
import { CrudTools } from "./tools/crudTools";
import { QueryTools } from "./tools/queryTools";
import { UtilityTools } from "./tools/utilityTools";
import { DdlTools } from "./tools/ddlTools";
import { TransactionTools } from "./tools/transactionTools";
import { StoredProcedureTools } from "./tools/storedProcedureTools";
import { DataExportTools } from "./tools/dataExportTools";
import { ViewTools } from "./tools/viewTools";
import { TriggerTools } from "./tools/triggerTools";
import { FunctionTools } from "./tools/functionTools";
import { IndexTools } from "./tools/indexTools";
import { ConstraintTools } from "./tools/constraintTools";
import { MaintenanceTools } from "./tools/maintenanceTools";
import { ProcessTools } from "./tools/processTools";
import SecurityLayer from "./security/securityLayer";
import DatabaseConnection from "./db/connection";
import { FeatureConfig } from "./config/featureConfig";

/**
 * MySQL Model Context Protocol (MCP)
 * A secure interface for AI models to interact with MySQL databases
 */
export class MySQLMCP {
  private dbTools: DatabaseTools;
  private crudTools: CrudTools;
  private queryTools: QueryTools;
  private utilityTools: UtilityTools;
  private ddlTools: DdlTools;
  private transactionTools: TransactionTools;
  private storedProcedureTools: StoredProcedureTools;
  private dataExportTools: DataExportTools;
  private viewTools: ViewTools;
  private triggerTools: TriggerTools;
  private functionTools: FunctionTools;
  private indexTools: IndexTools;
  private constraintTools: ConstraintTools;
  private maintenanceTools: MaintenanceTools;
  private processTools: ProcessTools;
  private security: SecurityLayer;
  private featureConfig: FeatureConfig;

  constructor(permissionsConfig?: string) {
    this.featureConfig = new FeatureConfig(permissionsConfig);
    this.security = new SecurityLayer(this.featureConfig);
    this.dbTools = new DatabaseTools();
    this.crudTools = new CrudTools(this.security);
    this.queryTools = new QueryTools(this.security);
    this.utilityTools = new UtilityTools();
    this.ddlTools = new DdlTools();
    this.transactionTools = new TransactionTools();
    this.storedProcedureTools = new StoredProcedureTools(this.security);
    this.dataExportTools = new DataExportTools(this.security);
    this.viewTools = new ViewTools(this.security);
    this.triggerTools = new TriggerTools(this.security);
    this.functionTools = new FunctionTools(this.security);
    this.indexTools = new IndexTools(this.security);
    this.constraintTools = new ConstraintTools(this.security);
    this.maintenanceTools = new MaintenanceTools(this.security);
    this.processTools = new ProcessTools(this.security);
  }

  // Helper method to check if tool is enabled
  private checkToolEnabled(toolName: string): {
    enabled: boolean;
    error?: string;
  } {
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

  async listTables(params: { database?: string }) {
    const check = this.checkToolEnabled("listTables");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }
    return await this.dbTools.listTables(params);
  }

  async readTableSchema(params: { table_name: string }) {
    const check = this.checkToolEnabled("readTableSchema");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }
    return await this.dbTools.readTableSchema(params);
  }

  // CRUD Tools
  async createRecord(params: {
    table_name: string;
    data: Record<string, any>;
  }) {
    const check = this.checkToolEnabled("createRecord");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }
    return await this.crudTools.createRecord(params);
  }

  async readRecords(params: {
    table_name: string;
    filters?: any[];
    pagination?: { page: number; limit: number };
    sorting?: { field: string; direction: "asc" | "desc" };
  }) {
    const check = this.checkToolEnabled("readRecords");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }
    return await this.crudTools.readRecords(params);
  }

  async updateRecord(params: {
    table_name: string;
    data: Record<string, any>;
    conditions: any[];
  }) {
    const check = this.checkToolEnabled("updateRecord");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }
    return await this.crudTools.updateRecord(params);
  }

  async deleteRecord(params: { table_name: string; conditions: any[] }) {
    const check = this.checkToolEnabled("deleteRecord");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }
    return await this.crudTools.deleteRecord(params);
  }

  // Query Tools
  async runQuery(params: { query: string; params?: any[] }) {
    const check = this.checkToolEnabled("runQuery");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }

    // Additional security check
    if (!this.security.isReadOnlyQuery(params.query)) {
      return {
        status: "error",
        error:
          "Only SELECT queries are allowed with runQuery. Use executeSql for other operations.",
      };
    }
    return await this.queryTools.runQuery(params);
  }

  async executeSql(params: { query: string; params?: any[] }) {
    const check = this.checkToolEnabled("executeSql");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }

    // Additional security check - block DDL unless DDL permission is enabled
    if (this.security.hasDangerousOperations(params.query)) {
      // Check if DDL permission is enabled
      if (!this.featureConfig.isCategoryEnabled("ddl" as any)) {
        return {
          status: "error",
          error:
            'DDL operations (DROP, TRUNCATE, ALTER, CREATE) require the "ddl" permission. Use executeDdl tool or add "ddl" to permissions.',
        };
      }
    }
    return await this.queryTools.executeSql(params);
  }

  // DDL Tools
  async createTable(params: any) {
    const check = this.checkToolEnabled("createTable");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }
    return await this.ddlTools.createTable(params);
  }

  async alterTable(params: any) {
    const check = this.checkToolEnabled("alterTable");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }
    return await this.ddlTools.alterTable(params);
  }

  async dropTable(params: any) {
    const check = this.checkToolEnabled("dropTable");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }
    return await this.ddlTools.dropTable(params);
  }

  async executeDdl(params: { query: string }) {
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

  async getTableRelationships(params: { table_name: string }) {
    const check = this.checkToolEnabled("getTableRelationships");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }
    return await this.utilityTools.getTableRelationships(params);
  }

  // Transaction Tools
  async beginTransaction(params?: { transactionId?: string }) {
    const check = this.checkToolEnabled("beginTransaction");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }
    return await this.transactionTools.beginTransaction(params);
  }

  async commitTransaction(params: { transactionId: string }) {
    const check = this.checkToolEnabled("commitTransaction");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }
    return await this.transactionTools.commitTransaction(params);
  }

  async rollbackTransaction(params: { transactionId: string }) {
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

  async executeInTransaction(params: {
    transactionId: string;
    query: string;
    params?: any[];
  }) {
    const check = this.checkToolEnabled("executeSql"); // Use executeSql permission for transaction queries
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }
    return await this.transactionTools.executeInTransaction(params);
  }

  // Stored Procedure Tools
  async listStoredProcedures(params: { database?: string }) {
    const check = this.checkToolEnabled("listStoredProcedures");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }
    return await this.storedProcedureTools.listStoredProcedures(params);
  }

  async getStoredProcedureInfo(params: {
    procedure_name: string;
    database?: string;
  }) {
    const check = this.checkToolEnabled("getStoredProcedureInfo");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }
    return await this.storedProcedureTools.getStoredProcedureInfo(params);
  }

  async executeStoredProcedure(params: {
    procedure_name: string;
    parameters?: any[];
    database?: string;
  }) {
    const check = this.checkToolEnabled("executeStoredProcedure");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }
    return await this.storedProcedureTools.executeStoredProcedure(params);
  }

  async createStoredProcedure(params: {
    procedure_name: string;
    parameters?: Array<{
      name: string;
      mode: "IN" | "OUT" | "INOUT";
      data_type: string;
    }>;
    body: string;
    comment?: string;
    database?: string;
  }) {
    const check = this.checkToolEnabled("createStoredProcedure");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }
    return await this.storedProcedureTools.createStoredProcedure(params);
  }

  async dropStoredProcedure(params: {
    procedure_name: string;
    if_exists?: boolean;
    database?: string;
  }) {
    const check = this.checkToolEnabled("dropStoredProcedure");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }
    return await this.storedProcedureTools.dropStoredProcedure(params);
  }

  async showCreateProcedure(params: {
    procedure_name: string;
    database?: string;
  }) {
    const check = this.checkToolEnabled("showCreateProcedure");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }
    return await this.storedProcedureTools.showCreateProcedure(params);
  }

  // Data Export Tools
  async exportTableToCSV(params: {
    table_name: string;
    filters?: any[];
    pagination?: { page: number; limit: number };
    sorting?: { field: string; direction: "asc" | "desc" };
    include_headers?: boolean;
  }) {
    const check = this.checkToolEnabled("exportTableToCSV");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }
    return await this.dataExportTools.exportTableToCSV(params);
  }

  async exportQueryToCSV(params: {
    query: string;
    params?: any[];
    include_headers?: boolean;
  }) {
    const check = this.checkToolEnabled("exportQueryToCSV");
    if (!check.enabled) {
      return { status: "error", error: check.error };
    }
    return await this.dataExportTools.exportQueryToCSV(params);
  }

  // Get feature configuration status
  getFeatureStatus() {
    return {
      status: "success",
      data: {
        enabledCategories: this.featureConfig.getEnabledCategories(),
        categoryStatus: this.featureConfig.getCategoryStatus(),
      },
    };
  }

  /**
   * Bulk insert multiple records into the specified table
   */
  async bulkInsert(params: {
    table_name: string;
    data: Record<string, any>[];
    batch_size?: number;
  }): Promise<{ status: string; data?: any; error?: string }> {
    this.checkToolEnabled("bulk_insert");
    return this.crudTools.bulkInsert(params);
  }

  /**
   * Bulk update multiple records with different conditions and data
   */
  async bulkUpdate(params: {
    table_name: string;
    updates: Array<{
      data: Record<string, any>;
      conditions: any[];
    }>;
    batch_size?: number;
  }): Promise<{ status: string; data?: any; error?: string }> {
    this.checkToolEnabled("bulk_update");
    return this.crudTools.bulkUpdate(params);
  }

  /**
   * Bulk delete records based on multiple condition sets
   */
  async bulkDelete(params: {
    table_name: string;
    condition_sets: any[][];
    batch_size?: number;
  }): Promise<{ status: string; data?: any; error?: string }> {
    this.checkToolEnabled("bulk_delete");
    return this.crudTools.bulkDelete(params);
  }

  // Close database connection
  async close() {
    const db = DatabaseConnection.getInstance();
    await db.closePool();
  }

  // ==========================================
  // Cache Management Methods
  // ==========================================

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const db = DatabaseConnection.getInstance();
    return {
      status: "success",
      data: db.getCacheStats(),
    };
  }

  /**
   * Get cache configuration
   */
  getCacheConfig() {
    const db = DatabaseConnection.getInstance();
    return {
      status: "success",
      data: db.getCacheConfig(),
    };
  }

  /**
   * Configure cache settings
   */
  configureCacheSettings(params: {
    enabled?: boolean;
    ttlMs?: number;
    maxSize?: number;
    maxMemoryMB?: number;
  }) {
    const db = DatabaseConnection.getInstance();
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
    const db = DatabaseConnection.getInstance();
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
  invalidateCacheForTable(params: { table_name: string }) {
    const db = DatabaseConnection.getInstance();
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
  analyzeQuery(params: { query: string }) {
    const analysis = this.queryTools.analyzeQuery(params.query);
    return {
      status: "success",
      data: analysis,
    };
  }

  /**
   * Get suggested optimizer hints for a specific optimization goal
   */
  getOptimizationHints(params: { goal: "SPEED" | "MEMORY" | "STABILITY" }) {
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

  async listViews(params: { database?: string }) {
    const check = this.checkToolEnabled("listViews");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.viewTools.listViews(params);
  }

  async getViewInfo(params: { view_name: string; database?: string }) {
    const check = this.checkToolEnabled("getViewInfo");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.viewTools.getViewInfo(params);
  }

  async createView(params: any) {
    const check = this.checkToolEnabled("createView");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.viewTools.createView(params);
  }

  async alterView(params: any) {
    const check = this.checkToolEnabled("alterView");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.viewTools.alterView(params);
  }

  async dropView(params: {
    view_name: string;
    if_exists?: boolean;
    database?: string;
  }) {
    const check = this.checkToolEnabled("dropView");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.viewTools.dropView(params);
  }

  async showCreateView(params: { view_name: string; database?: string }) {
    const check = this.checkToolEnabled("showCreateView");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.viewTools.showCreateView(params);
  }

  // ==========================================
  // Trigger Tools
  // ==========================================

  async listTriggers(params: { database?: string; table_name?: string }) {
    const check = this.checkToolEnabled("listTriggers");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.triggerTools.listTriggers(params);
  }

  async getTriggerInfo(params: { trigger_name: string; database?: string }) {
    const check = this.checkToolEnabled("getTriggerInfo");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.triggerTools.getTriggerInfo(params);
  }

  async createTrigger(params: any) {
    const check = this.checkToolEnabled("createTrigger");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.triggerTools.createTrigger(params);
  }

  async dropTrigger(params: {
    trigger_name: string;
    if_exists?: boolean;
    database?: string;
  }) {
    const check = this.checkToolEnabled("dropTrigger");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.triggerTools.dropTrigger(params);
  }

  async showCreateTrigger(params: { trigger_name: string; database?: string }) {
    const check = this.checkToolEnabled("showCreateTrigger");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.triggerTools.showCreateTrigger(params);
  }

  // ==========================================
  // Function Tools
  // ==========================================

  async listFunctions(params: { database?: string }) {
    const check = this.checkToolEnabled("listFunctions");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.functionTools.listFunctions(params);
  }

  async getFunctionInfo(params: { function_name: string; database?: string }) {
    const check = this.checkToolEnabled("getFunctionInfo");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.functionTools.getFunctionInfo(params);
  }

  async createFunction(params: any) {
    const check = this.checkToolEnabled("createFunction");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.functionTools.createFunction(params);
  }

  async dropFunction(params: {
    function_name: string;
    if_exists?: boolean;
    database?: string;
  }) {
    const check = this.checkToolEnabled("dropFunction");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.functionTools.dropFunction(params);
  }

  async showCreateFunction(params: {
    function_name: string;
    database?: string;
  }) {
    const check = this.checkToolEnabled("showCreateFunction");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.functionTools.showCreateFunction(params);
  }

  async executeFunction(params: {
    function_name: string;
    parameters?: any[];
    database?: string;
  }) {
    const check = this.checkToolEnabled("executeFunction");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.functionTools.executeFunction(params);
  }

  // ==========================================
  // Index Tools
  // ==========================================

  async listIndexes(params: { table_name: string; database?: string }) {
    const check = this.checkToolEnabled("listIndexes");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.indexTools.listIndexes(params);
  }

  async getIndexInfo(params: {
    table_name: string;
    index_name: string;
    database?: string;
  }) {
    const check = this.checkToolEnabled("getIndexInfo");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.indexTools.getIndexInfo(params);
  }

  async createIndex(params: any) {
    const check = this.checkToolEnabled("createIndex");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.indexTools.createIndex(params);
  }

  async dropIndex(params: {
    table_name: string;
    index_name: string;
    database?: string;
  }) {
    const check = this.checkToolEnabled("dropIndex");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.indexTools.dropIndex(params);
  }

  async analyzeIndex(params: { table_name: string; database?: string }) {
    const check = this.checkToolEnabled("analyzeIndex");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.indexTools.analyzeIndex(params);
  }

  // ==========================================
  // Constraint Tools
  // ==========================================

  async listForeignKeys(params: { table_name: string; database?: string }) {
    const check = this.checkToolEnabled("listForeignKeys");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.constraintTools.listForeignKeys(params);
  }

  async listConstraints(params: { table_name: string; database?: string }) {
    const check = this.checkToolEnabled("listConstraints");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.constraintTools.listConstraints(params);
  }

  async addForeignKey(params: any) {
    const check = this.checkToolEnabled("addForeignKey");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.constraintTools.addForeignKey(params);
  }

  async dropForeignKey(params: {
    table_name: string;
    constraint_name: string;
    database?: string;
  }) {
    const check = this.checkToolEnabled("dropForeignKey");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.constraintTools.dropForeignKey(params);
  }

  async addUniqueConstraint(params: any) {
    const check = this.checkToolEnabled("addUniqueConstraint");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.constraintTools.addUniqueConstraint(params);
  }

  async dropConstraint(params: {
    table_name: string;
    constraint_name: string;
    constraint_type: "UNIQUE" | "CHECK";
    database?: string;
  }) {
    const check = this.checkToolEnabled("dropConstraint");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.constraintTools.dropConstraint(params);
  }

  async addCheckConstraint(params: any) {
    const check = this.checkToolEnabled("addCheckConstraint");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.constraintTools.addCheckConstraint(params);
  }

  // ==========================================
  // Table Maintenance Tools
  // ==========================================

  async analyzeTable(params: { table_name: string; database?: string }) {
    const check = this.checkToolEnabled("analyzeTable");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.maintenanceTools.analyzeTable(params);
  }

  async optimizeTable(params: { table_name: string; database?: string }) {
    const check = this.checkToolEnabled("optimizeTable");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.maintenanceTools.optimizeTable(params);
  }

  async checkTable(params: {
    table_name: string;
    check_type?: "QUICK" | "FAST" | "MEDIUM" | "EXTENDED" | "CHANGED";
    database?: string;
  }) {
    const check = this.checkToolEnabled("checkTable");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.maintenanceTools.checkTable(params);
  }

  async repairTable(params: {
    table_name: string;
    quick?: boolean;
    extended?: boolean;
    use_frm?: boolean;
    database?: string;
  }) {
    const check = this.checkToolEnabled("repairTable");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.maintenanceTools.repairTable(params);
  }

  async truncateTable(params: { table_name: string; database?: string }) {
    const check = this.checkToolEnabled("truncateTable");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.maintenanceTools.truncateTable(params);
  }

  async getTableStatus(params: { table_name?: string; database?: string }) {
    const check = this.checkToolEnabled("getTableStatus");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.maintenanceTools.getTableStatus(params);
  }

  async flushTable(params: {
    table_name?: string;
    with_read_lock?: boolean;
    database?: string;
  }) {
    const check = this.checkToolEnabled("flushTable");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.maintenanceTools.flushTable(params);
  }

  async getTableSize(params: { table_name?: string; database?: string }) {
    const check = this.checkToolEnabled("getTableSize");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.maintenanceTools.getTableSize(params);
  }

  // ==========================================
  // Process Management Tools
  // ==========================================

  async showProcessList(params?: { full?: boolean }) {
    const check = this.checkToolEnabled("showProcessList");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.processTools.showProcessList(params);
  }

  async killProcess(params: {
    process_id: number;
    type?: "CONNECTION" | "QUERY";
  }) {
    const check = this.checkToolEnabled("killProcess");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.processTools.killProcess(params);
  }

  async showStatus(params?: { like?: string; global?: boolean }) {
    const check = this.checkToolEnabled("showStatus");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.processTools.showStatus(params);
  }

  async showVariables(params?: { like?: string; global?: boolean }) {
    const check = this.checkToolEnabled("showVariables");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.processTools.showVariables(params);
  }

  async explainQuery(params: {
    query: string;
    format?: "TRADITIONAL" | "JSON" | "TREE";
    analyze?: boolean;
  }) {
    const check = this.checkToolEnabled("explainQuery");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.processTools.explainQuery(params);
  }

  async showEngineStatus(params?: { engine?: string }) {
    const check = this.checkToolEnabled("showEngineStatus");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.processTools.showEngineStatus(params);
  }

  async getServerInfo() {
    const check = this.checkToolEnabled("getServerInfo");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.processTools.getServerInfo();
  }

  async showBinaryLogs() {
    const check = this.checkToolEnabled("showBinaryLogs");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.processTools.showBinaryLogs();
  }

  async showReplicationStatus(params?: {
    type?: "MASTER" | "REPLICA" | "SLAVE";
  }) {
    const check = this.checkToolEnabled("showReplicationStatus");
    if (!check.enabled) return { status: "error", error: check.error };
    return await this.processTools.showReplicationStatus(params);
  }
}

export default MySQLMCP;
