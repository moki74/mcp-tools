# MySQL MCP Server

A fully-featured **Model Context Protocol (MCP)** server for MySQL database integration with AI agents like Claude Desktop, Cline, Windsurf, and other MCP-compatible tools.

[![npm version](https://img.shields.io/npm/v/@berthojoris/mcp-mysql-server)](https://www.npmjs.com/package/@berthojoris/mcp-mysql-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Features

- ✅ **Full MCP Protocol Support** - Works with Claude Desktop, Cline, Windsurf, and any MCP-compatible AI agent
- 🔒 **Secure by Default** - Parameterized queries, SQL injection protection, permission-based access control
- 🛠️ **30 Powerful Tools** - Complete database operations (CRUD, DDL, queries, schema inspection, transactions, stored procedures, bulk operations)
- 🎛️ **Dynamic Per-Project Permissions** - Each AI agent can have different access levels
- 🏗️ **DDL Support** - Create, alter, and drop tables (when explicitly enabled)
- 💰 **Transaction Support** - Full ACID transaction management (BEGIN, COMMIT, ROLLBACK)
- 🌐 **Dual Mode** - Run as MCP server OR as REST API
- 📊 **Rich Metadata** - Table schemas, relationships, connection info
- ⚡ **TypeScript** - Fully typed with TypeScript definitions

---

## 📦 Installation

### Option 1: Quick Start (npx)

No installation needed! Use directly with npx:

```bash
npx @berthojoris/mcp-mysql-server mysql://user:pass@localhost:3306/db "list,read,utility"
```

### Option 2: Global Installation

```bash
npm install -g @berthojoris/mcp-mysql-server
mcp-mysql mysql://user:pass@localhost:3306/db "list,read,utility"
```

---

## 🚀 Quick Start

### 1. Set Up Environment

Create `.env` file (for local development):

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=yourdatabase

# Optional: Default permissions (can be overridden per-project)
MCP_CONFIG=list,read,utility
```

### 2. Build Project (if cloned)

```bash
npm run build
```

### 3. Configure AI Agent

#### Claude Desktop

**Location:**
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Configuration (using npx - recommended):**

```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": [
        "-y",
        "@berthojoris/mcp-mysql-server",
        "mysql://user:password@localhost:3306/database",
        "list,read,utility"
      ]
    }
  }
}
```

#### Cline (VS Code Extension)

Add to Cline MCP settings (same JSON format as Claude Desktop).

#### Windsurf

Add to Windsurf MCP settings (same JSON format as Claude Desktop).

### 4. Restart AI Agent

Completely restart your AI agent application to load the MCP server.

### 5. Test It!

Try asking your AI:
- *"What databases are available?"*
- *"Show me all tables in my database"*
- *"What's the structure of the users table?"*
- *"Show me the first 5 records from users"*

---

##  Permission System

### Permission Categories

Control access with these permission categories:

| Category | Operations | Example Use Case |
|----------|------------|------------------|
| **`list`** | List databases, tables, schemas | Database exploration |
| **`read`** | SELECT queries, read data | Analytics, reporting |
| **`create`** | INSERT new records | Data entry |
| **`update`** | UPDATE existing records | Data maintenance |
| **`delete`** | DELETE records | Data cleanup |
| **`execute`** | Execute custom SQL (DML) + Advanced SQL features | Complex operations, advanced queries |
| **`ddl`** | CREATE/ALTER/DROP tables | Schema management |
| **`procedure`** | CREATE/DROP/EXECUTE stored procedures | Stored procedure management |
| **`transaction`** | BEGIN, COMMIT, ROLLBACK transactions | ACID operations |
| **`utility`** | Connection testing, info | Diagnostics |

### Per-Project Configuration

**Each project can have different permissions!** Specify as the third argument:

```json
{
  "args": [
    "mysql://user:pass@localhost:3306/db",
    "list,read,utility"  // ← Permissions here
  ]
}
```

### Common Permission Sets

**Production Read-Only:**
```
list,read,utility
```

**Data Entry:**
```
list,read,create,utility
```

**Full Data Access (No Schema Changes):**
```
list,read,create,update,delete,utility
```

**Full Data Access with Transactions:**
```
list,read,create,update,delete,transaction,utility
```

**Development (Full Access):**
```
list,read,create,update,delete,execute,ddl,transaction,utility
```

**DBA Tasks:**
```
list,ddl,utility
```

### Multiple Projects Example

You can have different databases with different permissions in the same AI agent:

```json
{
  "mcpServers": {
    "mysql-prod": {
      "command": "npx",
      "args": [
        "-y",
        "@berthojoris/mcp-mysql-server",
        "mysql://reader:pass@prod-server:3306/prod_db",
        "list,read,utility"
      ]
    },
    "mysql-dev": {
      "command": "npx",
      "args": [
        "-y",
        "@berthojoris/mcp-mysql-server",
        "mysql://root:pass@localhost:3306/dev_db",
        "list,read,create,update,delete,execute,ddl,utility"
      ]
    }
  }
}
```

---

## 🚫 Permission Error Handling

The MySQL MCP Server provides clear, user-friendly error messages when operations are attempted without proper permissions. This helps users understand exactly what permissions are needed and how to enable them.

### Error Message Format

When a tool is called without the required permission, you'll receive a detailed error message like:

```
❌ Permission denied: Cannot use tool 'create_table'. This tool requires 'ddl' permission.

