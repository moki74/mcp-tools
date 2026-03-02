"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartQueryBuilderTools = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const config_1 = require("../config/config");
const queryTemplates = [
    {
        name: "Customer Analysis",
        description: "Analyze customer behavior and purchasing patterns",
        intent_patterns: ["customer analysis", "customer behavior", "purchasing patterns", "customer trends"],
        template_state: {
            context: "analytics",
            tables: ["customers", "orders"],
            aggregations: [
                { function: "COUNT", column: "id", alias: "order_count", table: "orders" },
                { function: "SUM", column: "total", alias: "total_spent", table: "orders" }
            ],
            group_by: [
                { table: "customers", column: "id" }
            ]
        },
        common_use_cases: ["Customer lifetime value", "Purchase frequency", "Customer segmentation"]
    },
    {
        name: "Sales Reporting",
        description: "Generate sales reports with time-based analysis",
        intent_patterns: ["sales report", "revenue analysis", "sales trends", "monthly sales"],
        template_state: {
            context: "reporting",
            tables: ["orders", "products"],
            aggregations: [
                { function: "SUM", column: "total", alias: "revenue", table: "orders" },
                { function: "COUNT", column: "id", alias: "order_count", table: "orders" }
            ],
            group_by: [
                { table: "orders", column: "created_at" }
            ]
        },
        common_use_cases: ["Monthly revenue", "Product performance", "Sales by region"]
    },
    {
        name: "Product Analytics",
        description: "Analyze product performance and inventory",
        intent_patterns: ["product analysis", "inventory", "product performance", "stock analysis"],
        template_state: {
            context: "analytics",
            tables: ["products", "order_items"],
            aggregations: [
                { function: "SUM", column: "quantity", alias: "total_sold", table: "order_items" },
                { function: "COUNT", column: "id", alias: "order_count", table: "order_items" }
            ],
            group_by: [
                { table: "products", column: "id" }
            ]
        },
        common_use_cases: ["Best selling products", "Inventory turnover", "Product profitability"]
    }
];
const activeSessions = new Map();
class SmartQueryBuilderTools {
    constructor(security) {
        this.db = connection_1.default.getInstance();
        this.security = security;
    }
    validateDatabaseAccess(requestedDatabase) {
        const connectedDatabase = config_1.dbConfig.database;
        if (!connectedDatabase) {
            return {
                valid: false,
                database: "",
                error: "No database specified in connection string. Cannot access any database.",
            };
        }
        if (!requestedDatabase) {
            return {
                valid: true,
                database: connectedDatabase,
            };
        }
        if (requestedDatabase !== connectedDatabase) {
            return {
                valid: false,
                database: "",
                error: `Access denied. You can only access the connected database '${connectedDatabase}'. Requested database '${requestedDatabase}' is not allowed.`,
            };
        }
        return {
            valid: true,
            database: connectedDatabase,
        };
    }
    async getDatabaseSchema(database) {
        const tables = await this.db.query(`SELECT TABLE_NAME, TABLE_ROWS 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`, [database]);
        if (!tables.length) {
            return { tables: [], relationships: [] };
        }
        const tableNames = tables.map((t) => t.TABLE_NAME);
        const placeholders = tableNames.map(() => "?").join(",");
        const columns = await this.db.query(`SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_KEY
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${placeholders})
       ORDER BY TABLE_NAME, ORDINAL_POSITION`, [database, ...tableNames]);
        const foreignKeys = await this.db.query(`SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
       FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${placeholders})
         AND REFERENCED_TABLE_NAME IS NOT NULL`, [database, ...tableNames]);
        const tableSchemas = tables.map((table) => {
            const tableCols = columns.filter((c) => c.TABLE_NAME === table.TABLE_NAME);
            return {
                name: table.TABLE_NAME,
                columns: tableCols.map((col) => {
                    const fkRef = foreignKeys.find((fk) => fk.TABLE_NAME === col.TABLE_NAME && fk.COLUMN_NAME === col.COLUMN_NAME);
                    return {
                        name: col.COLUMN_NAME,
                        type: col.DATA_TYPE,
                        is_primary_key: col.COLUMN_KEY === "PRI",
                        is_foreign_key: !!fkRef,
                        referenced_table: fkRef?.REFERENCED_TABLE_NAME,
                        referenced_column: fkRef?.REFERENCED_COLUMN_NAME,
                    };
                }),
                row_count: parseInt(table.TABLE_ROWS || "0", 10) || 0,
            };
        });
        const relationships = foreignKeys.map((fk) => ({
            from_table: fk.TABLE_NAME,
            from_column: fk.COLUMN_NAME,
            to_table: fk.REFERENCED_TABLE_NAME,
            to_column: fk.REFERENCED_COLUMN_NAME,
        }));
        return { tables: tableSchemas, relationships };
    }
    generateSessionId() {
        return `sqb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    findQueryTemplate(intent) {
        const lowerIntent = intent.toLowerCase();
        for (const template of queryTemplates) {
            for (const pattern of template.intent_patterns) {
                if (lowerIntent.includes(pattern.toLowerCase())) {
                    return template;
                }
            }
        }
        return null;
    }
    suggestNextTables(currentTables, availableTables, intent) {
        const template = this.findQueryTemplate(intent);
        if (template && template.template_state.tables) {
            return template.template_state.tables.filter(table => !currentTables.includes(table) && availableTables.includes(table));
        }
        const commonTableCombinations = {
            "customer": ["customers", "users"],
            "order": ["orders", "order_items"],
            "product": ["products", "inventory"],
            "sales": ["sales", "revenue"],
            "payment": ["payments", "transactions"],
            "category": ["categories", "tags"]
        };
        const suggestions = [];
        const lowerIntent = intent.toLowerCase();
        for (const [keyword, relatedTables] of Object.entries(commonTableCombinations)) {
            if (lowerIntent.includes(keyword)) {
                for (const table of relatedTables) {
                    if (!currentTables.includes(table) && availableTables.includes(table)) {
                        suggestions.push(table);
                    }
                }
            }
        }
        return suggestions.slice(0, 3);
    }
    generateQueryFromState(state) {
        let query = "SELECT ";
        if (state.selected_columns.length === 0) {
            query += "*";
        }
        else {
            const columnList = state.selected_columns.map(col => col.alias ? `${col.table}.${col.column} AS ${col.alias}` : `${col.table}.${col.column}`).join(", ");
            query += columnList;
        }
        query += ` FROM ${state.tables[0]}`;
        for (const join of state.joins) {
            query += ` ${join.join_type} JOIN ${join.to_table} ON ${join.from_table}.${join.from_column} = ${join.to_table}.${join.to_column}`;
        }
        if (state.conditions.length > 0) {
            query += " WHERE ";
            const conditionList = state.conditions.map(cond => {
                if (cond.operator === "is_null") {
                    return `${cond.table}.${cond.column} IS NULL`;
                }
                else if (cond.operator === "is_not_null") {
                    return `${cond.table}.${cond.column} IS NOT NULL`;
                }
                else if (cond.operator === "in" || cond.operator === "not_in") {
                    const values = cond.values?.map(v => `'${v}'`).join(", ") || "";
                    const operator = cond.operator === "in" ? "IN" : "NOT IN";
                    return `${cond.table}.${cond.column} ${operator} (${values})`;
                }
                else {
                    const operatorMap = {
                        eq: "=", neq: "!=", gt: ">", gte: ">=", lt: "<", lte: "<=", like: "LIKE"
                    };
                    return `${cond.table}.${cond.column} ${operatorMap[cond.operator]} '${cond.value}'`;
                }
            });
            query += conditionList.join(" AND ");
        }
        if (state.group_by.length > 0) {
            query += " GROUP BY ";
            const groupList = state.group_by.map(gb => `${gb.table}.${gb.column}`).join(", ");
            query += groupList;
        }
        if (state.aggregations.length > 0 && state.group_by.length === 0) {
            query = "SELECT " + state.aggregations.map(agg => `${agg.function}(${agg.table}.${agg.column}) AS ${agg.alias}`).join(", ") + ` FROM ${state.tables[0]}`;
        }
        if (state.conditions.length > 0 && state.aggregations.length > 0) {
            const whereIndex = query.indexOf(" WHERE ");
            if (whereIndex !== -1) {
                query = query.substring(0, whereIndex);
            }
            query += " WHERE ";
            const conditionList = state.conditions.map(cond => {
                const operatorMap = {
                    eq: "=", neq: "!=", gt: ">", gte: ">=", lt: "<", lte: "<=", like: "LIKE", in: "IN", not_in: "NOT IN", is_null: "IS NULL", is_not_null: "IS NOT NULL"
                };
                if (cond.operator === "in" || cond.operator === "not_in") {
                    const values = Array.isArray(cond.values) ? cond.values : [];
                    const valueList = values.map(v => `'${v}'`).join(", ");
                    return `${cond.table}.${cond.column} ${operatorMap[cond.operator]} (${valueList})`;
                }
                else if (cond.operator === "is_null" || cond.operator === "is_not_null") {
                    return `${cond.table}.${cond.column} ${operatorMap[cond.operator]}`;
                }
                else {
                    return `${cond.table}.${cond.column} ${operatorMap[cond.operator]} '${cond.value}'`;
                }
            });
            query += conditionList.join(" AND ");
        }
        if (state.order_by.length > 0) {
            query += " ORDER BY ";
            const orderList = state.order_by.map(ob => `${ob.table}.${ob.column} ${ob.direction.toUpperCase()}`).join(", ");
            query += orderList;
        }
        if (state.limit) {
            query += ` LIMIT ${state.limit}`;
        }
        if (state.offset) {
            query += ` OFFSET ${state.offset}`;
        }
        return query;
    }
    async startQueryBuilder(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { intent, context = "analytics" } = params;
            const database = dbValidation.database;
            if (!intent?.trim()) {
                return {
                    status: "error",
                    error: "intent parameter is required",
                };
            }
            const sessionId = this.generateSessionId();
            const schema = await this.getDatabaseSchema(database);
            const template = this.findQueryTemplate(intent);
            const suggestedTables = template?.template_state.tables || this.suggestNextTables([], schema.tables.map(t => t.name), intent);
            const session = {
                session_id: sessionId,
                current_step: "select_tables",
                state: {
                    session_id: sessionId,
                    intent,
                    context,
                    tables: [],
                    joins: [],
                    conditions: [],
                    aggregations: [],
                    group_by: [],
                    order_by: [],
                    selected_columns: [],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                available_tables: schema.tables,
                relationships: schema.relationships,
                suggestions: [
                    "Start by selecting the main tables you need",
                    "Consider what data you want to analyze",
                    "Think about relationships between tables"
                ],
                errors: []
            };
            activeSessions.set(sessionId, session);
            const nextActions = [
                "Add tables to your query",
                "Use a query template",
                "Get table suggestions"
            ];
            return {
                status: "success",
                data: {
                    session_id: sessionId,
                    current_step: session.current_step,
                    suggestions: session.suggestions,
                    template_suggestions: template ? [template] : [],
                    next_actions: nextActions
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
    async addTablesToQuery(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { session_id, tables } = params;
            if (!session_id || !tables?.length) {
                return {
                    status: "error",
                    error: "session_id and tables parameters are required",
                };
            }
            const session = activeSessions.get(session_id);
            if (!session) {
                return {
                    status: "error",
                    error: "Invalid session_id. Session not found.",
                };
            }
            const validTables = tables.filter(table => session.available_tables.some(t => t.name === table));
            if (validTables.length === 0) {
                return {
                    status: "error",
                    error: "No valid tables provided. Tables must exist in the database.",
                };
            }
            session.state.tables.push(...validTables);
            session.state.updated_at = new Date().toISOString();
            const suggestedJoins = [];
            for (const relationship of session.relationships) {
                if (session.state.tables.includes(relationship.from_table) &&
                    session.state.tables.includes(relationship.to_table)) {
                    suggestedJoins.push({
                        from_table: relationship.from_table,
                        to_table: relationship.to_table,
                        on_column: `${relationship.from_column} = ${relationship.to_column}`,
                        join_type: "INNER"
                    });
                }
            }
            session.current_step = session.state.tables.length > 1 ? "define_joins" : "select_columns";
            const nextActions = session.current_step === "define_joins"
                ? ["Define table joins", "Add more tables", "Select columns"]
                : ["Select columns for output", "Add conditions", "Add aggregations"];
            return {
                status: "success",
                data: {
                    session_id,
                    current_step: session.current_step,
                    added_tables: validTables,
                    suggested_joins: suggestedJoins,
                    next_actions: nextActions
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
    async defineJoins(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { session_id, joins } = params;
            if (!session_id || !joins?.length) {
                return {
                    status: "error",
                    error: "session_id and joins parameters are required",
                };
            }
            const session = activeSessions.get(session_id);
            if (!session) {
                return {
                    status: "error",
                    error: "Invalid session_id. Session not found.",
                };
            }
            const validJoins = joins.filter(join => session.state.tables.includes(join.from_table) &&
                session.state.tables.includes(join.to_table));
            if (validJoins.length === 0) {
                return {
                    status: "error",
                    error: "No valid joins provided. Both tables must be added to the session first.",
                };
            }
            for (const join of validJoins) {
                session.state.joins.push({
                    ...join,
                    join_type: join.join_type || "INNER"
                });
            }
            session.state.updated_at = new Date().toISOString();
            session.current_step = "select_columns";
            const nextActions = [
                "Select columns for output",
                "Add conditions",
                "Add aggregations"
            ];
            return {
                status: "success",
                data: {
                    session_id,
                    current_step: session.current_step,
                    added_joins: validJoins.length,
                    next_actions: nextActions
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
    async selectColumns(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { session_id, columns } = params;
            if (!session_id || !columns?.length) {
                return {
                    status: "error",
                    error: "session_id and columns parameters are required",
                };
            }
            const session = activeSessions.get(session_id);
            if (!session) {
                return {
                    status: "error",
                    error: "Invalid session_id. Session not found.",
                };
            }
            const validColumns = columns.filter(col => {
                const table = session.available_tables.find(t => t.name === col.table);
                return table && table.columns.some(c => c.name === col.column);
            });
            if (validColumns.length === 0) {
                return {
                    status: "error",
                    error: "No valid columns provided. Columns must exist in the selected tables.",
                };
            }
            session.state.selected_columns.push(...validColumns);
            session.state.updated_at = new Date().toISOString();
            session.current_step = "add_conditions";
            const nextActions = [
                "Add conditions to filter data",
                "Add aggregations",
                "Configure grouping and ordering",
                "Preview and finalize query"
            ];
            return {
                status: "success",
                data: {
                    session_id,
                    current_step: session.current_step,
                    selected_columns: validColumns.length,
                    next_actions: nextActions
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
    async addConditions(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { session_id, conditions } = params;
            if (!session_id) {
                return {
                    status: "error",
                    error: "session_id parameter is required",
                };
            }
            const session = activeSessions.get(session_id);
            if (!session) {
                return {
                    status: "error",
                    error: "Invalid session_id. Session not found.",
                };
            }
            const validConditions = (conditions || []).filter(cond => {
                const table = session.available_tables.find(t => t.name === cond.table);
                return table && table.columns.some(c => c.name === cond.column);
            });
            session.state.conditions.push(...validConditions);
            session.state.updated_at = new Date().toISOString();
            session.current_step = "add_aggregations";
            const nextActions = [
                "Add aggregations (COUNT, SUM, AVG, etc.)",
                "Configure grouping and ordering",
                "Preview and finalize query"
            ];
            return {
                status: "success",
                data: {
                    session_id,
                    current_step: session.current_step,
                    added_conditions: validConditions.length,
                    next_actions: nextActions
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
    async addAggregations(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { session_id, aggregations } = params;
            if (!session_id) {
                return {
                    status: "error",
                    error: "session_id parameter is required",
                };
            }
            const session = activeSessions.get(session_id);
            if (!session) {
                return {
                    status: "error",
                    error: "Invalid session_id. Session not found.",
                };
            }
            const validAggregations = (aggregations || []).filter(agg => {
                const table = session.available_tables.find(t => t.name === agg.table);
                return table && table.columns.some(c => c.name === agg.column);
            });
            session.state.aggregations.push(...validAggregations);
            session.state.updated_at = new Date().toISOString();
            session.current_step = "group_order";
            const nextActions = [
                "Configure grouping (GROUP BY)",
                "Configure ordering (ORDER BY)",
                "Set limits",
                "Preview and finalize query"
            ];
            return {
                status: "success",
                data: {
                    session_id,
                    current_step: session.current_step,
                    added_aggregations: validAggregations.length,
                    next_actions: nextActions
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
    async configureGroupingAndOrdering(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { session_id, group_by, order_by, limit, offset } = params;
            if (!session_id) {
                return {
                    status: "error",
                    error: "session_id parameter is required",
                };
            }
            const session = activeSessions.get(session_id);
            if (!session) {
                return {
                    status: "error",
                    error: "Invalid session_id. Session not found.",
                };
            }
            if (group_by) {
                const validGroupBy = group_by.filter(gb => {
                    const table = session.available_tables.find(t => t.name === gb.table);
                    return table && table.columns.some(c => c.name === gb.column);
                });
                session.state.group_by = validGroupBy;
            }
            if (order_by) {
                const validOrderBy = order_by.filter(ob => {
                    const table = session.available_tables.find(t => t.name === ob.table);
                    return table && table.columns.some(c => c.name === ob.column);
                });
                session.state.order_by = validOrderBy;
            }
            if (limit !== undefined) {
                session.state.limit = limit;
            }
            if (offset !== undefined) {
                session.state.offset = offset;
            }
            session.state.updated_at = new Date().toISOString();
            session.current_step = "finalize";
            const nextActions = [
                "Preview generated query",
                "Execute query",
                "Save query template",
                "Start new query"
            ];
            return {
                status: "success",
                data: {
                    session_id,
                    current_step: session.current_step,
                    next_actions: nextActions
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
    async previewQuery(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { session_id } = params;
            if (!session_id) {
                return {
                    status: "error",
                    error: "session_id parameter is required",
                };
            }
            const session = activeSessions.get(session_id);
            if (!session) {
                return {
                    status: "error",
                    error: "Invalid session_id. Session not found.",
                };
            }
            const generatedQuery = this.generateQueryFromState(session.state);
            let complexity = "simple";
            if (session.state.joins.length > 2 || session.state.conditions.length > 3 || session.state.aggregations.length > 2) {
                complexity = "complex";
            }
            else if (session.state.joins.length > 0 || session.state.conditions.length > 0 || session.state.aggregations.length > 0) {
                complexity = "medium";
            }
            const optimizationSuggestions = [];
            if (session.state.tables.length > 3) {
                optimizationSuggestions.push("Consider if all tables are necessary for your analysis");
            }
            if (session.state.conditions.length === 0 && session.state.tables.some(tableName => {
                const tableInfo = session.available_tables.find(t => t.name === tableName);
                return tableInfo && tableInfo.row_count > 100000;
            })) {
                optimizationSuggestions.push("Consider adding conditions to limit result set for large tables");
            }
            if (session.state.selected_columns.length === 0 && session.state.aggregations.length === 0) {
                optimizationSuggestions.push("Consider selecting specific columns instead of using SELECT *");
            }
            if (session.state.aggregations.length > 0 && session.state.group_by.length === 0) {
                optimizationSuggestions.push("Consider adding GROUP BY for aggregation functions");
            }
            return {
                status: "success",
                data: {
                    session_id,
                    generated_query: generatedQuery,
                    query_complexity: complexity,
                    optimization_suggestions: optimizationSuggestions,
                    current_step: session.current_step
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
    async executeQuery(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { session_id, dry_run = false } = params;
            if (!session_id) {
                return {
                    status: "error",
                    error: "session_id parameter is required",
                };
            }
            const session = activeSessions.get(session_id);
            if (!session) {
                return {
                    status: "error",
                    error: "Invalid session_id. Session not found.",
                };
            }
            const generatedQuery = this.generateQueryFromState(session.state);
            if (dry_run) {
                const explainQuery = `EXPLAIN FORMAT=JSON ${generatedQuery}`;
                const explainResult = await this.db.query(explainQuery);
                return {
                    status: "success",
                    data: {
                        session_id,
                        executed_query: generatedQuery,
                        results: explainResult,
                        is_dry_run: true
                    }
                };
            }
            const startTime = Date.now();
            const results = await this.db.query(generatedQuery);
            const executionTime = Date.now() - startTime;
            return {
                status: "success",
                data: {
                    session_id,
                    executed_query: generatedQuery,
                    results,
                    execution_time: executionTime,
                    row_count: results.length,
                    is_dry_run: false
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
    async getSessionState(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { session_id } = params;
            if (!session_id) {
                return {
                    status: "error",
                    error: "session_id parameter is required",
                };
            }
            const session = activeSessions.get(session_id);
            if (!session) {
                return {
                    status: "error",
                    error: "Invalid session_id. Session not found.",
                };
            }
            const progress = {
                tables_selected: session.state.tables.length > 0,
                joins_defined: session.state.joins.length > 0 || session.state.tables.length <= 1,
                columns_selected: session.state.selected_columns.length > 0,
                conditions_added: session.state.conditions.length >= 0,
                aggregations_added: session.state.aggregations.length >= 0,
                grouping_configured: session.state.group_by.length >= 0 && session.state.order_by.length >= 0,
                ready_to_execute: session.state.tables.length > 0
            };
            return {
                status: "success",
                data: {
                    session,
                    current_step: session.current_step,
                    progress
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
    async getQueryTemplates(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { category } = params;
            let filteredTemplates = queryTemplates;
            if (category) {
                filteredTemplates = queryTemplates.filter(template => template.template_state.context === category);
            }
            return {
                status: "success",
                data: {
                    templates: filteredTemplates,
                    total_count: filteredTemplates.length
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
    async applyQueryTemplate(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { session_id, template_name } = params;
            if (!session_id || !template_name) {
                return {
                    status: "error",
                    error: "session_id and template_name parameters are required",
                };
            }
            const session = activeSessions.get(session_id);
            if (!session) {
                return {
                    status: "error",
                    error: "Invalid session_id. Session not found.",
                };
            }
            const template = queryTemplates.find(t => t.name === template_name);
            if (!template) {
                return {
                    status: "error",
                    error: `Template '${template_name}' not found.`,
                };
            }
            if (template.template_state.context) {
                session.state.context = template.template_state.context;
            }
            if (template.template_state.tables) {
                session.state.tables = template.template_state.tables;
            }
            if (template.template_state.aggregations) {
                session.state.aggregations = template.template_state.aggregations;
            }
            if (template.template_state.group_by) {
                session.state.group_by = template.template_state.group_by;
            }
            session.state.updated_at = new Date().toISOString();
            if (session.state.tables.length > 1) {
                session.current_step = "define_joins";
            }
            else if (session.state.tables.length > 0) {
                session.current_step = "select_columns";
            }
            const nextActions = [
                "Review applied template",
                "Add missing tables",
                "Define joins between tables",
                "Customize columns and conditions"
            ];
            return {
                status: "success",
                data: {
                    session_id,
                    applied_template: template.name,
                    suggested_tables: template.template_state.tables || [],
                    next_actions: nextActions
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
    async suggestNextStep(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { session_id, user_input } = params;
            if (!session_id) {
                return {
                    status: "error",
                    error: "session_id parameter is required",
                };
            }
            const session = activeSessions.get(session_id);
            if (!session) {
                return {
                    status: "error",
                    error: "Invalid session_id. Session not found.",
                };
            }
            const suggestions = [];
            switch (session.current_step) {
                case "select_tables":
                    const suggestedTables = this.suggestNextTables(session.state.tables, session.available_tables.map(t => t.name), session.state.intent);
                    suggestedTables.forEach(table => {
                        suggestions.push({
                            type: "table",
                            description: `Add table '${table}' to your query`,
                            command: "addTablesToQuery",
                            parameters: { tables: [table] }
                        });
                    });
                    const template = this.findQueryTemplate(session.state.intent);
                    if (template) {
                        suggestions.push({
                            type: "template",
                            description: `Use '${template.name}' template`,
                            command: "applyQueryTemplate",
                            parameters: { template_name: template.name }
                        });
                    }
                    break;
                case "define_joins":
                    session.relationships.forEach(rel => {
                        if (session.state.tables.includes(rel.from_table) &&
                            session.state.tables.includes(rel.to_table)) {
                            suggestions.push({
                                type: "action",
                                description: `Join ${rel.from_table} with ${rel.to_table}`,
                                command: "defineJoins",
                                parameters: {
                                    joins: [{
                                            from_table: rel.from_table,
                                            from_column: rel.from_column,
                                            to_table: rel.to_table,
                                            to_column: rel.to_column,
                                            join_type: "INNER"
                                        }]
                                }
                            });
                        }
                    });
                    break;
                case "select_columns":
                    session.state.tables.forEach(table => {
                        const tableInfo = session.available_tables.find(t => t.name === table);
                        if (tableInfo) {
                            tableInfo.columns.forEach(column => {
                                if (column.is_primary_key || column.is_foreign_key) {
                                    suggestions.push({
                                        type: "column",
                                        description: `Add ${table}.${column.name} (${column.is_primary_key ? 'Primary Key' : 'Foreign Key'})`,
                                        command: "selectColumns",
                                        parameters: {
                                            columns: [{ table, column: column.name }]
                                        }
                                    });
                                }
                            });
                        }
                    });
                    break;
                case "add_conditions":
                    suggestions.push({
                        type: "condition",
                        description: "Add date range filter",
                        command: "addConditions",
                        parameters: {
                            conditions: [{
                                    table: session.state.tables[0],
                                    column: "created_at",
                                    operator: "gte",
                                    value: "2024-01-01"
                                }]
                        }
                    });
                    break;
                case "add_aggregations":
                    session.state.tables.forEach(table => {
                        const tableInfo = session.available_tables.find(t => t.name === table);
                        if (tableInfo) {
                            tableInfo.columns.forEach(column => {
                                if (column.type.includes("int") || column.type.includes("decimal") || column.type.includes("float")) {
                                    suggestions.push({
                                        type: "action",
                                        description: `Add SUM(${column.name}) aggregation`,
                                        command: "addAggregations",
                                        parameters: {
                                            aggregations: [{
                                                    function: "SUM",
                                                    column: column.name,
                                                    alias: `total_${column.name}`,
                                                    table
                                                }]
                                        }
                                    });
                                }
                            });
                        }
                    });
                    break;
                case "group_order":
                    suggestions.push({
                        type: "action",
                        description: "Order by most recent first",
                        command: "configureGroupingAndOrdering",
                        parameters: {
                            order_by: [{
                                    table: session.state.tables[0],
                                    column: "created_at",
                                    direction: "desc"
                                }]
                        }
                    });
                    break;
                case "finalize":
                    suggestions.push({
                        type: "action",
                        description: "Preview and execute query",
                        command: "previewQuery"
                    });
                    break;
            }
            const nextActions = [
                "Continue with current step",
                "Preview current query",
                "Get session state",
                "Start new session"
            ];
            return {
                status: "success",
                data: {
                    session_id,
                    current_step: session.current_step,
                    suggestions,
                    next_actions: nextActions
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
    async endSession(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { session_id } = params;
            if (!session_id) {
                return {
                    status: "error",
                    error: "session_id parameter is required",
                };
            }
            const session = activeSessions.get(session_id);
            if (!session) {
                return {
                    status: "error",
                    error: "Invalid session_id. Session not found.",
                };
            }
            const finalQuery = this.generateQueryFromState(session.state);
            activeSessions.delete(session_id);
            return {
                status: "success",
                data: {
                    session_id,
                    session_ended: true,
                    final_query: finalQuery
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
}
exports.SmartQueryBuilderTools = SmartQueryBuilderTools;
