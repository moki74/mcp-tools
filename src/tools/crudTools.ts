import DatabaseConnection from '../db/connection';
import SecurityLayer from '../security/securityLayer';
import { 
  validateCreateRecord, 
  validateReadRecords, 
  validateUpdateRecord, 
  validateDeleteRecord,
  validateBulkInsert,
  validateBulkUpdate,
  validateBulkDelete,
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

  /**
   * Bulk insert multiple records into the specified table
   */
  async bulkInsert(params: { 
    table_name: string; 
    data: Record<string, any>[];
    batch_size?: number;
  }): Promise<{ status: string; data?: any; error?: string }> {
    // Validate input schema
    if (!validateBulkInsert(params)) {
      return {
        status: 'error',
        error: 'Invalid parameters: ' + JSON.stringify(validateBulkInsert.errors)
      };
    }

    try {
      const { table_name, data, batch_size = 1000 } = params;
      
      // Validate table name
      const tableValidation = this.security.validateIdentifier(table_name);
      if (!tableValidation.valid) {
        return {
          status: 'error',
          error: `Invalid table name: ${tableValidation.error}`
        };
      }

      // Ensure data is not empty
      if (!data || data.length === 0) {
        return {
          status: 'error',
          error: 'Data array cannot be empty'
        };
      }

      // Validate that all records have the same columns
      const firstRecord = data[0];
      const columns = Object.keys(firstRecord);
      
      for (let i = 1; i < data.length; i++) {
        const recordColumns = Object.keys(data[i]);
        if (recordColumns.length !== columns.length || 
            !recordColumns.every(col => columns.includes(col))) {
          return {
            status: 'error',
            error: `All records must have the same columns. Record ${i + 1} has different columns.`
          };
        }
      }

      // Validate column names
      for (const column of columns) {
        const columnValidation = this.security.validateIdentifier(column);
        if (!columnValidation.valid) {
          return {
            status: 'error',
            error: `Invalid column name '${column}': ${columnValidation.error}`
          };
        }
      }

      // Process in batches
      const results = [];
      let totalInserted = 0;
      
      for (let i = 0; i < data.length; i += batch_size) {
        const batch = data.slice(i, i + batch_size);
        
        // Prepare batch values
        const batchValues: any[] = [];
        for (const record of batch) {
          const values = columns.map(col => record[col]);
          
          // Validate and sanitize parameter values for this record
          const paramValidation = this.security.validateParameters(values);
          if (!paramValidation.valid) {
            return {
              status: 'error',
              error: `Invalid parameter values in record ${i + batchValues.length / columns.length + 1}: ${paramValidation.error}`
            };
          }
          
          batchValues.push(...paramValidation.sanitizedParams!);
        }

        // Build the query with escaped identifiers
        const escapedTableName = this.security.escapeIdentifier(table_name);
        const escapedColumns = columns.map(col => this.security.escapeIdentifier(col));
        const valueGroups = batch.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
        
        const query = `INSERT INTO ${escapedTableName} (${escapedColumns.join(', ')}) VALUES ${valueGroups}`;
        
        // Execute the batch query
        const result = await this.db.query<any>(query, batchValues);
        
        results.push({
          batchNumber: Math.floor(i / batch_size) + 1,
          recordsInserted: batch.length,
          firstInsertId: result.insertId,
          affectedRows: result.affectedRows
        });
        
        totalInserted += result.affectedRows;
      }
      
      return {
        status: 'success',
        data: {
          totalRecords: data.length,
          totalInserted,
          batches: results.length,
          batchResults: results
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
   * Bulk update multiple records with different conditions and data
   */
  async bulkUpdate(params: { 
    table_name: string; 
    updates: Array<{
      data: Record<string, any>;
      conditions: FilterCondition[];
    }>;
    batch_size?: number;
  }): Promise<{ status: string; data?: any; error?: string }> {
    // Validate input schema
    if (!validateBulkUpdate(params)) {
      return {
        status: 'error',
        error: 'Invalid parameters: ' + JSON.stringify(validateBulkUpdate.errors)
      };
    }

    try {
      const { table_name, updates, batch_size = 100 } = params;
      
      // Validate table name
      const tableValidation = this.security.validateIdentifier(table_name);
      if (!tableValidation.valid) {
        return {
          status: 'error',
          error: `Invalid table name: ${tableValidation.error}`
        };
      }

      // Ensure updates is not empty
      if (!updates || updates.length === 0) {
        return {
          status: 'error',
          error: 'Updates array cannot be empty'
        };
      }

      // Validate each update operation
      for (let i = 0; i < updates.length; i++) {
        const update = updates[i];
        
        // Validate column names in data
        const columns = Object.keys(update.data);
        for (const column of columns) {
          const columnValidation = this.security.validateIdentifier(column);
          if (!columnValidation.valid) {
            return {
              status: 'error',
              error: `Invalid column name '${column}' in update ${i + 1}: ${columnValidation.error}`
            };
          }
        }

        // Validate condition fields
        for (const condition of update.conditions) {
          const fieldValidation = this.security.validateIdentifier(condition.field);
          if (!fieldValidation.valid) {
            return {
              status: 'error',
              error: `Invalid condition field '${condition.field}' in update ${i + 1}: ${fieldValidation.error}`
            };
          }
        }
      }

      // Process in batches using transactions for consistency
      const results = [];
      let totalAffected = 0;
      
      for (let i = 0; i < updates.length; i += batch_size) {
        const batch = updates.slice(i, i + batch_size);
        
        // Start a transaction for this batch
        await this.db.query('START TRANSACTION');
        
        try {
          const batchResults = [];
          
          for (const update of batch) {
            // Build SET clause
            const setClause = Object.entries(update.data)
              .map(([column, _]) => `${this.security.escapeIdentifier(column)} = ?`)
              .join(', ');
            
            const setValues = Object.values(update.data);
            
            // Build WHERE clause
            const whereConditions: string[] = [];
            const whereValues: any[] = [];
            
            update.conditions.forEach(condition => {
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
              throw new Error(`Invalid parameters: ${paramValidation.error}`);
            }
            
            // Build and execute the query
            const escapedTableName = this.security.escapeIdentifier(table_name);
            const query = `UPDATE ${escapedTableName} SET ${setClause} ${whereClause}`;
            
            const result = await this.db.query<any>(query, paramValidation.sanitizedParams!);
            batchResults.push({
              affectedRows: result.affectedRows
            });
            
            totalAffected += result.affectedRows;
          }
          
          // Commit the transaction
          await this.db.query('COMMIT');
          
          results.push({
            batchNumber: Math.floor(i / batch_size) + 1,
            updatesProcessed: batch.length,
            results: batchResults
          });
          
        } catch (error) {
          // Rollback on error
          await this.db.query('ROLLBACK');
          throw error;
        }
      }
      
      return {
        status: 'success',
        data: {
          totalUpdates: updates.length,
          totalAffectedRows: totalAffected,
          batches: results.length,
          batchResults: results
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
   * Bulk delete records based on multiple condition sets
   */
  async bulkDelete(params: { 
    table_name: string; 
    condition_sets: FilterCondition[][];
    batch_size?: number;
  }): Promise<{ status: string; data?: any; error?: string }> {
    // Validate input schema
    if (!validateBulkDelete(params)) {
      return {
        status: 'error',
        error: 'Invalid parameters: ' + JSON.stringify(validateBulkDelete.errors)
      };
    }

    try {
      const { table_name, condition_sets, batch_size = 100 } = params;
      
      // Validate table name
      const tableValidation = this.security.validateIdentifier(table_name);
      if (!tableValidation.valid) {
        return {
          status: 'error',
          error: `Invalid table name: ${tableValidation.error}`
        };
      }

      // Ensure condition_sets is not empty
      if (!condition_sets || condition_sets.length === 0) {
        return {
          status: 'error',
          error: 'Condition sets array cannot be empty'
        };
      }

      // Validate each condition set
      for (let i = 0; i < condition_sets.length; i++) {
        const conditions = condition_sets[i];
        
        // Ensure there are conditions for safety
        if (!conditions || conditions.length === 0) {
          return {
            status: 'error',
            error: `DELETE operations require at least one condition for safety. Condition set ${i + 1} is empty.`
          };
        }

        // Validate condition fields
        for (const condition of conditions) {
          const fieldValidation = this.security.validateIdentifier(condition.field);
          if (!fieldValidation.valid) {
            return {
              status: 'error',
              error: `Invalid condition field '${condition.field}' in condition set ${i + 1}: ${fieldValidation.error}`
            };
          }
        }
      }

      // Process in batches using transactions for consistency
      const results = [];
      let totalDeleted = 0;
      
      for (let i = 0; i < condition_sets.length; i += batch_size) {
        const batch = condition_sets.slice(i, i + batch_size);
        
        // Start a transaction for this batch
        await this.db.query('START TRANSACTION');
        
        try {
          const batchResults = [];
          
          for (const conditions of batch) {
            // Build WHERE clause
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
              throw new Error(`Invalid parameters: ${paramValidation.error}`);
            }
            
            // Build and execute the query
            const escapedTableName = this.security.escapeIdentifier(table_name);
            const query = `DELETE FROM ${escapedTableName} ${whereClause}`;
            
            const result = await this.db.query<any>(query, paramValidation.sanitizedParams!);
            batchResults.push({
              affectedRows: result.affectedRows
            });
            
            totalDeleted += result.affectedRows;
          }
          
          // Commit the transaction
          await this.db.query('COMMIT');
          
          results.push({
            batchNumber: Math.floor(i / batch_size) + 1,
            deletesProcessed: batch.length,
            results: batchResults
          });
          
        } catch (error) {
          // Rollback on error
          await this.db.query('ROLLBACK');
          throw error;
        }
      }
      
      return {
        status: 'success',
        data: {
          totalDeletes: condition_sets.length,
          totalDeletedRows: totalDeleted,
          batches: results.length,
          batchResults: results
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