Current permissions: list,read,utility
To enable this tool, add 'ddl' to your permissions configuration.

Example configuration:
"args": ["mysql://user:pass@host:3306/db", "list,read,utility,ddl"]

Tool description: Create new tables with columns and indexes
```

### Common Permission Error Examples

#### Creating Tables Without DDL Permission

**User prompt:** *"Create a new table called 'products'"*

**Error response when DDL not enabled:**
```
❌ Permission denied: Cannot use tool 'create_table'. This tool requires 'ddl' permission.

Current permissions: list,read,utility
To enable this tool, add 'ddl' to your permissions configuration.

Example configuration:
"args": ["mysql://user:pass@host:3306/db", "list,read,utility,ddl"]

Tool description: Create new tables with columns and indexes
```

#### Inserting Data Without Create Permission

**User prompt:** *"Add a new user to the users table"*

**Error response when CREATE not enabled:**
```
❌ Permission denied: Cannot use tool 'create_record'. This tool requires 'create' permission.

Current permissions: list,read,utility
To enable this tool, add 'create' to your permissions configuration.

Example configuration:
"args": ["mysql://user:pass@host:3306/db", "list,read,utility,create"]

Tool description: Insert new records with automatic SQL generation
```

#### Updating Data Without Update Permission

**User prompt:** *"Update the email for user ID 123"*

**Error response when UPDATE not enabled:**
```
❌ Permission denied: Cannot use tool 'update_record'. This tool requires 'update' permission.

Current permissions: list,read,utility
To enable this tool, add 'update' to your permissions configuration.

Example configuration:
"args": ["mysql://user:pass@host:3306/db", "list,read,utility,update"]

