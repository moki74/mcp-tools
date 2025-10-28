import DatabaseConnection from '../db/connection';
import { validateReadRecords } from '../validation/schemas';
import { FilterCondition, Pagination, Sorting } from '../validation/schemas';
import SecurityLayer from '../security/securityLayer';
import { FeatureConfig } from '../config/featureConfig';

export class DataExportTools {
  private db: DatabaseConnection;
  private security: SecurityLayer;

  constructor(security: SecurityLayer) {
    this.db = DatabaseConnection.getInstance();
    this.security = security;
  }

  /**
   * Export table data to CSV format
   */
  async exportTableToCSV(params: { 
    table_name: string; 
    filters?: FilterCondition[];
    pagination?: Pagination;
    sorting?: Sorting;
    include_headers?: boolean;
  }): Promise<{ status: string; data?: any; error?: string }> {
    try {
      const { table_name, filters = [], pagination, sorting, include_headers = true } = params;
      
      // Validate table name
      const tableValidation = this.security.validateIdentifier(table_name);
      if (!tableValidation.valid) {
        return {
          status: 'error',
          error: tableValidation.error
        };
      }

      // Build WHERE clause
      let whereClause = '';
      const whereParams: any[] = [];
      
      if (filters && filters.length > 0) {
        const whereConditions: string[] = [];
        
        for (const filter of filters) {
          // Validate field name
          const fieldValidation = this.security.validateIdentifier(filter.field);
          if (!fieldValidation.valid) {
            return {
              status: 'error',
              error: `Invalid field name: ${filter.field}`
            };
          }
          
          const fieldName = this.security.escapeIdentifier(filter.field);
          
          switch (filter.operator) {
            case 'eq':
              whereConditions.push(`${fieldName} = ?`);
              whereParams.push(filter.value);
              break;
            case 'neq':
              whereConditions.push(`${fieldName} != ?`);
              whereParams.push(filter.value);
              break;
            case 'gt':
              whereConditions.push(`${fieldName} > ?`);
              whereParams.push(filter.value);
              break;
            case 'gte':
              whereConditions.push(`${fieldName} >= ?`);
              whereParams.push(filter.value);
              break;
            case 'lt':
              whereConditions.push(`${fieldName} < ?`);
              whereParams.push(filter.value);
              break;
            case 'lte':
              whereConditions.push(`${fieldName} <= ?`);
              whereParams.push(filter.value);
              break;
            case 'like':
              whereConditions.push(`${fieldName} LIKE ?`);
              whereParams.push(filter.value);
              break;
            case 'in':
              if (Array.isArray(filter.value)) {
                const placeholders = filter.value.map(() => '?').join(', ');
                whereConditions.push(`${fieldName} IN (${placeholders})`);
                whereParams.push(...filter.value);
              } else {
                return {
                  status: 'error',
                  error: 'IN operator requires an array of values'
                };
              }
              break;
            default:
              return {
                status: 'error',
                error: `Unsupported operator: ${filter.operator}`
              };
          }
        }
        
        if (whereConditions.length > 0) {
          whereClause = 'WHERE ' + whereConditions.join(' AND ');
        }
      }

      // Build ORDER BY clause
      let orderByClause = '';
      if (sorting) {
        const fieldValidation = this.security.validateIdentifier(sorting.field);
        if (!fieldValidation.valid) {
          return {
            status: 'error',
            error: `Invalid sort field name: ${sorting.field}`
          };
        }
        
        const fieldName = this.security.escapeIdentifier(sorting.field);
        const direction = sorting.direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        orderByClause = `ORDER BY ${fieldName} ${direction}`;
      }

      // Build LIMIT clause
      let limitClause = '';
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        limitClause = `LIMIT ${offset}, ${pagination.limit}`;
      }

      // Construct the query
      const escapedTableName = this.security.escapeIdentifier(table_name);
      const query = `SELECT * FROM ${escapedTableName} ${whereClause} ${orderByClause} ${limitClause}`;
      
      // Execute query
      const results: any[] = await this.db.query(query, whereParams);
      
      // If no results, return empty CSV
      if (results.length === 0) {
        return {
          status: 'success',
          data: {
            csv: include_headers ? '' : '',
            row_count: 0
          }
        };
      }

      // Generate CSV
      let csv = '';
      
      // Add headers if requested
      if (include_headers) {
        const headers = Object.keys(results[0]).join(',');
        csv += headers + '\n';
      }
      
      // Add data rows
      for (const row of results) {
        const values = Object.values(row).map(value => {
          if (value === null) return '';
          if (typeof value === 'string') {
            // Escape quotes and wrap in quotes if contains comma or newline
            if (value.includes(',') || value.includes('\n') || value.includes('"')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }
          return String(value);
        }).join(',');
        csv += values + '\n';
      }

      return {
        status: 'success',
        data: {
          csv: csv,
          row_count: results.length
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
   * Export query results to CSV format
   */
  async exportQueryToCSV(params: { 
    query: string; 
    params?: any[];
    include_headers?: boolean;
  }): Promise<{ status: string; data?: any; error?: string }> {
    try {
      const { query, params: queryParams = [], include_headers = true } = params;
      
      // Validate query is a SELECT statement
      if (!this.security.isReadOnlyQuery(query)) {
        return {
          status: 'error',
          error: 'Only SELECT queries can be exported to CSV'
        };
      }

      // Validate parameters
      const paramValidation = this.security.validateParameters(queryParams);
      if (!paramValidation.valid) {
        return {
          status: 'error',
          error: paramValidation.error
        };
      }

      // Execute query
      const results: any[] = await this.db.query(query, queryParams);
      
      // If no results, return empty CSV
      if (results.length === 0) {
        return {
          status: 'success',
          data: {
            csv: include_headers ? '' : '',
            row_count: 0
          }
        };
      }

      // Generate CSV
      let csv = '';
      
      // Add headers if requested
      if (include_headers) {
        const headers = Object.keys(results[0]).join(',');
        csv += headers + '\n';
      }
      
      // Add data rows
      for (const row of results) {
        const values = Object.values(row).map(value => {
          if (value === null) return '';
          if (typeof value === 'string') {
            // Escape quotes and wrap in quotes if contains comma or newline
            if (value.includes(',') || value.includes('\n') || value.includes('"')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }
          return String(value);
        }).join(',');
        csv += values + '\n';
      }

      return {
        status: 'success',
        data: {
          csv: csv,
          row_count: results.length
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