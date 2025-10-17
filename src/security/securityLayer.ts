import Ajv from 'ajv';
import { FeatureConfig, ToolCategory } from '../config/featureConfig.js';

export class SecurityLayer {
  private ajv: Ajv;
  private readonly dangerousKeywords: string[];
  private readonly allowedOperations: string[];
  private readonly ddlOperations: string[];
  private featureConfig: FeatureConfig;

  constructor(featureConfig?: FeatureConfig) {
    this.ajv = new Ajv();
    this.featureConfig = featureConfig || new FeatureConfig();
    
    // Define dangerous SQL keywords that should always be blocked (security threats)
    this.dangerousKeywords = [
      'GRANT', 'REVOKE', 'LOAD_FILE', 'INTO OUTFILE', 'INTO DUMPFILE', 
      'LOAD DATA', 'INFORMATION_SCHEMA', 'MYSQL', 'PERFORMANCE_SCHEMA',
      'SYS', 'SHOW', 'DESCRIBE', 'DESC', 'EXPLAIN', 'PROCEDURE',
      'FUNCTION', 'TRIGGER', 'EVENT', 'VIEW', 'INDEX', 'DATABASE',
      'SCHEMA', 'USER', 'PASSWORD', 'SLEEP', 'BENCHMARK'
    ];

    // Define basic allowed SQL operations
    this.allowedOperations = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
    
    // Define DDL operations that require special permission
    this.ddlOperations = ['CREATE', 'ALTER', 'DROP', 'TRUNCATE', 'RENAME'];
  }

  /**
   * Validate input against a JSON schema
   */
  validateInput(schema: object, data: any): { valid: boolean; errors?: any } {
    const validate = this.ajv.compile(schema);
    const valid = validate(data);
    
    if (!valid) {
      return {
        valid: false,
        errors: validate.errors
      };
    }
    
    return { valid: true };
  }

  /**
   * Validate and sanitize table/column names to prevent SQL injection
   */
  validateIdentifier(identifier: string): { valid: boolean; error?: string } {
    if (!identifier || typeof identifier !== 'string') {
      return { valid: false, error: 'Identifier must be a non-empty string' };
    }

    // Check length
    if (identifier.length > 64) {
      return { valid: false, error: 'Identifier too long (max 64 characters)' };
    }

    // MySQL identifier rules: alphanumeric, underscore, dollar sign
    // Must start with letter, underscore, or dollar sign
    const identifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
    if (!identifierRegex.test(identifier)) {
      return { valid: false, error: 'Invalid identifier format' };
    }

    // Check against MySQL reserved words (basic list)
    const reservedWords = [
      'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'FROM', 'WHERE', 'JOIN',
      'INNER', 'LEFT', 'RIGHT', 'OUTER', 'ON', 'AS', 'AND', 'OR', 'NOT',
      'NULL', 'TRUE', 'FALSE', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT',
      'OFFSET', 'DISTINCT', 'ALL', 'EXISTS', 'IN', 'BETWEEN', 'LIKE',
      'REGEXP', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IF', 'IFNULL'
    ];

    if (reservedWords.includes(identifier.toUpperCase())) {
      return { valid: false, error: 'Identifier cannot be a reserved word' };
    }

    return { valid: true };
  }