Tool description: Update existing records based on conditions
```

### Permission Error Benefits

1. **🎯 Clear Guidance** - Exact permission needed and how to add it
2. **📋 Current State** - Shows what permissions are currently active
3. **💡 Example Configuration** - Ready-to-use configuration example
4. **📖 Tool Context** - Explains what the tool does
5. **🔒 Security** - Prevents unauthorized operations while being helpful

### Troubleshooting Permission Errors

If you encounter permission errors:

1. **Check your configuration** - Verify the permissions string in your MCP configuration
2. **Add required permission** - Add the missing permission to your configuration
3. **Restart your AI agent** - Changes require a restart to take effect
4. **Test with a simple operation** - Verify the permission is working

**Example fix for DDL operations:**

Before (DDL disabled):
```json
{
  "args": [
    "mysql://user:pass@localhost:3306/db",
    "list,read,utility"
  ]
}
```

After (DDL enabled):
```json
{
  "args": [
    "mysql://user:pass@localhost:3306/db",
    "list,read,utility,ddl"
  ]
}
```

---

## 🛠️ Available Tools

The MCP server provides **30 powerful tools**:

### Database Discovery (4 tools)

| Tool | Description |
|------|-------------|
| `list_databases` | Lists all databases on the MySQL server |
| `list_tables` | Lists all tables in the current/specified database |
| `read_table_schema` | Gets detailed schema (columns, types, keys, indexes) |
| `get_table_relationships` | Discovers foreign key relationships |

### Data Operations - CRUD (4 tools)

| Tool | Description |
|------|-------------|
| `create_record` | Insert new records with automatic SQL generation |
| `read_records` | Query records with filtering, pagination, and sorting |
| `update_record` | Update records based on conditions |
| `delete_record` | Delete records with safety checks |

### Bulk Operations (3 tools)

| Tool | Description | Performance |
|------|-------------|-------------|
| `bulk_insert` | Insert multiple records in batches for optimal performance | Up to 10,000 records per batch |
| `bulk_update` | Update multiple records with different conditions in batches | Up to 1,000 operations per batch |
| `bulk_delete` | Delete multiple record sets based on different conditions | Up to 1,000 operations per batch |

### Custom Queries (2 tools)

| Tool | Description |
|------|-------------|
| `run_query` | Execute read-only SELECT queries |
| `execute_sql` | Execute write operations (INSERT, UPDATE, DELETE, or DDL with permission) |

### Schema Management - DDL (4 tools)

| Tool | Description | Requires |
|------|-------------|----------|
| `create_table` | Create new tables with columns and indexes | `ddl` permission |
| `alter_table` | Modify table structure (add/drop/modify columns, indexes) | `ddl` permission |
| `drop_table` | Delete tables | `ddl` permission |
| `execute_ddl` | Execute raw DDL SQL (CREATE, ALTER, DROP, TRUNCATE, RENAME) | `ddl` permission |

### Utilities (4 tools)

| Tool | Description |
|------|-------------|
| `test_connection` | Test database connectivity and measure latency |
| `describe_connection` | Get current connection information |
| `export_table_to_csv` | Export table data to CSV format with optional filtering, pagination, and sorting |
| `export_query_to_csv` | Export the results of a SELECT query to CSV format |

### Transaction Management (5 tools)

| Tool | Description |
|------|-------------|
| `begin_transaction` | Start a new database transaction |
| `commit_transaction` | Commit the current transaction |
| `rollback_transaction` | Rollback the current transaction |
| `get_transaction_status` | Check if a transaction is active |
| `execute_in_transaction` | Execute SQL within a transaction context |

### Stored Procedures (5 tools)

| Tool | Description | Requires |
|------|-------------|----------|
| `list_stored_procedures` | List all stored procedures in a database | `procedure` permission |
| `create_stored_procedure` | Create new stored procedures with parameters | `procedure` permission |
| `get_stored_procedure_info` | Get detailed information about a stored procedure | `procedure` permission |
| `execute_stored_procedure` | Execute stored procedures with IN/OUT/INOUT parameters | `procedure` permission |
| `drop_stored_procedure` | Delete stored procedures | `procedure` permission |

---

## 🏗️ DDL Operations

DDL (Data Definition Language) operations allow AI to create, modify, and delete tables.

### ⚠️ Enable DDL with Caution

DDL operations are **disabled by default** for safety. Add `ddl` to permissions to enable:

```json
{
  "args": [
    "mysql://user:pass@localhost:3306/db",
    "list,read,create,update,delete,ddl,utility"
  ]
}
```

### DDL Tool Examples

#### Create Table

**User prompt:** *"Create a users table with id, username, email, and created_at"*

**AI will execute:**
```json
{
  "tool": "create_table",
  "arguments": {
    "table_name": "users",
    "columns": [
      {"name": "id", "type": "INT", "primary_key": true, "auto_increment": true},
      {"name": "username", "type": "VARCHAR(255)", "nullable": false},
      {"name": "email", "type": "VARCHAR(255)", "nullable": false},
      {"name": "created_at", "type": "DATETIME", "default": "CURRENT_TIMESTAMP"}
    ]
  }
}
```

#### Alter Table

**User prompt:** *"Add a phone column to the users table"*

**AI will execute:**
```json
{
  "tool": "alter_table",
  "arguments": {
    "table_name": "users",
    "operations": [
      {
        "type": "add_column",
        "column_name": "phone",
        "column_type": "VARCHAR(20)",
        "nullable": true
      }
    ]
  }
}
```

#### Drop Table

**User prompt:** *"Drop the temp_data table"*

**AI will execute:**
```json
{
  "tool": "drop_table",
  "arguments": {
    "table_name": "temp_data",
    "if_exists": true
  }
}
```

### DDL Safety Guidelines

1. ✅ **Enable only in development** - Keep DDL disabled for production
2. ✅ **Backup before major changes** - DDL operations are usually irreversible
3. ✅ **Test in dev first** - Try schema changes in development environment
4. ✅ **Use proper MySQL user permissions** - Grant only necessary privileges

---

## 📤 Data Export Tools

The MySQL MCP Server provides powerful data export capabilities, allowing AI agents to export database content in CSV format for analysis, reporting, and data sharing.

### Data Export Tools Overview

- **`export_table_to_csv`** - Export all or filtered data from a table to CSV format
- **`export_query_to_csv`** - Export the results of a custom SELECT query to CSV format

Both tools support:
- Filtering data with conditions
- Pagination for large datasets
- Sorting results
- Optional column headers
- Proper CSV escaping for special characters

### Data Export Tool Examples

#### Export Table to CSV

**User prompt:** *"Export the first 100 users ordered by registration date to CSV"*

**AI will execute:**
```json
{
  "tool": "export_table_to_csv",
  "arguments": {
    "table_name": "users",
    "sorting": {
      "field": "registration_date",
      "direction": "desc"
    },
    "pagination": {
      "page": 1,
      "limit": 100
    },
    "include_headers": true
  }
}
```

#### Export Filtered Data to CSV

**User prompt:** *"Export all users from the marketing department to CSV"*

**AI will execute:**
```json
{
  "tool": "export_table_to_csv",
  "arguments": {
    "table_name": "users",
    "filters": [
      {
        "field": "department",
        "operator": "eq",
        "value": "marketing"
      }
    ],
    "include_headers": true
  }
}
```

#### Export Query Results to CSV

**User prompt:** *"Export a report of total sales by product category to CSV"*

**AI will execute:**
```json
{
  "tool": "export_query_to_csv",
  "arguments": {
    "query": "SELECT category, SUM(sales_amount) as total_sales FROM sales GROUP BY category ORDER BY total_sales DESC",
    "include_headers": true
  }
}
```

### Data Export Best Practices

1. ✅ **Use filtering** - Export only the data you need to reduce file size
2. ✅ **Implement pagination** - For large datasets, use pagination to avoid memory issues
3. ✅ **Include headers** - Make CSV files more understandable with column headers
4. ✅ **Test with small datasets first** - Verify export format before processing large amounts of data
5. ✅ **Use proper permissions** - Data export tools require `utility` permission

### Common Data Export Patterns

**Pattern 1: Simple Table Export**
```json
{
  "tool": "export_table_to_csv",
  "arguments": {
    "table_name": "products",
    "include_headers": true
  }
}
```

**Pattern 2: Filtered and Sorted Export**
```json
{
  "tool": "export_table_to_csv",
  "arguments": {
    "table_name": "orders",
    "filters": [
      {
        "field": "order_date",
        "operator": "gte",
        "value": "2023-01-01"
      }
    ],
    "sorting": {
      "field": "order_date",
      "direction": "desc"
    },
    "include_headers": true
  }
}
```

**Pattern 3: Complex Query Export**
```json
{
  "tool": "export_query_to_csv",
  "arguments": {
    "query": "SELECT u.name, u.email, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id HAVING order_count > 5",
    "include_headers": true
  }
}
```

---

## 💰 Transaction Management

The MySQL MCP Server provides full ACID transaction support, allowing you to group multiple database operations into atomic units.

### Transaction Tools Overview

- **`begin_transaction`** - Start a new transaction
- **`execute_in_transaction`** - Execute SQL within transaction context
- **`commit_transaction`** - Permanently save all changes
- **`rollback_transaction`** - Discard all changes since transaction start
- **`get_transaction_status`** - Check if transaction is active

### Transaction Example: Money Transfer

**User:** *"Transfer $100 from Alice's account to Bob's account"*

**AI executes:**
```json
// Step 1: Begin transaction
{
  "tool": "begin_transaction"
}

