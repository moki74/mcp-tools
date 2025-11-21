import DatabaseConnection from '../db/connection';
import { SecurityLayer } from '../security/securityLayer';
import { dbConfig } from '../config/config';
import {
  validateListStoredProcedures,
  validateGetStoredProcedureInfo,
  validateStoredProcedureExecution,
  validateStoredProcedureCreation,
  validateDropStoredProcedure,
  validateShowCreateProcedure
} from '../validation/schemas';

export class StoredProcedureTools {
  private db: DatabaseConnection;
  private security: SecurityLayer;

  constructor(security: SecurityLayer) {
    this.db = DatabaseConnection.getInstance();
    this.security = security;
  }

  /**
   * Validate database access - ensures only the connected database can be accessed
   */
  private validateDatabaseAccess(requestedDatabase?: string): { valid: boolean; database: string; error?: string } {
    const connectedDatabase = dbConfig.database;
    
    if (!connectedDatabase) {
      return {
        valid: false,
        database: '',
        error: 'No database specified in connection string. Cannot access any database.'
      };
    }

    // If no database is requested, use the connected database
    if (!requestedDatabase) {
      return {
        valid: true,
        database: connectedDatabase
      };
    }

    // If a specific database is requested, ensure it matches the connected database
    if (requestedDatabase !== connectedDatabase) {
      return {
        valid: false,
        database: '',
        error: `Access denied. You can only access the connected database '${connectedDatabase}'. Requested database '${requestedDatabase}' is not allowed.`
      };
    }

    return {
      valid: true,
      database: connectedDatabase
    };
  }

  /**
   * List all stored procedures in the current database
   */
  async listStoredProcedures(params: { database?: string }): Promise<{ status: string; data?: any[]; error?: string; queryLog?: string }> {
    try {
      // Validate input
      if (!validateListStoredProcedures(params)) {
        return {
          status: 'error',
          error: 'Invalid parameters: ' + JSON.stringify(validateListStoredProcedures.errors)
        };
      }

      // Validate database access
      const dbValidation = this.validateDatabaseAccess(params.database);
      if (!dbValidation.valid) {
        return {
          status: 'error',
          error: dbValidation.error!
        };
      }

      const database = dbValidation.database;

      const query = `
        SELECT 
          ROUTINE_NAME as name,
          ROUTINE_TYPE as type,
          DATA_TYPE as return_type,
          ROUTINE_DEFINITION as definition,
          CREATED,
          LAST_ALTERED,
          ROUTINE_COMMENT as comment,
          DEFINER,
          SQL_MODE,
          SECURITY_TYPE
        FROM INFORMATION_SCHEMA.ROUTINES 
        WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'
        ORDER BY ROUTINE_NAME
      `;

      const results = await this.db.query<any[]>(query, [database]);
      
      return {
        status: 'success',
        data: results,
        queryLog: this.db.getFormattedQueryLogs(1)
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message,
        queryLog: this.db.getFormattedQueryLogs(1)
      };
    }
  }

  /**
   * Get detailed information about a specific stored procedure
   */
  async getStoredProcedureInfo(params: { procedure_name: string; database?: string }): Promise<{ status: string; data?: any; error?: string; queryLog?: string }> {
    try {
      // Validate input
      if (!validateGetStoredProcedureInfo(params)) {
        return {
          status: 'error',
          error: 'Invalid parameters: ' + JSON.stringify(validateGetStoredProcedureInfo.errors)
        };
      }

      // Validate database access
      const dbValidation = this.validateDatabaseAccess(params.database);
      if (!dbValidation.valid) {
        return {
          status: 'error',
          error: dbValidation.error!
        };
      }

      const { procedure_name } = params;
      const database = dbValidation.database;

      // Get procedure information
      const procedureQuery = `
        SELECT 
          ROUTINE_NAME as name,
          ROUTINE_TYPE as type,
          DATA_TYPE as return_type,
          ROUTINE_DEFINITION as definition,
          CREATED,
          LAST_ALTERED,
          ROUTINE_COMMENT as comment,
          DEFINER,
          SQL_MODE,
          SECURITY_TYPE,
          IS_DETERMINISTIC,
          SQL_DATA_ACCESS,
          ROUTINE_BODY
        FROM INFORMATION_SCHEMA.ROUTINES 
        WHERE ROUTINE_SCHEMA = ? AND ROUTINE_NAME = ? AND ROUTINE_TYPE = 'PROCEDURE'
      `;

      // Get procedure parameters
      const parametersQuery = `
        SELECT 
          PARAMETER_NAME as name,
          PARAMETER_MODE as mode,
          DATA_TYPE as data_type,
          CHARACTER_MAXIMUM_LENGTH as max_length,
          ORDINAL_POSITION as position
        FROM INFORMATION_SCHEMA.PARAMETERS 
        WHERE SPECIFIC_SCHEMA = ? AND SPECIFIC_NAME = ?
        ORDER BY ORDINAL_POSITION
      `;

      const [procedureInfo, parameters] = await Promise.all([
        this.db.query<any[]>(procedureQuery, [database, procedure_name]),
        this.db.query<any[]>(parametersQuery, [database, procedure_name])
      ]);

      if (procedureInfo.length === 0) {
        return {
          status: 'error',
          error: `Stored procedure '${procedure_name}' not found in database '${database}'`,
          queryLog: this.db.getFormattedQueryLogs(2)
        };
      }

      return {
        status: 'success',
        data: {
          ...procedureInfo[0],
          parameters: parameters
        },
        queryLog: this.db.getFormattedQueryLogs(2)
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message,
        queryLog: this.db.getFormattedQueryLogs(2)
      };
    }
  }

