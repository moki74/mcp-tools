# MySQL MCP Server - Detailed Documentation

This file contains detailed documentation for all features of the MySQL MCP Server. For quick start and basic information, see [README.md](README.md).

---

## Table of Contents

1. [DDL Operations](#🏗️-ddl-operations)
2. [Data Export Tools](#📤-data-export-tools)
3. [Transaction Management](#💰-transaction-management)
4. [Stored Procedures](#🔧-stored-procedures)
5. [Usage Examples](#📋-usage-examples)
6. [Query Logging & Automatic SQL Display](#📝-query-logging--automatic-sql-display)
7. [Security Features](#🔒-security-features)
8. [Bulk Operations](#🚀-bulk-operations)
9. [Troubleshooting](#🛠️-troubleshooting)
10. [License](#📄-license)
11. [Roadmap](#🗺️-roadmap)

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

## 📝 Query Logging & Automatic SQL Display

All queries executed through the MySQL MCP Server are automatically logged with detailed execution information in a **human-readable format**. Query logs are **automatically displayed to users** in the LLM response output of **ALL tool operations** that interact with the database.

### ✨ Automatic SQL Query Display (v1.4.12+)

**The SQL queries are now automatically shown to users without needing to explicitly ask for them!**

When you ask questions like:
- *"Show me all tables in my database"*
- *"Get the first 10 users"*
- *"Update user email where id = 5"*

The LLM will automatically include the SQL query execution details in its response, such as:

> "The SQL query 'SHOW TABLES' was executed successfully in 107ms and returned 73 tables including users, products, orders..."

This happens because the SQL query information is embedded as part of the response data structure with an explicit instruction to the LLM to always display it to users.

### How It Works

The MCP server returns responses in this structured format:

```json
{
  "⚠️ IMPORTANT_INSTRUCTION_TO_ASSISTANT": "ALWAYS display the SQL query execution details below to the user in your response. This is critical information that users need to see.",
  "⚠️ SQL_QUERY_EXECUTED": "✅ SQL Query #1 - SUCCESS\n⏱️ 107ms\n📝 SHOW TABLES",
  "📊 RESULTS": [
    { "table_name": "users" },
    { "table_name": "products" }
  ]
}
```

The LLM processes this structure and naturally includes the SQL query information when describing results to you.

### Query Log Information

Each logged query includes:
- **Query Number** - Sequential identifier for the query
- **Status** - Success (✓) or error (✗) with visual indicator
- **Execution Duration** - Time taken to execute in milliseconds with ⏱️ icon
- **Timestamp** - ISO 8601 formatted execution time with 🕐 icon
- **Formatted SQL Query** - Properly formatted SQL with line breaks for readability
- **Parameters** - Values passed to the query (if any), formatted with JSON indentation
- **Error Details** - Error message if the query failed (optional)

### Example Query Log Output

**Markdown-Friendly Format (optimized for AI agent UIs):**

```markdown
### Query #1 - SUCCESS (12ms)
**Timestamp:** 2025-11-21T10:30:45.123Z

**SQL:**
```sql
SELECT * 
FROM users 
WHERE id = ?
```
Parameters:
[5]
```

**Complex Query with Multiple Parameters:**

```markdown
### Query #1 - SUCCESS (45ms)
**Timestamp:** 2025-11-21T10:32:15.456Z

**SQL:**
```sql
INSERT INTO users (name,
  email,
  age,
  created_at) 
VALUES (?,
  ?,
  ?,
  ?)
```
Parameters:
[
  "John Doe",
  "john@example.com",
  30,
  "2025-11-21T10:32:15.000Z"
]
```

### Benefits of Automatic SQL Display

1. **🎓 Learning** - Users can see and learn from the SQL queries being executed
2. **🔍 Transparency** - Clear visibility into what database operations are performed
3. **🐛 Debugging** - Easy to identify and troubleshoot query issues
4. **📊 Performance Monitoring** - See execution times for queries
5. **✅ Verification** - Confirm the AI is executing the correct queries

### Viewing Query Logs in Responses

Query logs are automatically included in **ALL** tool responses and displayed to users via the structured response format with explicit LLM instructions:

**Example: Viewing Response with Query Log:**

When you call `list_tables`, the AI agent receives:

```json
[
  {"table_name": "users"},
  {"table_name": "orders"}
]
```

---

## SQL Query Execution Log

### Query #1 - SUCCESS (8ms)
**Timestamp:** 2025-11-21T10:30:45.123Z

**SQL:**
```sql
SHOW TABLES
```

**Example: Bulk Operations with Multiple Queries:**

When you call `bulk_insert`, the AI agent receives:

```json
{
  "affectedRows": 100,
  "totalInserted": 100
}
```

---

## SQL Query Execution Log

### Query #1 - SUCCESS (45ms)
**Timestamp:** 2025-11-21T10:30:45.123Z

**SQL:**
```sql
INSERT INTO users (name, email, age) 
VALUES (?, ?, ?)
```
Parameters:
["John Doe", "john@example.com", 30]

---

### Query #2 - SUCCESS (23ms)
**Timestamp:** 2025-11-21T10:30:45.168Z

**SQL:**
```sql
INSERT INTO users (name, email, age) 
VALUES (?, ?, ?)
```
Parameters:
["Jane Smith", "jane@example.com", 28]

**Tools with Query Logging:**

Query logs are now included in responses from **ALL 30 tools**:

✅ **Database Discovery** - `list_databases`, `list_tables`, `read_table_schema`, `get_table_relationships`
✅ **Data Operations** - `create_record`, `read_records`, `update_record`, `delete_record`
✅ **Bulk Operations** - `bulk_insert`, `bulk_update`, `bulk_delete`
✅ **Custom Queries** - `run_query`, `execute_sql`
✅ **Schema Management** - `create_table`, `alter_table`, `drop_table`, `execute_ddl`
✅ **Utilities** - `get_table_relationships`
✅ **Transactions** - `execute_in_transaction`
✅ **Stored Procedures** - `list_stored_procedures`, `get_stored_procedure_info`, `execute_stored_procedure`, etc.
✅ **Data Export** - `export_table_to_csv`, `export_query_to_csv`

### Query Logs for Debugging

Query logs are valuable for:
- **Performance Analysis** - Track which queries are slow (high duration)
- **Troubleshooting** - Review exact parameters sent to queries
- **Auditing** - See what operations were performed and when
- **Optimization** - Identify patterns in query execution
- **Error Investigation** - Review failed queries and their errors

### Query Log Limitations

- Logs are stored in memory (not persisted to disk)
- Maximum of 100 most recent queries are retained
- Logs are cleared when the MCP server restarts
- For production audit trails, consider using MySQL's built-in query logging

### Tools with Query Logging

All tools that execute queries include logs:
- `run_query` - SELECT query execution
- `executeSql` - Write operations (INSERT, UPDATE, DELETE)
- `create_record` - Single record insertion
- `read_records` - Record querying with filters
- `update_record` - Record updates
- `delete_record` - Record deletion
- Bulk operations (`bulk_insert`, `bulk_update`, `bulk_delete`)
- Stored procedure execution
- Transaction operations

### Query Logger Performance & Configuration

#### Memory Management

The QueryLogger is designed with robust memory safety:

**Built-in Protections:**
- ✅ **SQL Truncation** - Queries truncated to 500 characters max
- ✅ **Parameter Limiting** - Only first 5 parameters logged
- ✅ **Value Truncation** - Individual parameter values limited to 50 characters
- ✅ **Error Truncation** - Error messages limited to 200 characters
- ✅ **Deep Copy** - Parameters are deep copied to prevent reference mutations
- ✅ **Safe Serialization** - Handles circular references, BigInt, and unstringifiable objects
- ✅ **Bounded Storage** - Maximum 100 most recent queries retained

**Memory Impact:**
```
Regular query:     ~1 KB per log entry
Bulk operations:   ~1 KB per log entry (99.9% reduction vs unbounded)
Total max memory:  ~100 KB for all 100 log entries
```

#### Configuration Tuning

The QueryLogger limits are defined as constants and can be adjusted if needed by modifying `src/db/queryLogger.ts`:

```typescript
private static readonly MAX_LOGS = 100;          // Number of queries to retain
private static readonly MAX_SQL_LENGTH = 500;    // Max SQL string length
private static readonly MAX_PARAM_LENGTH = 200;  // Max params output length
private static readonly MAX_PARAM_ITEMS = 5;     // Max number of params to log
```

**Tuning Recommendations:**
- **High-traffic production**: Reduce `MAX_LOGS` to 50 to minimize memory
- **Development/debugging**: Increase `MAX_SQL_LENGTH` to 1000 for fuller visibility
- **Bulk operations heavy**: Keep defaults - they're optimized for bulk workloads

#### Production Monitoring

When running in production, monitor these metrics:

1. **Memory Usage** - QueryLogger should use <500 KB total
2. **Response Payload Size** - Query logs add minimal overhead (<1 KB per response)
3. **Performance Impact** - Logging overhead is <1ms per query

**Health Check:**
```javascript
// Check log memory usage
const logs = db.getQueryLogs();
const estimatedMemory = logs.length * 1; // ~1 KB per log
console.log(`Query log memory usage: ~${estimatedMemory} KB`);
```

#### Persistent Logging for Production Auditing

**Important:** QueryLogger stores logs in memory only (not persisted to disk). For production audit trails and compliance, consider:

1. **MySQL Query Log** (Recommended)
   ```sql
   -- Enable general query log
   SET GLOBAL general_log = 'ON';
   SET GLOBAL general_log_file = '/var/log/mysql/queries.log';
   ```

2. **MySQL Slow Query Log**
   ```sql
   -- Log queries slower than 1 second
   SET GLOBAL slow_query_log = 'ON';
   SET GLOBAL long_query_time = 1;
   ```

3. **Application-Level Logging**
   - Use Winston or similar logger to persist query logs to disk
   - Integrate with log aggregation services (ELK, Splunk, DataDog)

4. **Database Audit Plugins**
   - MySQL Enterprise Audit
   - MariaDB Audit Plugin
   - Percona Audit Log Plugin

**Trade-offs:**
- **In-Memory (QueryLogger)**: Fast, lightweight, for debugging & development
- **MySQL Query Log**: Complete audit trail, slight performance impact
- **Application Logging**: Flexible, can include business context
- **Audit Plugins**: Enterprise-grade, compliance-ready, feature-rich

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

## 🛠️ Troubleshooting

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
- ✅ **Add query log on output** - **COMPLETED!**
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
