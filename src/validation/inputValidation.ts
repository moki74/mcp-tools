import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

// Initialize AJV with formats
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Validation schemas
const createRecordSchema = {
  type: 'object',
  properties: {
    table_name: {
      type: 'string',
      minLength: 1,
      maxLength: 64,
      pattern: '^[a-zA-Z_][a-zA-Z0-9_]*$'
    },
    data: {
      type: 'object',
      minProperties: 1
    }
  },
  required: ['table_name', 'data'],
  additionalProperties: false
};

const readRecordsSchema = {
  type: 'object',
  properties: {
    table_name: {
      type: 'string',
      minLength: 1,
      maxLength: 64,
      pattern: '^[a-zA-Z_][a-zA-Z0-9_]*$'
    },
    filters: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            minLength: 1,
            maxLength: 64,
            pattern: '^[a-zA-Z_][a-zA-Z0-9_]*$'
          },
          operator: {
            type: 'string',
            enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'in']
          },
          value: {
            oneOf: [
              { type: 'string' },
              { type: 'number' },
              { type: 'boolean' },
              { type: 'null' },
              { type: 'array' }
            ]
          }
        },
        required: ['field', 'operator', 'value'],
        additionalProperties: false
      },
      maxItems: 50
    },
    pagination: {
      type: 'object',
      properties: {
        page: {
          type: 'integer',
          minimum: 1,
          maximum: 10000
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 1000
        }
      },
      required: ['page', 'limit'],
      additionalProperties: false
    },
    sorting: {
      type: 'object',
      properties: {
        field: {
          type: 'string',
          minLength: 1,
          maxLength: 64,
          pattern: '^[a-zA-Z_][a-zA-Z0-9_]*$'
        },
        direction: {
          type: 'string',
          enum: ['asc', 'desc']
        }
      },
      required: ['field', 'direction'],
      additionalProperties: false
    }
  },
  required: ['table_name'],
  additionalProperties: false
};

const updateRecordSchema = {
  type: 'object',
  properties: {
    table_name: {
      type: 'string',
      minLength: 1,
      maxLength: 64,
      pattern: '^[a-zA-Z_][a-zA-Z0-9_]*$'
    },
    data: {
      type: 'object',
      minProperties: 1
    },
    conditions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            minLength: 1,
            maxLength: 64,
            pattern: '^[a-zA-Z_][a-zA-Z0-9_]*$'
          },
          operator: {
            type: 'string',
            enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'in']
          },
          value: {
            oneOf: [
              { type: 'string' },
              { type: 'number' },
              { type: 'boolean' },
              { type: 'null' },
              { type: 'array' }
            ]
          }
        },
        required: ['field', 'operator', 'value'],
        additionalProperties: false
      },
      minItems: 1,
      maxItems: 50
    }
  },
  required: ['table_name', 'data', 'conditions'],
  additionalProperties: false
};

const deleteRecordSchema = {
  type: 'object',
  properties: {
    table_name: {
      type: 'string',
      minLength: 1,
      maxLength: 64,
      pattern: '^[a-zA-Z_][a-zA-Z0-9_]*$'
    },
    conditions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            minLength: 1,
            maxLength: 64,
            pattern: '^[a-zA-Z_][a-zA-Z0-9_]*$'
          },
          operator: {
            type: 'string',
            enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'in']
          },
          value: {
            oneOf: [
              { type: 'string' },
              { type: 'number' },
              { type: 'boolean' },
              { type: 'null' },
              { type: 'array' }
            ]
          }
        },
        required: ['field', 'operator', 'value'],
        additionalProperties: false
      },
      minItems: 1,
      maxItems: 50
    }
  },
  required: ['table_name', 'conditions'],
  additionalProperties: false
};

const querySchema = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      minLength: 1,
      maxLength: 100000
    },
    params: {
      type: 'array',
      maxItems: 1000
    }
  },
  required: ['query'],
  additionalProperties: false
};

