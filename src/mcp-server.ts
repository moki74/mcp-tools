#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { MySQLMCP } from "./index.js";

// Get permissions and categories from environment variables (set by bin/mcp-mysql.js)
// Layer 1 (Permissions): MCP_PERMISSIONS or MCP_CONFIG (backward compatible)
// Layer 2 (Categories): MCP_CATEGORIES (optional, for fine-grained control)
const permissions = process.env.MCP_PERMISSIONS || process.env.MCP_CONFIG || "";
const categories = process.env.MCP_CATEGORIES || "";
const preset =
  process.env.MCP_PRESET || process.env.MCP_PERMISSION_PRESET || "";

// Declare the MySQL MCP instance (will be initialized in main())
let mysqlMCP: MySQLMCP;

// Define all available tools with their schemas
const TOOLS: Tool[] = [
  {
    name: "list_databases",
    description: "Lists all databases available on the MySQL server.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_tables",
    description: "Lists all tables in the connected MySQL database.",
    inputSchema: {
      type: "object",
      properties: {
        database: {
          type: "string",
          description: "Optional: specific database name to list tables from",
        },
      },
    },
  },
  {
    name: "get_database_summary",
    description:
      "Get a high-level summary of the database (tables, columns, row counts) optimized for AI context.",
    inputSchema: {
      type: "object",
      properties: {
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
    },
  },
  {
    name: "get_schema_erd",
    description:
      "Get a Mermaid.js ER diagram string representing the database schema and relationships.",
    inputSchema: {
      type: "object",
      properties: {
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
    },
  },
  {
    name: "get_schema_rag_context",
    description:
      "Return a compact schema-aware context pack (tables, PK/FK, columns, row estimates) optimized for RAG prompts.",
    inputSchema: {
      type: "object",
      properties: {
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
        max_tables: {
          type: "number",
          description: "Optional: maximum number of tables to include (default 50, max 200)",
        },
        max_columns: {
          type: "number",
          description: "Optional: maximum number of columns per table (default 12, max 200)",
        },
        include_relationships: {
          type: "boolean",
          description: "Whether to include FK relationships section (default: true)",
        },
      },
    },
  },
  {
    name: "get_column_statistics",
    description:
      "Get detailed statistics for a specific column (min, max, avg, distinct counts, nulls).",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table",
        },
        column_name: {
          type: "string",
          description: "Name of the column",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name", "column_name"],
    },
  },
  {
    name: "read_table_schema",
    description:
      "Reads the schema of a specified table, including columns, types, keys, and indexes.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to read schema from",
        },
      },
      required: ["table_name"],
    },
  },
  {
    name: "create_record",
    description: "Creates a new record in the specified table.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to insert into",
        },
        data: {
          type: "object",
          description: "Object containing column names and values to insert",
        },
      },
      required: ["table_name", "data"],
    },
  },
  {
    name: "read_records",
    description:
      "Reads records from the specified table with optional filtering, pagination, and sorting.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to read from",
        },
        filters: {
          type: "array",
          description: "Array of filter conditions",
          items: {
            type: "object",
            properties: {
              field: { type: "string" },
              operator: {
                type: "string",
                enum: ["eq", "neq", "gt", "gte", "lt", "lte", "like", "in"],
              },
              value: {
                description:
                  'Value to compare against (can be string, number, boolean, or array for "in" operator)',
              },
            },
            required: ["field", "operator", "value"],
          },
        },
        pagination: {
          type: "object",
          properties: {
            page: {
              type: "number",
              description: "Page number (starting from 1)",
            },
            limit: {
              type: "number",
              description: "Number of records per page",
            },
          },
        },
        sorting: {
          type: "object",
          properties: {
            field: { type: "string", description: "Field name to sort by" },
            direction: { type: "string", enum: ["asc", "desc"] },
          },
        },
      },
      required: ["table_name"],
    },
  },
  {
    name: "update_record",
    description:
      "Updates existing records in the specified table based on conditions.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to update",
        },
        data: {
          type: "object",
          description: "Object containing column names and new values",
        },
        conditions: {
          type: "array",
          description:
            "Array of conditions to identify which records to update",
          items: {
            type: "object",
            properties: {
              field: { type: "string" },
              operator: {
                type: "string",
                enum: ["eq", "neq", "gt", "gte", "lt", "lte", "like", "in"],
              },
              value: {},
            },
            required: ["field", "operator", "value"],
          },
        },
      },
      required: ["table_name", "data", "conditions"],
    },
  },
  {
    name: "delete_record",
    description:
      "Deletes records from the specified table based on conditions.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to delete from",
        },
        conditions: {
          type: "array",
          description:
            "Array of conditions to identify which records to delete",
          items: {
            type: "object",
            properties: {
              field: { type: "string" },
              operator: {
                type: "string",
                enum: ["eq", "neq", "gt", "gte", "lt", "lte", "like", "in"],
              },
              value: {},
            },
            required: ["field", "operator", "value"],
          },
        },
      },
      required: ["table_name", "conditions"],
    },
  },
  {
    name: "bulk_insert",
    description:
      "Bulk insert multiple records into the specified table with batch processing for optimal performance.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to insert into",
        },
        data: {
          type: "array",
          description:
            "Array of objects containing column names and values to insert",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: true,
          },
        },
        batch_size: {
          type: "number",
          description:
            "Optional batch size for processing (default: 1000, max: 10000)",
          minimum: 1,
          maximum: 10000,
        },
      },
      required: ["table_name", "data"],
    },
  },
  {
    name: "bulk_update",
    description:
      "Bulk update multiple records with different conditions and data using batch processing.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to update",
        },
        updates: {
          type: "array",
          description: "Array of update operations with data and conditions",
          minItems: 1,
          items: {
            type: "object",
            properties: {
              data: {
                type: "object",
                description: "Object containing column names and new values",
                additionalProperties: true,
              },
              conditions: {
                type: "array",
                description:
                  "Array of conditions to identify which records to update",
                minItems: 1,
                items: {
                  type: "object",
                  properties: {
                    field: { type: "string" },
                    operator: {
                      type: "string",
                      enum: [
                        "eq",
                        "neq",
                        "gt",
                        "gte",
                        "lt",
                        "lte",
                        "like",
                        "in",
                      ],
                    },
                    value: {},
                  },
                  required: ["field", "operator", "value"],
                },
              },
            },
            required: ["data", "conditions"],
          },
        },
        batch_size: {
          type: "number",
          description:
            "Optional batch size for processing (default: 100, max: 1000)",
          minimum: 1,
          maximum: 1000,
        },
      },
      required: ["table_name", "updates"],
    },
  },
  {
    name: "bulk_delete",
    description:
      "Bulk delete records based on multiple condition sets using batch processing.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to delete from",
        },
        condition_sets: {
          type: "array",
          description:
            "Array of condition sets, each defining records to delete",
          minItems: 1,
          items: {
            type: "array",
            description: "Array of conditions for this delete operation",
            minItems: 1,
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                operator: {
                  type: "string",
                  enum: ["eq", "neq", "gt", "gte", "lt", "lte", "like", "in"],
                },
                value: {},
              },
              required: ["field", "operator", "value"],
            },
          },
        },
        batch_size: {
          type: "number",
          description:
            "Optional batch size for processing (default: 100, max: 1000)",
          minimum: 1,
          maximum: 1000,
        },
      },
      required: ["table_name", "condition_sets"],
    },
  },
  {
    name: "run_query",
    description:
      "Runs a read-only SQL SELECT query with optional parameters, optimizer hints, and caching support. Only SELECT statements are allowed.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "SQL SELECT query to execute",
        },
        params: {
          type: "array",
          description: "Optional array of parameters for parameterized queries",
          items: {},
        },
        hints: {
          type: "object",
          description: "Optional MySQL optimizer hints to apply to the query",
          properties: {
            maxExecutionTime: {
              type: "number",
              description: "Maximum execution time in milliseconds",
            },
            forceIndex: {
              oneOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } },
              ],
              description: "Force usage of specific index(es)",
            },
            ignoreIndex: {
              oneOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } },
              ],
              description: "Ignore specific index(es)",
            },
            straightJoin: {
              type: "boolean",
              description: "Use STRAIGHT_JOIN to force join order",
            },
            noCache: {
              type: "boolean",
              description: "Disable query cache for this query",
            },
            sqlBigResult: {
              type: "boolean",
              description: "Optimize for large result sets",
            },
            sqlSmallResult: {
              type: "boolean",
              description: "Optimize for small result sets",
            },
          },
        },
        useCache: {
          type: "boolean",
          description: "Whether to use query result caching (default: true)",
        },
        dry_run: {
          type: "boolean",
          description:
            "If true, returns query plan and estimated cost without executing (Safe Mode)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "execute_sql",
    description:
      'Executes a write SQL operation (INSERT, UPDATE, DELETE) with optional parameters. DDL operations require "ddl" permission.',
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "SQL query to execute (INSERT, UPDATE, DELETE, or DDL if permitted)",
        },
        params: {
          type: "array",
          description: "Optional array of parameters for parameterized queries",
          items: {},
        },
      },
      required: ["query"],
    },
  },
  {
    name: "safe_export_table",
    description:
      "Exports table data to CSV with enforced data masking rules to protect sensitive information.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to export",
        },
        masking_profile: {
          type: "string",
          enum: ["soft", "partial", "strict"],
          description:
            "Masking profile to apply (default: strict). strict=redact all PII/secrets, partial=partial mask PII, soft=mask secrets only.",
        },
        limit: {
          type: "number",
          description: "Maximum number of rows to export (default: 1000, max: 10000)",
        },
        include_headers: {
          type: "boolean",
          description: "Whether to include CSV headers (default: true)",
        },
      },
      required: ["table_name"],
    },
  },
  {
    name: "repair_query",
    description: "Analyzes a SQL query (and optional error) to suggest repairs or optimizations using EXPLAIN and heuristics.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The SQL query to analyze or repair",
        },
        error_message: {
          type: "string",
          description: "Optional error message received when executing the query",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "create_table",
    description:
      'Creates a new table with the specified columns and indexes. Requires "ddl" permission.',
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to create",
        },
        columns: {
          type: "array",
          description: "Array of column definitions",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Column name" },
              type: {
                type: "string",
                description: "MySQL data type (e.g., VARCHAR(255), INT, TEXT)",
              },
              nullable: {
                type: "boolean",
                description: "Whether column can be NULL",
              },
              primary_key: {
                type: "boolean",
                description: "Whether this is the primary key",
              },
              auto_increment: {
                type: "boolean",
                description: "Whether column auto-increments",
              },
              default: { type: "string", description: "Default value" },
            },
            required: ["name", "type"],
          },
        },
        indexes: {
          type: "array",
          description: "Optional indexes to create",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              columns: { type: "array", items: { type: "string" } },
              unique: { type: "boolean" },
            },
          },
        },
      },
      required: ["table_name", "columns"],
    },
  },
  {
    name: "alter_table",
    description:
      'Alters an existing table structure (add/drop/modify columns, add/drop indexes). Requires "ddl" permission.',
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to alter",
        },
        operations: {
          type: "array",
          description: "Array of alter operations to perform",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: [
                  "add_column",
                  "drop_column",
                  "modify_column",
                  "rename_column",
                  "add_index",
                  "drop_index",
                ],
                description: "Type of alteration",
              },
              column_name: { type: "string" },
              new_column_name: { type: "string" },
              column_type: { type: "string" },
              nullable: { type: "boolean" },
              default: { type: "string" },
              index_name: { type: "string" },
              index_columns: { type: "array", items: { type: "string" } },
              unique: { type: "boolean" },
            },
            required: ["type"],
          },
        },
      },
      required: ["table_name", "operations"],
    },
  },
  {
    name: "drop_table",
    description:
      'Drops (deletes) a table and all its data. Requires "ddl" permission. WARNING: This is irreversible!',
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to drop",
        },
        if_exists: {
          type: "boolean",
          description: "If true, will not error if table does not exist",
        },
      },
      required: ["table_name"],
    },
  },
  {
    name: "execute_ddl",
    description:
      'Executes raw DDL SQL (CREATE, ALTER, DROP, TRUNCATE, RENAME). Requires "ddl" permission.',
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "DDL SQL query to execute",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "describe_connection",
    description: "Returns information about the current database connection.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "read_changelog",
    description:
      "Reads the changelog to see what features are new or changed.",
    inputSchema: {
      type: "object",
      properties: {
        version: {
          type: "string",
          description: "Optional: specific version to read (e.g., '1.0.0')",
        },
        limit: {
          type: "number",
          description: "Optional: limit character count (default: 5000)",
        },
      },
    },
  },
  {
    name: "test_connection",
    description:
      "Tests the database connection and returns latency information.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_table_relationships",
    description: "Returns foreign key relationships for a specified table.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to get relationships for",
        },
      },
      required: ["table_name"],
    },
  },
  // Transaction Tools
  {
    name: "begin_transaction",
    description:
      "Begins a new database transaction. Returns a transaction ID for subsequent operations.",
    inputSchema: {
      type: "object",
      properties: {
        transactionId: {
          type: "string",
          description:
            "Optional custom transaction ID. If not provided, one will be generated.",
        },
      },
    },
  },
  {
    name: "commit_transaction",
    description: "Commits a transaction and makes all changes permanent.",
    inputSchema: {
      type: "object",
      properties: {
        transactionId: {
          type: "string",
          description: "The transaction ID to commit",
        },
      },
      required: ["transactionId"],
    },
  },
  {
    name: "rollback_transaction",
    description:
      "Rolls back a transaction and undoes all changes made within it.",
    inputSchema: {
      type: "object",
      properties: {
        transactionId: {
          type: "string",
          description: "The transaction ID to rollback",
        },
      },
      required: ["transactionId"],
    },
  },
  {
    name: "get_transaction_status",
    description: "Returns the status of all active transactions.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "execute_in_transaction",
    description: "Executes a SQL query within an active transaction.",
    inputSchema: {
      type: "object",
      properties: {
        transactionId: {
          type: "string",
          description: "The transaction ID to execute the query within",
        },
        query: {
          type: "string",
          description: "SQL query to execute within the transaction",
        },
        params: {
          type: "array",
          description: "Optional array of parameters for parameterized queries",
          items: {},
        },
      },
      required: ["transactionId", "query"],
    },
  },
  // Stored Procedure Tools
  {
    name: "list_stored_procedures",
    description: "Lists all stored procedures in the specified database.",
    inputSchema: {
      type: "object",
      properties: {
        database: {
          type: "string",
          description:
            "Optional: specific database name to list procedures from",
        },
      },
    },
  },
  {
    name: "get_stored_procedure_info",
    description:
      "Gets detailed information about a specific stored procedure including parameters and metadata.",
    inputSchema: {
      type: "object",
      properties: {
        procedure_name: {
          type: "string",
          description: "Name of the stored procedure to get information for",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["procedure_name"],
    },
  },
  {
    name: "execute_stored_procedure",
    description: "Executes a stored procedure with optional parameters.",
    inputSchema: {
      type: "object",
      properties: {
        procedure_name: {
          type: "string",
          description: "Name of the stored procedure to execute",
        },
        parameters: {
          type: "array",
          description:
            "Optional array of parameters to pass to the stored procedure",
          items: {},
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["procedure_name"],
    },
  },
  {
    name: "create_stored_procedure",
    description:
      "Creates a new stored procedure with the specified parameters and body.",
    inputSchema: {
      type: "object",
      properties: {
        procedure_name: {
          type: "string",
          description: "Name of the stored procedure to create",
        },
        parameters: {
          type: "array",
          description: "Optional array of parameter definitions",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Parameter name" },
              mode: {
                type: "string",
                enum: ["IN", "OUT", "INOUT"],
                description: "Parameter mode",
              },
              data_type: {
                type: "string",
                description: "MySQL data type (e.g., VARCHAR(255), INT)",
              },
            },
            required: ["name", "mode", "data_type"],
          },
        },
        body: {
          type: "string",
          description: "SQL body of the stored procedure",
        },
        comment: {
          type: "string",
          description: "Optional comment for the stored procedure",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["procedure_name", "body"],
    },
  },
  {
    name: "drop_stored_procedure",
    description:
      "Drops (deletes) a stored procedure. WARNING: This is irreversible!",
    inputSchema: {
      type: "object",
      properties: {
        procedure_name: {
          type: "string",
          description: "Name of the stored procedure to drop",
        },
        if_exists: {
          type: "boolean",
          description: "If true, will not error if procedure does not exist",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["procedure_name"],
    },
  },
  {
    name: "show_create_procedure",
    description: "Shows the CREATE statement for a stored procedure.",
    inputSchema: {
      type: "object",
      properties: {
        procedure_name: {
          type: "string",
          description:
            "Name of the stored procedure to show CREATE statement for",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["procedure_name"],
    },
  },
  // Data Export Tools
  {
    name: "export_table_to_csv",
    description:
      "Export table data to CSV format with optional filtering, pagination, and sorting.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to export",
        },
        filters: {
          type: "array",
          description: "Array of filter conditions",
          items: {
            type: "object",
            properties: {
              field: { type: "string" },
              operator: {
                type: "string",
                enum: ["eq", "neq", "gt", "gte", "lt", "lte", "like", "in"],
              },
              value: {
                description:
                  'Value to compare against (can be string, number, boolean, or array for "in" operator)',
              },
            },
            required: ["field", "operator", "value"],
          },
        },
        pagination: {
          type: "object",
          properties: {
            page: {
              type: "number",
              description: "Page number (starting from 1)",
            },
            limit: {
              type: "number",
              description: "Number of records per page",
            },
          },
        },
        sorting: {
          type: "object",
          properties: {
            field: { type: "string", description: "Field name to sort by" },
            direction: { type: "string", enum: ["asc", "desc"] },
          },
        },
        include_headers: {
          type: "boolean",
          description: "Whether to include column headers in the CSV output",
        },
      },
      required: ["table_name"],
    },
  },
  {
    name: "export_query_to_csv",
    description: "Export the results of a SELECT query to CSV format.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "SQL SELECT query to execute and export",
        },
        params: {
          type: "array",
          description: "Optional array of parameters for parameterized queries",
          items: {},
        },
        include_headers: {
          type: "boolean",
          description: "Whether to include column headers in the CSV output",
        },
      },
      required: ["query"],
    },
  },
  // Cache Management Tools
  {
    name: "get_cache_stats",
    description:
      "Get query cache statistics including hit rate, size, and configuration.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_cache_config",
    description: "Get current cache configuration settings.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "configure_cache",
    description:
      "Configure cache settings including TTL, max size, and enable/disable.",
    inputSchema: {
      type: "object",
      properties: {
        enabled: {
          type: "boolean",
          description: "Enable or disable the query cache",
        },
        ttlMs: {
          type: "number",
          description: "Cache time-to-live in milliseconds (default: 60000)",
        },
        maxSize: {
          type: "number",
          description: "Maximum number of cached entries (default: 100)",
        },
        maxMemoryMB: {
          type: "number",
          description: "Maximum memory usage in MB (default: 50)",
        },
      },
    },
  },
  {
    name: "clear_cache",
    description: "Clear all entries from the query cache.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "invalidate_table_cache",
    description: "Invalidate all cached queries related to a specific table.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to invalidate cache for",
        },
      },
      required: ["table_name"],
    },
  },
  // Query Optimization Tools
  {
    name: "analyze_query",
    description:
      "Analyze a SQL query and get optimization suggestions including recommended indexes and hints.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "SQL query to analyze",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_optimization_hints",
    description:
      "Get suggested MySQL optimizer hints for a specific optimization goal (SPEED, MEMORY, or STABILITY).",
    inputSchema: {
      type: "object",
      properties: {
        goal: {
          type: "string",
          enum: ["SPEED", "MEMORY", "STABILITY"],
          description:
            "Optimization goal: SPEED for faster queries, MEMORY for lower memory usage, STABILITY for consistent performance",
        },
      },
      required: ["goal"],
    },
  },
  // View Tools
  {
    name: "list_views",
    description: "Lists all views in the connected database.",
    inputSchema: {
      type: "object",
      properties: {
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
    },
  },
  {
    name: "get_view_info",
    description:
      "Gets detailed information about a specific view including columns and definition.",
    inputSchema: {
      type: "object",
      properties: {
        view_name: { type: "string", description: "Name of the view" },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["view_name"],
    },
  },
  {
    name: "create_view",
    description:
      "Creates a new view with the specified SELECT definition. Requires 'ddl' permission.",
    inputSchema: {
      type: "object",
      properties: {
        view_name: {
          type: "string",
          description: "Name of the view to create",
        },
        definition: {
          type: "string",
          description: "SELECT statement that defines the view",
        },
        or_replace: {
          type: "boolean",
          description: "If true, replaces existing view",
        },
        algorithm: {
          type: "string",
          enum: ["UNDEFINED", "MERGE", "TEMPTABLE"],
          description: "View algorithm",
        },
        security: {
          type: "string",
          enum: ["DEFINER", "INVOKER"],
          description: "Security context",
        },
        check_option: {
          type: "string",
          enum: ["CASCADED", "LOCAL"],
          description: "Check option for updatable views",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["view_name", "definition"],
    },
  },
  {
    name: "alter_view",
    description:
      "Alters an existing view definition. Requires 'ddl' permission.",
    inputSchema: {
      type: "object",
      properties: {
        view_name: { type: "string", description: "Name of the view to alter" },
        definition: {
          type: "string",
          description: "New SELECT statement that defines the view",
        },
        algorithm: {
          type: "string",
          enum: ["UNDEFINED", "MERGE", "TEMPTABLE"],
          description: "View algorithm",
        },
        security: {
          type: "string",
          enum: ["DEFINER", "INVOKER"],
          description: "Security context",
        },
        check_option: {
          type: "string",
          enum: ["CASCADED", "LOCAL"],
          description: "Check option",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["view_name", "definition"],
    },
  },
  {
    name: "drop_view",
    description:
      "Drops a view. Requires 'ddl' permission. WARNING: This is irreversible!",
    inputSchema: {
      type: "object",
      properties: {
        view_name: { type: "string", description: "Name of the view to drop" },
        if_exists: {
          type: "boolean",
          description: "If true, will not error if view does not exist",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["view_name"],
    },
  },
  {
    name: "show_create_view",
    description: "Shows the CREATE statement for a view.",
    inputSchema: {
      type: "object",
      properties: {
        view_name: { type: "string", description: "Name of the view" },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["view_name"],
    },
  },
  // Trigger Tools
  {
    name: "list_triggers",
    description:
      "Lists all triggers in the database, optionally filtered by table.",
    inputSchema: {
      type: "object",
      properties: {
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
        table_name: {
          type: "string",
          description: "Optional: filter triggers for specific table",
        },
      },
    },
  },
  {
    name: "get_trigger_info",
    description: "Gets detailed information about a specific trigger.",
    inputSchema: {
      type: "object",
      properties: {
        trigger_name: { type: "string", description: "Name of the trigger" },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["trigger_name"],
    },
  },
  {
    name: "create_trigger",
    description: "Creates a new trigger on a table. Requires 'ddl' permission.",
    inputSchema: {
      type: "object",
      properties: {
        trigger_name: { type: "string", description: "Name of the trigger" },
        table_name: {
          type: "string",
          description: "Table the trigger is associated with",
        },
        timing: {
          type: "string",
          enum: ["BEFORE", "AFTER"],
          description: "When the trigger fires",
        },
        event: {
          type: "string",
          enum: ["INSERT", "UPDATE", "DELETE"],
          description: "Event that fires the trigger",
        },
        body: { type: "string", description: "SQL statements to execute" },
        definer: {
          type: "string",
          description: "Optional: user who owns the trigger",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["trigger_name", "table_name", "timing", "event", "body"],
    },
  },
  {
    name: "drop_trigger",
    description:
      "Drops a trigger. Requires 'ddl' permission. WARNING: This is irreversible!",
    inputSchema: {
      type: "object",
      properties: {
        trigger_name: {
          type: "string",
          description: "Name of the trigger to drop",
        },
        if_exists: {
          type: "boolean",
          description: "If true, will not error if trigger does not exist",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["trigger_name"],
    },
  },
  {
    name: "show_create_trigger",
    description: "Shows the CREATE statement for a trigger.",
    inputSchema: {
      type: "object",
      properties: {
        trigger_name: { type: "string", description: "Name of the trigger" },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["trigger_name"],
    },
  },
  // Function Tools
  {
    name: "list_functions",
    description: "Lists all user-defined functions in the database.",
    inputSchema: {
      type: "object",
      properties: {
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
    },
  },
  {
    name: "get_function_info",
    description:
      "Gets detailed information about a specific function including parameters.",
    inputSchema: {
      type: "object",
      properties: {
        function_name: { type: "string", description: "Name of the function" },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["function_name"],
    },
  },
  {
    name: "create_function",
    description:
      "Creates a new user-defined function. Requires 'ddl' permission.",
    inputSchema: {
      type: "object",
      properties: {
        function_name: { type: "string", description: "Name of the function" },
        parameters: {
          type: "array",
          description: "Array of parameter definitions",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              data_type: { type: "string" },
            },
            required: ["name", "data_type"],
          },
        },
        returns: { type: "string", description: "Return data type" },
        body: { type: "string", description: "Function body (SQL statements)" },
        deterministic: {
          type: "boolean",
          description:
            "Whether function always returns same result for same input",
        },
        data_access: {
          type: "string",
          enum: [
            "CONTAINS SQL",
            "NO SQL",
            "READS SQL DATA",
            "MODIFIES SQL DATA",
          ],
        },
        security: { type: "string", enum: ["DEFINER", "INVOKER"] },
        comment: { type: "string", description: "Optional comment" },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["function_name", "returns", "body"],
    },
  },
  {
    name: "drop_function",
    description: "Drops a user-defined function. Requires 'ddl' permission.",
    inputSchema: {
      type: "object",
      properties: {
        function_name: {
          type: "string",
          description: "Name of the function to drop",
        },
        if_exists: {
          type: "boolean",
          description: "If true, will not error if function does not exist",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["function_name"],
    },
  },
  {
    name: "show_create_function",
    description: "Shows the CREATE statement for a function.",
    inputSchema: {
      type: "object",
      properties: {
        function_name: { type: "string", description: "Name of the function" },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["function_name"],
    },
  },
  {
    name: "execute_function",
    description: "Executes a user-defined function and returns its result.",
    inputSchema: {
      type: "object",
      properties: {
        function_name: {
          type: "string",
          description: "Name of the function to execute",
        },
        parameters: {
          type: "array",
          description: "Array of parameter values",
          items: {},
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["function_name"],
    },
  },
  // Index Tools
  {
    name: "list_indexes",
    description: "Lists all indexes for a specific table.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: { type: "string", description: "Name of the table" },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name"],
    },
  },
  {
    name: "get_index_info",
    description: "Gets detailed information about a specific index.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: { type: "string", description: "Name of the table" },
        index_name: { type: "string", description: "Name of the index" },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name", "index_name"],
    },
  },
  {
    name: "create_index",
    description: "Creates a new index on a table. Requires 'ddl' permission.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: { type: "string", description: "Name of the table" },
        index_name: { type: "string", description: "Name of the index" },
        columns: {
          type: "array",
          description:
            "Columns to index (string or object with column, length, order)",
          items: {},
        },
        unique: { type: "boolean", description: "Whether index is unique" },
        index_type: {
          type: "string",
          enum: ["BTREE", "HASH", "FULLTEXT", "SPATIAL"],
          description: "Index type",
        },
        comment: { type: "string", description: "Optional comment" },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name", "index_name", "columns"],
    },
  },
  {
    name: "drop_index",
    description: "Drops an index from a table. Requires 'ddl' permission.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: { type: "string", description: "Name of the table" },
        index_name: {
          type: "string",
          description: "Name of the index to drop",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name", "index_name"],
    },
  },
  {
    name: "analyze_index",
    description: "Analyzes a table to update index statistics.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to analyze",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name"],
    },
  },
  // Constraint Tools
  {
    name: "list_foreign_keys",
    description: "Lists all foreign key constraints for a table.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: { type: "string", description: "Name of the table" },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name"],
    },
  },
  {
    name: "list_constraints",
    description:
      "Lists all constraints (PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK) for a table.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: { type: "string", description: "Name of the table" },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name"],
    },
  },
  {
    name: "add_foreign_key",
    description:
      "Adds a foreign key constraint to a table. Requires 'ddl' permission.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: { type: "string", description: "Name of the table" },
        constraint_name: {
          type: "string",
          description: "Name of the constraint",
        },
        columns: {
          type: "array",
          items: { type: "string" },
          description: "Columns in the foreign key",
        },
        referenced_table: {
          type: "string",
          description: "Referenced table name",
        },
        referenced_columns: {
          type: "array",
          items: { type: "string" },
          description: "Referenced columns",
        },
        on_delete: {
          type: "string",
          enum: ["CASCADE", "SET NULL", "RESTRICT", "NO ACTION", "SET DEFAULT"],
        },
        on_update: {
          type: "string",
          enum: ["CASCADE", "SET NULL", "RESTRICT", "NO ACTION", "SET DEFAULT"],
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: [
        "table_name",
        "constraint_name",
        "columns",
        "referenced_table",
        "referenced_columns",
      ],
    },
  },
  {
    name: "drop_foreign_key",
    description: "Drops a foreign key constraint. Requires 'ddl' permission.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: { type: "string", description: "Name of the table" },
        constraint_name: {
          type: "string",
          description: "Name of the constraint to drop",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name", "constraint_name"],
    },
  },
  {
    name: "add_unique_constraint",
    description:
      "Adds a unique constraint to a table. Requires 'ddl' permission.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: { type: "string", description: "Name of the table" },
        constraint_name: {
          type: "string",
          description: "Name of the constraint",
        },
        columns: {
          type: "array",
          items: { type: "string" },
          description: "Columns in the unique constraint",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name", "constraint_name", "columns"],
    },
  },
  {
    name: "drop_constraint",
    description:
      "Drops a UNIQUE or CHECK constraint. Requires 'ddl' permission.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: { type: "string", description: "Name of the table" },
        constraint_name: {
          type: "string",
          description: "Name of the constraint",
        },
        constraint_type: {
          type: "string",
          enum: ["UNIQUE", "CHECK"],
          description: "Type of constraint",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name", "constraint_name", "constraint_type"],
    },
  },
  {
    name: "add_check_constraint",
    description:
      "Adds a CHECK constraint to a table (MySQL 8.0.16+). Requires 'ddl' permission.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: { type: "string", description: "Name of the table" },
        constraint_name: {
          type: "string",
          description: "Name of the constraint",
        },
        expression: {
          type: "string",
          description: "Check expression (e.g., 'age >= 18')",
        },
        enforced: {
          type: "boolean",
          description: "Whether constraint is enforced (default: true)",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name", "constraint_name", "expression"],
    },
  },
  // Table Maintenance Tools
  {
    name: "analyze_table",
    description:
      "Analyzes a table to update index statistics for the query optimizer.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to analyze",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name"],
    },
  },
  {
    name: "optimize_table",
    description:
      "Optimizes a table to reclaim unused space and defragment data.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to optimize",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name"],
    },
  },
  {
    name: "check_table",
    description: "Checks a table for errors.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to check",
        },
        check_type: {
          type: "string",
          enum: ["QUICK", "FAST", "MEDIUM", "EXTENDED", "CHANGED"],
          description: "Type of check",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name"],
    },
  },
  {
    name: "repair_table",
    description: "Repairs a corrupted table (MyISAM, ARCHIVE, CSV only).",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to repair",
        },
        quick: { type: "boolean", description: "Quick repair" },
        extended: { type: "boolean", description: "Extended repair" },
        use_frm: { type: "boolean", description: "Use .frm file to repair" },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name"],
    },
  },
  {
    name: "truncate_table",
    description:
      "Truncates a table (removes all rows quickly). Requires 'ddl' permission. WARNING: This is irreversible!",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to truncate",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name"],
    },
  },
  {
    name: "get_table_status",
    description: "Gets detailed status and statistics for one or all tables.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Optional: specific table name (omit for all tables)",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
    },
  },
  {
    name: "flush_table",
    description: "Flushes table(s) - closes and reopens them.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Optional: specific table (omit for all tables)",
        },
        with_read_lock: {
          type: "boolean",
          description: "Acquire read lock after flushing",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
    },
  },
  {
    name: "get_table_size",
    description:
      "Gets size information for one or all tables including data and index sizes.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Optional: specific table name (omit for all tables)",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
    },
  },
  // Process Management Tools
  {
    name: "show_process_list",
    description: "Shows all running MySQL processes/connections.",
    inputSchema: {
      type: "object",
      properties: {
        full: { type: "boolean", description: "Show full query text" },
      },
    },
  },
  {
    name: "kill_process",
    description: "Kills a MySQL process/connection by ID.",
    inputSchema: {
      type: "object",
      properties: {
        process_id: { type: "number", description: "Process ID to kill" },
        type: {
          type: "string",
          enum: ["CONNECTION", "QUERY"],
          description: "Kill connection or just query",
        },
      },
      required: ["process_id"],
    },
  },
  {
    name: "show_status",
    description: "Shows MySQL server status variables.",
    inputSchema: {
      type: "object",
      properties: {
        like: {
          type: "string",
          description: "Optional: filter pattern (e.g., 'Thread%')",
        },
        global: {
          type: "boolean",
          description: "Show global status instead of session",
        },
      },
    },
  },
  {
    name: "show_variables",
    description: "Shows MySQL server configuration variables.",
    inputSchema: {
      type: "object",
      properties: {
        like: {
          type: "string",
          description: "Optional: filter pattern (e.g., 'max_%')",
        },
        global: {
          type: "boolean",
          description: "Show global variables instead of session",
        },
      },
    },
  },
  {
    name: "explain_query",
    description: "Shows the execution plan for a query (EXPLAIN).",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "SQL query to explain" },
        format: {
          type: "string",
          enum: ["TRADITIONAL", "JSON", "TREE"],
          description: "Output format",
        },
        analyze: {
          type: "boolean",
          description: "Actually execute the query and show real statistics",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "show_engine_status",
    description: "Shows storage engine status (InnoDB by default).",
    inputSchema: {
      type: "object",
      properties: {
        engine: {
          type: "string",
          description: "Engine name (INNODB, PERFORMANCE_SCHEMA, etc.)",
        },
      },
    },
  },
  {
    name: "get_server_info",
    description:
      "Gets comprehensive MySQL server information including version, uptime, and statistics.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "show_binary_logs",
    description: "Shows binary log files on the server.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "show_replication_status",
    description: "Shows replication status (master or replica).",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["MASTER", "REPLICA", "SLAVE"],
          description: "Which status to show",
        },
      },
    },
  },
  // Backup and Restore Tools
  {
    name: "backup_table",
    description:
      "Backup a single table to SQL dump format including structure and optionally data.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to backup",
        },
        include_data: {
          type: "boolean",
          description: "Include table data in the backup (default: true)",
        },
        include_drop: {
          type: "boolean",
          description: "Include DROP TABLE IF EXISTS statement (default: true)",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name"],
    },
  },
  {
    name: "backup_database",
    description:
      "Backup entire database or selected tables to SQL dump format.",
    inputSchema: {
      type: "object",
      properties: {
        include_data: {
          type: "boolean",
          description: "Include table data in the backup (default: true)",
        },
        include_drop: {
          type: "boolean",
          description:
            "Include DROP TABLE IF EXISTS statements (default: true)",
        },
        tables: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional: specific tables to backup (default: all tables)",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
    },
  },
  {
    name: "restore_from_sql",
    description:
      "Restore database from SQL dump content. Executes SQL statements from the provided dump. Requires 'ddl' permission.",
    inputSchema: {
      type: "object",
      properties: {
        sql_dump: {
          type: "string",
          description: "SQL dump content to restore",
        },
        stop_on_error: {
          type: "boolean",
          description: "Stop execution on first error (default: true)",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["sql_dump"],
    },
  },
  {
    name: "get_create_table_statement",
    description: "Get the CREATE TABLE statement for a specific table.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name"],
    },
  },
  {
    name: "get_database_schema",
    description:
      "Get complete database schema including tables, views, procedures, functions, and triggers.",
    inputSchema: {
      type: "object",
      properties: {
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
        include_views: {
          type: "boolean",
          description: "Include views in schema (default: true)",
        },
        include_procedures: {
          type: "boolean",
          description: "Include stored procedures in schema (default: true)",
        },
        include_functions: {
          type: "boolean",
          description: "Include functions in schema (default: true)",
        },
        include_triggers: {
          type: "boolean",
          description: "Include triggers in schema (default: true)",
        },
      },
    },
  },
  // Extended Data Export Tools (JSON, SQL)
  {
    name: "export_table_to_json",
    description:
      "Export table data to JSON format with optional filtering, pagination, and sorting.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to export",
        },
        filters: {
          type: "array",
          description: "Array of filter conditions",
          items: {
            type: "object",
            properties: {
              field: { type: "string" },
              operator: {
                type: "string",
                enum: ["eq", "neq", "gt", "gte", "lt", "lte", "like", "in"],
              },
              value: {},
            },
            required: ["field", "operator", "value"],
          },
        },
        pagination: {
          type: "object",
          properties: {
            page: { type: "number" },
            limit: { type: "number" },
          },
        },
        sorting: {
          type: "object",
          properties: {
            field: { type: "string" },
            direction: { type: "string", enum: ["asc", "desc"] },
          },
        },
        pretty: {
          type: "boolean",
          description: "Pretty print JSON output (default: true)",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name"],
    },
  },
  {
    name: "export_query_to_json",
    description: "Export the results of a SELECT query to JSON format.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "SQL SELECT query to execute and export",
        },
        params: {
          type: "array",
          description: "Optional array of parameters for parameterized queries",
          items: {},
        },
        pretty: {
          type: "boolean",
          description: "Pretty print JSON output (default: true)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "export_table_to_sql",
    description:
      "Export table data to SQL INSERT statements with optional CREATE TABLE.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to export",
        },
        filters: {
          type: "array",
          description: "Array of filter conditions",
          items: {
            type: "object",
            properties: {
              field: { type: "string" },
              operator: {
                type: "string",
                enum: ["eq", "neq", "gt", "gte", "lt", "lte", "like", "in"],
              },
              value: {},
            },
            required: ["field", "operator", "value"],
          },
        },
        include_create_table: {
          type: "boolean",
          description: "Include CREATE TABLE statement (default: false)",
        },
        batch_size: {
          type: "number",
          description: "Number of rows per INSERT statement (default: 100)",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name"],
    },
  },
  // Data Import Tools
  {
    name: "import_from_csv",
    description:
      "Import data from CSV string into a table. Requires 'create' permission.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to import into",
        },
        csv_data: {
          type: "string",
          description: "CSV data as a string",
        },
        has_headers: {
          type: "boolean",
          description: "CSV has header row (default: true)",
        },
        column_mapping: {
          type: "object",
          description:
            "Optional: map CSV columns to table columns {csv_col: table_col}",
          additionalProperties: { type: "string" },
        },
        skip_errors: {
          type: "boolean",
          description: "Continue on row errors (default: false)",
        },
        batch_size: {
          type: "number",
          description: "Number of rows per batch insert (default: 100)",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name", "csv_data"],
    },
  },
  {
    name: "import_from_json",
    description:
      "Import data from JSON array string into a table. Requires 'create' permission.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to import into",
        },
        json_data: {
          type: "string",
          description: "JSON array of objects as a string",
        },
        column_mapping: {
          type: "object",
          description:
            "Optional: map JSON keys to table columns {json_key: table_col}",
          additionalProperties: { type: "string" },
        },
        skip_errors: {
          type: "boolean",
          description: "Continue on row errors (default: false)",
        },
        batch_size: {
          type: "number",
          description: "Number of rows per batch insert (default: 100)",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table_name", "json_data"],
    },
  },
  // Data Migration Tools
  {
    name: "copy_table_data",
    description:
      "Copy data from one table to another with optional column mapping and filtering. Requires 'create' permission.",
    inputSchema: {
      type: "object",
      properties: {
        source_table: {
          type: "string",
          description: "Name of the source table to copy from",
        },
        target_table: {
          type: "string",
          description: "Name of the target table to copy to",
        },
        column_mapping: {
          type: "object",
          description:
            "Optional: map source columns to target columns {source_col: target_col}",
          additionalProperties: { type: "string" },
        },
        filters: {
          type: "array",
          description: "Optional: array of filter conditions for source data",
          items: {
            type: "object",
            properties: {
              field: { type: "string" },
              operator: {
                type: "string",
                enum: ["eq", "neq", "gt", "gte", "lt", "lte", "like", "in"],
              },
              value: {},
            },
            required: ["field", "operator", "value"],
          },
        },
        batch_size: {
          type: "number",
          description: "Number of rows per batch insert (default: 1000)",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["source_table", "target_table"],
    },
  },
  {
    name: "move_table_data",
    description:
      "Move data from one table to another (copy then delete from source). Requires 'create' and 'delete' permissions.",
    inputSchema: {
      type: "object",
      properties: {
        source_table: {
          type: "string",
          description: "Name of the source table to move from",
        },
        target_table: {
          type: "string",
          description: "Name of the target table to move to",
        },
        column_mapping: {
          type: "object",
          description:
            "Optional: map source columns to target columns {source_col: target_col}",
          additionalProperties: { type: "string" },
        },
        filters: {
          type: "array",
          description: "Optional: array of filter conditions for source data",
          items: {
            type: "object",
            properties: {
              field: { type: "string" },
              operator: {
                type: "string",
                enum: ["eq", "neq", "gt", "gte", "lt", "lte", "like", "in"],
              },
              value: {},
            },
            required: ["field", "operator", "value"],
          },
        },
        batch_size: {
          type: "number",
          description: "Number of rows per batch (default: 1000)",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["source_table", "target_table"],
    },
  },
  {
    name: "clone_table",
    description:
      "Clone a table structure with optional data. Requires 'ddl' permission.",
    inputSchema: {
      type: "object",
      properties: {
        source_table: {
          type: "string",
          description: "Name of the source table to clone",
        },
        new_table_name: {
          type: "string",
          description: "Name of the new table to create",
        },
        include_data: {
          type: "boolean",
          description: "Include table data in the clone (default: false)",
        },
        include_indexes: {
          type: "boolean",
          description: "Include indexes in the clone (default: true)",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["source_table", "new_table_name"],
    },
  },
  {
    name: "compare_table_structure",
    description:
      "Compare the structure of two tables and identify differences in columns, types, and indexes.",
    inputSchema: {
      type: "object",
      properties: {
        table1: {
          type: "string",
          description: "Name of the first table",
        },
        table2: {
          type: "string",
          description: "Name of the second table",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table1", "table2"],
    },
  },
  {
    name: "sync_table_data",
    description:
      "Synchronize data between two tables based on a key column. Supports insert-only, update-only, or upsert modes.",
    inputSchema: {
      type: "object",
      properties: {
        source_table: {
          type: "string",
          description: "Name of the source table",
        },
        target_table: {
          type: "string",
          description: "Name of the target table",
        },
        key_column: {
          type: "string",
          description: "Primary key or unique column to match records",
        },
        columns_to_sync: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional: specific columns to sync (default: all columns)",
        },
        sync_mode: {
          type: "string",
          enum: ["insert_only", "update_only", "upsert"],
          description:
            "Sync mode: insert_only (new records), update_only (existing), upsert (both). Default: upsert",
        },
        batch_size: {
          type: "number",
          description: "Number of rows per batch (default: 1000)",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["source_table", "target_table", "key_column"],
    },
  },
  // Schema Versioning and Migrations Tools
  {
    name: "init_migrations_table",
    description:
      "Initialize the migrations tracking table (_schema_migrations) for schema versioning. Creates the table if it doesn't exist.",
    inputSchema: {
      type: "object",
      properties: {
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
    },
  },
  {
    name: "create_migration",
    description:
      "Create a new migration entry with up and down SQL. The migration will be stored as pending until applied. Requires 'ddl' permission.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description:
            "Name of the migration (e.g., 'add_users_table', 'add_email_column')",
        },
        up_sql: {
          type: "string",
          description:
            "SQL statements to apply the migration (can contain multiple statements separated by semicolons)",
        },
        down_sql: {
          type: "string",
          description:
            "SQL statements to rollback the migration (optional but recommended)",
        },
        description: {
          type: "string",
          description: "Optional description of what this migration does",
        },
        version: {
          type: "string",
          description:
            "Optional: custom version string (14 chars, e.g., '20240115120000'). Auto-generated if not provided.",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["name", "up_sql"],
    },
  },
  {
    name: "apply_migrations",
    description:
      "Apply all pending migrations or up to a specific version. Executes migrations in version order. Requires 'ddl' permission.",
    inputSchema: {
      type: "object",
      properties: {
        target_version: {
          type: "string",
          description:
            "Optional: apply migrations up to this version (inclusive)",
        },
        dry_run: {
          type: "boolean",
          description:
            "If true, show what would be applied without executing (default: false)",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
    },
  },
  {
    name: "rollback_migration",
    description:
      "Rollback applied migrations. Can rollback by steps or to a specific version. Requires 'ddl' permission.",
    inputSchema: {
      type: "object",
      properties: {
        target_version: {
          type: "string",
          description:
            "Optional: rollback to this version (exclusive - this version will remain applied)",
        },
        steps: {
          type: "number",
          description:
            "Number of migrations to rollback (default: 1). Ignored if target_version is specified.",
        },
        dry_run: {
          type: "boolean",
          description:
            "If true, show what would be rolled back without executing (default: false)",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
    },
  },
  {
    name: "get_migration_status",
    description:
      "Get migration history and status. Shows all migrations with their current status, execution times, and any errors.",
    inputSchema: {
      type: "object",
      properties: {
        version: {
          type: "string",
          description: "Optional: get status of a specific version",
        },
        status: {
          type: "string",
          enum: ["pending", "applied", "failed", "rolled_back"],
          description: "Optional: filter by status",
        },
        limit: {
          type: "number",
          description: "Maximum number of migrations to return (default: 50)",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
    },
  },
  {
    name: "get_schema_version",
    description:
      "Get the current schema version (the last successfully applied migration).",
    inputSchema: {
      type: "object",
      properties: {
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
    },
  },
  {
    name: "validate_migrations",
    description:
      "Validate all migrations for issues such as duplicate versions, missing down_sql, checksum mismatches, or blocked migrations.",
    inputSchema: {
      type: "object",
      properties: {
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
    },
  },
  {
    name: "reset_failed_migration",
    description:
      "Reset a failed migration back to pending status so it can be retried. Only works for migrations in 'failed' status.",
    inputSchema: {
      type: "object",
      properties: {
        version: {
          type: "string",
          description: "Version of the failed migration to reset",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["version"],
    },
  },
  {
    name: "generate_migration_from_diff",
    description:
      "Generate a migration by comparing two table structures. Creates up_sql to transform table2 to match table1, and down_sql to revert. Requires 'ddl' permission.",
    inputSchema: {
      type: "object",
      properties: {
        table1: {
          type: "string",
          description: "Source table (the structure to match)",
        },
        table2: {
          type: "string",
          description: "Target table (the table to be modified)",
        },
        migration_name: {
          type: "string",
          description: "Name for the generated migration",
        },
        database: {
          type: "string",
          description: "Optional: specific database name",
        },
      },
      required: ["table1", "table2", "migration_name"],
    },
  },
  // Performance Monitoring Tools
  {
    name: "get_performance_metrics",
    description:
      "Get comprehensive MySQL performance metrics including query performance, connection stats, buffer pool metrics, and InnoDB statistics.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_top_queries_by_time",
    description:
      "Get the top queries ordered by total execution time. Useful for identifying slow queries.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description:
            "Maximum number of queries to return (default: 10, max: 100)",
        },
      },
    },
  },
  {
    name: "get_top_queries_by_count",
    description:
      "Get the top queries ordered by execution count. Useful for identifying frequently executed queries.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description:
            "Maximum number of queries to return (default: 10, max: 100)",
        },
      },
    },
  },
  {
    name: "get_slow_queries",
    description:
      "Get queries that exceed a specified execution time threshold.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description:
            "Maximum number of queries to return (default: 10, max: 100)",
        },
        threshold_seconds: {
          type: "number",
          description: "Execution time threshold in seconds (default: 1)",
        },
      },
    },
  },
  {
    name: "get_table_io_stats",
    description:
      "Get I/O statistics for tables including read/write operations and timings.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description:
            "Maximum number of tables to return (default: 20, max: 100)",
        },
        table_schema: {
          type: "string",
          description: "Filter by specific database schema",
        },
      },
    },
  },
  {
    name: "get_index_usage_stats",
    description:
      "Get index usage statistics showing how often each index is used.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description:
            "Maximum number of indexes to return (default: 20, max: 100)",
        },
        table_schema: {
          type: "string",
          description: "Filter by specific database schema",
        },
      },
    },
  },
  {
    name: "get_unused_indexes",
    description:
      "Identify indexes that are not being used by queries. These may be candidates for removal to improve write performance.",
    inputSchema: {
      type: "object",
      properties: {
        table_schema: {
          type: "string",
          description: "Filter by specific database schema",
        },
      },
    },
  },
  {
    name: "get_connection_pool_stats",
    description:
      "Get connection pool statistics including current connections, max usage, configuration, and health indicators.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_database_health_check",
    description:
      "Perform a comprehensive health check of the database including connection usage, buffer pool efficiency, aborted connections, and slow queries.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "reset_performance_stats",
    description:
      "Reset performance schema statistics. This clears query digest statistics, table I/O stats, and index usage stats. Requires 'utility' permission.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// Create the MCP server
const server = new Server(
  {
    name: "mysql-mcp-server",
    version: "1.12.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Handle list tools request - filter tools based on permissions and categories
server.setRequestHandler(ListToolsRequestSchema, async () => {
  // Filter tools to only return those that are enabled based on current config
  const enabledTools = TOOLS.filter((tool) => {
    // Convert tool name from snake_case to camelCase for checking
    // e.g., "list_databases" -> "listDatabases"
    const toolNameCamelCase = tool.name.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase(),
    );

    // Check if tool is enabled based on permissions and categories
    return mysqlMCP.isToolEnabled(toolNameCamelCase);
  });

  // Log the filtering results
  console.error(
    `Tools available: ${enabledTools.length} of ${TOOLS.length} total tools`,
  );

  return {
    tools: enabledTools,
  };
});

// Handle tool call requests
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case "list_databases":
        result = await mysqlMCP.listDatabases();
        break;

      case "list_tables":
        result = await mysqlMCP.listTables(
          (args || {}) as { database?: string },
        );
        break;

      case "get_database_summary":
        result = await mysqlMCP.getDatabaseSummary(
          (args || {}) as { database?: string },
        );
        break;

      case "get_schema_erd":
        result = await mysqlMCP.getSchemaERD(
          (args || {}) as { database?: string },
        );
        break;

      case "get_schema_rag_context":
        result = await mysqlMCP.getSchemaRagContext(
          (args || {}) as {
            database?: string;
            max_tables?: number;
            max_columns?: number;
            include_relationships?: boolean;
          },
        );
        break;

      case "get_column_statistics":
        result = await mysqlMCP.getColumnStatistics(
          (args || {}) as {
            table_name: string;
            column_name: string;
            database?: string;
          },
        );
        break;

      case "read_table_schema":
        result = await mysqlMCP.readTableSchema(
          (args || {}) as { table_name: string },
        );
        break;

      case "alter_table":
        result = await mysqlMCP.alterTable(args || {});
        break;

      case "drop_table":
        result = await mysqlMCP.dropTable(args || {});
        break;

      case "execute_ddl":
        result = await mysqlMCP.executeDdl((args || {}) as { query: string });
        break;

      case "describe_connection":
        result = await mysqlMCP.describeConnection();
        break;

      case "test_connection":
        result = await mysqlMCP.testConnection();
        break;

      case "read_changelog":
        result = await mysqlMCP.readChangelog(
          (args || {}) as { version?: string; limit?: number },
        );
        break;

      case "get_table_relationships":
        result = await mysqlMCP.getTableRelationships(
          (args || {}) as { table_name: string },
        );
        break;

      // Transaction Tools
      case "begin_transaction":
        result = await mysqlMCP.beginTransaction(
          (args || {}) as { transactionId?: string },
        );
        break;

      case "commit_transaction":
        result = await mysqlMCP.commitTransaction(
          (args || {}) as { transactionId: string },
        );
        break;

      case "rollback_transaction":
        result = await mysqlMCP.rollbackTransaction(
          (args || {}) as { transactionId: string },
        );
        break;

      case "get_transaction_status":
        result = await mysqlMCP.getTransactionStatus();
        break;

      case "execute_in_transaction":
        result = await mysqlMCP.executeInTransaction(
          (args || {}) as {
            transactionId: string;
            query: string;
            params?: any[];
          },
        );
        break;

      // Stored Procedure Tools
      case "list_stored_procedures":
        result = await mysqlMCP.listStoredProcedures(
          (args || {}) as { database?: string },
        );
        break;

      case "get_stored_procedure_info":
        result = await mysqlMCP.getStoredProcedureInfo(
          (args || {}) as { procedure_name: string; database?: string },
        );
        break;

      case "execute_stored_procedure":
        result = await mysqlMCP.executeStoredProcedure(
          (args || {}) as {
            procedure_name: string;
            parameters?: any[];
            database?: string;
          },
        );
        break;

      case "create_stored_procedure":
        result = await mysqlMCP.createStoredProcedure((args || {}) as any);
        break;

      case "drop_stored_procedure":
        result = await mysqlMCP.dropStoredProcedure(
          (args || {}) as {
            procedure_name: string;
            if_exists?: boolean;
            database?: string;
          },
        );
        break;

      case "show_create_procedure":
        result = await mysqlMCP.showCreateProcedure(
          (args || {}) as { procedure_name: string; database?: string },
        );
        break;

      // Data Export Tools
      case "export_table_to_csv":
        result = await mysqlMCP.exportTableToCSV((args || {}) as any);
        break;

      case "export_query_to_csv":
        result = await mysqlMCP.exportQueryToCSV(
          (args || {}) as {
            query: string;
            params?: any[];
            include_headers?: boolean;
          },
        );
        break;

      // Cache Management Tools
      case "get_cache_stats":
        result = mysqlMCP.getCacheStats();
        break;

      case "get_cache_config":
        result = mysqlMCP.getCacheConfig();
        break;

      case "configure_cache":
        result = mysqlMCP.configureCacheSettings(
          (args || {}) as {
            enabled?: boolean;
            ttlMs?: number;
            maxSize?: number;
            maxMemoryMB?: number;
          },
        );
        break;

      case "clear_cache":
        result = mysqlMCP.clearCache();
        break;

      case "invalidate_table_cache":
        result = mysqlMCP.invalidateCacheForTable(
          (args || {}) as { table_name: string },
        );
        break;

      // Query Optimization Tools
      case "analyze_query":
        result = mysqlMCP.analyzeQuery((args || {}) as { query: string });
        break;

      case "get_optimization_hints":
        result = mysqlMCP.getOptimizationHints(
          (args || {}) as { goal: "SPEED" | "MEMORY" | "STABILITY" },
        );
        break;

      // View Tools
      case "list_views":
        result = await mysqlMCP.listViews((args || {}) as any);
        break;
      case "get_view_info":
        result = await mysqlMCP.getViewInfo((args || {}) as any);
        break;
      case "create_view":
        result = await mysqlMCP.createView((args || {}) as any);
        break;
      case "alter_view":
        result = await mysqlMCP.alterView((args || {}) as any);
        break;
      case "drop_view":
        result = await mysqlMCP.dropView((args || {}) as any);
        break;
      case "show_create_view":
        result = await mysqlMCP.showCreateView((args || {}) as any);
        break;

      // Trigger Tools
      case "list_triggers":
        result = await mysqlMCP.listTriggers((args || {}) as any);
        break;
      case "get_trigger_info":
        result = await mysqlMCP.getTriggerInfo((args || {}) as any);
        break;
      case "create_trigger":
        result = await mysqlMCP.createTrigger((args || {}) as any);
        break;
      case "drop_trigger":
        result = await mysqlMCP.dropTrigger((args || {}) as any);
        break;
      case "show_create_trigger":
        result = await mysqlMCP.showCreateTrigger((args || {}) as any);
        break;

      // Function Tools
      case "list_functions":
        result = await mysqlMCP.listFunctions((args || {}) as any);
        break;
      case "get_function_info":
        result = await mysqlMCP.getFunctionInfo((args || {}) as any);
        break;
      case "create_function":
        result = await mysqlMCP.createFunction((args || {}) as any);
        break;
      case "drop_function":
        result = await mysqlMCP.dropFunction((args || {}) as any);
        break;
      case "show_create_function":
        result = await mysqlMCP.showCreateFunction((args || {}) as any);
        break;
      case "execute_function":
        result = await mysqlMCP.executeFunction((args || {}) as any);
        break;

      // Index Tools
      case "list_indexes":
        result = await mysqlMCP.listIndexes((args || {}) as any);
        break;
      case "get_index_info":
        result = await mysqlMCP.getIndexInfo((args || {}) as any);
        break;
      case "create_index":
        result = await mysqlMCP.createIndex((args || {}) as any);
        break;
      case "drop_index":
        result = await mysqlMCP.dropIndex((args || {}) as any);
        break;
      case "analyze_index":
        result = await mysqlMCP.analyzeIndex((args || {}) as any);
        break;

      // Constraint Tools
      case "list_foreign_keys":
        result = await mysqlMCP.listForeignKeys((args || {}) as any);
        break;
      case "list_constraints":
        result = await mysqlMCP.listConstraints((args || {}) as any);
        break;
      case "add_foreign_key":
        result = await mysqlMCP.addForeignKey((args || {}) as any);
        break;
      case "drop_foreign_key":
        result = await mysqlMCP.dropForeignKey((args || {}) as any);
        break;
      case "add_unique_constraint":
        result = await mysqlMCP.addUniqueConstraint((args || {}) as any);
        break;
      case "drop_constraint":
        result = await mysqlMCP.dropConstraint((args || {}) as any);
        break;
      case "add_check_constraint":
        result = await mysqlMCP.addCheckConstraint((args || {}) as any);
        break;

      // Table Maintenance Tools
      case "analyze_table":
        result = await mysqlMCP.analyzeTable((args || {}) as any);
        break;
      case "optimize_table":
        result = await mysqlMCP.optimizeTable((args || {}) as any);
        break;
      case "check_table":
        result = await mysqlMCP.checkTable((args || {}) as any);
        break;
      case "repair_table":
        result = await mysqlMCP.repairTable((args || {}) as any);
        break;
      case "truncate_table":
        result = await mysqlMCP.truncateTable((args || {}) as any);
        break;
      case "get_table_status":
        result = await mysqlMCP.getTableStatus((args || {}) as any);
        break;
      case "flush_table":
        result = await mysqlMCP.flushTable((args || {}) as any);
        break;
      case "get_table_size":
        result = await mysqlMCP.getTableSize((args || {}) as any);
        break;

      // Process Management Tools
      case "show_process_list":
        result = await mysqlMCP.showProcessList((args || {}) as any);
        break;
      case "kill_process":
        result = await mysqlMCP.killProcess((args || {}) as any);
        break;
      case "show_status":
        result = await mysqlMCP.showStatus((args || {}) as any);
        break;
      case "show_variables":
        result = await mysqlMCP.showVariables((args || {}) as any);
        break;
      case "explain_query":
        result = await mysqlMCP.explainQuery((args || {}) as any);
        break;
      case "show_engine_status":
        result = await mysqlMCP.showEngineStatus((args || {}) as any);
        break;
      case "get_server_info":
        result = await mysqlMCP.getServerInfo();
        break;
      case "show_binary_logs":
        result = await mysqlMCP.showBinaryLogs();
        break;
      case "show_replication_status":
        result = await mysqlMCP.showReplicationStatus((args || {}) as any);
        break;

      // Backup and Restore Tools
      case "backup_table":
        result = await mysqlMCP.backupTable((args || {}) as any);
        break;
      case "backup_database":
        result = await mysqlMCP.backupDatabase((args || {}) as any);
        break;
      case "restore_from_sql":
        result = await mysqlMCP.restoreFromSql((args || {}) as any);
        break;
      case "get_create_table_statement":
        result = await mysqlMCP.getCreateTableStatement((args || {}) as any);
        break;
      case "get_database_schema":
        result = await mysqlMCP.getDatabaseSchema((args || {}) as any);
        break;

      // Extended Data Export Tools
      case "export_table_to_json":
        result = await mysqlMCP.exportTableToJSON((args || {}) as any);
        break;
      case "export_query_to_json":
        result = await mysqlMCP.exportQueryToJSON((args || {}) as any);
        break;
      case "export_query_to_csv":
        result = await mysqlMCP.exportQueryToCSV((args || {}) as any);
        break;
      case "safe_export_table":
        result = await mysqlMCP.safeExportTable((args || {}) as any);
        break;
      case "export_table_to_sql":
        result = await mysqlMCP.exportTableToSql((args || {}) as any);
        break;

      // Data Import Tools
      case "import_from_csv":
        result = await mysqlMCP.importFromCSV((args || {}) as any);
        break;
      case "import_from_json":
        result = await mysqlMCP.importFromJSON((args || {}) as any);
        break;

      // Data Migration Tools
      case "copy_table_data":
        result = await mysqlMCP.copyTableData((args || {}) as any);
        break;
      case "move_table_data":
        result = await mysqlMCP.moveTableData((args || {}) as any);
        break;
      case "clone_table":
        result = await mysqlMCP.cloneTable((args || {}) as any);
        break;
      case "compare_table_structure":
        result = await mysqlMCP.compareTableStructure((args || {}) as any);
        break;
      case "sync_table_data":
        result = await mysqlMCP.syncTableData((args || {}) as any);
        break;

      // Schema Versioning and Migrations Tools
      case "init_migrations_table":
        result = await mysqlMCP.initMigrationsTable((args || {}) as any);
        break;
      case "create_migration":
        result = await mysqlMCP.createMigration((args || {}) as any);
        break;
      case "apply_migrations":
        result = await mysqlMCP.applyMigrations((args || {}) as any);
        break;
      case "rollback_migration":
        result = await mysqlMCP.rollbackMigration((args || {}) as any);
        break;
      case "get_migration_status":
        result = await mysqlMCP.getMigrationStatus((args || {}) as any);
        break;
      case "get_schema_version":
        result = await mysqlMCP.getSchemaVersion((args || {}) as any);
        break;
      case "validate_migrations":
        result = await mysqlMCP.validateMigrations((args || {}) as any);
        break;
      case "reset_failed_migration":
        result = await mysqlMCP.resetFailedMigration((args || {}) as any);
        break;
      case "generate_migration_from_diff":
        result = await mysqlMCP.generateMigrationFromDiff((args || {}) as any);
        break;

      // Performance Monitoring Tools
      case "get_performance_metrics":
        result = await mysqlMCP.getPerformanceMetrics();
        break;
      case "get_top_queries_by_time":
        result = await mysqlMCP.getTopQueriesByTime((args || {}) as any);
        break;
      case "get_top_queries_by_count":
        result = await mysqlMCP.getTopQueriesByCount((args || {}) as any);
        break;
      case "get_slow_queries":
        result = await mysqlMCP.getSlowQueries((args || {}) as any);
        break;
      case "get_table_io_stats":
        result = await mysqlMCP.getTableIOStats((args || {}) as any);
        break;
      case "get_index_usage_stats":
        result = await mysqlMCP.getIndexUsageStats((args || {}) as any);
        break;
      case "get_unused_indexes":
        result = await mysqlMCP.getUnusedIndexes((args || {}) as any);
        break;
      case "get_connection_pool_stats":
        result = await mysqlMCP.getConnectionPoolStats();
        break;
      case "get_database_health_check":
        result = await mysqlMCP.getDatabaseHealthCheck();
        break;
      case "reset_performance_stats":
        result = await mysqlMCP.resetPerformanceStats();
        break;

      case "repair_query":
        result = await mysqlMCP.repairQuery(
          (args || {}) as { query: string; error_message?: string },
        );
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    // Handle the result based on status
    if (result.status === "error") {
      let errorText = `Error: ${"error" in result ? result.error : "Unknown error"}`;

      return {
        content: [
          {
            type: "text",
            text: errorText,
          },
        ],
        isError: true,
      };
    }

    // Return successful result - handle different result types
    let responseData: any;
    if ("data" in result) {
      // Standard result with data property
      responseData = result.data;
    } else if ("transactionId" in result) {
      // Transaction result
      responseData = {
        transactionId: result.transactionId,
      } as any;

      if ("message" in result && result.message) {
        responseData.message = result.message;
      }

      if ("activeTransactions" in result && result.activeTransactions) {
        responseData.activeTransactions = result.activeTransactions;
      }
    } else if ("message" in result) {
      // Simple message result
      responseData = { message: result.message };
    } else {
      // Fallback
      responseData = result;
    }

    // If no query log, return data as before
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(responseData, null, 2),
        },
      ],
    };
  } catch (error: any) {
    // Check if this is a permission error
    if (error.message && error.message.includes("Permission denied")) {
      return {
        content: [
          {
            type: "text",
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
          type: "text",
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

  // Initialize the MySQL MCP instance AFTER transport is connected
  // This ensures the database connection pool is created when the server is ready
  mysqlMCP = new MySQLMCP(permissions, categories, preset);

  // Log the effective filtering configuration to stderr
  const accessProfile = mysqlMCP.getAccessProfile();
  if (accessProfile.preset) {
    console.error(
      `Preset: ${accessProfile.preset.name} (${accessProfile.preset.description})`,
    );
  } else if (preset) {
    console.error(`Preset requested but not recognized: ${preset}`);
  }
  console.error(`Permissions (resolved): ${accessProfile.permissions}`);
  if (accessProfile.categories) {
    console.error(`Categories (resolved): ${accessProfile.categories}`);
  }
  console.error(`Filtering mode: ${accessProfile.filteringMode}`);

  // Log to stderr (not stdout, which is used for MCP protocol)
  console.error("MySQL MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
