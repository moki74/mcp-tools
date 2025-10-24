# MySQL MCP Server

A fully-featured **Model Context Protocol (MCP)** server for MySQL database integration with AI agents like Claude Desktop, Cline, Windsurf, and other MCP-compatible tools.

[![npm version](https://img.shields.io/npm/v/@berthojoris/mcp-mysql-server)](https://www.npmjs.com/package/@berthojoris/mcp-mysql-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Features

- ✅ **Full MCP Protocol Support** - Works with Claude Desktop, Cline, Windsurf, and any MCP-compatible AI agent
- 🔒 **Secure by Default** - Parameterized queries, SQL injection protection, permission-based access control
- 🛠️ **27 Powerful Tools** - Complete database operations (CRUD, DDL, queries, schema inspection, transactions, stored procedures)
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

**Alternative: Local development (if you cloned the repository):**

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": [
        "C:\\path\\to\\mysql-mcp\\bin\\mcp-mysql.js",
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

### Utilities (2 tools)

| Tool | Description |
|------|-------------|
| `test_connection` | Test database connectivity and measure latency |
| `describe_connection` | Get current connection information |

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

## 🔐 Permission System

### Permission Categories

Control access with these permission categories:

| Category | Operations | Example Use Case |
|----------|------------|------------------|
| **`list`** | List databases, tables, schemas | Database exploration |
| **`read`** | SELECT queries, read data | Analytics, reporting |
| **`create`** | INSERT new records | Data entry |
| **`update`** | UPDATE existing records | Data maintenance |
| **`delete`** | DELETE records | Data cleanup |
| **`execute`** | Execute custom SQL (DML) | Complex operations |
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

## ⚙️ Configuration

### Connection String Format

```
mysql://username:password@host:port/database
```

**Examples:**
```
mysql://root:pass@localhost:3306/myapp
mysql://user:pass@192.168.1.100:3306/production
mysql://admin:pass@db.example.com:3306/analytics
```

**Database name is optional:**
```
mysql://user:pass@localhost:3306/
```

When omitted, AI can switch between databases using SQL commands.

### Environment Variables

Create `.env` file for local development:

```env
# MySQL Connection
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=yourdatabase

# Default Permissions (optional, can be overridden per-project)
MCP_CONFIG=list,read,utility

# REST API Mode (optional)
PORT=3000
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

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

## 🌐 REST API Mode

In addition to MCP protocol, this server can run as a REST API.

### Start API Server

```bash
npm run start:api
```

Server runs on `http://localhost:3000` (or configured PORT).

### API Endpoints

All endpoints require JWT authentication (except `/health`).

**Health Check:**
```
GET /health
```

**Database Operations:**
```
GET  /api/databases          # List databases
GET  /api/tables             # List tables
GET  /api/tables/:name/schema    # Get table schema
GET  /api/tables/:name/records   # Read records
POST /api/tables/:name/records   # Create record
PUT  /api/tables/:name/records/:id  # Update record
DELETE /api/tables/:name/records/:id  # Delete record
```

**Query Operations:**
```
POST /api/query    # Execute SELECT query
POST /api/execute  # Execute write query
```

**Utilities:**
```
GET /api/connection       # Connection info
GET /api/connection/test  # Test connection
GET /api/tables/:name/relationships  # Get foreign keys
```

### Authentication

Include JWT token in Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/tables
```

---

## 🧪 Testing

### Test MCP Server Locally

```bash
# Test connection using npx (recommended)
npx -y @berthojoris/mcp-mysql-server mysql://user:pass@localhost:3306/test "list,read,utility"

# Or if you cloned the repository locally
node bin/mcp-mysql.js mysql://user:pass@localhost:3306/test "list,read,utility"
```

### Test with Claude Desktop

1. Configure `claude_desktop_config.json`
2. Restart Claude Desktop
3. Ask: *"What databases are available?"*

### Test REST API

```bash
# Start API server
npm run start:api

# Test health endpoint
curl http://localhost:3000/health
```

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

---

## 📚 Development

### Project Structure

```
mysql-mcp/
├── src/
│   ├── config/         # Configuration and permissions
│   ├── db/             # Database connection
│   ├── security/       # Security layer
│   ├── tools/          # Tool implementations
│   │   ├── databaseTools.ts   # Database discovery
│   │   ├── crudTools.ts       # CRUD operations
│   │   ├── queryTools.ts      # Query execution
│   │   ├── ddlTools.ts        # DDL operations
│   │   └── utilityTools.ts    # Utilities
│   ├── validation/     # Input validation schemas
│   ├── index.ts        # MySQLMCP class
│   ├── mcp-server.ts   # MCP protocol server
│   └── server.ts       # REST API server
├── bin/
│   └── mcp-mysql.js    # CLI entry point
├── dist/               # Compiled JavaScript
├── .env                # Local environment config
├── package.json
├── tsconfig.json
└── README.md
```

### Development Commands

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode (MCP)
npm run dev:mcp

# Run in development mode (API)
npm run dev:api

# Run tests
npm test
```

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Build and test: `npm run build`
5. Commit: `git commit -m "Add my feature"`
6. Push: `git push origin feature/my-feature`
7. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- Compatible with [Claude Desktop](https://claude.ai/), [Cline](https://github.com/cline/cline), [Windsurf](https://codeium.com/windsurf), and other MCP-compatible tools
- Inspired by the Model Context Protocol specification

---

## 💬 Support

- **Issues:** [GitHub Issues](https://github.com/berthojoris/mysql-mcp/issues)
- **Discussions:** [GitHub Discussions](https://github.com/berthojoris/mysql-mcp/discussions)
- **Documentation:** This README

---

## 🗺️ Roadmap

### Core Features
- ✅ **Transaction support (BEGIN, COMMIT, ROLLBACK)** - **COMPLETED!**
- ✅ **Stored procedure execution** - **COMPLETED!**
- [ ] Bulk operations (batch insert/update/delete)
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

---

**Made with ❤️ for the AI community**

*Help AI agents interact with MySQL databases safely and efficiently!*
