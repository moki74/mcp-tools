# MySQL MCP Server - Detailed Documentation

This file contains detailed documentation for all features of the MySQL MCP Server. For quick start and basic information, see [README.md](README.md).

---

## Table of Contents

1. [DDL Operations](#🏗️-ddl-operations)
2. [Data Export Tools](#📤-data-export-tools)
3. [Data Import Tools](#📥-data-import-tools) - NEW!
4. [Database Backup & Restore](#💾-database-backup--restore) - NEW!
5. [Transaction Management](#💰-transaction-management)
6. [Stored Procedures](#🔧-stored-procedures)
7. [Views Management](#👁️-views-management)
8. [Triggers Management](#⚡-triggers-management)
9. [Functions Management](#🔢-functions-management)
10. [Index Management](#📇-index-management)
11. [Constraint Management](#🔗-constraint-management)
12. [Table Maintenance](#🔧-table-maintenance)
13. [Process & Server Management](#📊-process--server-management)
14. [Usage Examples](#📋-usage-examples)
15. [Query Logging & Automatic SQL Display](#📝-query-logging--automatic-sql-display)
16. [Security Features](#🔒-security-features)
17. [Query Result Caching](#💾-query-result-caching)
18. [Query Optimization Hints](#🎯-query-optimization-hints)
19. [Bulk Operations](#🚀-bulk-operations)
20. [Troubleshooting](#🛠️-troubleshooting)
21. [License](#📄-license)
22. [Roadmap](#🗺️-roadmap)

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

## 📥 Data Import Tools

The MySQL MCP Server provides tools to import data from various formats into your database tables.

### Data Import Tools Overview

| Tool | Description | Permission |
|------|-------------|------------|
| `import_from_csv` | Import data from CSV string | `create` |
| `import_from_json` | Import data from JSON array | `create` |

### Import from CSV

Import data from a CSV string into a table with optional column mapping and error handling.

```json
{
  "tool": "import_from_csv",
  "arguments": {
    "table_name": "users",
    "csv_data": "name,email,age\nJohn,john@example.com,30\nJane,jane@example.com,25",
    "has_headers": true,
    "skip_errors": false,
    "batch_size": 100
  }
}
```

**With Column Mapping:**
```json
{
  "tool": "import_from_csv",
  "arguments": {
    "table_name": "users",
    "csv_data": "full_name,mail\nJohn Doe,john@example.com",
    "has_headers": true,
    "column_mapping": {
      "full_name": "name",
      "mail": "email"
    }
  }
}
```

### Import from JSON

Import data from a JSON array string into a table.

```json
{
  "tool": "import_from_json",
  "arguments": {
    "table_name": "products",
    "json_data": "[{\"name\":\"Widget\",\"price\":9.99},{\"name\":\"Gadget\",\"price\":19.99}]",
    "skip_errors": false,
    "batch_size": 100
  }
}
```

### Import Response

```json
{
  "status": "success",
  "data": {
    "message": "Import completed successfully",
    "rows_imported": 150,
    "rows_failed": 0
  }
}
```

### Import Best Practices

1. **Validate data format** - Ensure CSV/JSON is well-formed before importing
2. **Use batch_size** - Adjust batch size for optimal performance (default: 100)
3. **Enable skip_errors** - For large imports, set `skip_errors: true` to continue on individual row failures
4. **Column mapping** - Use when source column names don't match table columns

---

## 💾 Database Backup & Restore

Enterprise-grade backup and restore functionality for MySQL databases.

### Backup & Restore Tools Overview

| Tool | Description | Permission |
|------|-------------|------------|
| `backup_table` | Backup single table to SQL dump | `utility` |
| `backup_database` | Backup entire database to SQL dump | `utility` |
| `restore_from_sql` | Restore from SQL dump content | `ddl` |
| `get_create_table_statement` | Get CREATE TABLE statement | `list` |
| `get_database_schema` | Get complete database schema | `list` |

### Backup Single Table

```json
{
  "tool": "backup_table",
  "arguments": {
    "table_name": "users",
    "include_data": true,
    "include_drop": true
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "table_name": "users",
    "sql_dump": "-- MySQL Dump...\nDROP TABLE IF EXISTS `users`;\nCREATE TABLE...\nINSERT INTO...",
    "row_count": 1500,
    "include_data": true,
    "include_drop": true
  }
}
```

### Backup Entire Database

```json
{
  "tool": "backup_database",
  "arguments": {
    "include_data": true,
    "include_drop": true
  }
}
```

**Backup Specific Tables:**
```json
{
  "tool": "backup_database",
  "arguments": {
    "tables": ["users", "orders", "products"],
    "include_data": true
  }
}
```

### Restore from SQL Dump

```json
{
  "tool": "restore_from_sql",
  "arguments": {
    "sql_dump": "DROP TABLE IF EXISTS `users`;\nCREATE TABLE `users` (...);",
    "stop_on_error": true
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": "Restore completed successfully",
    "statements_executed": 25,
    "statements_failed": 0
  }
}
```

### Get Database Schema

Get a complete overview of all database objects:

```json
{
  "tool": "get_database_schema",
  "arguments": {
    "include_views": true,
    "include_procedures": true,
    "include_functions": true,
    "include_triggers": true
  }
}
```

### Export to JSON Format

```json
{
  "tool": "export_table_to_json",
  "arguments": {
    "table_name": "users",
    "pretty": true,
    "filters": [
      { "field": "status", "operator": "eq", "value": "active" }
    ]
  }
}
```

### Export to SQL INSERT Statements

```json
{
  "tool": "export_table_to_sql",
  "arguments": {
    "table_name": "products",
    "include_create_table": true,
    "batch_size": 100
  }
}
```

### Backup Best Practices

1. **Regular backups** - Schedule regular database backups
2. **Test restores** - Periodically test your backup restoration process
3. **Include structure** - Always include `include_drop: true` for clean restores
4. **Schema-only backups** - Use `include_data: false` for structure-only backups
5. **Selective backups** - Use `tables` array to backup only critical tables

### Backup Safety Features

- **Transactional integrity** - Backups include transaction markers
- **Foreign key handling** - `SET FOREIGN_KEY_CHECKS=0` included in dumps
- **Binary data support** - Proper escaping for BLOB and binary columns
- **Character encoding** - UTF-8 encoding preserved in exports

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

## 👁️ Views Management

Views allow you to create virtual tables based on SQL SELECT statements. The MySQL MCP Server provides comprehensive view management tools.

### View Tools Overview

- **`list_views`** - List all views in the database
- **`get_view_info`** - Get detailed information about a view including columns
- **`create_view`** - Create a new view with SELECT definition
- **`alter_view`** - Alter an existing view definition
- **`drop_view`** - Drop a view
- **`show_create_view`** - Show the CREATE statement for a view

### Creating Views

**User:** *"Create a view that shows active users with their order count"*

**AI will execute:**
```json
{
  "tool": "create_view",
  "arguments": {
    "view_name": "active_users_orders",
    "definition": "SELECT u.id, u.name, u.email, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.status = 'active' GROUP BY u.id",
    "or_replace": true
  }
}
```

### View Options

| Option | Description |
|--------|-------------|
| `or_replace` | If true, replaces existing view with same name |
| `algorithm` | UNDEFINED, MERGE, or TEMPTABLE |
| `security` | DEFINER or INVOKER |
| `check_option` | CASCADED or LOCAL for updatable views |

---

## ⚡ Triggers Management

Triggers are database callbacks that automatically execute when specific events occur on a table.

### Trigger Tools Overview

- **`list_triggers`** - List all triggers, optionally filtered by table
- **`get_trigger_info`** - Get detailed information about a trigger
- **`create_trigger`** - Create a new trigger
- **`drop_trigger`** - Drop a trigger
- **`show_create_trigger`** - Show the CREATE statement for a trigger

### Creating Triggers

**User:** *"Create a trigger that logs all updates to the users table"*

**AI will execute:**
```json
{
  "tool": "create_trigger",
  "arguments": {
    "trigger_name": "users_update_log",
    "table_name": "users",
    "timing": "AFTER",
    "event": "UPDATE",
    "body": "INSERT INTO audit_log (table_name, action, record_id, changed_at) VALUES ('users', 'UPDATE', NEW.id, NOW());"
  }
}
```

### Trigger Timing and Events

| Timing | Events | Description |
|--------|--------|-------------|
| BEFORE | INSERT, UPDATE, DELETE | Execute before the operation |
| AFTER | INSERT, UPDATE, DELETE | Execute after the operation |

---

## 🔢 Functions Management

User-defined functions (UDFs) allow you to create reusable SQL functions that can be called in queries.

### Function Tools Overview

- **`list_functions`** - List all user-defined functions
- **`get_function_info`** - Get detailed information about a function
- **`create_function`** - Create a new function
- **`drop_function`** - Drop a function
- **`show_create_function`** - Show the CREATE statement
- **`execute_function`** - Execute a function and return its result

### Creating Functions

**User:** *"Create a function that calculates the discount price"*

**AI will execute:**
```json
{
  "tool": "create_function",
  "arguments": {
    "function_name": "calculate_discount",
    "parameters": [
      {"name": "price", "data_type": "DECIMAL(10,2)"},
      {"name": "discount_percent", "data_type": "INT"}
    ],
    "returns": "DECIMAL(10,2)",
    "body": "RETURN price - (price * discount_percent / 100);",
    "deterministic": true,
    "comment": "Calculate discounted price"
  }
}
```

### Executing Functions

```json
{
  "tool": "execute_function",
  "arguments": {
    "function_name": "calculate_discount",
    "parameters": [100.00, 15]
  }
}
```

**Returns:** `{"result": 85.00}`

---

## 📇 Index Management

Indexes improve query performance by allowing MySQL to find rows faster.

### Index Tools Overview

- **`list_indexes`** - List all indexes for a table
- **`get_index_info`** - Get detailed information about an index
- **`create_index`** - Create a new index
- **`drop_index`** - Drop an index
- **`analyze_index`** - Update index statistics

### Creating Indexes

**User:** *"Create an index on the email column of the users table"*

**AI will execute:**
```json
{
  "tool": "create_index",
  "arguments": {
    "table_name": "users",
    "index_name": "idx_users_email",
    "columns": ["email"],
    "unique": true
  }
}
```

### Index Types

| Type | Description | Use Case |
|------|-------------|----------|
| BTREE | Default B-tree index | General purpose, range queries |
| HASH | Hash index | Equality comparisons only |
| FULLTEXT | Full-text search index | Text search in CHAR, VARCHAR, TEXT columns |
| SPATIAL | Spatial index | Geographic data (GEOMETRY types) |

### Composite Indexes

```json
{
  "tool": "create_index",
  "arguments": {
    "table_name": "orders",
    "index_name": "idx_orders_user_date",
    "columns": [
      {"column": "user_id"},
      {"column": "created_at", "order": "DESC"}
    ]
  }
}
```

---

## 🔗 Constraint Management

Constraints enforce data integrity rules on tables.

### Constraint Tools Overview

- **`list_foreign_keys`** - List all foreign keys for a table
- **`list_constraints`** - List all constraints (PK, FK, UNIQUE, CHECK)
- **`add_foreign_key`** - Add a foreign key constraint
- **`drop_foreign_key`** - Drop a foreign key constraint
- **`add_unique_constraint`** - Add a unique constraint
- **`drop_constraint`** - Drop a UNIQUE or CHECK constraint
- **`add_check_constraint`** - Add a CHECK constraint (MySQL 8.0.16+)

### Adding Foreign Keys

**User:** *"Add a foreign key from orders.user_id to users.id"*

**AI will execute:**
```json
{
  "tool": "add_foreign_key",
  "arguments": {
    "table_name": "orders",
    "constraint_name": "fk_orders_user",
    "columns": ["user_id"],
    "referenced_table": "users",
    "referenced_columns": ["id"],
    "on_delete": "CASCADE",
    "on_update": "CASCADE"
  }
}
```

### Referential Actions

| Action | Description |
|--------|-------------|
| CASCADE | Delete/update child rows when parent changes |
| SET NULL | Set child foreign key to NULL |
| RESTRICT | Prevent parent delete/update if children exist |
| NO ACTION | Same as RESTRICT |
| SET DEFAULT | Set to default value (not widely supported) |

### Adding CHECK Constraints (MySQL 8.0.16+)

```json
{
  "tool": "add_check_constraint",
  "arguments": {
    "table_name": "products",
    "constraint_name": "chk_positive_price",
    "expression": "price > 0"
  }
}
```

---

## 🔧 Table Maintenance

Table maintenance tools help optimize performance and fix issues.

### Maintenance Tools Overview

- **`analyze_table`** - Update index statistics for query optimizer
- **`optimize_table`** - Reclaim unused space and defragment
- **`check_table`** - Check table for errors
- **`repair_table`** - Repair corrupted tables (MyISAM, ARCHIVE, CSV)
- **`truncate_table`** - Remove all rows quickly
- **`get_table_status`** - Get detailed table statistics
- **`flush_table`** - Close and reopen tables
- **`get_table_size`** - Get size information for tables

### Analyzing Tables

**User:** *"Analyze the orders table to update statistics"*

```json
{
  "tool": "analyze_table",
  "arguments": {
    "table_name": "orders"
  }
}
```

### Optimizing Tables

```json
{
  "tool": "optimize_table",
  "arguments": {
    "table_name": "orders"
  }
}
```

### Checking Tables for Errors

```json
{
  "tool": "check_table",
  "arguments": {
    "table_name": "orders",
    "check_type": "MEDIUM"
  }
}
```

**Check Types:**
- `QUICK` - Don't scan rows for incorrect links
- `FAST` - Only check tables that haven't been closed properly
- `MEDIUM` - Scan rows to verify links are correct (default)
- `EXTENDED` - Full key lookup for each row
- `CHANGED` - Only check tables changed since last check

### Getting Table Size Information

**User:** *"Get size information for all tables in the database"*

```json
{
  "tool": "get_table_size",
  "arguments": {}
}
```

**User:** *"Get size information for a specific table"*

```json
{
  "tool": "get_table_size",
  "arguments": {
    "table_name": "orders"
  }
}
```

**Returns:**
```json
{
  "tables": [
    {
      "table_name": "orders",
      "row_count": 150000,
      "data_size_bytes": 15728640,
      "index_size_bytes": 5242880,
      "total_size_mb": "20.00"
    }
  ],
  "summary": {
    "total_tables": 25,
    "total_size_mb": "150.50"
  }
}
```

**Usage:**
- Get size information for all tables (no arguments)
- Get size for specific table (use `table_name` parameter)
- Optional `database` parameter to specify different database

---

## 📊 Process & Server Management

Monitor and manage MySQL server processes and configuration.

### Process Tools Overview

- **`show_process_list`** - Show all running processes/connections
- **`kill_process`** - Kill a process or query
- **`show_status`** - Show server status variables
- **`show_variables`** - Show server configuration variables
- **`explain_query`** - Show query execution plan
- **`show_engine_status`** - Show storage engine status
- **`get_server_info`** - Get comprehensive server information
- **`show_binary_logs`** - Show binary log files
- **`show_replication_status`** - Show replication status

### Showing Process List

**User:** *"Show me all running MySQL processes"*

```json
{
  "tool": "show_process_list",
  "arguments": {
    "full": true
  }
}
```

### Killing a Process

```json
{
  "tool": "kill_process",
  "arguments": {
    "process_id": 12345,
    "type": "QUERY"
  }
}
```

**Types:**
- `CONNECTION` - Kill the entire connection
- `QUERY` - Kill only the current query, keep connection

### Explaining Queries

**User:** *"Explain this query to see its execution plan"*

```json
{
  "tool": "explain_query",
  "arguments": {
    "query": "SELECT * FROM orders WHERE user_id = 5 ORDER BY created_at DESC",
    "format": "JSON",
    "analyze": true
  }
}
```

**Formats:**
- `TRADITIONAL` - Tabular output (default)
- `JSON` - JSON format with detailed information
- `TREE` - Tree-like output showing query plan

### Getting Server Information

```json
{
  "tool": "get_server_info",
  "arguments": {}
}
```

**Returns:**
```json
{
  "version": "8.0.32",
  "connection_id": 12345,
  "current_user": "app_user@localhost",
  "database": "myapp",
  "uptime": "86400",
  "uptime_formatted": "1d 0h 0m",
  "threads_connected": "5",
  "threads_running": "1",
  "questions": "1000000"
}
```

### Showing Server Variables

```json
{
  "tool": "show_variables",
  "arguments": {
    "like": "max_%",
    "global": true
  }
}
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

## 💾 Query Result Caching

The MySQL MCP server includes an intelligent LRU (Least Recently Used) cache system that dramatically improves performance for repeated queries.

### Cache Features

- **LRU Eviction**: Automatically removes least recently used entries when cache is full
- **TTL Support**: Configurable time-to-live for cache entries (default: 60 seconds)
- **Automatic Invalidation**: Cache is automatically invalidated when data is modified
- **Memory Management**: Configurable maximum entries and memory limits
- **Cache Statistics**: Track hit rates and monitor cache performance

### Cache Configuration

Cache can be configured via environment variables or programmatically:

```bash
# Environment variables
CACHE_ENABLED=true          # Enable/disable cache (default: true)
CACHE_TTL_MS=60000          # Cache TTL in milliseconds (default: 60000)
CACHE_MAX_SIZE=100          # Maximum cached entries (default: 100)
CACHE_MAX_MEMORY_MB=50      # Maximum memory in MB (default: 50)
```

### Cache Management Tools

#### Get Cache Statistics
```json
{
  "tool": "get_cache_stats"
}
```

Returns:
```json
{
  "totalHits": 150,
  "totalMisses": 50,
  "hitRate": 0.75,
  "currentSize": 45,
  "maxSize": 100,
  "ttlMs": 60000,
  "enabled": true
}
```

#### Configure Cache
```json
{
  "tool": "configure_cache",
  "arguments": {
    "enabled": true,
    "ttlMs": 120000,
    "maxSize": 200
  }
}
```

#### Clear Cache
```json
{
  "tool": "clear_cache"
}
```

#### Invalidate Table Cache
```json
{
  "tool": "invalidate_table_cache",
  "arguments": {
    "table_name": "users"
  }
}
```

### Cache Behavior

- **SELECT queries only**: Only SELECT queries are cached
- **Automatic invalidation**: INSERT, UPDATE, DELETE operations automatically invalidate related cache entries
- **Per-query control**: Use `useCache: false` in `run_query` to bypass cache for specific queries

---

## 🎯 Query Optimization Hints

The MySQL MCP server provides advanced query optimization tools that help you improve query performance using MySQL 8.0+ optimizer hints.

### Optimization Features

- **Optimizer Hints**: Apply MySQL 8.0+ optimizer hints to queries
- **Query Analysis**: Analyze queries and get optimization suggestions
- **Goal-Based Hints**: Get suggested hints based on optimization goals (SPEED, MEMORY, STABILITY)

### Using Optimizer Hints

When running queries with `run_query`, you can include optimizer hints:

```json
{
  "tool": "run_query",
  "arguments": {
    "query": "SELECT * FROM orders WHERE customer_id = ?",
    "params": [123],
    "hints": {
      "maxExecutionTime": 5000,
      "forceIndex": "idx_customer_id",
      "straightJoin": true
    }
  }
}
```

### Available Hint Options

| Hint | Type | Description |
|------|------|-------------|
| `maxExecutionTime` | number | Maximum execution time in milliseconds |
| `forceIndex` | string/array | Force usage of specific index(es) |
| `ignoreIndex` | string/array | Ignore specific index(es) |
| `straightJoin` | boolean | Force join order as specified in query |
| `noCache` | boolean | Disable query cache for this query |
| `sqlBigResult` | boolean | Optimize for large result sets |
| `sqlSmallResult` | boolean | Optimize for small result sets |

### Query Analysis Tool

Analyze a query to get optimization suggestions:

```json
{
  "tool": "analyze_query",
  "arguments": {
    "query": "SELECT o.*, c.name FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.status = 'pending' ORDER BY o.created_at"
  }
}
```

Returns analysis with suggestions:
```json
{
  "originalQuery": "SELECT o.*, c.name FROM orders o JOIN customers c...",
  "queryType": "SELECT",
  "tables": ["orders", "customers"],
  "hasJoins": true,
  "hasSubqueries": false,
  "hasGroupBy": false,
  "hasOrderBy": true,
  "hasLimit": false,
  "estimatedComplexity": "MEDIUM",
  "suggestions": [
    {
      "type": "STRUCTURE",
      "priority": "MEDIUM",
      "description": "ORDER BY without LIMIT may cause full result set sorting",
      "suggestedAction": "Consider adding LIMIT clause to improve performance"
    }
  ]
}
```

### Get Optimization Hints by Goal

Get suggested hints for a specific optimization goal:

```json
{
  "tool": "get_optimization_hints",
  "arguments": {
    "goal": "SPEED"
  }
}
```

Available goals:
- **SPEED**: Optimize for faster query execution
- **MEMORY**: Optimize for lower memory usage
- **STABILITY**: Optimize for consistent, predictable performance

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
- ✅ **Query result caching** - **COMPLETED!**
- ✅ **Advanced query optimization hints** - **COMPLETED!**

### Essential Database Objects (v1.6.0)
- ✅ **Views Management** - Create, alter, drop, and query database views - **COMPLETED!**
- ✅ **Triggers Management** - Full trigger lifecycle management - **COMPLETED!**
- ✅ **Functions Management** - Stored function creation and execution - **COMPLETED!**

### Administration Features (v1.6.0)
- ✅ **Index Management** - Create, drop, and analyze indexes - **COMPLETED!**
- ✅ **Foreign Keys & Constraints** - Constraint management with referential integrity - **COMPLETED!**
- ✅ **Table Maintenance** - Analyze, optimize, check, repair tables - **COMPLETED!**
- ✅ **Process Management** - Server processes, status, and query analysis - **COMPLETED!**

### Enterprise Features
- [x] **Database backup and restore tools** - **COMPLETED!**
- [x] **Data export/import utilities** (CSV, JSON, SQL dumps) - **COMPLETED!**
- [ ] **Performance monitoring and metrics**
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
- ✅ **Query result caching** - Dramatically improve response times for repeated queries - **COMPLETED!**
- [ ] **Performance metrics** - Track query execution times and database performance
- [ ] **Connection pool monitoring** - Monitor database connection health and usage
- [ ] **Database health checks** - Comprehensive system health monitoring

#### **Phase 2: Data Management** 📊
- [x] **Database backup and restore tools** - Essential for production data safety - **COMPLETED!**
- [ ] **Data migration utilities** - Move data between databases and environments
- [x] **Enhanced export/import** - Support for JSON, SQL dump formats - **COMPLETED!**
- [ ] **Query history & analytics** - Track and analyze database usage patterns

#### **Phase 3: Enterprise Features** 🏢
- [ ] **Audit logging and compliance** - Track all database operations for security
- [ ] **Schema versioning and migrations** - Version control for database schema changes
- ✅ **Query optimization** - Automatic query analysis and optimization suggestions - **COMPLETED!**
- [ ] **Advanced security features** - Enhanced access control and monitoring

#### **Phase 4: Multi-Database Support** 🌐
- [ ] **PostgreSQL adapter** - Extend support to PostgreSQL databases
- [ ] **MongoDB adapter** - Add NoSQL document database support
- [ ] **SQLite adapter** - Support for lightweight embedded databases
- [ ] **Database-agnostic operations** - Unified API across different database types

#### **Implementation Priority Matrix**

| Feature | Impact | Effort | Priority | Status |
|---------|--------|--------|----------|--------|
| Query Result Caching | High | Medium | 1 | ✅ COMPLETED |
| Views Management | High | Medium | 2 | ✅ COMPLETED |
| Triggers Management | High | Medium | 3 | ✅ COMPLETED |
| Functions Management | High | Medium | 4 | ✅ COMPLETED |
| Index Management | High | Medium | 5 | ✅ COMPLETED |
| Foreign Keys & Constraints | High | Medium | 6 | ✅ COMPLETED |
| Table Maintenance | High | Low | 7 | ✅ COMPLETED |
| Process Management | High | Medium | 8 | ✅ COMPLETED |
| Query Optimization | Medium | Medium | 9 | ✅ COMPLETED |
| Database Backup/Restore | High | High | 10 | ✅ COMPLETED |
| Data Export/Import (JSON, SQL) | High | Medium | 11 | ✅ COMPLETED |
| Performance Monitoring | High | Medium | 12 | Pending |
| Data Migration | High | High | 13 | Pending |
| PostgreSQL Adapter | High | High | 13 | Pending |
| Audit Logging | Medium | Low | 14 | Pending |
| Schema Versioning | Medium | Medium | 15 | Pending |

---

**Made with ❤️ for the AI community**

*Help AI agents interact with MySQL databases safely and efficiently!*