const bulkInsertSchema = {
  type: 'object',
  properties: {
    table_name: {
      type: 'string',
      minLength: 1,
      maxLength: 64,
      pattern: '^[a-zA-Z_][a-zA-Z0-9_]*$'
    },
    data: {
      type: 'array',
      items: {
        type: 'object',
        minProperties: 1
      },
      minItems: 1,
      maxItems: 10000
    },
    batch_size: {
      type: 'integer',
      minimum: 1,
      maximum: 1000,
      nullable: true
    }
  },
  required: ['table_name', 'data'],
  additionalProperties: false
};

// Compile validators
const createRecordValidator = ajv.compile(createRecordSchema);
const readRecordsValidator = ajv.compile(readRecordsSchema);
const updateRecordValidator = ajv.compile(updateRecordSchema);
const deleteRecordValidator = ajv.compile(deleteRecordSchema);
const queryValidator = ajv.compile(querySchema);
const bulkInsertValidator = ajv.compile(bulkInsertSchema);

// Validation functions
export function validateCreateRecord(data: any): { valid: boolean; errors?: string[] } {
  const valid = createRecordValidator(data);
  if (!valid) {
    return {
      valid: false,
      errors: formatErrors(createRecordValidator.errors || [])
    };
  }
  return { valid: true };
}

export function validateReadRecords(data: any): { valid: boolean; errors?: string[] } {
  const valid = readRecordsValidator(data);
  if (!valid) {
    return {
      valid: false,
      errors: formatErrors(readRecordsValidator.errors || [])
    };
  }
  return { valid: true };
}

export function validateUpdateRecord(data: any): { valid: boolean; errors?: string[] } {
  const valid = updateRecordValidator(data);
  if (!valid) {
    return {
      valid: false,
      errors: formatErrors(updateRecordValidator.errors || [])
    };
  }
  return { valid: true };
}

export function validateDeleteRecord(data: any): { valid: boolean; errors?: string[] } {
  const valid = deleteRecordValidator(data);
  if (!valid) {
    return {
      valid: false,
      errors: formatErrors(deleteRecordValidator.errors || [])
    };
  }
  return { valid: true };
}

export function validateQuery(data: any): { valid: boolean; errors?: string[] } {
  const valid = queryValidator(data);
  if (!valid) {
    return {
      valid: false,
      errors: formatErrors(queryValidator.errors || [])
    };
  }
  return { valid: true };
}

export function validateBulkInsert(data: any): { valid: boolean; errors?: string[] } {
  const valid = bulkInsertValidator(data);
  if (!valid) {
    return {
      valid: false,
      errors: formatErrors(bulkInsertValidator.errors || [])
    };
  }
  return { valid: true };
}

// Helper function to format AJV errors
function formatErrors(errors: ErrorObject[]): string[] {
  return errors.map(error => {
    const field = error.instancePath || error.schemaPath || 'root';
    const message = error.message || 'Invalid value';
    const errorMessage = (error.schema as any)?.errorMessage || message;
    return `${field}: ${errorMessage}`;
  });
}

// Sanitization functions
export function sanitizeTableName(tableName: string): string {
  // Remove any characters that aren't valid MySQL identifiers
  return tableName.replace(/[^a-zA-Z0-9_]/g, '').replace(/^[^a-zA-Z_]/, '');
}

export function sanitizeFieldName(fieldName: string): string {
  // Remove any characters that aren't valid MySQL identifiers
  return fieldName.replace(/[^a-zA-Z0-9_]/g, '').replace(/^[^a-zA-Z_]/, '');
}

export function sanitizeQuery(query: string): string {
  // Basic query sanitization - remove potential control characters
  return query.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

// Input size limits
export const INPUT_LIMITS = {
  MAX_QUERY_LENGTH: 100000,
  MAX_BATCH_SIZE: 10000,
  MAX_FILTERS: 50,
  MAX_PARAMETERS: 1000,
  MAX_STRING_LENGTH: 65535,
  MAX_TABLE_NAME_LENGTH: 64,
  MAX_FIELD_NAME_LENGTH: 64
};