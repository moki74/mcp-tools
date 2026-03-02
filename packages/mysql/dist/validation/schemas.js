"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStoredProcedureCreation = exports.validateStoredProcedureExecution = exports.validateShowCreateProcedure = exports.validateDropStoredProcedure = exports.validateCreateStoredProcedure = exports.validateExecuteStoredProcedure = exports.validateGetStoredProcedureInfo = exports.validateListStoredProcedures = exports.validateExecuteInTransaction = exports.validateRollbackTransaction = exports.validateCommitTransaction = exports.validateBeginTransaction = exports.validateExecuteDdl = exports.validateDropTable = exports.validateAlterTable = exports.validateCreateTable = exports.validateBulkDelete = exports.validateBulkUpdate = exports.validateBulkInsert = exports.validateDeleteRecord = exports.validateUpdateRecord = exports.validateReadRecords = exports.validateCreateRecord = exports.validateReadTableSchema = exports.validateListTables = exports.exportQueryToCsvSchema = exports.exportTableToCsvSchema = exports.showCreateProcedureSchema = exports.dropStoredProcedureSchema = exports.createStoredProcedureSchema = exports.executeStoredProcedureSchema = exports.getStoredProcedureInfoSchema = exports.listStoredProceduresSchema = exports.executeInTransactionSchema = exports.getTransactionStatusSchema = exports.rollbackTransactionSchema = exports.commitTransactionSchema = exports.beginTransactionSchema = exports.getAllTablesRelationshipsSchema = exports.getTableRelationshipsSchema = exports.executeDdlSchema = exports.dropTableSchema = exports.alterTableSchema = exports.createTableSchema = exports.deleteRecordSchema = exports.updateRecordSchema = exports.readRecordsSchema = exports.createRecordSchema = exports.readTableSchemaSchema = exports.listTablesSchema = void 0;
exports.validateExportQueryToCsv = exports.validateExportTableToCsv = exports.validateGetAllTablesRelationships = exports.validateGetTableRelationships = void 0;
const ajv_1 = __importDefault(require("ajv"));
const ajv = new ajv_1.default();
// Schema definitions
exports.listTablesSchema = {
    type: 'object',
    properties: {
        database: { type: 'string', nullable: true }
    },
    additionalProperties: false
};
exports.readTableSchemaSchema = {
    type: 'object',
    required: ['table_name'],
    properties: {
        table_name: { type: 'string' }
    },
    additionalProperties: false
};
exports.createRecordSchema = {
    type: 'object',
    required: ['table_name', 'data'],
    properties: {
        table_name: { type: 'string' },
        data: {
            type: 'object',
            additionalProperties: true
        }
    },
    additionalProperties: false
};
exports.readRecordsSchema = {
    type: 'object',
    required: ['table_name'],
    properties: {
        table_name: { type: 'string' },
        filters: {
            type: 'array',
            items: {
                type: 'object',
                required: ['field', 'operator', 'value'],
                properties: {
                    field: { type: 'string' },
                    operator: {
                        type: 'string',
                        enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'in']
                    },
                    value: {}
                }
            },
            nullable: true
        },
        pagination: {
            type: 'object',
            properties: {
                page: { type: 'integer', minimum: 1 },
                limit: { type: 'integer', minimum: 1, maximum: 1000 }
            },
            required: ['page', 'limit'],
            nullable: true
        },
        sorting: {
            type: 'object',
            properties: {
                field: { type: 'string' },
                direction: { type: 'string', enum: ['asc', 'desc'] }
            },
            required: ['field', 'direction'],
            nullable: true
        }
    },
    additionalProperties: false
};
exports.updateRecordSchema = {
    type: 'object',
    required: ['table_name', 'data', 'conditions'],
    properties: {
        table_name: { type: 'string' },
        data: {
            type: 'object',
            additionalProperties: true
        },
        conditions: {
            type: 'array',
            items: {
                type: 'object',
                required: ['field', 'operator', 'value'],
                properties: {
                    field: { type: 'string' },
                    operator: {
                        type: 'string',
                        enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'in']
                    },
                    value: {}
                }
            }
        }
    },
    additionalProperties: false
};
exports.deleteRecordSchema = {
    type: 'object',
    required: ['table_name', 'conditions'],
    properties: {
        table_name: { type: 'string' },
        conditions: {
            type: 'array',
            items: {
                type: 'object',
                required: ['field', 'operator', 'value'],
                properties: {
                    field: { type: 'string' },
                    operator: {
                        type: 'string',
                        enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'in']
                    },
                    value: {}
                }
            }
        }
    },
    additionalProperties: false
};
// Filter condition schema for reuse
const filterConditionSchema = {
    type: 'object',
    required: ['field', 'operator', 'value'],
    properties: {
        field: { type: 'string' },
        operator: {
            type: 'string',
            enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'in']
        },
        value: {}
    },
    additionalProperties: false
};
// Note: runQuerySchema and executeSqlSchema have been removed
// Use runSelectQuerySchema and executeWriteQuerySchema instead
// DDL schemas
exports.createTableSchema = {
    type: 'object',
    required: ['table_name', 'columns'],
    properties: {
        table_name: { type: 'string' },
        columns: {
            type: 'array',
            items: {
                type: 'object',
                required: ['name', 'type'],
                properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    nullable: { type: 'boolean' },
                    primary_key: { type: 'boolean' },
                    auto_increment: { type: 'boolean' },
                    default: { type: 'string' }
                }
            }
        },
        indexes: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    columns: { type: 'array', items: { type: 'string' } },
                    unique: { type: 'boolean' }
                }
            },
            nullable: true
        }
    },
    additionalProperties: false
};
exports.alterTableSchema = {
    type: 'object',
    required: ['table_name', 'operations'],
    properties: {
        table_name: { type: 'string' },
        operations: {
            type: 'array',
            items: {
                type: 'object',
                required: ['type'],
                properties: {
                    type: {
                        type: 'string',
                        enum: ['add_column', 'drop_column', 'modify_column', 'rename_column', 'add_index', 'drop_index']
                    },
                    column_name: { type: 'string' },
                    new_column_name: { type: 'string' },
                    column_type: { type: 'string' },
                    nullable: { type: 'boolean' },
                    default: { type: 'string' },
                    index_name: { type: 'string' },
                    index_columns: { type: 'array', items: { type: 'string' } },
                    unique: { type: 'boolean' }
                }
            }
        }
    },
    additionalProperties: false
};
exports.dropTableSchema = {
    type: 'object',
    required: ['table_name'],
    properties: {
        table_name: { type: 'string' },
        if_exists: { type: 'boolean' }
    },
    additionalProperties: false
};
exports.executeDdlSchema = {
    type: 'object',
    required: ['query'],
    properties: {
        query: { type: 'string' }
    },
    additionalProperties: false
};
exports.getTableRelationshipsSchema = {
    type: 'object',
    required: ['table_name'],
    properties: {
        table_name: { type: 'string' }
    },
    additionalProperties: false
};
exports.getAllTablesRelationshipsSchema = {
    type: 'object',
    required: [],
    properties: {
        database: { type: 'string' }
    },
    additionalProperties: false
};
// Transaction Schemas
exports.beginTransactionSchema = {
    type: 'object',
    properties: {
        transactionId: { type: 'string', nullable: true }
    },
    additionalProperties: false
};
exports.commitTransactionSchema = {
    type: 'object',
    required: ['transactionId'],
    properties: {
        transactionId: { type: 'string' }
    },
    additionalProperties: false
};
exports.rollbackTransactionSchema = {
    type: 'object',
    required: ['transactionId'],
    properties: {
        transactionId: { type: 'string' }
    },
    additionalProperties: false
};
exports.getTransactionStatusSchema = {
    type: 'object',
    properties: {},
    additionalProperties: false
};
exports.executeInTransactionSchema = {
    type: 'object',
    required: ['transactionId', 'query'],
    properties: {
        transactionId: { type: 'string' },
        query: { type: 'string' },
        params: {
            type: 'array',
            items: {},
            nullable: true
        }
    },
    additionalProperties: false
};
// Stored procedure schemas
exports.listStoredProceduresSchema = {
    type: 'object',
    properties: {
        database: { type: 'string', nullable: true }
    },
    additionalProperties: false
};
exports.getStoredProcedureInfoSchema = {
    type: 'object',
    required: ['procedure_name'],
    properties: {
        procedure_name: { type: 'string' },
        database: { type: 'string', nullable: true }
    },
    additionalProperties: false
};
exports.executeStoredProcedureSchema = {
    type: 'object',
    required: ['procedure_name'],
    properties: {
        procedure_name: { type: 'string' },
        parameters: {
            type: 'array',
            items: {},
            nullable: true
        },
        database: { type: 'string', nullable: true }
    },
    additionalProperties: false
};
exports.createStoredProcedureSchema = {
    type: 'object',
    required: ['procedure_name', 'body'],
    properties: {
        procedure_name: { type: 'string' },
        parameters: {
            type: 'array',
            items: {
                type: 'object',
                required: ['name', 'mode', 'data_type'],
                properties: {
                    name: { type: 'string' },
                    mode: { type: 'string', enum: ['IN', 'OUT', 'INOUT'] },
                    data_type: { type: 'string' }
                }
            },
            nullable: true
        },
        body: { type: 'string' },
        comment: { type: 'string', nullable: true },
        database: { type: 'string', nullable: true }
    },
    additionalProperties: false
};
exports.dropStoredProcedureSchema = {
    type: 'object',
    required: ['procedure_name'],
    properties: {
        procedure_name: { type: 'string' },
        if_exists: { type: 'boolean', nullable: true },
        database: { type: 'string', nullable: true }
    },
    additionalProperties: false
};
exports.showCreateProcedureSchema = {
    type: 'object',
    required: ['procedure_name'],
    properties: {
        procedure_name: { type: 'string' },
        database: { type: 'string', nullable: true }
    },
    additionalProperties: false
};
// Bulk Insert Schema
const bulkInsertSchema = {
    type: 'object',
    properties: {
        table_name: { type: 'string', minLength: 1 },
        data: {
            type: 'array',
            minItems: 1,
            items: {
                type: 'object',
                additionalProperties: true
            }
        },
        batch_size: { type: 'number', minimum: 1, maximum: 10000 }
    },
    required: ['table_name', 'data'],
    additionalProperties: false
};
// Bulk Update Schema
const bulkUpdateSchema = {
    type: 'object',
    properties: {
        table_name: { type: 'string', minLength: 1 },
        updates: {
            type: 'array',
            minItems: 1,
            items: {
                type: 'object',
                properties: {
                    data: {
                        type: 'object',
                        additionalProperties: true
                    },
                    conditions: {
                        type: 'array',
                        minItems: 1,
                        items: filterConditionSchema
                    }
                },
                required: ['data', 'conditions'],
                additionalProperties: false
            }
        },
        batch_size: { type: 'number', minimum: 1, maximum: 1000 }
    },
    required: ['table_name', 'updates'],
    additionalProperties: false
};
// Bulk Delete Schema
const bulkDeleteSchema = {
    type: 'object',
    properties: {
        table_name: { type: 'string', minLength: 1 },
        condition_sets: {
            type: 'array',
            minItems: 1,
            items: {
                type: 'array',
                minItems: 1,
                items: filterConditionSchema
            }
        },
        batch_size: { type: 'number', minimum: 1, maximum: 1000 }
    },
    required: ['table_name', 'condition_sets'],
    additionalProperties: false
};
// Data Export schemas
exports.exportTableToCsvSchema = {
    type: 'object',
    required: ['table_name'],
    properties: {
        table_name: { type: 'string' },
        filters: {
            type: 'array',
            items: {
                type: 'object',
                required: ['field', 'operator', 'value'],
                properties: {
                    field: { type: 'string' },
                    operator: {
                        type: 'string',
                        enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'in']
                    },
                    value: {}
                }
            },
            nullable: true
        },
        pagination: {
            type: 'object',
            properties: {
                page: { type: 'integer', minimum: 1 },
                limit: { type: 'integer', minimum: 1, maximum: 10000 }
            },
            required: ['page', 'limit'],
            nullable: true
        },
        sorting: {
            type: 'object',
            properties: {
                field: { type: 'string' },
                direction: { type: 'string', enum: ['asc', 'desc'] }
            },
            required: ['field', 'direction'],
            nullable: true
        },
        include_headers: { type: 'boolean', nullable: true }
    },
    additionalProperties: false
};
exports.exportQueryToCsvSchema = {
    type: 'object',
    required: ['query'],
    properties: {
        query: { type: 'string' },
        params: {
            type: 'array',
            items: {},
            nullable: true
        },
        include_headers: { type: 'boolean', nullable: true }
    },
    additionalProperties: false
};
// Compile validators
exports.validateListTables = ajv.compile(exports.listTablesSchema);
exports.validateReadTableSchema = ajv.compile(exports.readTableSchemaSchema);
exports.validateCreateRecord = ajv.compile(exports.createRecordSchema);
exports.validateReadRecords = ajv.compile(exports.readRecordsSchema);
exports.validateUpdateRecord = ajv.compile(exports.updateRecordSchema);
exports.validateDeleteRecord = ajv.compile(exports.deleteRecordSchema);
exports.validateBulkInsert = ajv.compile(bulkInsertSchema);
exports.validateBulkUpdate = ajv.compile(bulkUpdateSchema);
exports.validateBulkDelete = ajv.compile(bulkDeleteSchema);
exports.validateCreateTable = ajv.compile(exports.createTableSchema);
exports.validateAlterTable = ajv.compile(exports.alterTableSchema);
exports.validateDropTable = ajv.compile(exports.dropTableSchema);
exports.validateExecuteDdl = ajv.compile(exports.executeDdlSchema);
exports.validateBeginTransaction = ajv.compile(exports.beginTransactionSchema);
exports.validateCommitTransaction = ajv.compile(exports.commitTransactionSchema);
exports.validateRollbackTransaction = ajv.compile(exports.rollbackTransactionSchema);
exports.validateExecuteInTransaction = ajv.compile(exports.executeInTransactionSchema);
exports.validateListStoredProcedures = ajv.compile(exports.listStoredProceduresSchema);
exports.validateGetStoredProcedureInfo = ajv.compile(exports.getStoredProcedureInfoSchema);
exports.validateExecuteStoredProcedure = ajv.compile(exports.executeStoredProcedureSchema);
exports.validateCreateStoredProcedure = ajv.compile(exports.createStoredProcedureSchema);
exports.validateDropStoredProcedure = ajv.compile(exports.dropStoredProcedureSchema);
exports.validateShowCreateProcedure = ajv.compile(exports.showCreateProcedureSchema);
exports.validateStoredProcedureExecution = ajv.compile(exports.executeStoredProcedureSchema);
exports.validateStoredProcedureCreation = ajv.compile(exports.createStoredProcedureSchema);
exports.validateGetTableRelationships = ajv.compile(exports.getTableRelationshipsSchema);
exports.validateGetAllTablesRelationships = ajv.compile(exports.getAllTablesRelationshipsSchema);
exports.validateExportTableToCsv = ajv.compile(exports.exportTableToCsvSchema);
exports.validateExportQueryToCsv = ajv.compile(exports.exportQueryToCsvSchema);