// Step 2: Deduct from Alice's account
{
  "tool": "execute_in_transaction",
  "arguments": {
    "sql": "UPDATE accounts SET balance = balance - 100 WHERE name = 'Alice'"
  }
}

// Step 3: Add to Bob's account
{
  "tool": "execute_in_transaction",
  "arguments": {
    "sql": "UPDATE accounts SET balance = balance + 100 WHERE name = 'Bob'"
  }
}

// Step 4: Verify both accounts exist and have sufficient funds
{
  "tool": "execute_in_transaction",
  "arguments": {
    "sql": "SELECT * FROM accounts WHERE name IN ('Alice', 'Bob')"
  }
}

// Step 5: Commit if everything is valid
{
  "tool": "commit_transaction"
}
```

### Transaction Safety Features

1. ✅ **Atomic Operations** - All operations succeed or all fail together
2. ✅ **Automatic Rollback** - If any operation fails, transaction automatically rolls back
3. ✅ **Isolation** - Other sessions see changes only after commit
4. ✅ **Status Checking** - Always know if a transaction is active
5. ✅ **Error Handling** - Comprehensive error reporting for failed operations

### Transaction Best Practices

1. **Keep transactions short** - Long transactions can block other operations
2. **Always commit or rollback** - Don't leave transactions hanging
3. **Test transaction logic** - Verify your transaction sequence works correctly
4. **Handle errors gracefully** - Check for errors after each operation
5. **Use appropriate isolation levels** - Understand your consistency requirements

### Common Transaction Patterns

**Pattern 1: Safe Update with Verification**
```json
// Begin transaction
// Update records
// Verify changes with SELECT
// Commit if valid, rollback if not
```

**Pattern 2: Batch Operations**
```json
// Begin transaction
// Insert multiple related records
// Update related tables
// Commit all changes together
```

**Pattern 3: Error Recovery**
```json
// Begin transaction
// Try operations
// If error occurs: rollback
// If success: commit
```

---

## 🔧 Stored Procedures

The MySQL MCP Server provides comprehensive stored procedure management, allowing you to create, execute, and manage stored procedures with full parameter support.

### Stored Procedure Tools Overview

- **`list_stored_procedures`** - List all stored procedures in a database
- **`create_stored_procedure`** - Create new stored procedures with IN/OUT/INOUT parameters
- **`get_stored_procedure_info`** - Get detailed information about parameters and metadata
- **`execute_stored_procedure`** - Execute procedures with automatic parameter handling
- **`drop_stored_procedure`** - Delete stored procedures safely

### ⚠️ Enable Stored Procedures

Stored procedure operations require the `procedure` permission. Add it to your configuration:

```json
{
  "args": [
    "mysql://user:pass@localhost:3306/db",
    "list,read,procedure,utility"  // ← Include 'procedure'
  ]
}
```

### Creating Stored Procedures

**User:** *"Create a stored procedure that calculates tax for a given amount"*

**AI will execute:**
```json
{
  "tool": "create_stored_procedure",
  "arguments": {
    "procedure_name": "calculate_tax",
    "parameters": [
      {
        "name": "amount",
        "mode": "IN",
        "data_type": "DECIMAL(10,2)"
      },
      {
        "name": "tax_rate",
        "mode": "IN", 
        "data_type": "DECIMAL(5,4)"
      },
      {
        "name": "tax_amount",
        "mode": "OUT",
        "data_type": "DECIMAL(10,2)"
      }
    ],
    "body": "SET tax_amount = amount * tax_rate;",
    "comment": "Calculate tax amount based on amount and tax rate"
  }
}
```

### Executing Stored Procedures

**User:** *"Calculate tax for $1000 with 8.5% tax rate"*

**AI will execute:**
```json
{
  "tool": "execute_stored_procedure",
  "arguments": {
    "procedure_name": "calculate_tax",
    "parameters": [1000.00, 0.085]
  }
}
```

**Result:**
```json
{
  "status": "success",
  "data": {
    "results": { /* execution results */ },
    "outputParameters": {
      "tax_amount": 85.00
    }
  }
}
```

### Parameter Types

**IN Parameters** - Input values passed to the procedure
```sql
IN user_id INT
IN email VARCHAR(255)
```

**OUT Parameters** - Output values returned by the procedure
```sql
OUT total_count INT
OUT average_score DECIMAL(5,2)
```

**INOUT Parameters** - Values that are both input and output
```sql
INOUT running_total DECIMAL(10,2)
```

### Complex Stored Procedure Example

**User:** *"Create a procedure to process an order with inventory check"*

```json
{
  "tool": "create_stored_procedure",
  "arguments": {
    "procedure_name": "process_order",
    "parameters": [
      { "name": "product_id", "mode": "IN", "data_type": "INT" },
      { "name": "quantity", "mode": "IN", "data_type": "INT" },
      { "name": "customer_id", "mode": "IN", "data_type": "INT" },
      { "name": "order_id", "mode": "OUT", "data_type": "INT" },
      { "name": "success", "mode": "OUT", "data_type": "BOOLEAN" }
    ],
    "body": "DECLARE available_qty INT; SELECT stock_quantity INTO available_qty FROM products WHERE id = product_id; IF available_qty >= quantity THEN INSERT INTO orders (customer_id, product_id, quantity) VALUES (customer_id, product_id, quantity); SET order_id = LAST_INSERT_ID(); UPDATE products SET stock_quantity = stock_quantity - quantity WHERE id = product_id; SET success = TRUE; ELSE SET order_id = 0; SET success = FALSE; END IF;",
    "comment": "Process order with inventory validation"
  }
}
```

### Getting Procedure Information

**User:** *"Show me details about the calculate_tax procedure"*

**AI will execute:**
```json
{
  "tool": "get_stored_procedure_info",
  "arguments": {
    "procedure_name": "calculate_tax"
  }
}
```

**Returns detailed information:**
- Procedure metadata (created date, security type, etc.)
- Parameter details (names, types, modes)
- Procedure definition
- Comments and documentation

### Stored Procedure Best Practices

1. ✅ **Use descriptive names** - Make procedure purposes clear
2. ✅ **Document with comments** - Add meaningful comments to procedures
3. ✅ **Validate inputs** - Check parameter values within procedures
4. ✅ **Handle errors** - Use proper error handling in procedure bodies
5. ✅ **Test thoroughly** - Verify procedures work with various inputs
6. ✅ **Use appropriate data types** - Choose correct types for parameters
7. ✅ **Consider security** - Be mindful of SQL injection in dynamic SQL

### Common Stored Procedure Patterns

**Pattern 1: Data Validation and Processing**
```sql
-- Validate input, process if valid, return status
IF input_value > 0 THEN
  -- Process data
  SET success = TRUE;
