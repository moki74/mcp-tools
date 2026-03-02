export interface TableInfo {
    table_name: string;
}
export interface ColumnInfo {
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_key: string;
    column_default: string | null;
    extra: string;
}
export interface FilterCondition {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';
    value: any;
}
export interface Pagination {
    page: number;
    limit: number;
}
export interface Sorting {
    field: string;
    direction: 'asc' | 'desc';
}
export declare const listTablesSchema: {
    type: string;
    properties: {
        database: {
            type: string;
            nullable: boolean;
        };
    };
    additionalProperties: boolean;
};
export declare const readTableSchemaSchema: {
    type: string;
    required: string[];
    properties: {
        table_name: {
            type: string;
        };
    };
    additionalProperties: boolean;
};
export declare const createRecordSchema: {
    type: string;
    required: string[];
    properties: {
        table_name: {
            type: string;
        };
        data: {
            type: string;
            additionalProperties: boolean;
        };
    };
    additionalProperties: boolean;
};
export declare const readRecordsSchema: {
    type: string;
    required: string[];
    properties: {
        table_name: {
            type: string;
        };
        filters: {
            type: string;
            items: {
                type: string;
                required: string[];
                properties: {
                    field: {
                        type: string;
                    };
                    operator: {
                        type: string;
                        enum: string[];
                    };
                    value: {};
                };
            };
            nullable: boolean;
        };
        pagination: {
            type: string;
            properties: {
                page: {
                    type: string;
                    minimum: number;
                };
                limit: {
                    type: string;
                    minimum: number;
                    maximum: number;
                };
            };
            required: string[];
            nullable: boolean;
        };
        sorting: {
            type: string;
            properties: {
                field: {
                    type: string;
                };
                direction: {
                    type: string;
                    enum: string[];
                };
            };
            required: string[];
            nullable: boolean;
        };
    };
    additionalProperties: boolean;
};
export declare const updateRecordSchema: {
    type: string;
    required: string[];
    properties: {
        table_name: {
            type: string;
        };
        data: {
            type: string;
            additionalProperties: boolean;
        };
        conditions: {
            type: string;
            items: {
                type: string;
                required: string[];
                properties: {
                    field: {
                        type: string;
                    };
                    operator: {
                        type: string;
                        enum: string[];
                    };
                    value: {};
                };
            };
        };
    };
    additionalProperties: boolean;
};
export declare const deleteRecordSchema: {
    type: string;
    required: string[];
    properties: {
        table_name: {
            type: string;
        };
        conditions: {
            type: string;
            items: {
                type: string;
                required: string[];
                properties: {
                    field: {
                        type: string;
                    };
                    operator: {
                        type: string;
                        enum: string[];
                    };
                    value: {};
                };
            };
        };
    };
    additionalProperties: boolean;
};
export declare const createTableSchema: {
    type: string;
    required: string[];
    properties: {
        table_name: {
            type: string;
        };
        columns: {
            type: string;
            items: {
                type: string;
                required: string[];
                properties: {
                    name: {
                        type: string;
                    };
                    type: {
                        type: string;
                    };
                    nullable: {
                        type: string;
                    };
                    primary_key: {
                        type: string;
                    };
                    auto_increment: {
                        type: string;
                    };
                    default: {
                        type: string;
                    };
                };
            };
        };
        indexes: {
            type: string;
            items: {
                type: string;
                properties: {
                    name: {
                        type: string;
                    };
                    columns: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    unique: {
                        type: string;
                    };
                };
            };
            nullable: boolean;
        };
    };
    additionalProperties: boolean;
};
export declare const alterTableSchema: {
    type: string;
    required: string[];
    properties: {
        table_name: {
            type: string;
        };
        operations: {
            type: string;
            items: {
                type: string;
                required: string[];
                properties: {
                    type: {
                        type: string;
                        enum: string[];
                    };
                    column_name: {
                        type: string;
                    };
                    new_column_name: {
                        type: string;
                    };
                    column_type: {
                        type: string;
                    };
                    nullable: {
                        type: string;
                    };
                    default: {
                        type: string;
                    };
                    index_name: {
                        type: string;
                    };
                    index_columns: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    unique: {
                        type: string;
                    };
                };
            };
        };
    };
    additionalProperties: boolean;
};
export declare const dropTableSchema: {
    type: string;
    required: string[];
    properties: {
        table_name: {
            type: string;
        };
        if_exists: {
            type: string;
        };
    };
    additionalProperties: boolean;
};
export declare const executeDdlSchema: {
    type: string;
    required: string[];
    properties: {
        query: {
            type: string;
        };
    };
    additionalProperties: boolean;
};
export declare const getTableRelationshipsSchema: {
    type: string;
    required: string[];
    properties: {
        table_name: {
            type: string;
        };
    };
    additionalProperties: boolean;
};
export declare const getAllTablesRelationshipsSchema: {
    type: string;
    required: never[];
    properties: {
        database: {
            type: string;
        };
    };
    additionalProperties: boolean;
};
export declare const beginTransactionSchema: {
    type: string;
    properties: {
        transactionId: {
            type: string;
            nullable: boolean;
        };
    };
    additionalProperties: boolean;
};
export declare const commitTransactionSchema: {
    type: string;
    required: string[];
    properties: {
        transactionId: {
            type: string;
        };
    };
    additionalProperties: boolean;
};
export declare const rollbackTransactionSchema: {
    type: string;
    required: string[];
    properties: {
        transactionId: {
            type: string;
        };
    };
    additionalProperties: boolean;
};
export declare const getTransactionStatusSchema: {
    type: string;
    properties: {};
    additionalProperties: boolean;
};
export declare const executeInTransactionSchema: {
    type: string;
    required: string[];
    properties: {
        transactionId: {
            type: string;
        };
        query: {
            type: string;
        };
        params: {
            type: string;
            items: {};
            nullable: boolean;
        };
    };
    additionalProperties: boolean;
};
export declare const listStoredProceduresSchema: {
    type: string;
    properties: {
        database: {
            type: string;
            nullable: boolean;
        };
    };
    additionalProperties: boolean;
};
export declare const getStoredProcedureInfoSchema: {
    type: string;
    required: string[];
    properties: {
        procedure_name: {
            type: string;
        };
        database: {
            type: string;
            nullable: boolean;
        };
    };
    additionalProperties: boolean;
};
export declare const executeStoredProcedureSchema: {
    type: string;
    required: string[];
    properties: {
        procedure_name: {
            type: string;
        };
        parameters: {
            type: string;
            items: {};
            nullable: boolean;
        };
        database: {
            type: string;
            nullable: boolean;
        };
    };
    additionalProperties: boolean;
};
export declare const createStoredProcedureSchema: {
    type: string;
    required: string[];
    properties: {
        procedure_name: {
            type: string;
        };
        parameters: {
            type: string;
            items: {
                type: string;
                required: string[];
                properties: {
                    name: {
                        type: string;
                    };
                    mode: {
                        type: string;
                        enum: string[];
                    };
                    data_type: {
                        type: string;
                    };
                };
            };
            nullable: boolean;
        };
        body: {
            type: string;
        };
        comment: {
            type: string;
            nullable: boolean;
        };
        database: {
            type: string;
            nullable: boolean;
        };
    };
    additionalProperties: boolean;
};
export declare const dropStoredProcedureSchema: {
    type: string;
    required: string[];
    properties: {
        procedure_name: {
            type: string;
        };
        if_exists: {
            type: string;
            nullable: boolean;
        };
        database: {
            type: string;
            nullable: boolean;
        };
    };
    additionalProperties: boolean;
};
export declare const showCreateProcedureSchema: {
    type: string;
    required: string[];
    properties: {
        procedure_name: {
            type: string;
        };
        database: {
            type: string;
            nullable: boolean;
        };
    };
    additionalProperties: boolean;
};
export declare const exportTableToCsvSchema: {
    type: string;
    required: string[];
    properties: {
        table_name: {
            type: string;
        };
        filters: {
            type: string;
            items: {
                type: string;
                required: string[];
                properties: {
                    field: {
                        type: string;
                    };
                    operator: {
                        type: string;
                        enum: string[];
                    };
                    value: {};
                };
            };
            nullable: boolean;
        };
        pagination: {
            type: string;
            properties: {
                page: {
                    type: string;
                    minimum: number;
                };
                limit: {
                    type: string;
                    minimum: number;
                    maximum: number;
                };
            };
            required: string[];
            nullable: boolean;
        };
        sorting: {
            type: string;
            properties: {
                field: {
                    type: string;
                };
                direction: {
                    type: string;
                    enum: string[];
                };
            };
            required: string[];
            nullable: boolean;
        };
        include_headers: {
            type: string;
            nullable: boolean;
        };
    };
    additionalProperties: boolean;
};
export declare const exportQueryToCsvSchema: {
    type: string;
    required: string[];
    properties: {
        query: {
            type: string;
        };
        params: {
            type: string;
            items: {};
            nullable: boolean;
        };
        include_headers: {
            type: string;
            nullable: boolean;
        };
    };
    additionalProperties: boolean;
};
export declare const validateListTables: import("ajv").ValidateFunction<{
    database: unknown;
} & {}>;
export declare const validateReadTableSchema: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateCreateRecord: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateReadRecords: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateUpdateRecord: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateDeleteRecord: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateBulkInsert: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateBulkUpdate: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateBulkDelete: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateCreateTable: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateAlterTable: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateDropTable: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateExecuteDdl: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateBeginTransaction: import("ajv").ValidateFunction<{
    transactionId: unknown;
} & {}>;
export declare const validateCommitTransaction: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateRollbackTransaction: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateExecuteInTransaction: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateListStoredProcedures: import("ajv").ValidateFunction<{
    database: unknown;
} & {}>;
export declare const validateGetStoredProcedureInfo: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateExecuteStoredProcedure: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateCreateStoredProcedure: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateDropStoredProcedure: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateShowCreateProcedure: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateStoredProcedureExecution: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateStoredProcedureCreation: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateGetTableRelationships: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateGetAllTablesRelationships: import("ajv").ValidateFunction<unknown>;
export declare const validateExportTableToCsv: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
export declare const validateExportQueryToCsv: import("ajv").ValidateFunction<{
    [x: string]: {};
}>;
