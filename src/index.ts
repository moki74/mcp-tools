import { DatabaseTools } from './tools/databaseTools';
import { CrudTools } from './tools/crudTools';
import { QueryTools } from './tools/queryTools';
import { UtilityTools } from './tools/utilityTools';
import { DdlTools } from './tools/ddlTools';
import { TransactionTools } from './tools/transactionTools';
import SecurityLayer from './security/securityLayer';
import DatabaseConnection from './db/connection';
import { FeatureConfig } from './config/featureConfig';

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
  }

  // Helper method to check if tool is enabled
  private checkToolEnabled(toolName: string): { enabled: boolean; error?: string } {
    if (!this.featureConfig.isToolEnabled(toolName)) {
      return {
        enabled: false,
        error: `Tool '${toolName}' is disabled in the current configuration. Enabled categories: ${this.featureConfig.getEnabledCategories().join(', ')}`
      };
    }
    return { enabled: true };
  }

  // Database Tools
  async listDatabases() {
    const check = this.checkToolEnabled('listDatabases');
    if (!check.enabled) {
      return { status: 'error', error: check.error };
    }
    return await this.dbTools.listDatabases();
  }

  async listTables(params: { database?: string }) {
    const check = this.checkToolEnabled('listTables');
    if (!check.enabled) {
      return { status: 'error', error: check.error };
    }
    return await this.dbTools.listTables(params);
  }

  async readTableSchema(params: { table_name: string }) {
    const check = this.checkToolEnabled('readTableSchema');
    if (!check.enabled) {
      return { status: 'error', error: check.error };
    }
    return await this.dbTools.readTableSchema(params);
  }

  // CRUD Tools
  async createRecord(params: { table_name: string; data: Record<string, any> }) {
    const check = this.checkToolEnabled('createRecord');
    if (!check.enabled) {
      return { status: 'error', error: check.error };
    }
    return await this.crudTools.createRecord(params);
  }

  async readRecords(params: { 
    table_name: string; 
    filters?: any[];
    pagination?: { page: number; limit: number };
    sorting?: { field: string; direction: 'asc' | 'desc' };
  }) {
    const check = this.checkToolEnabled('readRecords');
    if (!check.enabled) {
      return { status: 'error', error: check.error };
    }
    return await this.crudTools.readRecords(params);
  }

  async updateRecord(params: { 
    table_name: string; 
    data: Record<string, any>;
    conditions: any[];
  }) {
    const check = this.checkToolEnabled('updateRecord');
    if (!check.enabled) {
      return { status: 'error', error: check.error };
    }
    return await this.crudTools.updateRecord(params);
  }

  async deleteRecord(params: { 
    table_name: string; 
    conditions: any[];
  }) {
    const check = this.checkToolEnabled('deleteRecord');
    if (!check.enabled) {
      return { status: 'error', error: check.error };
    }
    return await this.crudTools.deleteRecord(params);
  }

  // Query Tools
  async runQuery(params: { query: string; params?: any[] }) {
    const check = this.checkToolEnabled('runQuery');
    if (!check.enabled) {
      return { status: 'error', error: check.error };
    }
    
    // Additional security check
    if (!this.security.isReadOnlyQuery(params.query)) {
      return {
        status: 'error',
        error: 'Only SELECT queries are allowed with runQuery. Use executeSql for other operations.'
      };
    }
    return await this.queryTools.runQuery(params);
  }

  async executeSql(params: { query: string; params?: any[] }) {
    const check = this.checkToolEnabled('executeSql');
    if (!check.enabled) {
      return { status: 'error', error: check.error };
    }
    
    // Additional security check - block DDL unless DDL permission is enabled
    if (this.security.hasDangerousOperations(params.query)) {
      // Check if DDL permission is enabled
      if (!this.featureConfig.isCategoryEnabled('ddl' as any)) {
        return {
          status: 'error',
          error: 'DDL operations (DROP, TRUNCATE, ALTER, CREATE) require the "ddl" permission. Use executeDdl tool or add "ddl" to permissions.'
        };
      }
    }
    return await this.queryTools.executeSql(params);
  }

  // DDL Tools
  async createTable(params: any) {
    const check = this.checkToolEnabled('createTable');
    if (!check.enabled) {
      return { status: 'error', error: check.error };
    }
    return await this.ddlTools.createTable(params);
  }

  async alterTable(params: any) {
    const check = this.checkToolEnabled('alterTable');
    if (!check.enabled) {
      return { status: 'error', error: check.error };
    }
    return await this.ddlTools.alterTable(params);
  }

  async dropTable(params: any) {
    const check = this.checkToolEnabled('dropTable');
    if (!check.enabled) {
      return { status: 'error', error: check.error };
    }
    return await this.ddlTools.dropTable(params);
  }

  async executeDdl(params: { query: string }) {
    const check = this.checkToolEnabled('executeDdl');
    if (!check.enabled) {
      return { status: 'error', error: check.error };
    }
    return await this.ddlTools.executeDdl(params);
  }

  // Utility Tools
  async describeConnection() {
    const check = this.checkToolEnabled('describeConnection');
    if (!check.enabled) {
      return { status: 'error', error: check.error };
    }
    return await this.utilityTools.describeConnection();
  }

  async testConnection() {
    const check = this.checkToolEnabled('testConnection');
    if (!check.enabled) {
      return { status: 'error', error: check.error };
    }
    return await this.utilityTools.testConnection();
  }

  async getTableRelationships(params: { table_name: string }) {
    const check = this.checkToolEnabled('getTableRelationships');
    if (!check.enabled) {
      return { status: 'error', error: check.error };
    }
    return await this.utilityTools.getTableRelationships(params);
  }

  // Transaction Tools
  async beginTransaction(params?: { transactionId?: string }) {
    const check = this.checkToolEnabled('beginTransaction');
    if (!check.enabled) {
      return { status: 'error', error: check.error };
    }
    return await this.transactionTools.beginTransaction(params);
  }

  async commitTransaction(params: { transactionId: string }) {
    const check = this.checkToolEnabled('commitTransaction');
    if (!check.enabled) {
      return { status: 'error', error: check.error };
    }
    return await this.transactionTools.commitTransaction(params);
  }

  async rollbackTransaction(params: { transactionId: string }) {
    const check = this.checkToolEnabled('rollbackTransaction');
    if (!check.enabled) {
      return { status: 'error', error: check.error };
    }
    return await this.transactionTools.rollbackTransaction(params);
  }

  async getTransactionStatus() {
    const check = this.checkToolEnabled('getTransactionStatus');
    if (!check.enabled) {
      return { status: 'error', error: check.error };
    }
    return await this.transactionTools.getTransactionStatus();
  }

  async executeInTransaction(params: {
    transactionId: string;
    query: string;
    params?: any[];
  }) {
    const check = this.checkToolEnabled('executeSql'); // Use executeSql permission for transaction queries
    if (!check.enabled) {
      return { status: 'error', error: check.error };
    }
    return await this.transactionTools.executeInTransaction(params);
  }
  
  // Get feature configuration status
  getFeatureStatus() {
    return {
      status: 'success',
      data: {
        enabledCategories: this.featureConfig.getEnabledCategories(),
        categoryStatus: this.featureConfig.getCategoryStatus()
      }
    };
  }

  // Close database connection
  async close() {
    const db = DatabaseConnection.getInstance();
    await db.closePool();
  }
}

export default MySQLMCP;