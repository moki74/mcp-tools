/**
 * MySQL Model Context Protocol (MCP)
 * A secure interface for AI models to interact with MySQL databases
 */
export declare class MySQLMCP {
    private dbTools;
    private crudTools;
    private queryTools;
    private utilityTools;
    private ddlTools;
    private transactionTools;
    private storedProcedureTools;
    private dataExportTools;
    private viewTools;
    private triggerTools;
    private functionTools;
    private indexTools;
    private constraintTools;
    private maintenanceTools;
    private processTools;
    private backupRestoreTools;
    private migrationTools;
    private schemaVersioningTools;
    private performanceTools;
    private analysisTools;
    private aiTools;
    private macroTools;
    private intelligentQueryTools;
    private smartDiscoveryTools;
    private documentationGeneratorTools;
    private schemaDesignTools;
    private securityAuditTools;
    private indexRecommendationTools;
    private testDataTools;
    private schemaPatternTools;
    private queryVisualizationTools;
    private forecastingTools;
    private smartQueryBuilderTools;
    private fulltextSearchTools;
    private security;
    private featureConfig;
    constructor(permissionsConfig?: string, categoriesConfig?: string);
    private checkToolEnabled;
    listDatabases(): Promise<{
        status: string;
        data?: string[];
        error?: string;
    }>;
    listTables(params: {
        database?: string;
    }): Promise<{
        status: string;
        data?: import("./validation/schemas").TableInfo[];
        error?: string;
    }>;
    readTableSchema(params: {
        table_name: string;
    }): Promise<{
        status: string;
        data?: import("./validation/schemas").ColumnInfo[];
        error?: string;
    }>;
    getDatabaseSummary(params: {
        database?: string;
        max_tables?: number;
        include_relationships?: boolean;
    }): Promise<{
        status: string;
        data?: string;
        error?: string;
    }>;
    getSchemaERD(params: {
        database?: string;
    }): Promise<{
        status: string;
        data?: string;
        error?: string;
    }>;
    createRecord(params: {
        table_name: string;
        data: Record<string, any>;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    readRecords(params: {
        table_name: string;
        filters?: any[];
        pagination?: {
            page: number;
            limit: number;
        };
        sorting?: {
            field: string;
            direction: "asc" | "desc";
        };
    }): Promise<{
        status: string;
        data?: any[];
        total?: number;
        error?: string;
    }>;
    updateRecord(params: {
        table_name: string;
        data: Record<string, any>;
        conditions: any[];
    }): Promise<{
        status: string;
        data?: {
            affectedRows: number;
        };
        error?: string;
    }>;
    deleteRecord(params: {
        table_name: string;
        conditions: any[];
    }): Promise<{
        status: string;
        data?: {
            affectedRows: number;
        };
        error?: string;
    }>;
    runSelectQuery(params: {
        query: string;
        params?: any[];
        hints?: any;
        useCache?: boolean;
        dry_run?: boolean;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
        optimizedQuery?: string;
        dry_run?: boolean;
        execution_plan?: any;
        estimated_cost?: string;
        message?: string;
    }>;
    executeWriteQuery(params: {
        query: string;
        params?: any[];
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    getColumnStatistics(params: {
        table_name: string;
        column_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    getSchemaRagContext(params: {
        database?: string;
        max_tables?: number;
        max_columns?: number;
        include_relationships?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    createTable(params: any): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    alterTable(params: any): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    dropTable(params: any): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    executeDdl(params: {
        query: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    describeConnection(): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    testConnection(): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    getTableRelationships(params: {
        table_name: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    getAllTablesRelationships(params?: {
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    readChangelog(params?: {
        version?: string;
        limit?: number;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    listAllTools(): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    beginTransaction(params?: {
        transactionId?: string;
    }): Promise<import("./tools/transactionTools").TransactionResult | {
        status: string;
        error: string | undefined;
    }>;
    commitTransaction(params: {
        transactionId: string;
    }): Promise<import("./tools/transactionTools").TransactionResult | {
        status: string;
        error: string | undefined;
    }>;
    rollbackTransaction(params: {
        transactionId: string;
    }): Promise<import("./tools/transactionTools").TransactionResult | {
        status: string;
        error: string | undefined;
    }>;
    getTransactionStatus(): Promise<import("./tools/transactionTools").TransactionResult | {
        status: string;
        error: string | undefined;
    }>;
    executeInTransaction(params: {
        transactionId: string;
        query: string;
        params?: any[];
    }): Promise<{
        status: "success" | "error";
        data?: any;
        error?: string;
    } | {
        status: string;
        error: string | undefined;
    }>;
    listStoredProcedures(params: {
        database?: string;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    getStoredProcedureInfo(params: {
        procedure_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    executeStoredProcedure(params: {
        procedure_name: string;
        parameters?: any[];
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    createStoredProcedure(params: {
        procedure_name: string;
        parameters?: Array<{
            name: string;
            mode: "IN" | "OUT" | "INOUT";
            data_type: string;
        }>;
        body: string;
        comment?: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    dropStoredProcedure(params: {
        procedure_name: string;
        if_exists?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
    showCreateProcedure(params: {
        procedure_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    exportTableToCSV(params: {
        table_name: string;
        filters?: any[];
        pagination?: {
            page: number;
            limit: number;
        };
        sorting?: {
            field: string;
            direction: "asc" | "desc";
        };
        include_headers?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    exportQueryToCSV(params: {
        query: string;
        params?: any[];
        include_headers?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    exportTableToJSON(params: {
        table_name: string;
        filters?: any[];
        pagination?: {
            page: number;
            limit: number;
        };
        sorting?: {
            field: string;
            direction: "asc" | "desc";
        };
        pretty?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    exportQueryToJSON(params: {
        query: string;
        params?: any[];
        pretty?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    exportTableToSql(params: {
        table_name: string;
        filters?: any[];
        include_create_table?: boolean;
        batch_size?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    importFromCSV(params: {
        table_name: string;
        csv_data: string;
        has_headers?: boolean;
        column_mapping?: Record<string, string>;
        skip_errors?: boolean;
        batch_size?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    importFromJSON(params: {
        table_name: string;
        json_data: string;
        column_mapping?: Record<string, string>;
        skip_errors?: boolean;
        batch_size?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    backupTable(params: {
        table_name: string;
        include_data?: boolean;
        include_drop?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    backupDatabase(params: {
        include_data?: boolean;
        include_drop?: boolean;
        tables?: string[];
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    restoreFromSql(params: {
        sql_dump: string;
        stop_on_error?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    getCreateTableStatement(params: {
        table_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    getDatabaseSchema(params: {
        database?: string;
        include_views?: boolean;
        include_procedures?: boolean;
        include_functions?: boolean;
        include_triggers?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    copyTableData(params: {
        source_table: string;
        target_table: string;
        column_mapping?: Record<string, string>;
        filters?: any[];
        batch_size?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    moveTableData(params: {
        source_table: string;
        target_table: string;
        column_mapping?: Record<string, string>;
        filters?: any[];
        batch_size?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    cloneTable(params: {
        source_table: string;
        new_table_name: string;
        include_data?: boolean;
        include_indexes?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    compareTableStructure(params: {
        table1: string;
        table2: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    syncTableData(params: {
        source_table: string;
        target_table: string;
        key_column: string;
        columns_to_sync?: string[];
        sync_mode?: "insert_only" | "update_only" | "upsert";
        batch_size?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Initialize the migrations tracking table
     */
    initMigrationsTable(params: {
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Create a new migration
     */
    createMigration(params: {
        name: string;
        up_sql: string;
        down_sql?: string;
        description?: string;
        version?: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Apply pending migrations
     */
    applyMigrations(params: {
        target_version?: string;
        dry_run?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Rollback migrations
     */
    rollbackMigration(params: {
        target_version?: string;
        steps?: number;
        dry_run?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Get migration status and history
     */
    getMigrationStatus(params: {
        version?: string;
        status?: "pending" | "applied" | "failed" | "rolled_back";
        limit?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Get current schema version
     */
    getSchemaVersion(params: {
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Validate migrations for issues
     */
    validateMigrations(params: {
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Reset a failed migration to pending status
     */
    resetFailedMigration(params: {
        version: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Generate a migration from table structure differences
     */
    generateMigrationFromDiff(params: {
        table1: string;
        table2: string;
        migration_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    repairQuery(params: {
        query: string;
        error_message?: string;
    }): Promise<{
        status: string;
        analysis?: any;
        fixed_query?: string;
        suggestions?: string[];
        error?: string;
    }>;
    safeExportTable(params: {
        table_name: string;
        masking_profile?: string;
        limit?: number;
        include_headers?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    getFeatureStatus(): {
        status: string;
        data: {
            config: {
                permissions: string;
                categories: string;
                filteringMode: string;
                enabledLegacy: import("./config/featureConfig").ToolCategory[];
                enabledDoc: import("./config/featureConfig").DocCategory[];
            };
            filteringMode: string;
            enabledCategories: import("./config/featureConfig").ToolCategory[];
            categoryStatus: Record<import("./config/featureConfig").ToolCategory, boolean>;
            docCategoryStatus: Record<import("./config/featureConfig").DocCategory, boolean>;
        };
    };
    /**
     * Check if a specific tool is enabled based on current permissions and categories
     * @param toolName - The tool name in camelCase (e.g., 'listDatabases')
     * @returns boolean indicating if the tool is enabled
     */
    isToolEnabled(toolName: string): boolean;
    /**
     * Expose resolved access profile (resolved permissions/categories)
     */
    getAccessProfile(): {
        permissions: string;
        categories: string;
        filteringMode: string;
        enabledLegacy: import("./config/featureConfig").ToolCategory[];
        enabledDoc: import("./config/featureConfig").DocCategory[];
    };
    /**
     * Bulk insert multiple records into the specified table
     */
    bulkInsert(params: {
        table_name: string;
        data: Record<string, any>[];
        batch_size?: number;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Bulk update multiple records with different conditions and data
     */
    bulkUpdate(params: {
        table_name: string;
        updates: Array<{
            data: Record<string, any>;
            conditions: any[];
        }>;
        batch_size?: number;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Bulk delete records based on multiple condition sets
     */
    bulkDelete(params: {
        table_name: string;
        condition_sets: any[][];
        batch_size?: number;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    close(): Promise<void>;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        status: string;
        data: import("./cache/queryCache").CacheStats;
    };
    /**
     * Get cache configuration
     */
    getCacheConfig(): {
        status: string;
        data: import("./cache/queryCache").CacheConfig;
    };
    /**
     * Configure cache settings
     */
    configureCacheSettings(params: {
        enabled?: boolean;
        ttlMs?: number;
        maxSize?: number;
        maxMemoryMB?: number;
    }): {
        status: string;
        data: {
            message: string;
            config: import("./cache/queryCache").CacheConfig;
        };
    };
    /**
     * Clear the query cache
     */
    clearCache(): {
        status: string;
        data: {
            message: string;
            entriesCleared: number;
        };
    };
    /**
     * Invalidate cache for a specific table
     */
    invalidateCacheForTable(params: {
        table_name: string;
    }): {
        status: string;
        data: {
            message: string;
            entriesInvalidated: number;
        };
    };
    /**
     * Analyze a query and get optimization suggestions
     */
    analyzeQuery(params: {
        query: string;
    }): {
        status: string;
        data: import("./optimization/queryOptimizer").QueryAnalysis;
    };
    /**
     * Get suggested optimizer hints for a specific optimization goal
     */
    getOptimizationHints(params: {
        goal: "SPEED" | "MEMORY" | "STABILITY";
    }): {
        status: string;
        data: {
            goal: "SPEED" | "MEMORY" | "STABILITY";
            hints: import("./optimization/queryOptimizer").QueryHints;
        };
    };
    listViews(params: {
        database?: string;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    getViewInfo(params: {
        view_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    createView(params: any): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    alterView(params: any): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    dropView(params: {
        view_name: string;
        if_exists?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
    showCreateView(params: {
        view_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    listTriggers(params: {
        database?: string;
        table_name?: string;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    getTriggerInfo(params: {
        trigger_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    createTrigger(params: any): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    dropTrigger(params: {
        trigger_name: string;
        if_exists?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
    showCreateTrigger(params: {
        trigger_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    listFunctions(params: {
        database?: string;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    getFunctionInfo(params: {
        function_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    createFunction(params: any): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    dropFunction(params: {
        function_name: string;
        if_exists?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
    showCreateFunction(params: {
        function_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    executeFunction(params: {
        function_name: string;
        parameters?: any[];
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    listIndexes(params: {
        table_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    getIndexInfo(params: {
        table_name: string;
        index_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    createIndex(params: any): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    dropIndex(params: {
        table_name: string;
        index_name: string;
        database?: string;
    }): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
    analyzeIndex(params: {
        table_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    listForeignKeys(params: {
        table_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    listConstraints(params: {
        table_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    addForeignKey(params: any): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    dropForeignKey(params: {
        table_name: string;
        constraint_name: string;
        database?: string;
    }): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
    addUniqueConstraint(params: any): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    dropConstraint(params: {
        table_name: string;
        constraint_name: string;
        constraint_type: "UNIQUE" | "CHECK";
        database?: string;
    }): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
    addCheckConstraint(params: any): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    analyzeTable(params: {
        table_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    optimizeTable(params: {
        table_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    checkTable(params: {
        table_name: string;
        check_type?: "QUICK" | "FAST" | "MEDIUM" | "EXTENDED" | "CHANGED";
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    repairTable(params: {
        table_name: string;
        quick?: boolean;
        extended?: boolean;
        use_frm?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    truncateTable(params: {
        table_name: string;
        database?: string;
    }): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
    getTableStatus(params: {
        table_name?: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    flushTable(params: {
        table_name?: string;
        with_read_lock?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
    getTableSize(params: {
        table_name?: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    showProcessList(params?: {
        full?: boolean;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    killProcess(params: {
        process_id: number;
        type?: "CONNECTION" | "QUERY";
    }): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
    showStatus(params?: {
        like?: string;
        global?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    showVariables(params?: {
        like?: string;
        global?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    explainQuery(params: {
        query: string;
        format?: "TRADITIONAL" | "JSON" | "TREE";
        analyze?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    showEngineStatus(params?: {
        engine?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    getServerInfo(): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    showBinaryLogs(): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    showReplicationStatus(params?: {
        type?: "MASTER" | "REPLICA" | "SLAVE";
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    getPerformanceMetrics(): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    getTopQueriesByTime(params?: {
        limit?: number;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    getTopQueriesByCount(params?: {
        limit?: number;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    getSlowQueries(params?: {
        limit?: number;
        threshold_seconds?: number;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    getTableIOStats(params?: {
        limit?: number;
        table_schema?: string;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    getIndexUsageStats(params?: {
        limit?: number;
        table_schema?: string;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    getUnusedIndexes(params?: {
        table_schema?: string;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    getConnectionPoolStats(): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    getDatabaseHealthCheck(): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    resetPerformanceStats(): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
    buildQueryFromIntent(params: {
        natural_language: string;
        context?: "analytics" | "reporting" | "data_entry" | "schema_exploration";
        max_complexity?: "simple" | "medium" | "complex";
        safety_level?: "strict" | "moderate" | "permissive";
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            generated_sql: string;
            explanation: string;
            tables_involved: string[];
            columns_involved: string[];
            estimated_complexity: string;
            safety_notes: string[];
            optimization_hints: string[];
            alternatives?: string[];
        };
        error?: string;
    }>;
    suggestQueryImprovements(params: {
        query: string;
        optimization_goal?: "speed" | "memory" | "readability";
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            original_query: string;
            suggestions: Array<{
                type: string;
                description: string;
                improved_query?: string;
            }>;
            estimated_improvement: string;
        };
        error?: string;
    }>;
    smartSearch(params: {
        search_term: string;
        search_type?: "column" | "table" | "data_pattern" | "relationship" | "all";
        similarity_threshold?: number;
        include_sample_data?: boolean;
        max_results?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            search_term: string;
            search_type: string;
            results: {
                tables: Array<{
                    name: string;
                    relevance_score: number;
                    match_reason: string;
                    column_count: number;
                    row_estimate: number;
                    matching_columns?: string[];
                }>;
                columns: Array<{
                    table_name: string;
                    column_name: string;
                    data_type: string;
                    relevance_score: number;
                    match_reason: string;
                    sample_values?: any[];
                }>;
                data_patterns: Array<{
                    table_name: string;
                    column_name: string;
                    pattern_type: string;
                    description: string;
                    sample_matches?: any[];
                }>;
                relationships: Array<{
                    from_table: string;
                    from_column: string;
                    to_table: string;
                    to_column: string;
                    relationship_type: string;
                    confidence: number;
                }>;
            };
            total_matches: number;
            search_time_ms: number;
        };
        error?: string;
    }>;
    findSimilarColumns(params: {
        column_name?: string;
        table_name?: string;
        include_data_comparison?: boolean;
        max_results?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            reference_column?: {
                table: string;
                column: string;
                data_type: string;
            };
            similar_columns: Array<{
                table_name: string;
                column_name: string;
                data_type: string;
                similarity_score: number;
                similarity_type: string;
                data_overlap_percentage?: number;
            }>;
            potential_joins: Array<{
                table1: string;
                column1: string;
                table2: string;
                column2: string;
                confidence: number;
                reason: string;
            }>;
        };
        error?: string;
    }>;
    discoverDataPatterns(params: {
        table_name: string;
        pattern_types?: Array<"unique" | "null" | "duplicate" | "format" | "range">;
        max_columns?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            table_name: string;
            patterns: Array<{
                column_name: string;
                pattern_type: string;
                description: string;
                metrics?: Record<string, any>;
                recommendations?: string[];
            }>;
            summary: {
                columns_analyzed: number;
                patterns_found: number;
                data_quality_score: number;
            };
        };
        error?: string;
    }>;
    generateDocumentation(params: {
        scope?: "database" | "table" | "column" | "relationship";
        table_name?: string;
        include_business_glossary?: boolean;
        format?: "markdown" | "html" | "json";
        include_examples?: boolean;
        include_statistics?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            format: string;
            scope: string;
            content: string;
            metadata: {
                generated_at: string;
                database: string;
                tables_documented: number;
                columns_documented: number;
            };
        };
        error?: string;
    }>;
    generateDataDictionary(params: {
        table_name: string;
        include_sample_values?: boolean;
        include_constraints?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            table_name: string;
            description: string;
            columns: Array<{
                name: string;
                data_type: string;
                description: string;
                constraints: string[];
                is_nullable: boolean;
                default_value: string | null;
                sample_values?: any[];
                business_term?: string;
            }>;
            primary_key: string[];
            foreign_keys: Array<{
                column: string;
                references_table: string;
                references_column: string;
            }>;
            indexes: Array<{
                name: string;
                columns: string[];
                is_unique: boolean;
            }>;
        };
        error?: string;
    }>;
    generateBusinessGlossary(params: {
        include_descriptions?: boolean;
        group_by?: "table" | "category" | "alphabetical";
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            glossary: Array<{
                term: string;
                technical_name: string;
                source_table: string;
                data_type: string;
                description: string;
                category: string;
                related_terms?: string[];
            }>;
            categories: string[];
            total_terms: number;
        };
        error?: string;
    }>;
    designSchemaFromRequirements(params: {
        requirements_text: string;
        entities?: Array<{
            name: string;
            fields?: string[];
        }>;
        naming_convention?: "snake_case" | "camelCase";
        include_audit_columns?: boolean;
        id_type?: "BIGINT" | "UUID";
        engine?: string;
        charset?: string;
        collation?: string;
    }): Promise<{
        status: string;
        data?: {
            input: {
                requirements_text: string;
                inferred_entities_count: number;
            };
            tables: Array<{
                table_name: string;
                columns: Array<{
                    name: string;
                    type: string;
                    nullable: boolean;
                    primary_key?: boolean;
                    unique?: boolean;
                    references?: {
                        table: string;
                        column: string;
                    };
                }>;
                indexes: Array<{
                    name: string;
                    columns: string[];
                    unique?: boolean;
                }>;
            }>;
            relationships: Array<{
                from_table: string;
                from_column: string;
                to_table: string;
                to_column: string;
                type: "one_to_many" | "many_to_one";
            }>;
            ddl_statements: string[];
            notes: string[];
        };
        error?: string;
    }>;
    auditDatabaseSecurity(params?: {
        database?: string;
        include_user_account_checks?: boolean;
        include_privilege_checks?: boolean;
    }): Promise<{
        status: string;
        data?: {
            database: string;
            findings: Array<{
                severity: "critical" | "medium" | "info" | "low" | "high";
                title: string;
                evidence?: string;
                recommendation: string;
            }>;
            summary: {
                critical: number;
                high: number;
                medium: number;
                low: number;
                info: number;
            };
            notes: string[];
        };
        error?: string;
    }>;
    recommendIndexes(params?: {
        database?: string;
        max_query_patterns?: number;
        max_recommendations?: number;
        min_execution_count?: number;
        min_avg_time_ms?: number;
        include_unused_index_warnings?: boolean;
    }): Promise<{
        status: string;
        data?: {
            database: string;
            analyzed_query_patterns: number;
            recommendations: Array<{
                table_name: string;
                columns: string[];
                proposed_index_name: string;
                create_index_sql: string;
                reason: string;
                supporting_query_patterns: Array<{
                    query_pattern: string;
                    execution_count: number;
                    avg_execution_time_ms: number;
                }>;
            }>;
            unused_index_warnings?: Array<{
                table_schema: string;
                table_name: string;
                index_name: string;
                note: string;
            }>;
            notes: string[];
        };
        error?: string;
    }>;
    generateTestData(params: {
        table_name: string;
        row_count: number;
        batch_size?: number;
        include_nulls?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    analyzeSchemaPatterns(params?: {
        scope?: "database" | "table";
        table_name?: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    visualizeQuery(params: {
        query: string;
        include_explain_json?: boolean;
        format?: "mermaid" | "json" | "both";
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    predictQueryPerformance(params: {
        query: string;
        row_growth_multiplier?: number;
        per_table_row_growth?: Record<string, number>;
        include_explain_json?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    forecastDatabaseGrowth(params?: {
        horizon_days?: number;
        growth_rate_percent_per_day?: number;
        growth_rate_percent_per_month?: number;
        per_table_growth_rate_percent_per_day?: Record<string, number>;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    startQueryBuilder(params: {
        intent: string;
        context?: "analytics" | "reporting" | "data_entry" | "schema_exploration";
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            session_id: string;
            current_step: string;
            suggestions: string[];
            template_suggestions?: import("./tools/smartQueryBuilderTools").QueryTemplate[];
            next_actions: string[];
        };
        error?: string;
    }>;
    addTablesToQuery(params: {
        session_id: string;
        tables: string[];
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            session_id: string;
            current_step: string;
            added_tables: string[];
            suggested_joins: Array<{
                from_table: string;
                to_table: string;
                on_column: string;
                join_type: string;
            }>;
            next_actions: string[];
        };
        error?: string;
    }>;
    defineJoins(params: {
        session_id: string;
        joins: Array<{
            from_table: string;
            from_column: string;
            to_table: string;
            to_column: string;
            join_type?: "INNER" | "LEFT" | "RIGHT" | "FULL";
        }>;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            session_id: string;
            current_step: string;
            added_joins: number;
            next_actions: string[];
        };
        error?: string;
    }>;
    selectColumns(params: {
        session_id: string;
        columns: Array<{
            table: string;
            column: string;
            alias?: string;
        }>;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            session_id: string;
            current_step: string;
            selected_columns: number;
            next_actions: string[];
        };
        error?: string;
    }>;
    addConditions(params: {
        session_id: string;
        conditions: Array<{
            table: string;
            column: string;
            operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "in" | "not_in" | "is_null" | "is_not_null";
            value?: any;
            values?: any[];
        }>;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            session_id: string;
            current_step: string;
            added_conditions: number;
            next_actions: string[];
        };
        error?: string;
    }>;
    addAggregations(params: {
        session_id: string;
        aggregations: Array<{
            function: "COUNT" | "SUM" | "AVG" | "MIN" | "MAX";
            column: string;
            alias: string;
            table: string;
        }>;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            session_id: string;
            current_step: string;
            added_aggregations: number;
            next_actions: string[];
        };
        error?: string;
    }>;
    configureGroupingAndOrdering(params: {
        session_id: string;
        group_by?: Array<{
            table: string;
            column: string;
        }>;
        order_by?: Array<{
            table: string;
            column: string;
            direction: "asc" | "desc";
        }>;
        limit?: number;
        offset?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            session_id: string;
            current_step: string;
            next_actions: string[];
        };
        error?: string;
    }>;
    previewQuery(params: {
        session_id: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            session_id: string;
            generated_query: string;
            query_complexity: "simple" | "medium" | "complex";
            estimated_rows?: number;
            optimization_suggestions: string[];
            current_step: string;
        };
        error?: string;
    }>;
    executeQuery(params: {
        session_id: string;
        dry_run?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            session_id: string;
            executed_query: string;
            results?: any[];
            execution_time?: number;
            row_count?: number;
            is_dry_run: boolean;
        };
        error?: string;
    }>;
    getSessionState(params: {
        session_id: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            session: import("./tools/smartQueryBuilderTools").QueryBuilderSession;
            current_step: string;
            progress: {
                tables_selected: boolean;
                joins_defined: boolean;
                columns_selected: boolean;
                conditions_added: boolean;
                aggregations_added: boolean;
                grouping_configured: boolean;
                ready_to_execute: boolean;
            };
        };
        error?: string;
    }>;
    getQueryTemplates(params: {
        category?: "analytics" | "reporting" | "data_entry" | "schema_exploration";
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            templates: import("./tools/smartQueryBuilderTools").QueryTemplate[];
            total_count: number;
        };
        error?: string;
    }>;
    applyQueryTemplate(params: {
        session_id: string;
        template_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            session_id: string;
            applied_template: string;
            suggested_tables: string[];
            next_actions: string[];
        };
        error?: string;
    }>;
    suggestNextStep(params: {
        session_id: string;
        user_input?: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            session_id: string;
            current_step: string;
            suggestions: Array<{
                type: "action" | "table" | "column" | "condition" | "template";
                description: string;
                command?: string;
                parameters?: any;
            }>;
            next_actions: string[];
        };
        error?: string;
    }>;
    endSession(params: {
        session_id: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            session_id: string;
            session_ended: boolean;
            final_query?: string;
        };
        error?: string;
    }>;
    createFulltextIndex(params: {
        table_name: string;
        columns: string[];
        index_name?: string;
        parser?: "ngram" | "mecab";
        ngram_token_size?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    fulltextSearch(params: {
        table_name: string;
        search_term: string;
        columns?: string[];
        mode?: "natural_language" | "natural_language_with_query_expansion" | "boolean" | "query_expansion";
        limit?: number;
        offset?: number;
        order_by?: string;
        order_direction?: "ASC" | "DESC";
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    getFulltextInfo(params: {
        table_name: string;
        index_name?: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    dropFulltextIndex(params: {
        table_name: string;
        index_name?: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    getFulltextStats(params: {
        table_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    optimizeFulltext(params: {
        table_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
export default MySQLMCP;
