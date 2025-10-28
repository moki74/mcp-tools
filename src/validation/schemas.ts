import Ajv from 'ajv';

const ajv = new Ajv();

// Common interfaces
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

// Schema definitions
export const listTablesSchema = {
  type: 'object',
  properties: {
    database: { type: 'string', nullable: true }
  },
  additionalProperties: false
};

export const readTableSchemaSchema = {
  type: 'object',
  required: ['table_name'],
  properties: {
    table_name: { type: 'string' }
  },
  additionalProperties: false
};

export const createRecordSchema = {
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

export const readRecordsSchema = {
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

export const updateRecordSchema = {
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

export const deleteRecordSchema = {
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

export const runQuerySchema = {
  type: 'object',
  required: ['query'],
  properties: {
    query: { type: 'string' },
    params: { 
      type: 'array',
      items: {},
      nullable: true
    }
  },
  additionalProperties: false
};

// SQL execution schema
export const executeSqlSchema = {
  type: 'object',
  required: ['query'],
  properties: {
    query: { type: 'string' },
    params: { 
      type: 'array',
      items: {},
      nullable: true
    }
  },
  additionalProperties: false
};

// DDL schemas
export const createTableSchema = {
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

export const alterTableSchema = {
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

export const dropTableSchema = {
  type: 'object',
  required: ['table_name'],
  properties: {
    table_name: { type: 'string' },
    if_exists: { type: 'boolean' }
  },
  additionalProperties: false
};

export const executeDdlSchema = {
  type: 'object',
  required: ['query'],
  properties: {
    query: { type: 'string' }
  },
  additionalProperties: false
};

export const getTableRelationshipsSchema = {
  type: 'object',
  required: ['table_name'],
  properties: {
    table_name: { type: 'string' }
  },
  additionalProperties: false
};

// Transaction Schemas
export const beginTransactionSchema = {
  type: 'object',
  properties: {
    transactionId: { type: 'string', nullable: true }
  },
  additionalProperties: false
};

export const commitTransactionSchema = {
  type: 'object',
  required: ['transactionId'],
  properties: {
    transactionId: { type: 'string' }
  },
  additionalProperties: false
};

export const rollbackTransactionSchema = {
  type: 'object',
  required: ['transactionId'],
  properties: {
    transactionId: { type: 'string' }
  },
  additionalProperties: false
};

export const getTransactionStatusSchema = {
  type: 'object',
  properties: {},
  additionalProperties: false
};

export const executeInTransactionSchema = {
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
export const listStoredProceduresSchema = {
  type: 'object',
  properties: {
    database: { type: 'string', nullable: true }
  },
  additionalProperties: false
};

export const getStoredProcedureInfoSchema = {
  type: 'object',
  required: ['procedure_name'],
  properties: {
    procedure_name: { type: 'string' },
    database: { type: 'string', nullable: true }
  },
  additionalProperties: false
};

export const executeStoredProcedureSchema = {
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

export const createStoredProcedureSchema = {
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

export const dropStoredProcedureSchema = {
  type: 'object',
  required: ['procedure_name'],
  properties: {
    procedure_name: { type: 'string' },
    if_exists: { type: 'boolean', nullable: true },
    database: { type: 'string', nullable: true }
  },
  additionalProperties: false
};

export const showCreateProcedureSchema = {
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
export const exportTableToCsvSchema = {
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

export const exportQueryToCsvSchema = {
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
export const validateListTables = ajv.compile(listTablesSchema);
export const validateReadTableSchema = ajv.compile(readTableSchemaSchema);
export const validateCreateRecord = ajv.compile(createRecordSchema);
export const validateReadRecords = ajv.compile(readRecordsSchema);
export const validateUpdateRecord = ajv.compile(updateRecordSchema);
export const validateDeleteRecord = ajv.compile(deleteRecordSchema);
export const validateBulkInsert = ajv.compile(bulkInsertSchema);
export const validateBulkUpdate = ajv.compile(bulkUpdateSchema);
export const validateBulkDelete = ajv.compile(bulkDeleteSchema);
export const validateRunQuery = ajv.compile(runQuerySchema);
export const validateExecuteSql = ajv.compile(executeSqlSchema);
export const validateCreateTable = ajv.compile(createTableSchema);
export const validateAlterTable = ajv.compile(alterTableSchema);
export const validateDropTable = ajv.compile(dropTableSchema);
export const validateExecuteDdl = ajv.compile(executeDdlSchema);
export const validateBeginTransaction = ajv.compile(beginTransactionSchema);
export const validateCommitTransaction = ajv.compile(commitTransactionSchema);
export const validateRollbackTransaction = ajv.compile(rollbackTransactionSchema);
export const validateExecuteInTransaction = ajv.compile(executeInTransactionSchema);
export const validateListStoredProcedures = ajv.compile(listStoredProceduresSchema);
export const validateGetStoredProcedureInfo = ajv.compile(getStoredProcedureInfoSchema);
export const validateExecuteStoredProcedure = ajv.compile(executeStoredProcedureSchema);
export const validateCreateStoredProcedure = ajv.compile(createStoredProcedureSchema);
export const validateDropStoredProcedure = ajv.compile(dropStoredProcedureSchema);
export const validateShowCreateProcedure = ajv.compile(showCreateProcedureSchema);
export const validateStoredProcedureExecution = ajv.compile(executeStoredProcedureSchema);
export const validateStoredProcedureCreation = ajv.compile(createStoredProcedureSchema);
export const validateGetTableRelationships = ajv.compile(getTableRelationshipsSchema);
export const validateExportTableToCsv = ajv.compile(exportTableToCsvSchema);
export const validateExportQueryToCsv = ajv.compile(exportQueryToCsvSchema);