#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { MySQLMCP } from './index.js';

// Get permissions from environment variable (set by bin/mcp-mysql.js)
// Priority: MCP_PERMISSIONS (from command line) > MCP_CONFIG (from .env) > all permissions
const permissions = process.env.MCP_PERMISSIONS || process.env.MCP_CONFIG || '';

// Initialize the MySQL MCP instance with permissions
const mysqlMCP = new MySQLMCP(permissions);

// Log the effective permissions to stderr
if (permissions) {
  console.error(`Active permissions: ${permissions}`);
} else {
  console.error('Active permissions: all (default)');
}

// Define all available tools with their schemas
const TOOLS: Tool[] = [
  {
    name: 'list_databases',
    description: 'Lists all databases available on the MySQL server.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_tables',
    description: 'Lists all tables in the connected MySQL database.',
    inputSchema: {
      type: 'object',
      properties: {
        database: {
          type: 'string',
          description: 'Optional: specific database name to list tables from',
        },
      },
    },
  },
  {
    name: 'read_table_schema',
    description: 'Reads the schema of a specified table, including columns, types, keys, and indexes.',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Name of the table to read schema from',
        },
      },
      required: ['table_name'],
    },
  },
  {
    name: 'create_record',
    description: 'Creates a new record in the specified table.',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Name of the table to insert into',
        },
        data: {
          type: 'object',
          description: 'Object containing column names and values to insert',
        },
      },
      required: ['table_name', 'data'],
    },
  },
  {
    name: 'read_records',
    description: 'Reads records from the specified table with optional filtering, pagination, and sorting.',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Name of the table to read from',
        },
        filters: {
          type: 'array',
          description: 'Array of filter conditions',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              operator: { 
                type: 'string',
                enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'in']
              },
              value: { 
                description: 'Value to compare against (can be string, number, boolean, or array for "in" operator)'
              },
            },
            required: ['field', 'operator', 'value'],
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', description: 'Page number (starting from 1)' },
            limit: { type: 'number', description: 'Number of records per page' },
          },
        },
        sorting: {
          type: 'object',
          properties: {
            field: { type: 'string', description: 'Field name to sort by' },
            direction: { type: 'string', enum: ['asc', 'desc'] },
          },
        },
      },
      required: ['table_name'],
    },
  },
  {
    name: 'update_record',
    description: 'Updates existing records in the specified table based on conditions.',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Name of the table to update',
        },
        data: {
          type: 'object',
          description: 'Object containing column names and new values',
        },
        conditions: {
          type: 'array',
          description: 'Array of conditions to identify which records to update',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              operator: { 
                type: 'string',
                enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'in']
              },
              value: {},
            },
            required: ['field', 'operator', 'value'],
          },
        },
      },
      required: ['table_name', 'data', 'conditions'],
    },
  },
  {
    name: 'delete_record',
    description: 'Deletes records from the specified table based on conditions.',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Name of the table to delete from',
        },
        conditions: {
          type: 'array',
          description: 'Array of conditions to identify which records to delete',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              operator: { 
                type: 'string',
                enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'in']
              },
              value: {},
            },
            required: ['field', 'operator', 'value'],
          },
        },
      },
      required: ['table_name', 'conditions'],
    },
  },
  {
    name: 'bulk_insert',
    description: 'Bulk insert multiple records into the specified table with batch processing for optimal performance.',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Name of the table to insert into',
        },
        data: {
          type: 'array',
          description: 'Array of objects containing column names and values to insert',
          minItems: 1,
          items: {
            type: 'object',
            additionalProperties: true,
          },
        },
        batch_size: {
          type: 'number',
          description: 'Optional batch size for processing (default: 1000, max: 10000)',
          minimum: 1,
          maximum: 10000,
        },
      },
      required: ['table_name', 'data'],
    },
  },
  {
    name: 'bulk_update',
    description: 'Bulk update multiple records with different conditions and data using batch processing.',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Name of the table to update',
        },
        updates: {
          type: 'array',
          description: 'Array of update operations with data and conditions',
          minItems: 1,
          items: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                description: 'Object containing column names and new values',
                additionalProperties: true,
              },
              conditions: {
                type: 'array',
                description: 'Array of conditions to identify which records to update',
                minItems: 1,
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    operator: { 
                      type: 'string',
                      enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'in']
                    },
                    value: {},
                  },
                  required: ['field', 'operator', 'value'],
                },
              },
            },
            required: ['data', 'conditions'],
          },
        },
        batch_size: {
          type: 'number',
          description: 'Optional batch size for processing (default: 100, max: 1000)',
          minimum: 1,
          maximum: 1000,
        },
      },
      required: ['table_name', 'updates'],
    },
  },
  {
    name: 'bulk_delete',
    description: 'Bulk delete records based on multiple condition sets using batch processing.',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Name of the table to delete from',
        },
        condition_sets: {
          type: 'array',
          description: 'Array of condition sets, each defining records to delete',
          minItems: 1,
          items: {
            type: 'array',
            description: 'Array of conditions for this delete operation',
            minItems: 1,
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                operator: { 
                  type: 'string',
                  enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'in']
                },
                value: {},
              },
              required: ['field', 'operator', 'value'],
            },
          },
        },
        batch_size: {
          type: 'number',
          description: 'Optional batch size for processing (default: 100, max: 1000)',
          minimum: 1,
          maximum: 1000,
        },
      },
      required: ['table_name', 'condition_sets'],
    },
  },
  {
    name: 'run_query',
    description: 'Runs a read-only SQL SELECT query with optional parameters. Only SELECT statements are allowed.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'SQL SELECT query to execute',
        },
        params: {
          type: 'array',
          description: 'Optional array of parameters for parameterized queries',
          items: {},
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'execute_sql',
    description: 'Executes a write SQL operation (INSERT, UPDATE, DELETE) with optional parameters. DDL operations require "ddl" permission.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'SQL query to execute (INSERT, UPDATE, DELETE, or DDL if permitted)',
        },
        params: {
          type: 'array',
          description: 'Optional array of parameters for parameterized queries',
          items: {},
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'create_table',
    description: 'Creates a new table with the specified columns and indexes. Requires "ddl" permission.',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Name of the table to create',
        },
        columns: {
          type: 'array',
          description: 'Array of column definitions',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Column name' },
              type: { type: 'string', description: 'MySQL data type (e.g., VARCHAR(255), INT, TEXT)' },
              nullable: { type: 'boolean', description: 'Whether column can be NULL' },
              primary_key: { type: 'boolean', description: 'Whether this is the primary key' },
              auto_increment: { type: 'boolean', description: 'Whether column auto-increments' },
              default: { type: 'string', description: 'Default value' },
            },
            required: ['name', 'type'],
          },
        },
        indexes: {
          type: 'array',
          description: 'Optional indexes to create',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              columns: { type: 'array', items: { type: 'string' } },
              unique: { type: 'boolean' },
            },
          },
        },
      },
      required: ['table_name', 'columns'],
    },
  },
  {
    name: 'alter_table',
    description: 'Alters an existing table structure (add/drop/modify columns, add/drop indexes). Requires "ddl" permission.',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Name of the table to alter',
        },
        operations: {
          type: 'array',
          description: 'Array of alter operations to perform',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['add_column', 'drop_column', 'modify_column', 'rename_column', 'add_index', 'drop_index'],
                description: 'Type of alteration',
              },
              column_name: { type: 'string' },
              new_column_name: { type: 'string' },
              column_type: { type: 'string' },
              nullable: { type: 'boolean' },
              default: { type: 'string' },
              index_name: { type: 'string' },
              index_columns: { type: 'array', items: { type: 'string' } },
              unique: { type: 'boolean' },
            },
            required: ['type'],
          },
        },
      },
      required: ['table_name', 'operations'],
    },
  },
  {
    name: 'drop_table',
    description: 'Drops (deletes) a table and all its data. Requires "ddl" permission. WARNING: This is irreversible!',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Name of the table to drop',
        },
        if_exists: {
          type: 'boolean',
          description: 'If true, will not error if table does not exist',
        },
      },
      required: ['table_name'],
    },
  },
  {
    name: 'execute_ddl',
    description: 'Executes raw DDL SQL (CREATE, ALTER, DROP, TRUNCATE, RENAME). Requires "ddl" permission.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'DDL SQL query to execute',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'describe_connection',
    description: 'Returns information about the current database connection.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'test_connection',
    description: 'Tests the database connection and returns latency information.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_table_relationships',
    description: 'Returns foreign key relationships for a specified table.',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Name of the table to get relationships for',
        },
      },
      required: ['table_name'],
    },
  },
  // Transaction Tools
  {
    name: 'begin_transaction',
    description: 'Begins a new database transaction. Returns a transaction ID for subsequent operations.',
    inputSchema: {
      type: 'object',
      properties: {
        transactionId: {
          type: 'string',
          description: 'Optional custom transaction ID. If not provided, one will be generated.',
        },
      },
    },
  },
  {
    name: 'commit_transaction',
    description: 'Commits a transaction and makes all changes permanent.',
    inputSchema: {
      type: 'object',
      properties: {
        transactionId: {
          type: 'string',
          description: 'The transaction ID to commit',
        },
      },
      required: ['transactionId'],
    },
  },
  {
    name: 'rollback_transaction',
    description: 'Rolls back a transaction and undoes all changes made within it.',
    inputSchema: {
      type: 'object',
      properties: {
        transactionId: {
          type: 'string',
          description: 'The transaction ID to rollback',
        },
      },
      required: ['transactionId'],
    },
  },
  {
    name: 'get_transaction_status',
    description: 'Returns the status of all active transactions.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'execute_in_transaction',
    description: 'Executes a SQL query within an active transaction.',
    inputSchema: {
      type: 'object',
      properties: {
        transactionId: {
          type: 'string',
          description: 'The transaction ID to execute the query within',
        },
        query: {
          type: 'string',
          description: 'SQL query to execute within the transaction',
        },
        params: {
          type: 'array',
          description: 'Optional array of parameters for parameterized queries',
          items: {},
        },
      },
      required: ['transactionId', 'query'],
    },
  },
  // Stored Procedure Tools
  {
    name: 'list_stored_procedures',
    description: 'Lists all stored procedures in the specified database.',
    inputSchema: {
      type: 'object',
      properties: {
        database: {
          type: 'string',
          description: 'Optional: specific database name to list procedures from',
        },
      },
    },
  },
  {
    name: 'get_stored_procedure_info',
    description: 'Gets detailed information about a specific stored procedure including parameters and metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        procedure_name: {
          type: 'string',
          description: 'Name of the stored procedure to get information for',
        },
        database: {
          type: 'string',
          description: 'Optional: specific database name',
        },
      },
      required: ['procedure_name'],
    },
  },
  {
    name: 'execute_stored_procedure',
    description: 'Executes a stored procedure with optional parameters.',
    inputSchema: {
      type: 'object',
      properties: {
        procedure_name: {
          type: 'string',
          description: 'Name of the stored procedure to execute',
        },
        parameters: {
          type: 'array',
          description: 'Optional array of parameters to pass to the stored procedure',
          items: {},
        },
        database: {
          type: 'string',
          description: 'Optional: specific database name',
        },
      },
      required: ['procedure_name'],
    },
  },
  {
    name: 'create_stored_procedure',
    description: 'Creates a new stored procedure with the specified parameters and body.',
    inputSchema: {
      type: 'object',
      properties: {
        procedure_name: {
          type: 'string',
          description: 'Name of the stored procedure to create',
        },
        parameters: {
          type: 'array',
          description: 'Optional array of parameter definitions',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Parameter name' },
              mode: { type: 'string', enum: ['IN', 'OUT', 'INOUT'], description: 'Parameter mode' },
              data_type: { type: 'string', description: 'MySQL data type (e.g., VARCHAR(255), INT)' },
            },
            required: ['name', 'mode', 'data_type'],
          },
        },
        body: {
          type: 'string',
          description: 'SQL body of the stored procedure',
        },
        comment: {
          type: 'string',
          description: 'Optional comment for the stored procedure',
        },
        database: {
          type: 'string',
          description: 'Optional: specific database name',
        },
      },
      required: ['procedure_name', 'body'],
    },
  },
  {
    name: 'drop_stored_procedure',
    description: 'Drops (deletes) a stored procedure. WARNING: This is irreversible!',
    inputSchema: {
      type: 'object',
      properties: {
        procedure_name: {
          type: 'string',
          description: 'Name of the stored procedure to drop',
        },
        if_exists: {
          type: 'boolean',
          description: 'If true, will not error if procedure does not exist',
        },
        database: {
          type: 'string',
          description: 'Optional: specific database name',
        },
      },
      required: ['procedure_name'],
    },
  },
  {
    name: 'show_create_procedure',
    description: 'Shows the CREATE statement for a stored procedure.',
    inputSchema: {
      type: 'object',
      properties: {
        procedure_name: {
          type: 'string',
          description: 'Name of the stored procedure to show CREATE statement for',
        },
        database: {
          type: 'string',
          description: 'Optional: specific database name',
        },
      },
      required: ['procedure_name'],
    },
  },
  // Data Export Tools
  {
    name: 'export_table_to_csv',
    description: 'Export table data to CSV format with optional filtering, pagination, and sorting.',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Name of the table to export',
        },
        filters: {
          type: 'array',
          description: 'Array of filter conditions',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              operator: { 
                type: 'string',
                enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'in']
              },
              value: { 
                description: 'Value to compare against (can be string, number, boolean, or array for "in" operator)'
              },
            },
            required: ['field', 'operator', 'value'],
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', description: 'Page number (starting from 1)' },
            limit: { type: 'number', description: 'Number of records per page' },
          },
        },
        sorting: {
          type: 'object',
          properties: {
            field: { type: 'string', description: 'Field name to sort by' },
            direction: { type: 'string', enum: ['asc', 'desc'] },
          },
        },
        include_headers: {
          type: 'boolean',
          description: 'Whether to include column headers in the CSV output',
        },
      },
      required: ['table_name'],
    },
  },
  {
    name: 'export_query_to_csv',
    description: 'Export the results of a SELECT query to CSV format.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'SQL SELECT query to execute and export',
        },
        params: {
          type: 'array',
          description: 'Optional array of parameters for parameterized queries',
          items: {},
        },
        include_headers: {
          type: 'boolean',
          description: 'Whether to include column headers in the CSV output',
        },
      },
      required: ['query'],
    },
  },
];