  /**
   * Validate SQL query for security issues
   */
  validateQuery(query: string): { valid: boolean; error?: string; queryType?: string } {
    if (!query || typeof query !== 'string') {
      return { valid: false, error: 'Query must be a non-empty string' };
    }

    const trimmedQuery = query.trim().toUpperCase();
    
    // Check for empty query
    if (trimmedQuery.length === 0) {
      return { valid: false, error: 'Query cannot be empty' };
    }

    // Check for multiple statements (basic check)
    if (query.includes(';') && !query.trim().endsWith(';')) {
      return { valid: false, error: 'Multiple statements not allowed' };
    }

    // Remove trailing semicolon for analysis
    const cleanQuery = trimmedQuery.replace(/;$/, '');

    // Determine query type - check basic operations first
    let queryType = '';
    for (const operation of this.allowedOperations) {
      if (cleanQuery.startsWith(operation)) {
        queryType = operation;
        break;
      }
    }

    // If not a basic operation, check if it's a DDL operation
    if (!queryType) {
      for (const ddlOp of this.ddlOperations) {
        if (cleanQuery.startsWith(ddlOp)) {
          // Check if DDL permission is enabled
          if (this.featureConfig.isCategoryEnabled(ToolCategory.DDL)) {
            queryType = ddlOp;
            break;
          } else {
            return { 
              valid: false, 
              error: `DDL operation '${ddlOp}' requires 'ddl' permission. Add 'ddl' to your permissions configuration.` 
            };
          }
        }
      }
    }

    if (!queryType) {
      return { valid: false, error: 'Query type not allowed' };
    }

    // Check for dangerous keywords (always blocked regardless of permissions)
    for (const keyword of this.dangerousKeywords) {
      if (cleanQuery.includes(keyword)) {
        return { valid: false, error: `Dangerous keyword detected: ${keyword}` };
      }
    }

    // Additional checks for specific query types
    if (queryType === 'SELECT') {
      // Check for UNION attacks
      if (cleanQuery.includes('UNION')) {
        return { valid: false, error: 'UNION operations not allowed' };
      }
      
      // Check for subqueries in FROM clause (basic check)
      if (cleanQuery.includes('FROM (')) {
        return { valid: false, error: 'Subqueries in FROM clause not allowed' };
      }
    }

    // Check for comment-based injection attempts
    if (cleanQuery.includes('/*') || cleanQuery.includes('--') || cleanQuery.includes('#')) {
      return { valid: false, error: 'Comments not allowed in queries' };
    }

    return { valid: true, queryType };
  }

  /**
   * Validate parameter values to prevent injection
   */
  validateParameters(params: any[]): { valid: boolean; error?: string; sanitizedParams?: any[] } {
    if (!params) {
      return { valid: true, sanitizedParams: [] };
    }

    if (!Array.isArray(params)) {
      return { valid: false, error: 'Parameters must be an array' };
    }

    const sanitizedParams: any[] = [];

    for (let i = 0; i < params.length; i++) {
      const param = params[i];

      // Check for null/undefined
      if (param === null || param === undefined) {
        sanitizedParams.push(null);
        continue;
      }

      // Validate based on type
      if (typeof param === 'string') {
        // Check string length
        if (param.length > 65535) {
          return { valid: false, error: `Parameter ${i} too long (max 65535 characters)` };
        }
        
        // Don't modify strings - let MySQL handle escaping through prepared statements
        sanitizedParams.push(param);
      } else if (typeof param === 'number') {
        // Validate number
        if (!Number.isFinite(param)) {
          return { valid: false, error: `Parameter ${i} must be a finite number` };
        }
        sanitizedParams.push(param);
      } else if (typeof param === 'boolean') {
        sanitizedParams.push(param);
      } else if (param instanceof Date) {
        sanitizedParams.push(param);
      } else {
        return { valid: false, error: `Parameter ${i} has unsupported type: ${typeof param}` };
      }
    }

    return { valid: true, sanitizedParams };
  }

  /**
   * Check if a query is a read-only SELECT query
   */
  isReadOnlyQuery(query: string): boolean {
    const validation = this.validateQuery(query);
    return validation.valid && validation.queryType === 'SELECT';
  }

  /**
   * Check if a query contains dangerous operations
   */
  hasDangerousOperations(query: string): boolean {
    const validation = this.validateQuery(query);
    return !validation.valid;
  }

  /**
   * Escape identifier for safe use in SQL queries
   */
  escapeIdentifier(identifier: string): string {
    const validation = this.validateIdentifier(identifier);
    if (!validation.valid) {
      throw new Error(`Invalid identifier: ${validation.error}`);
    }
    // Use backticks to escape MySQL identifiers
    return `\`${identifier}\``;
  }
}

export default SecurityLayer;