ELSE
  SET success = FALSE;
END IF;
```

**Pattern 2: Complex Business Logic**
```sql
-- Multi-step business process
-- Step 1: Validate
-- Step 2: Calculate
-- Step 3: Update multiple tables
-- Step 4: Return results
```

**Pattern 3: Reporting and Analytics**
```sql
-- Aggregate data from multiple tables
-- Apply business rules
-- Return calculated results
```

---

## 📋 Usage Examples

### Example 1: Read Data

**User:** *"Show me the first 10 users ordered by created_at"*

**AI uses `read_records`:**
- Queries the users table
- Applies pagination (limit 10)
- Sorts by created_at descending
- Returns results

### Example 2: Filter Data

**User:** *"Find all users with email ending in @example.com"*

**AI uses `read_records` with filters:**
- Applies LIKE filter on email column
- Returns matching records

### Example 3: Create Records

**User:** *"Add a new user with username 'john_doe' and email 'john@example.com'"*

**AI uses `create_record`:**
- Inserts new record
- Returns insert ID

### Example 4: Update Records

**User:** *"Update the email for user ID 5 to 'newemail@example.com'"*

**AI uses `update_record`:**
- Updates specific record by ID
- Returns affected rows

### Example 5: Complex Query

**User:** *"Show me the total number of orders per user for the last 30 days"*

**AI uses `run_query`:**
- Constructs JOIN query
- Applies date filter
- Groups by user
- Returns aggregated results

### Example 6: Transaction Management

**User:** *"Transfer $100 from account 1 to account 2 in a single transaction"*

**AI uses transaction tools:**
```json
{
  "tool": "begin_transaction"
}

