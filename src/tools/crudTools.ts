import DatabaseConnection from '../db/connection';
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

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  /**
   * Create a new record in the specified table
   */
  async createRecord(params: { table_name: string; data: Record<string, any> }): Promise<{ status: string; data?: any; error?: string }> {
    // Validate input
    if (!validateCreateRecord(params)) {
      return {
        status: 'error',
        error: 'Invalid parameters: ' + JSON.stringify(validateCreateRecord.errors)
      };
    }

    try {
      const { table_name, data } = params;
      
      // Extract column names and values
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map(() => '?').join(', ');
      
      // Build the query
      const query = `INSERT INTO \`${table_name}\` (\`${columns.join('`, `')}\`) VALUES (${placeholders})`;
      
      // Execute the query
      const result = await this.db.query<any>(query, values);
      
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
    // Validate input
    if (!validateReadRecords(params)) {
      return {
        status: 'error',
        error: 'Invalid parameters: ' + JSON.stringify(validateReadRecords.errors)
      };
    }

    try {
      const { table_name, filters, pagination, sorting } = params;
      
      // Build the WHERE clause if filters are provided
      let whereClause = '';
      let queryParams: any[] = [];
      
      if (filters && filters.length > 0) {
        const conditions = filters.map(filter => {
          switch (filter.operator) {
            case 'eq':
              queryParams.push(filter.value);
              return `\`${filter.field}\` = ?`;
            case 'neq':
              queryParams.push(filter.value);
              return `\`${filter.field}\` != ?`;
            case 'gt':
              queryParams.push(filter.value);
              return `\`${filter.field}\` > ?`;
            case 'gte':
              queryParams.push(filter.value);
              return `\`${filter.field}\` >= ?`;
            case 'lt':
              queryParams.push(filter.value);
              return `\`${filter.field}\` < ?`;
            case 'lte':
              queryParams.push(filter.value);
              return `\`${filter.field}\` <= ?`;
            case 'like':
              queryParams.push(`%${filter.value}%`);
              return `\`${filter.field}\` LIKE ?`;
            case 'in':
              if (Array.isArray(filter.value)) {
                const placeholders = filter.value.map(() => '?').join(', ');
                queryParams.push(...filter.value);
                return `\`${filter.field}\` IN (${placeholders})`;
              }
              return '1=1'; // Default true condition if value is not an array
            default:
              return '1=1'; // Default true condition
          }
        });
        
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }
      
      // Build the ORDER BY clause if sorting is provided
      let orderByClause = '';
      if (sorting) {
        orderByClause = `ORDER BY \`${sorting.field}\` ${sorting.direction.toUpperCase()}`;
      }
      
      // Build the LIMIT clause if pagination is provided
      let limitClause = '';
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        limitClause = `LIMIT ${offset}, ${pagination.limit}`;
        
        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) as total FROM \`${table_name}\` ${whereClause}`;
        const countResult = await this.db.query<any[]>(countQuery, queryParams);
        const total = countResult[0].total;
        
        // Execute the main query with pagination
        const query = `SELECT * FROM \`${table_name}\` ${whereClause} ${orderByClause} ${limitClause}`;
        const results = await this.db.query<any[]>(query, queryParams);
        
        return {
          status: 'success',
          data: results,
          total
        };
      } else {
        // Execute the query without pagination
        const query = `SELECT * FROM \`${table_name}\` ${whereClause} ${orderByClause}`;
        const results = await this.db.query<any[]>(query, queryParams);
        
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
    // Validate input
    if (!validateUpdateRecord(params)) {
      return {
        status: 'error',
        error: 'Invalid parameters: ' + JSON.stringify(validateUpdateRecord.errors)
      };
    }

    try {
      const { table_name, data, conditions } = params;
      
      // Extract column names and values for SET clause
      const setClause = Object.entries(data)
        .map(([column, _]) => `\`${column}\` = ?`)
        .join(', ');
      
      const setValues = Object.values(data);
      
      // Build the WHERE clause
      const whereConditions: string[] = [];
      const whereValues: any[] = [];
      
      conditions.forEach(condition => {
        switch (condition.operator) {
          case 'eq':
            whereConditions.push(`\`${condition.field}\` = ?`);
            whereValues.push(condition.value);
            break;
          case 'neq':
            whereConditions.push(`\`${condition.field}\` != ?`);
            whereValues.push(condition.value);
            break;
          case 'gt':
            whereConditions.push(`\`${condition.field}\` > ?`);
            whereValues.push(condition.value);
            break;
          case 'gte':
            whereConditions.push(`\`${condition.field}\` >= ?`);
            whereValues.push(condition.value);
            break;
          case 'lt':
            whereConditions.push(`\`${condition.field}\` < ?`);
            whereValues.push(condition.value);
            break;
          case 'lte':
            whereConditions.push(`\`${condition.field}\` <= ?`);
            whereValues.push(condition.value);
            break;
          case 'like':
            whereConditions.push(`\`${condition.field}\` LIKE ?`);
            whereValues.push(`%${condition.value}%`);
            break;
          case 'in':
            if (Array.isArray(condition.value)) {
              const placeholders = condition.value.map(() => '?').join(', ');
              whereConditions.push(`\`${condition.field}\` IN (${placeholders})`);
              whereValues.push(...condition.value);
            }
            break;
        }
      });
      
      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ') 
        : '';
      
      // Build the query
      const query = `UPDATE \`${table_name}\` SET ${setClause} ${whereClause}`;
      
      // Execute the query with all parameters
      const result = await this.db.query<any>(query, [...setValues, ...whereValues]);
      
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
    // Validate input
    if (!validateDeleteRecord(params)) {
      return {
        status: 'error',
        error: 'Invalid parameters: ' + JSON.stringify(validateDeleteRecord.errors)
      };
    }

    try {
      const { table_name, conditions } = params;
      
      // Build the WHERE clause
      const whereConditions: string[] = [];
      const whereValues: any[] = [];
      
      conditions.forEach(condition => {
        switch (condition.operator) {
          case 'eq':
            whereConditions.push(`\`${condition.field}\` = ?`);
            whereValues.push(condition.value);
            break;
          case 'neq':
            whereConditions.push(`\`${condition.field}\` != ?`);
            whereValues.push(condition.value);
            break;
          case 'gt':
            whereConditions.push(`\`${condition.field}\` > ?`);
            whereValues.push(condition.value);
            break;
          case 'gte':
            whereConditions.push(`\`${condition.field}\` >= ?`);
            whereValues.push(condition.value);
            break;
          case 'lt':
            whereConditions.push(`\`${condition.field}\` < ?`);
            whereValues.push(condition.value);
            break;
          case 'lte':
            whereConditions.push(`\`${condition.field}\` <= ?`);
            whereValues.push(condition.value);
            break;
          case 'like':
            whereConditions.push(`\`${condition.field}\` LIKE ?`);
            whereValues.push(`%${condition.value}%`);
            break;
          case 'in':
            if (Array.isArray(condition.value)) {
              const placeholders = condition.value.map(() => '?').join(', ');
              whereConditions.push(`\`${condition.field}\` IN (${placeholders})`);
              whereValues.push(...condition.value);
            }
            break;
        }
      });
      
      // Ensure there's a WHERE clause for safety
      if (whereConditions.length === 0) {
        return {
          status: 'error',
          error: 'DELETE operations require at least one condition for safety'
        };
      }
      
      const whereClause = 'WHERE ' + whereConditions.join(' AND ');
      
      // Build the query
      const query = `DELETE FROM \`${table_name}\` ${whereClause}`;
      
      // Execute the query
      const result = await this.db.query<any>(query, whereValues);
      
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