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

// Compile validators
export const validateListTables = ajv.compile(listTablesSchema);
export const validateReadTableSchema = ajv.compile(readTableSchemaSchema);
export const validateCreateRecord = ajv.compile(createRecordSchema);
export const validateReadRecords = ajv.compile(readRecordsSchema);
export const validateUpdateRecord = ajv.compile(updateRecordSchema);
export const validateDeleteRecord = ajv.compile(deleteRecordSchema);
export const validateRunQuery = ajv.compile(runQuerySchema);
export const validateGetTableRelationships = ajv.compile(getTableRelationshipsSchema);