{
  "tool": "execute_in_transaction",
  "arguments": {
    "sql": "UPDATE accounts SET balance = balance - 100 WHERE id = 1"
  }
}

{
  "tool": "execute_in_transaction",
  "arguments": {
    "sql": "UPDATE accounts SET balance = balance + 100 WHERE id = 2"
  }
}

{
  "tool": "commit_transaction"
}
```

**User:** *"Check if there's an active transaction"*

**AI uses `get_transaction_status`:**
- Returns transaction status and ID if active

### Example 7: Bulk Insert

**User:** *"Insert 1000 new products from this CSV data"*

**AI uses `bulk_insert`:**
```json
{
  "tool": "bulk_insert",
  "arguments": {
    "table_name": "products",
    "data": [
      {"name": "Product 1", "price": 19.99, "category": "Electronics"},
      {"name": "Product 2", "price": 29.99, "category": "Books"},
      // ... up to 1000 records
    ],
    "batch_size": 1000
  }
}
```
- Processes records in optimized batches
- Returns total inserted count and performance metrics

### Example 8: Bulk Update

**User:** *"Update prices for all products in specific categories with different discounts"*

**AI uses `bulk_update`:**
```json
{
  "tool": "bulk_update",
  "arguments": {
    "table_name": "products",
    "updates": [
      {
        "data": {"price": "price * 0.9"},
        "conditions": [{"field": "category", "operator": "eq", "value": "Electronics"}]
      },
      {
        "data": {"price": "price * 0.8"},
        "conditions": [{"field": "category", "operator": "eq", "value": "Books"}]
      }
    ],
    "batch_size": 100
  }
}
```
- Applies different updates based on conditions
- Processes in batches for optimal performance

### Example 9: Bulk Delete

**User:** *"Delete all inactive users and expired sessions"*

**AI uses `bulk_delete`:**
```json
{
  "tool": "bulk_delete",
  "arguments": {
    "table_name": "users",
    "condition_sets": [
      [{"field": "status", "operator": "eq", "value": "inactive"}],
      [{"field": "last_login", "operator": "lt", "value": "2023-01-01"}],
      [{"field": "email_verified", "operator": "eq", "value": false}]
    ],
    "batch_size": 100
  }
}
```
- Deletes records matching any of the condition sets
- Processes deletions in safe batches

**User:** *"Rollback the current transaction"*

**AI uses `rollback_transaction`:**
- Cancels all changes in the current transaction

---

## 🔒 Security Features

### Built-in Security

- ✅ **Parameterized Queries** - All queries use prepared statements (SQL injection protection)
- ✅ **Permission-Based Access** - Fine-grained control over operations
- ✅ **Read-Only Validation** - `run_query` enforces SELECT-only operations
- ✅ **DDL Gating** - Schema changes require explicit `ddl` permission
- ✅ **Condition Requirements** - DELETE operations must include WHERE conditions
- ✅ **Input Validation** - All inputs validated with JSON schemas
- ✅ **Connection Pooling** - Efficient database connection management

### Additional Security (REST API Mode)

- ✅ **JWT Authentication** - Token-based authentication
- ✅ **Rate Limiting** - 100 requests per 15 minutes per IP
- ✅ **CORS Protection** - Configurable CORS policies
- ✅ **Helmet Security Headers** - HTTP security headers

### Security Best Practices

1. **Use Read-Only for Production**
   ```
   "list,read,utility"
   ```

2. **Create MySQL Users with Limited Permissions**
   ```sql
   CREATE USER 'readonly'@'%' IDENTIFIED BY 'password';
   GRANT SELECT ON myapp.* TO 'readonly'@'%';
   FLUSH PRIVILEGES;
   ```

3. **Never Use Root in Production**
   - Create dedicated users per environment
   - Grant minimal necessary permissions

4. **Never Commit `.env` Files**
   - Add `.env` to `.gitignore`
   - Use environment-specific configs

5. **Enable DDL Only When Needed**
   - Keep DDL disabled by default
   - Only enable for schema migration tasks

---

## 🚀 Bulk Operations

The MySQL MCP server includes powerful bulk operation tools designed for high-performance data processing. These tools are optimized for handling large datasets efficiently.

### Performance Characteristics

- **Batch Processing**: Operations are processed in configurable batches to optimize memory usage and database performance
- **Transaction Safety**: Each batch is wrapped in a transaction for data consistency
- **Error Handling**: Detailed error reporting with batch-level granularity
- **Memory Efficient**: Streaming approach prevents memory overflow with large datasets

### Best Practices

#### Batch Size Optimization
```json
{
  "batch_size": 1000  // Recommended for most operations
}
```

**Guidelines:**
- **Small records (< 1KB)**: Use batch sizes of 1000-5000
- **Large records (> 10KB)**: Use batch sizes of 100-500
- **Complex operations**: Start with 100 and increase based on performance

#### Bulk Insert Tips
- Use consistent data structure across all records
- Pre-validate data to avoid mid-batch failures
- Consider using `ON DUPLICATE KEY UPDATE` for upsert operations
- Monitor MySQL's `max_allowed_packet` setting for large batches

#### Bulk Update Optimization
- Use indexed columns in conditions for better performance
- Group similar updates together
- Consider using raw SQL expressions for calculated updates
- Test with small batches first to verify logic

#### Bulk Delete Safety
- Always test delete conditions with `SELECT` first
- Use smaller batch sizes for delete operations
- Consider soft deletes for important data
- Monitor foreign key constraints

### Error Handling

Bulk operations provide detailed error information:

```json
{
  "success": false,
  "error": "Batch 3 failed: Duplicate entry 'user123' for key 'username'",
  "processed_batches": 2,
  "total_batches": 5,
  "successful_operations": 2000,
  "failed_operations": 1000
}
```

### Performance Monitoring

Each bulk operation returns performance metrics:

```json
{
  "success": true,
  "total_processed": 10000,
  "batches_processed": 10,
  "execution_time_ms": 2500,
  "average_batch_time_ms": 250,
  "records_per_second": 4000
}
```

---

##  Troubleshooting

### MCP Server Not Connecting

**Problem:** AI agent doesn't see tools

**Solutions:**
1. Check config file path is correct
2. Restart AI agent completely  
3. If using npx: Verify internet connection for package download
4. If using local files: Verify bin/mcp-mysql.js exists
5. Check for JSON syntax errors

**Problem:** Connection fails

**Solutions:**
1. Test MySQL manually: `mysql -u root -p`
2. Verify credentials in connection string
3. Check MySQL is running
4. Verify network access (host/port)

### Permission Issues

**Problem:** "Tool is disabled" error

**Solutions:**
1. Check permissions in third argument
2. Verify permission spelling
3. Add required permission category

**Problem:** MySQL permission denied

**Solutions:**
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON db.* TO 'user'@'localhost';
FLUSH PRIVILEGES;
```

