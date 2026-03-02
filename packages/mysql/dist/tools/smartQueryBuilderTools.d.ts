import { SecurityLayer } from "../security/securityLayer";
export interface QueryBuildingState {
    session_id: string;
    intent: string;
    context?: "analytics" | "reporting" | "data_entry" | "schema_exploration";
    tables: string[];
    joins: Array<{
        from_table: string;
        from_column: string;
        to_table: string;
        to_column: string;
        join_type: "INNER" | "LEFT" | "RIGHT" | "FULL";
    }>;
    conditions: Array<{
        table: string;
        column: string;
        operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "in" | "not_in" | "is_null" | "is_not_null";
        value?: any;
        values?: any[];
    }>;
    aggregations: Array<{
        function: "COUNT" | "SUM" | "AVG" | "MIN" | "MAX";
        column: string;
        alias: string;
        table: string;
    }>;
    group_by: Array<{
        table: string;
        column: string;
    }>;
    order_by: Array<{
        table: string;
        column: string;
        direction: "asc" | "desc";
    }>;
    limit?: number;
    offset?: number;
    selected_columns: Array<{
        table: string;
        column: string;
        alias?: string;
    }>;
    created_at: string;
    updated_at: string;
}
export interface QueryBuilderSession {
    session_id: string;
    current_step: "start" | "select_tables" | "define_joins" | "select_columns" | "add_conditions" | "add_aggregations" | "group_order" | "finalize";
    state: QueryBuildingState;
    available_tables: Array<{
        name: string;
        columns: Array<{
            name: string;
            type: string;
            is_primary_key: boolean;
            is_foreign_key: boolean;
            referenced_table?: string;
            referenced_column?: string;
        }>;
        row_count: number;
    }>;
    relationships: Array<{
        from_table: string;
        from_column: string;
        to_table: string;
        to_column: string;
    }>;
    suggestions: string[];
    errors: string[];
}
export interface QueryTemplate {
    name: string;
    description: string;
    intent_patterns: string[];
    template_state: Partial<QueryBuildingState>;
    common_use_cases: string[];
}
export declare class SmartQueryBuilderTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    private validateDatabaseAccess;
    private getDatabaseSchema;
    private generateSessionId;
    private findQueryTemplate;
    private suggestNextTables;
    private generateQueryFromState;
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
            template_suggestions?: QueryTemplate[];
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
            session: QueryBuilderSession;
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
            templates: QueryTemplate[];
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
}