// Create the MCP server
const server = new Server(
  {
    name: 'mysql-mcp-server',
    version: '1.4.1',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle tool call requests
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case 'list_databases':
        result = await mysqlMCP.listDatabases();
        break;

      case 'list_tables':
        result = await mysqlMCP.listTables((args || {}) as { database?: string });
        break;

      case 'read_table_schema':
        result = await mysqlMCP.readTableSchema((args || {}) as { table_name: string });
        break;

      case 'create_record':
        result = await mysqlMCP.createRecord((args || {}) as { table_name: string; data: Record<string, any> });
        break;

      case 'read_records':
        result = await mysqlMCP.readRecords((args || {}) as any);
        break;

      case 'update_record':
        result = await mysqlMCP.updateRecord((args || {}) as any);
        break;

      case 'delete_record':
        result = await mysqlMCP.deleteRecord((args || {}) as any);
        break;

      case 'bulk_insert':
        result = await mysqlMCP.bulkInsert((args || {}) as any);
        break;

      case 'bulk_update':
        result = await mysqlMCP.bulkUpdate((args || {}) as any);
        break;

      case 'bulk_delete':
        result = await mysqlMCP.bulkDelete((args || {}) as any);
        break;

      case 'run_query':
        result = await mysqlMCP.runQuery((args || {}) as { query: string; params?: any[] });
        break;

      case 'execute_sql':
        result = await mysqlMCP.executeSql((args || {}) as { query: string; params?: any[] });
        break;

      case 'create_table':
        result = await mysqlMCP.createTable(args || {});
        break;

      case 'alter_table':
        result = await mysqlMCP.alterTable(args || {});
        break;

      case 'drop_table':
        result = await mysqlMCP.dropTable(args || {});
        break;

      case 'execute_ddl':
        result = await mysqlMCP.executeDdl((args || {}) as { query: string });
        break;

      case 'describe_connection':
        result = await mysqlMCP.describeConnection();
        break;

      case 'test_connection':
        result = await mysqlMCP.testConnection();
        break;

      case 'get_table_relationships':
        result = await mysqlMCP.getTableRelationships((args || {}) as { table_name: string });
        break;

      // Transaction Tools
      case 'begin_transaction':
        result = await mysqlMCP.beginTransaction((args || {}) as { transactionId?: string });
        break;

      case 'commit_transaction':
        result = await mysqlMCP.commitTransaction((args || {}) as { transactionId: string });
        break;

      case 'rollback_transaction':
        result = await mysqlMCP.rollbackTransaction((args || {}) as { transactionId: string });
        break;

      case 'get_transaction_status':
        result = await mysqlMCP.getTransactionStatus();
        break;

      case 'execute_in_transaction':
        result = await mysqlMCP.executeInTransaction((args || {}) as { transactionId: string; query: string; params?: any[] });
        break;

      // Stored Procedure Tools
      case 'list_stored_procedures':
        result = await mysqlMCP.listStoredProcedures((args || {}) as { database?: string });
        break;

      case 'get_stored_procedure_info':
        result = await mysqlMCP.getStoredProcedureInfo((args || {}) as { procedure_name: string; database?: string });
        break;

      case 'execute_stored_procedure':
        result = await mysqlMCP.executeStoredProcedure((args || {}) as { procedure_name: string; parameters?: any[]; database?: string });
        break;

      case 'create_stored_procedure':
        result = await mysqlMCP.createStoredProcedure((args || {}) as any);
        break;

      case 'drop_stored_procedure':
        result = await mysqlMCP.dropStoredProcedure((args || {}) as { procedure_name: string; if_exists?: boolean; database?: string });
        break;

      case 'show_create_procedure':
        result = await mysqlMCP.showCreateProcedure((args || {}) as { procedure_name: string; database?: string });
        break;

      // Data Export Tools
      case 'export_table_to_csv':
        result = await mysqlMCP.exportTableToCSV((args || {}) as any);
        break;

      case 'export_query_to_csv':
        result = await mysqlMCP.exportQueryToCSV((args || {}) as { query: string; params?: any[]; include_headers?: boolean });
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    // Handle the result based on status
    if (result.status === 'error') {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${result.error}`,
          },
        ],
        isError: true,
      };
    }

    // Return successful result - handle different result types
    let responseData;
    if ('data' in result) {
      // Standard result with data property
      responseData = result.data;
    } else if ('transactionId' in result) {
      // Transaction result
      responseData = {
        transactionId: result.transactionId
      } as any;
      
      if ('message' in result && result.message) {
        responseData.message = result.message;
      }
      
      if ('activeTransactions' in result && result.activeTransactions) {
        responseData.activeTransactions = result.activeTransactions;
      }
    } else if ('message' in result) {
      // Simple message result
      responseData = { message: result.message };
    } else {
      // Fallback
      responseData = result;
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(responseData, null, 2),
        },
      ],
    };
  } catch (error: any) {
    // Check if this is a permission error
    if (error.message && error.message.includes('Permission denied')) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ ${error.message}`,
          },
        ],
        isError: true,
      };
    }
    
    // Handle other errors with generic message
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (not stdout, which is used for MCP protocol)
  console.error('MySQL MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