### DDL Operations Not Working

**Problem:** "DDL operations require 'ddl' permission"

**Solution:** Add `ddl` to permissions:
```json
{
  "args": [
    "mysql://...",
    "list,read,create,update,delete,ddl,utility"
  ]
}
```

### Parameter Validation Errors

**Problem:** "Invalid parameters: must be object" error

**Symptoms:**
- Tools fail when called without parameters
- Error message: `Error: Invalid parameters: [{"instancePath":"","schemaPath":"#/type","keyword":"type","params":{"type":"object"},"message":"must be object"}]`
- Occurs especially with tools that have optional parameters like `list_tables`, `begin_transaction`, `list_stored_procedures`

**Cause:**
This error occurred in earlier versions (< 1.4.1) when AI agents called MCP tools without providing parameters. The MCP SDK sometimes passes `undefined` or `null` instead of an empty object `{}`, causing JSON schema validation to fail.

**Solution:**
✅ **Fixed in version 1.4.1+** - All 33 tools now include defensive parameter handling that automatically converts `undefined`/`null` to empty objects.

**If you're still experiencing this issue:**
1. Update to the latest version:
   ```bash
   npx -y @berthojoris/mcp-mysql-server@latest mysql://user:pass@localhost:3306/db "permissions"
   ```

2. If using global installation:
   ```bash
   npm update -g @berthojoris/mcp-mysql-server
   ```