  /**
   * Execute a stored procedure with parameters
   */
  async executeStoredProcedure(params: { 
    procedure_name: string; 
    parameters?: any[];
    database?: string;
  }): Promise<{ status: string; data?: any; error?: string }> {
    // Validate input schema
    if (!validateStoredProcedureExecution(params)) {
      return {
        status: 'error',
        error: 'Invalid parameters: ' + JSON.stringify(validateStoredProcedureExecution.errors)
      };
    }

    try {
      // Validate database access
      const dbValidation = this.validateDatabaseAccess(params.database);
      if (!dbValidation.valid) {
        return {
          status: 'error',
          error: dbValidation.error!
        };
      }

      const { procedure_name, parameters = [] } = params;
      const database = dbValidation.database;

      // Validate procedure name
      const identifierValidation = this.security.validateIdentifier(procedure_name);
      if (!identifierValidation.valid) {
          return {
            status: 'error',
            error: identifierValidation.error || 'Invalid procedure name'
          };
        }

      // Get procedure parameter information to handle OUT/INOUT parameters
      const procInfo = await this.getStoredProcedureInfo({ procedure_name, database });
      if (procInfo.status !== 'success' || !procInfo.data) {
        return {
          status: 'error',
          error: `Could not retrieve procedure information: ${procInfo.error || 'Unknown error'}`
        };
      }

      const procedureParams = procInfo.data.parameters || [];
      
      // Validate parameter count
      if (parameters.length > procedureParams.length) {
        return {
          status: 'error',
          error: `Too many parameters provided. Expected ${procedureParams.length}, got ${parameters.length}`
        };
      }

      // Validate parameters
      const paramValidation = this.security.validateParameters(parameters);
      if (!paramValidation.valid) {
        return {
          status: 'error',
          error: `Parameter validation failed: ${paramValidation.error}`
        };
      }

      // Build parameter list for CALL statement
      const callParams: string[] = [];
      const sessionVars: string[] = [];
      let paramIndex = 0;

      for (let i = 0; i < procedureParams.length; i++) {
        const procParam = procedureParams[i];
        
        if (procParam.mode === 'IN') {
          // IN parameters use provided values or NULL if not provided
          if (paramIndex < parameters.length) {
            callParams.push('?');
            paramIndex++;
          } else {
            callParams.push('NULL');
          }
        } else if (procParam.mode === 'OUT' || procParam.mode === 'INOUT') {
          // OUT/INOUT parameters use session variables
          const varName = `@${procParam.name}_${Date.now()}_${i}`;
          sessionVars.push(varName);
          
          if (procParam.mode === 'INOUT' && paramIndex < parameters.length) {
            // For INOUT, set the session variable to the input value first
            await this.db.query(`SET ${varName} = ?`, [paramValidation.sanitizedParams![paramIndex]]);
            paramIndex++;
          }
          
          callParams.push(varName);
        }
      }

      // Build and execute CALL statement
      const callQuery = `CALL \`${database}\`.\`${procedure_name}\`(${callParams.join(', ')})`;
      const callResults = await this.db.query<any>(callQuery, paramValidation.sanitizedParams!.slice(0, paramIndex));

      // Get OUT/INOUT parameter values
      const outputValues: any = {};
      if (sessionVars.length > 0) {
        const selectQuery = `SELECT ${sessionVars.join(', ')}`;
        const outputResults = await this.db.query<any>(selectQuery);
        
        if (outputResults && outputResults.length > 0) {
          const outputRow = outputResults[0];
          sessionVars.forEach((varName, index) => {
             const paramName = procedureParams.find((p: any) => 
               (p.mode === 'OUT' || p.mode === 'INOUT') && 
               varName.includes(p.name)
             )?.name || `param_${index}`;
             outputValues[paramName] = outputRow[varName];
           });
        }
      }

      return {
        status: 'success',
        data: {
          results: callResults,
          outputParameters: Object.keys(outputValues).length > 0 ? outputValues : undefined
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
   * Create a new stored procedure
   */
  async createStoredProcedure(params: {
    procedure_name: string;
    parameters?: Array<{
      name: string;
      mode: 'IN' | 'OUT' | 'INOUT';
      data_type: string;
    }>;
    body: string;
    comment?: string;
    database?: string;
  }): Promise<{ status: string; data?: any; error?: string }> {
    // Validate input schema
    if (!validateStoredProcedureCreation(params)) {
      return {
        status: 'error',
        error: 'Invalid parameters: ' + JSON.stringify(validateStoredProcedureCreation.errors)
      };
    }

    try {
      // Validate database access
      const dbValidation = this.validateDatabaseAccess(params.database);
      if (!dbValidation.valid) {
        return {
          status: 'error',
          error: dbValidation.error!
        };
      }

      const { procedure_name, parameters = [], body, comment } = params;
      const database = dbValidation.database;

      // Validate procedure name
      const identifierValidation = this.security.validateIdentifier(procedure_name);
      if (!identifierValidation.valid) {
          return {
            status: 'error',
            error: identifierValidation.error || 'Invalid procedure name'
          };
        }

      // Build parameter list
      const parameterList = parameters.map(param => {
        if (!this.security.validateIdentifier(param.name).valid) {
          throw new Error(`Invalid parameter name: ${param.name}`);
        }
        return `${param.mode} \`${param.name}\` ${param.data_type}`;
      }).join(', ');

      // Build CREATE PROCEDURE statement
      let createQuery = `CREATE PROCEDURE \`${database}\`.\`${procedure_name}\`(${parameterList})\n`;
      
      if (comment) {
        createQuery += `COMMENT '${comment.replace(/'/g, "''")}'
`;
      }
      
      // Check if body already contains BEGIN/END, if not add them
      const trimmedBody = body.trim();
      if (trimmedBody.toUpperCase().startsWith('BEGIN') && trimmedBody.toUpperCase().endsWith('END')) {
        createQuery += `\n${body}`;
      } else {
        createQuery += `BEGIN\n${body}\nEND`;
      }

      // Execute the CREATE PROCEDURE statement
      await this.db.query(createQuery);
      
      return {
        status: 'success',
        data: {
          message: `Stored procedure '${procedure_name}' created successfully`,
          procedure_name,
          database
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
   * Drop a stored procedure
   */
  async dropStoredProcedure(params: { procedure_name: string; if_exists?: boolean; database?: string }): Promise<{ status: string; message?: string; error?: string }> {
    try {
      // Validate input
      if (!validateDropStoredProcedure(params)) {
        return {
          status: 'error',
          error: 'Invalid parameters: ' + JSON.stringify(validateDropStoredProcedure.errors)
        };
      }

      // Validate database access
      const dbValidation = this.validateDatabaseAccess(params.database);
      if (!dbValidation.valid) {
        return {
          status: 'error',
          error: dbValidation.error!
        };
      }

      const { procedure_name, if_exists = false } = params;
      const database = dbValidation.database;

      // Validate procedure name
      const identifierValidation = this.security.validateIdentifier(procedure_name);
      if (!identifierValidation.valid) {
          return {
            status: 'error',
            error: identifierValidation.error || 'Invalid procedure name'
          };
        }

      // Build DROP PROCEDURE statement
      const dropQuery = `DROP PROCEDURE ${if_exists ? 'IF EXISTS' : ''} \`${database}\`.\`${procedure_name}\``;

      // Execute the DROP PROCEDURE statement
      await this.db.query(dropQuery);
      
      return {
        status: 'success',
        message: `Stored procedure '${procedure_name}' dropped successfully`
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Show the CREATE statement for a stored procedure
   */
  async showCreateProcedure(params: { procedure_name: string; database?: string }): Promise<{ status: string; data?: any; error?: string }> {
    try {
      // Validate input
      if (!validateShowCreateProcedure(params)) {
        return {
          status: 'error',
          error: 'Invalid parameters: ' + JSON.stringify(validateShowCreateProcedure.errors)
        };
      }

      // Validate database access
      const dbValidation = this.validateDatabaseAccess(params.database);
      if (!dbValidation.valid) {
        return {
          status: 'error',
          error: dbValidation.error!
        };
      }

      const { procedure_name } = params;
      const database = dbValidation.database;

      // Validate procedure name
      const identifierValidation = this.security.validateIdentifier(procedure_name);
      if (!identifierValidation.valid) {
          return {
            status: 'error',
            error: identifierValidation.error || 'Invalid procedure name'
          };
        }

      const query = `SHOW CREATE PROCEDURE \`${database}\`.\`${procedure_name}\``;
      const results = await this.db.query<any[]>(query);
      
      if (results.length === 0) {
        return {
          status: 'error',
          error: `Stored procedure '${procedure_name}' not found`
        };
      }

      return {
        status: 'success',
        data: results[0]
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}