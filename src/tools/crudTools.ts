import DatabaseConnection from '../db/connection';
import SecurityLayer from '../security/securityLayer';
import { 
  validateCreateRecord, 
  validateReadRecords, 
  validateUpdateRecord, 
  validateDeleteRecord,
  FilterCondition,
  Pagination,
  Sorting
} from '../validation/schemas';

export class CrudTools {
  private db: DatabaseConnection;
  private security: SecurityLayer;

  constructor(security: SecurityLayer) {
    this.db = DatabaseConnection.getInstance();
    this.security = security;
  }

  /**
   * Create a new record in the specified table
   */
  async createRecord(params: { table_name: string; data: Record<string, any> }): Promise<{ status: string; data?: any; error?: string }> {
    // Validate input schema
    if (!validateCreateRecord(params)) {
      return {
        status: 'error',
        error: 'Invalid parameters: ' + JSON.stringify(validateCreateRecord.errors)
      };
    }

    try {
      const { table_name, data } = params;
      
      // Validate table name
      const tableValidation = this.security.validateIdentifier(table_name);
      if (!tableValidation.valid) {
        return {
          status: 'error',
          error: `Invalid table name: ${tableValidation.error}`
        };
      }

      // Validate column names
      const columns = Object.keys(data);
      for (const column of columns) {
        const columnValidation = this.security.validateIdentifier(column);
        if (!columnValidation.valid) {
          return {
            status: 'error',
            error: `Invalid column name '${column}': ${columnValidation.error}`
          };
        }
      }

      // Validate and sanitize parameter values
      const values = Object.values(data);
      const paramValidation = this.security.validateParameters(values);
      if (!paramValidation.valid) {
        return {
          status: 'error',
          error: `Invalid parameter values: ${paramValidation.error}`
        };
      }

      // Build the query with escaped identifiers
      const escapedTableName = this.security.escapeIdentifier(table_name);
      const escapedColumns = columns.map(col => this.security.escapeIdentifier(col));
      const placeholders = columns.map(() => '?').join(', ');
      
      const query = `INSERT INTO ${escapedTableName} (${escapedColumns.join(', ')}) VALUES (${placeholders})`;
      
      // Execute the query with sanitized parameters
      const result = await this.db.query<any>(query, paramValidation.sanitizedParams!);
      
      return {
        status: 'success',
        data: {
          insertId: result.insertId,
          affectedRows: result.affectedRows
        }
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Read records from the specified table with optional filters, pagination, and sorting
   */
  async readRecords(params: { 
    table_name: string; 
    filters?: FilterCondition[];
    pagination?: Pagination;
    sorting?: Sorting;
  }): Promise<{ status: string; data?: any[]; total?: number; error?: string }> {
    // Validate input schema
    if (!validateReadRecords(params)) {
      return {
        status: 'error',
        error: 'Invalid parameters: ' + JSON.stringify(validateReadRecords.errors)
      };
    }

    try {
      const { table_name, filters, pagination, sorting } = params;
      
      // Validate table name
      const tableValidation = this.security.validateIdentifier(table_name);
      if (!tableValidation.valid) {
        return {
          status: 'error',
          error: `Invalid table name: ${tableValidation.error}`
        };
      }

      // Validate sorting field if provided
      if (sorting) {
        const sortFieldValidation = this.security.validateIdentifier(sorting.field);
        if (!sortFieldValidation.valid) {
          return {
            status: 'error',
            error: `Invalid sorting field: ${sortFieldValidation.error}`
          };
        }
      }

      // Validate filter fields if provided
      if (filters && filters.length > 0) {
        for (const filter of filters) {
          const fieldValidation = this.security.validateIdentifier(filter.field);
          if (!fieldValidation.valid) {
            return {
              status: 'error',
              error: `Invalid filter field '${filter.field}': ${fieldValidation.error}`
            };
          }
        }
      }
      
      // Build the WHERE clause if filters are provided
      let whereClause = '';
      let queryParams: any[] = [];
      
      if (filters && filters.length > 0) {
        const conditions = filters.map(filter => {
          const escapedField = this.security.escapeIdentifier(filter.field);
          switch (filter.operator) {
            case 'eq':
              queryParams.push(filter.value);
              return `${escapedField} = ?`;
            case 'neq':
              queryParams.push(filter.value);
              return `${escapedField} != ?`;
            case 'gt':
              queryParams.push(filter.value);
              return `${escapedField} > ?`;
            case 'gte':
              queryParams.push(filter.value);
              return `${escapedField} >= ?`;
            case 'lt':
              queryParams.push(filter.value);
              return `${escapedField} < ?`;
            case 'lte':
              queryParams.push(filter.value);
              return `${escapedField} <= ?`;
            case 'like':
              queryParams.push(`%${filter.value}%`);
              return `${escapedField} LIKE ?`;
            case 'in':
              if (Array.isArray(filter.value)) {
                const placeholders = filter.value.map(() => '?').join(', ');
                queryParams.push(...filter.value);
                return `${escapedField} IN (${placeholders})`;
              }
              return '1=1'; // Default true condition if value is not an array
            default:
              return '1=1'; // Default true condition
          }
        });
        
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }

      // Validate all query parameters
      const paramValidation = this.security.validateParameters(queryParams);
      if (!paramValidation.valid) {
        return {
          status: 'error',
          error: `Invalid query parameters: ${paramValidation.error}`
        };
      }
      
      // Build the ORDER BY clause if sorting is provided
      let orderByClause = '';
      if (sorting) {
        const escapedSortField = this.security.escapeIdentifier(sorting.field);
        orderByClause = `ORDER BY ${escapedSortField} ${sorting.direction.toUpperCase()}`;
      }
      
      // Build the LIMIT clause if pagination is provided
      let limitClause = '';
      const escapedTableName = this.security.escapeIdentifier(table_name);
      
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        limitClause = `LIMIT ${offset}, ${pagination.limit}`;
        
        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) as total FROM ${escapedTableName} ${whereClause}`;
        const countResult = await this.db.query<any[]>(countQuery, paramValidation.sanitizedParams!);
        const total = countResult[0].total;
        
        // Execute the main query with pagination
        const query = `SELECT * FROM ${escapedTableName} ${whereClause} ${orderByClause} ${limitClause}`;
        const results = await this.db.query<any[]>(query, paramValidation.sanitizedParams!);
        
        return {
          status: 'success',
          data: results,
          total
        };
      } else {
        // Execute the query without pagination
        const query = `SELECT * FROM ${escapedTableName} ${whereClause} ${orderByClause}`;
        const results = await this.db.query<any[]>(query, paramValidation.sanitizedParams!);
        
        return {
          status: 'success',
          data: results,
          total: results.length
        };
      }
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Update records in the specified table based on conditions
   */
  async updateRecord(params: { 
    table_name: string; 
    data: Record<string, any>;
    conditions: FilterCondition[];
  }): Promise<{ status: string; data?: { affectedRows: number }; error?: string }> {
    // Validate input schema
    if (!validateUpdateRecord(params)) {
      return {
        status: 'error',
        error: 'Invalid parameters: ' + JSON.stringify(validateUpdateRecord.errors)
      };
    }

    try {
      const { table_name, data, conditions } = params;
      
      // Validate table name
      const tableValidation = this.security.validateIdentifier(table_name);
      if (!tableValidation.valid) {
        return {
          status: 'error',
          error: `Invalid table name: ${tableValidation.error}`
        };
      }

      // Validate column names in data
      const columns = Object.keys(data);
      for (const column of columns) {
        const columnValidation = this.security.validateIdentifier(column);
        if (!columnValidation.valid) {
          return {
            status: 'error',
            error: `Invalid column name '${column}': ${columnValidation.error}`
          };
        }
      }

      // Validate condition fields
      for (const condition of conditions) {
        const fieldValidation = this.security.validateIdentifier(condition.field);
        if (!fieldValidation.valid) {
          return {
            status: 'error',
            error: `Invalid condition field '${condition.field}': ${fieldValidation.error}`
          };
        }
      }
      
      // Build SET clause with escaped identifiers
      const setClause = Object.entries(data)
        .map(([column, _]) => `${this.security.escapeIdentifier(column)} = ?`)
        .join(', ');
      
      const setValues = Object.values(data);
      
      // Build the WHERE clause
      const whereConditions: string[] = [];
      const whereValues: any[] = [];
      
      conditions.forEach(condition => {
        const escapedField = this.security.escapeIdentifier(condition.field);
        switch (condition.operator) {
          case 'eq':
            whereConditions.push(`${escapedField} = ?`);
            whereValues.push(condition.value);
            break;
          case 'neq':
            whereConditions.push(`${escapedField} != ?`);
            whereValues.push(condition.value);
            break;
          case 'gt':
            whereConditions.push(`${escapedField} > ?`);
            whereValues.push(condition.value);
            break;
          case 'gte':
            whereConditions.push(`${escapedField} >= ?`);
            whereValues.push(condition.value);
            break;
          case 'lt':
            whereConditions.push(`${escapedField} < ?`);
            whereValues.push(condition.value);
            break;
          case 'lte':
            whereConditions.push(`${escapedField} <= ?`);
            whereValues.push(condition.value);
            break;
          case 'like':
            whereConditions.push(`${escapedField} LIKE ?`);
            whereValues.push(`%${condition.value}%`);
            break;
          case 'in':
            if (Array.isArray(condition.value)) {
              const placeholders = condition.value.map(() => '?').join(', ');
              whereConditions.push(`${escapedField} IN (${placeholders})`);
              whereValues.push(...condition.value);
            }
            break;
        }
      });
      
      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ') 
        : '';

      // Validate all parameters
      const allParams = [...setValues, ...whereValues];
      const paramValidation = this.security.validateParameters(allParams);
      if (!paramValidation.valid) {
        return {
          status: 'error',
          error: `Invalid parameters: ${paramValidation.error}`
        };
      }
      
      // Build the query with escaped table name
      const escapedTableName = this.security.escapeIdentifier(table_name);
      const query = `UPDATE ${escapedTableName} SET ${setClause} ${whereClause}`;
      
      // Execute the query with sanitized parameters
      const result = await this.db.query<any>(query, paramValidation.sanitizedParams!);
      
      return {
        status: 'success',
        data: {
          affectedRows: result.affectedRows
        }
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Delete records from the specified table based on conditions
   */
  async deleteRecord(params: { 
    table_name: string; 
    conditions: FilterCondition[];
  }): Promise<{ status: string; data?: { affectedRows: number }; error?: string }> {
    // Validate input schema
    if (!validateDeleteRecord(params)) {
      return {
        status: 'error',
        error: 'Invalid parameters: ' + JSON.stringify(validateDeleteRecord.errors)
      };
    }

    try {
      const { table_name, conditions } = params;
      
      // Validate table name
      const tableValidation = this.security.validateIdentifier(table_name);
      if (!tableValidation.valid) {
        return {
          status: 'error',
          error: `Invalid table name: ${tableValidation.error}`
        };
      }

      // Ensure there are conditions for safety
      if (!conditions || conditions.length === 0) {
        return {
          status: 'error',
          error: 'DELETE operations require at least one condition for safety'
        };
      }

      // Validate condition fields
      for (const condition of conditions) {
        const fieldValidation = this.security.validateIdentifier(condition.field);
        if (!fieldValidation.valid) {
          return {
            status: 'error',
            error: `Invalid condition field '${condition.field}': ${fieldValidation.error}`
          };
        }
      }
      
      // Build the WHERE clause
      const whereConditions: string[] = [];
      const whereValues: any[] = [];
      
      conditions.forEach(condition => {
        const escapedField = this.security.escapeIdentifier(condition.field);
        switch (condition.operator) {
          case 'eq':
            whereConditions.push(`${escapedField} = ?`);
            whereValues.push(condition.value);
            break;
          case 'neq':
            whereConditions.push(`${escapedField} != ?`);
            whereValues.push(condition.value);
            break;
          case 'gt':
            whereConditions.push(`${escapedField} > ?`);
            whereValues.push(condition.value);
            break;
          case 'gte':
            whereConditions.push(`${escapedField} >= ?`);
            whereValues.push(condition.value);
            break;
          case 'lt':
            whereConditions.push(`${escapedField} < ?`);
            whereValues.push(condition.value);
            break;
          case 'lte':
            whereConditions.push(`${escapedField} <= ?`);
            whereValues.push(condition.value);
            break;
          case 'like':
            whereConditions.push(`${escapedField} LIKE ?`);
            whereValues.push(`%${condition.value}%`);
            break;
          case 'in':
            if (Array.isArray(condition.value)) {
              const placeholders = condition.value.map(() => '?').join(', ');
              whereConditions.push(`${escapedField} IN (${placeholders})`);
              whereValues.push(...condition.value);
            }
            break;
        }
      });
      
      const whereClause = 'WHERE ' + whereConditions.join(' AND ');

      // Validate all parameters
      const paramValidation = this.security.validateParameters(whereValues);
      if (!paramValidation.valid) {
        return {
          status: 'error',
          error: `Invalid parameters: ${paramValidation.error}`
        };
      }
      
      // Build the query with escaped table name
      const escapedTableName = this.security.escapeIdentifier(table_name);
      const query = `DELETE FROM ${escapedTableName} ${whereClause}`;
      
      // Execute the query with sanitized parameters
      const result = await this.db.query<any>(query, paramValidation.sanitizedParams!);
      
      return {
        status: 'success',
        data: {
          affectedRows: result.affectedRows
        }
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}