3. Restart your AI agent after updating

**Technical Details:**
- All tool handlers now use defensive pattern: `(args || {})` to ensure parameters are always objects
- This fix applies to all 27 tools that accept parameters
- Tools with no parameters (like `list_databases`, `test_connection`) were not affected
- No breaking changes - existing valid calls continue to work exactly as before

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🗺️ Roadmap

### Core Features
- ✅ **Transaction support (BEGIN, COMMIT, ROLLBACK)** - **COMPLETED!**
- ✅ **Stored procedure execution** - **COMPLETED!**
- ✅ **Bulk operations (batch insert/update/delete)** - **COMPLETED!**
- [ ] Query result caching
- [ ] Advanced query optimization hints

### Enterprise Features
- [ ] **Database backup and restore tools**
- [ ] **Data export/import utilities** (CSV, JSON, SQL dumps)
- [ ] **Performance monitoring and metrics**
- [ ] **Query performance analysis**
- [ ] **Connection pool monitoring**
- [ ] **Audit logging and compliance**
- [ ] **Data migration utilities**
- [ ] **Schema versioning and migrations**

### Database Adapters
- [ ] PostgreSQL adapter
- [ ] MongoDB adapter
- [ ] SQLite adapter
- [ ] Oracle Database adapter
- [ ] SQL Server adapter

### Recommended Implementation Order

#### **Phase 1: Performance & Monitoring** 🚀
- [ ] **Query result caching** - Dramatically improve response times for repeated queries
- [ ] **Performance metrics** - Track query execution times and database performance
- [ ] **Connection pool monitoring** - Monitor database connection health and usage
- [ ] **Database health checks** - Comprehensive system health monitoring

#### **Phase 2: Data Management** 📊
- [ ] **Database backup and restore tools** - Essential for production data safety
- [ ] **Data migration utilities** - Move data between databases and environments
- [ ] **Enhanced export/import** - Support for JSON, XML, Excel formats
- [ ] **Query history & analytics** - Track and analyze database usage patterns

#### **Phase 3: Enterprise Features** 🏢
- [ ] **Audit logging and compliance** - Track all database operations for security
- [ ] **Schema versioning and migrations** - Version control for database schema changes
- [ ] **Query optimization** - Automatic query analysis and optimization suggestions
- [ ] **Advanced security features** - Enhanced access control and monitoring

#### **Phase 4: Multi-Database Support** 🌐
- [ ] **PostgreSQL adapter** - Extend support to PostgreSQL databases
- [ ] **MongoDB adapter** - Add NoSQL document database support
- [ ] **SQLite adapter** - Support for lightweight embedded databases
- [ ] **Database-agnostic operations** - Unified API across different database types

#### **Implementation Priority Matrix**

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Query Result Caching | High | Medium | 1 |
| Database Backup/Restore | High | High | 2 |
| Performance Monitoring | High | Medium | 3 |
| Data Migration | High | High | 4 |
| Query Optimization | Medium | Medium | 5 |
| PostgreSQL Adapter | High | High | 6 |
| Audit Logging | Medium | Low | 7 |
| Schema Versioning | Medium | Medium | 8 |

---

**Made with ❤️ for the AI community**

*Help AI agents interact with MySQL databases safely and efficiently!*
