import Ajv, { JSONSchemaType } from 'ajv';

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

// Compile validators
export const validateListTables = ajv.compile(listTablesSchema);
export const validateReadTableSchema = ajv.compile(readTableSchemaSchema);
export const validateCreateRecord = ajv.compile(createRecordSchema);
export const validateReadRecords = ajv.compile(readRecordsSchema);
export const validateUpdateRecord = ajv.compile(updateRecordSchema);
export const validateDeleteRecord = ajv.compile(deleteRecordSchema);
export const validateRunQuery = ajv.compile(runQuerySchema);
export const validateGetTableRelationships = ajv.compile(getTableRelationshipsSchema);
export const validateBeginTransaction = ajv.compile(beginTransactionSchema);
export const validateCommitTransaction = ajv.compile(commitTransactionSchema);
export const validateRollbackTransaction = ajv.compile(rollbackTransactionSchema);
export const validateGetTransactionStatus = ajv.compile(getTransactionStatusSchema);
export const validateExecuteInTransaction = ajv.compile(executeInTransactionSchema);

// Stored procedure validators
export const validateListStoredProcedures = ajv.compile(listStoredProceduresSchema);
export const validateGetStoredProcedureInfo = ajv.compile(getStoredProcedureInfoSchema);
export const validateStoredProcedureExecution = ajv.compile(executeStoredProcedureSchema);
export const validateStoredProcedureCreation = ajv.compile(createStoredProcedureSchema);
export const validateDropStoredProcedure = ajv.compile(dropStoredProcedureSchema);
export const validateShowCreateProcedure = ajv.compile(showCreateProcedureSchema);