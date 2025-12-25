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
  
  // Additional validation for table name
  if (data && data.table_name && typeof data.table_name === 'string') {
    const tableNameValidation = validateTableName(data.table_name);
    if (!tableNameValidation.valid) {
      return {
        valid: false,
        errors: [tableNameValidation.error || 'Invalid table name']
      };
    }
  }
  
  // Additional validation for data values
  if (data && data.data && typeof data.data === 'object' && data.data !== null) {
    for (const [key, value] of Object.entries(data.data)) {
      if (typeof key === 'string') {
        const fieldValidation = validateFieldName(key);
        if (!fieldValidation.valid) {
          return {
            valid: false,
            errors: [fieldValidation.error || 'Invalid field name']
          };
        }
      }
      
      const valueValidation = validateValue(value);
      if (!valueValidation.valid) {
        return {
          valid: false,
          errors: [valueValidation.error || 'Invalid value']
        };
      }
    }
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
  
  // Additional validation for table name
  if (data && data.table_name && typeof data.table_name === 'string') {
    const tableNameValidation = validateTableName(data.table_name);
    if (!tableNameValidation.valid) {
      return {
        valid: false,
        errors: [tableNameValidation.error || 'Invalid table name']
      };
    }
  }
  
  // Additional validation for filters
  if (data && data.filters && Array.isArray(data.filters)) {
    for (const filter of data.filters) {
      if (filter && filter.field && typeof filter.field === 'string') {
        const fieldValidation = validateFieldName(filter.field);
        if (!fieldValidation.valid) {
          return {
            valid: false,
            errors: [fieldValidation.error || 'Invalid field name']
          };
        }
      }
      
      if (filter && filter.value !== undefined) {
        const valueValidation = validateValue(filter.value);
        if (!valueValidation.valid) {
          return {
            valid: false,
            errors: [valueValidation.error || 'Invalid value']
          };
        }
      }
    }
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
  
  // Additional validation for table name
  if (data && data.table_name && typeof data.table_name === 'string') {
    const tableNameValidation = validateTableName(data.table_name);
    if (!tableNameValidation.valid) {
      return {
        valid: false,
        errors: [tableNameValidation.error || 'Invalid table name']
      };
    }
  }
  
  // Additional validation for data values
  if (data && data.data && typeof data.data === 'object' && data.data !== null) {
    for (const [key, value] of Object.entries(data.data)) {
      if (typeof key === 'string') {
        const fieldValidation = validateFieldName(key);
        if (!fieldValidation.valid) {
          return {
            valid: false,
            errors: [fieldValidation.error || 'Invalid field name']
          };
        }
      }
      
      const valueValidation = validateValue(value);
      if (!valueValidation.valid) {
        return {
          valid: false,
          errors: [valueValidation.error || 'Invalid value']
        };
      }
    }
  }
  
  // Additional validation for conditions
  if (data && data.conditions && Array.isArray(data.conditions)) {
    for (const condition of data.conditions) {
      if (condition && condition.field && typeof condition.field === 'string') {
        const fieldValidation = validateFieldName(condition.field);
        if (!fieldValidation.valid) {
          return {
            valid: false,
            errors: [fieldValidation.error || 'Invalid field name']
          };
        }
      }
      
      if (condition && condition.value !== undefined) {
        const valueValidation = validateValue(condition.value);
        if (!valueValidation.valid) {
          return {
            valid: false,
            errors: [valueValidation.error || 'Invalid value']
          };
        }
      }
    }
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
  
  // Additional validation for table name
  if (data && data.table_name && typeof data.table_name === 'string') {
    const tableNameValidation = validateTableName(data.table_name);
    if (!tableNameValidation.valid) {
      return {
        valid: false,
        errors: [tableNameValidation.error || 'Invalid table name']
      };
    }
  }
  
  // Additional validation for conditions
  if (data && data.conditions && Array.isArray(data.conditions)) {
    for (const condition of data.conditions) {
      if (condition && condition.field && typeof condition.field === 'string') {
        const fieldValidation = validateFieldName(condition.field);
        if (!fieldValidation.valid) {
          return {
            valid: false,
            errors: [fieldValidation.error || 'Invalid field name']
          };
        }
      }
      
      if (condition && condition.value !== undefined) {
        const valueValidation = validateValue(condition.value);
        if (!valueValidation.valid) {
          return {
            valid: false,
            errors: [valueValidation.error || 'Invalid value']
          };
        }
      }
    }
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
  
  // Additional validation for query string
  if (data && data.query && typeof data.query === 'string') {
    const valueValidation = validateValue(data.query);
    if (!valueValidation.valid) {
      return {
        valid: false,
        errors: [valueValidation.error || 'Invalid query']
      };
    }
  }
  
  // Additional validation for parameters
  if (data && data.params && Array.isArray(data.params)) {
    if (data.params.length > INPUT_LIMITS.MAX_PARAMETERS) {
      return {
        valid: false,
        errors: [`Parameters array exceeds maximum length of ${INPUT_LIMITS.MAX_PARAMETERS} items`]
      };
    }
    
    for (const param of data.params) {
      const valueValidation = validateValue(param);
      if (!valueValidation.valid) {
        return {
          valid: false,
          errors: [valueValidation.error || 'Invalid parameter']
        };
      }
    }
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
  
  // Additional validation for table name
  if (data && data.table_name && typeof data.table_name === 'string') {
    const tableNameValidation = validateTableName(data.table_name);
    if (!tableNameValidation.valid) {
      return {
        valid: false,
        errors: [tableNameValidation.error || 'Invalid table name']
      };
    }
  }
  
  // Additional validation for data values
  if (data && data.data && Array.isArray(data.data)) {
    for (const record of data.data) {
      if (record && typeof record === 'object' && record !== null) {
        for (const [key, value] of Object.entries(record)) {
          if (typeof key === 'string') {
            const fieldValidation = validateFieldName(key);
            if (!fieldValidation.valid) {
              return {
                valid: false,
                errors: [fieldValidation.error || 'Invalid field name']
              };
            }
          }
          
          const valueValidation = validateValue(value);
          if (!valueValidation.valid) {
            return {
              valid: false,
              errors: [valueValidation.error || 'Invalid value']
            };
          }
        }
      }
    }
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
  // MySQL identifiers can contain letters, digits, underscore, and must start with letter, underscore, or $
  const sanitized = tableName.replace(/[^a-zA-Z0-9_$]/g, '').replace(/^[^a-zA-Z_$]/, '');
  
  // Ensure the table name is not empty after sanitization
  if (!sanitized) {
    throw new Error('Invalid table name after sanitization');
  }
  
  // Ensure the table name is not too long (MySQL limit is 64 characters)
  if (sanitized.length > 64) {
    return sanitized.substring(0, 64);
  }
  
  return sanitized;
}

export function sanitizeFieldName(fieldName: string): string {
  // Remove any characters that aren't valid MySQL identifiers
  const sanitized = fieldName.replace(/[^a-zA-Z0-9_$]/g, '').replace(/^[^a-zA-Z_$]/, '');
  
  // Ensure the field name is not empty after sanitization
  if (!sanitized) {
    throw new Error('Invalid field name after sanitization');
  }
  
  // Ensure the field name is not too long (MySQL limit is 64 characters)
  if (sanitized.length > 64) {
    return sanitized.substring(0, 64);
  }
  
  return sanitized;
}

export function sanitizeQuery(query: string): string {
  // Basic query sanitization - remove potential control characters
  return query.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

// Enhanced validation functions
export function validateTableName(tableName: string): { valid: boolean; error?: string } {
  if (!tableName || typeof tableName !== 'string') {
    return { valid: false, error: 'Table name must be a non-empty string' };
  }
  
  if (tableName.length > 64) {
    return { valid: false, error: 'Table name exceeds maximum length of 64 characters' };
  }
  
  // Check for valid MySQL identifier format
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
    return { valid: false, error: 'Table name contains invalid characters' };
  }
  
  // Check for reserved words
  const reservedWords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'TABLE', 'INDEX',
    'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CONSTRAINT', 'UNIQUE', 'CHECK',
    'DEFAULT', 'NOT', 'NULL', 'IS', 'AS', 'FROM', 'WHERE', 'GROUP', 'BY', 'ORDER',
    'HAVING', 'LIMIT', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'ON', 'AND', 'OR',
    'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'UNION', 'ALL', 'DISTINCT', 'COUNT', 'SUM',
    'AVG', 'MIN', 'MAX', 'DATE', 'TIME', 'TIMESTAMP', 'DATETIME', 'YEAR', 'INT',
    'INTEGER', 'SMALLINT', 'TINYINT', 'MEDIUMINT', 'BIGINT', 'DECIMAL', 'NUMERIC',
    'FLOAT', 'DOUBLE', 'REAL', 'BIT', 'BOOLEAN', 'BOOL', 'CHAR', 'VARCHAR', 'TINYTEXT',
    'TEXT', 'MEDIUMTEXT', 'LONGTEXT', 'TINYBLOB', 'BLOB', 'MEDIUMBLOB', 'LONGBLOB',
    'BINARY', 'VARBINARY', 'ENUM', 'SET', 'GEOMETRY', 'POINT', 'LINESTRING', 'POLYGON',
    'MULTIPOINT', 'MULTILINESTRING', 'MULTIPOLYGON', 'GEOMETRYCOLLECTION', 'IF', 'ELSE',
    'ELSEIF', 'END', 'WHILE', 'LOOP', 'REPEAT', 'FOR', 'CASE', 'WHEN', 'THEN', 'BEGIN',
    'COMMIT', 'ROLLBACK', 'START', 'TRANSACTION', 'SAVEPOINT', 'LOCK', 'UNLOCK', 'USE',
    'DATABASE', 'SCHEMA', 'SHOW', 'DESCRIBE', 'DESC', 'EXPLAIN', 'HELP', 'DO', 'HANDLER',
    'LOAD', 'REPLACE', 'IGNORE', 'LOW_PRIORITY', 'DELAYED', 'HIGH_PRIORITY', 'SQL_SMALL_RESULT',
    'SQL_BIG_RESULT', 'SQL_BUFFER_RESULT', 'SQL_CACHE', 'SQL_NO_CACHE', 'SQL_CALC_FOUND_ROWS',
    'DUAL', 'FALSE', 'TRUE', 'NULL', 'UNKNOWN', 'ADD', 'ALL', 'ALTER', 'ANALYZE', 'AND',
    'AS', 'ASC', 'ASENSITIVE', 'BEFORE', 'BETWEEN', 'BIGINT', 'BINARY', 'BLOB', 'BOTH',
    'BY', 'CALL', 'CASCADE', 'CASE', 'CHANGE', 'CHAR', 'CHARACTER', 'CHECK', 'COLLATE',
    'COLUMN', 'CONDITION', 'CONNECTION', 'CONSTRAINT', 'CONTINUE', 'CONVERT', 'CREATE',
    'CROSS', 'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'CURRENT_USER', 'CURSOR',
    'DATABASE', 'DATABASES', 'DAY_HOUR', 'DAY_MICROSECOND', 'DAY_MINUTE', 'DAY_SECOND',
    'DEC', 'DECIMAL', 'DECLARE', 'DEFAULT', 'DELAYED', 'DELETE', 'DESC', 'DESCRIBE',
    'DETERMINISTIC', 'DISTINCT', 'DISTINCTROW', 'DIV', 'DOUBLE', 'DROP', 'DUAL', 'EACH',
    'ELSE', 'ELSEIF', 'ENCLOSED', 'ESCAPED', 'EXISTS', 'EXIT', 'EXPLAIN', 'FALSE', 'FETCH',
    'FLOAT', 'FLOAT4', 'FLOAT8', 'FOR', 'FORCE', 'FOREIGN', 'FROM', 'FULLTEXT', 'GRANT',
    'GROUP', 'HAVING', 'HIGH_PRIORITY', 'HOUR_MICROSECOND', 'HOUR_MINUTE', 'HOUR_SECOND',
    'IF', 'IGNORE', 'IN', 'INDEX', 'INFILE', 'INNER', 'INOUT', 'INSENSITIVE', 'INSERT',
    'INT', 'INT1', 'INT2', 'INT3', 'INT4', 'INT8', 'INTEGER', 'INTERVAL', 'INTO', 'IS',
    'ITERATE', 'JOIN', 'KEY', 'KEYS', 'KILL', 'LEADING', 'LEAVE', 'LEFT', 'LIKE', 'LIMIT',
    'LINES', 'LOAD', 'LOCALTIME', 'LOCALTIMESTAMP', 'LOCK', 'LONG', 'LONGBLOB', 'LONGTEXT',
    'LOOP', 'LOW_PRIORITY', 'MATCH', 'MEDIUMBLOB', 'MEDIUMINT', 'MEDIUMTEXT', 'MIDDLEINT',
    'MINUTE_MICROSECOND', 'MINUTE_SECOND', 'MOD', 'MODIFIES', 'NATURAL', 'NOT', 'NO_WRITE_TO_BINLOG',
    'NULL', 'NUMERIC', 'ON', 'OPTIMIZE', 'OPTION', 'OPTIONALLY', 'OR', 'ORDER', 'OUT', 'OUTER',
    'OUTFILE', 'PRECISION', 'PRIMARY', 'PROCEDURE', 'PURGE', 'RAID0', 'READ', 'READS',
    'REAL', 'REFERENCES', 'REGEXP', 'RELEASE', 'RENAME', 'REPEAT', 'REPLACE', 'REQUIRE',
    'RESTRICT', 'RETURN', 'REVOKE', 'RIGHT', 'RLIKE', 'SCHEMA', 'SCHEMAS', 'SECOND_MICROSECOND',
    'SELECT', 'SENSITIVE', 'SEPARATOR', 'SET', 'SHOW', 'SMALLINT', 'SPATIAL', 'SPECIFIC',
    'SQL', 'SQLEXCEPTION', 'SQLSTATE', 'SQLWARNING', 'SQL_BIG_RESULT', 'SQL_CALC_FOUND_ROWS',
    'SQL_SMALL_RESULT', 'SSL', 'STARTING', 'STRAIGHT_JOIN', 'TABLE', 'TERMINATED', 'THEN',
    'TINYBLOB', 'TINYINT', 'TINYTEXT', 'TO', 'TRAILING', 'TRIGGER', 'TRUE', 'UNDO', 'UNION',
    'UNIQUE', 'UNLOCK', 'UNSIGNED', 'UPDATE', 'USAGE', 'USE', 'USING', 'UTC_DATE', 'UTC_TIME',
    'UTC_TIMESTAMP', 'VALUES', 'VARBINARY', 'VARCHAR', 'VARCHARACTER', 'VARYING', 'WHEN',
    'WHERE', 'WHILE', 'WITH', 'WRITE', 'XOR', 'YEAR_MONTH', 'ZEROFILL'
  ];
  
  if (reservedWords.includes(tableName.toUpperCase())) {
    return { valid: false, error: 'Table name cannot be a reserved word' };
  }
  
  return { valid: true };
}

export function validateFieldName(fieldName: string): { valid: boolean; error?: string } {
  if (!fieldName || typeof fieldName !== 'string') {
    return { valid: false, error: 'Field name must be a non-empty string' };
  }
  
  if (fieldName.length > 64) {
    return { valid: false, error: 'Field name exceeds maximum length of 64 characters' };
  }
  
  // Check for valid MySQL identifier format
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldName)) {
    return { valid: false, error: 'Field name contains invalid characters' };
  }
  
  return { valid: true };
}

export function validateValue(value: any): { valid: boolean; error?: string } {
  // Validate string values
  if (typeof value === 'string') {
    if (value.length > INPUT_LIMITS.MAX_STRING_LENGTH) {
      return { valid: false, error: `String value exceeds maximum length of ${INPUT_LIMITS.MAX_STRING_LENGTH} characters` };
    }
    
    // Check for potential injection patterns
    const injectionPatterns = [
      /(?:;|\s)UNION\s+(?:ALL\s+|DISTINCT\s+)?SELECT/i,
      /(?:;|\s)SELECT\s+.*\s+FROM\s+(?:information_schema|mysql|performance_schema)/i,
      /(?:;|\s)DROP\s+(?:TABLE|DATABASE)/i,
      /(?:;|\s)CREATE\s+(?:TABLE|DATABASE)/i,
      /(?:;|\s)DELETE\s+FROM/i,
      /(?:;|\s)UPDATE\s+.*\s+SET/i,
      /(?:;|\s)INSERT\s+INTO/i,
      /(?:;|\s)EXEC\s+/i,
      /(?:;|\s)EXECUTE\s+/i,
      /(?:;|\s)CALL\s+/i,
      /(?:;|\s)LOAD_FILE/i,
      /(?:;|\s)INTO\s+OUTFILE/i,
      /(?:;|\s)INTO\s+DUMPFILE/i,
    ];
    
    for (const pattern of injectionPatterns) {
      if (pattern.test(value)) {
        return { valid: false, error: 'Value contains potential SQL injection patterns' };
      }
    }
  }
  
  // Validate array values
  if (Array.isArray(value)) {
    if (value.length > 1000) { // Reasonable limit for array values
      return { valid: false, error: 'Array value exceeds maximum length of 1000 items' };
    }
    
    for (const item of value) {
      const validation = validateValue(item);
      if (!validation.valid) {
        return validation;
      }
    }
  }
  
  // Validate number values
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return { valid: false, error: 'Number value must be finite' };
    }
  }
  
  return { valid: true };
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

// Schema for importFromJSON
const importFromJsonSchema = {
  type: 'object',
  required: ['table_name', 'json_data'],
  properties: {
    table_name: {
      type: 'string',
      minLength: 1,
      maxLength: 64,
      pattern: '^[a-zA-Z_][a-zA-Z0-9_]*$'
    },
    json_data: {
      type: 'string',
      minLength: 1
    },
    column_mapping: {
      type: 'object',
      additionalProperties: { type: 'string' },
      nullable: true
    },
    skip_errors: {
      type: 'boolean',
      nullable: true
    },
    batch_size: {
      type: 'number',
      minimum: 1,
      maximum: 10000,
      nullable: true
    },
    database: {
      type: 'string',
      nullable: true
    }
  },
  additionalProperties: false
};

export function validateImportFromJSON(data: any): { valid: boolean; errors?: string[] } {
  try {
    const valid = ajv.validate(importFromJsonSchema, data);
    
    if (!valid) {
      const errors = ajv.errors?.map((error: ErrorObject) => 
        error.message || 'Validation error'
      ) || ['Unknown validation error'];
      return { valid: false, errors };
    }

    // Additional custom validation
    if (data.table_name) {
      const tableValidation = validateTableName(data.table_name);
      if (!tableValidation.valid) {
        return { valid: false, errors: [tableValidation.error!] };
      }
    }

    if (data.json_data) {
      // Check if JSON data is valid JSON
      try {
        const parsed = JSON.parse(data.json_data);
        if (!Array.isArray(parsed)) {
          return { valid: false, errors: ['JSON data must be an array of objects'] };
        }
        if (parsed.length === 0) {
          return { valid: false, errors: ['JSON data cannot be empty'] };
        }
        // Limit the size of the JSON data
        if (data.json_data.length > INPUT_LIMITS.MAX_STRING_LENGTH) {
          return { valid: false, errors: [`JSON data exceeds maximum length of ${INPUT_LIMITS.MAX_STRING_LENGTH} characters`] };
        }
      } catch (e) {
        return { valid: false, errors: ['Invalid JSON data'] };
      }
    }

    if (data.column_mapping) {
      for (const [key, value] of Object.entries(data.column_mapping)) {
        if (typeof key !== 'string' || typeof value !== 'string') {
          return { valid: false, errors: ['Column mapping keys and values must be strings'] };
        }
        const keyValidation = validateFieldName(key);
        if (!keyValidation.valid) {
          return { valid: false, errors: [`Invalid column mapping key: ${keyValidation.error}`] };
        }
        const valueValidation = validateFieldName(value);
        if (!valueValidation.valid) {
          return { valid: false, errors: [`Invalid column mapping value: ${valueValidation.error}`] };
        }
      }
    }

    if (data.database) {
      const dbValidation = validateValue(data.database);
      if (!dbValidation.valid) {
        return { valid: false, errors: [dbValidation.error!] };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown validation error'}`] };
  }
}