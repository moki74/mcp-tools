# MySQL MCP Server - Detailed Documentation

This file contains detailed documentation for all features of the MySQL MCP Server. For quick start and basic information, see [README.md](README.md).

---

## Table of Contents

1. [Category Filtering System](#🆕-category-filtering-system) - NEW!
2. [🔧 Complete Tools Reference](#🔧-complete-tools-reference) - All 134 tools organized by category
3. [DDL Operations](#🏗️-ddl-operations)
4. [Data Export Tools](#📤-data-export-tools)
5. [Data Import Tools](#📥-data-import-tools)
6. [Database Backup & Restore](#💾-database-backup--restore)
7. [Data Migration Tools](#🔄-data-migration-tools)
8. [Schema Versioning & Migrations](#🔄-schema-versioning-and-migrations)
9. [Transaction Management](#💰-transaction-management)
10. [Stored Procedures](#🔧-stored-procedures)
11. [Views Management](#👁️-views-management)
12. [Triggers Management](#⚡-triggers-management)
13. [Functions Management](#🔢-functions-management)
14. [Index Management](#📇-index-management)
15. [Constraint Management](#🔗-constraint-management)
16. [Table Maintenance](#🔧-table-maintenance)
17. [Process & Server Management](#📊-process--server-management)
18. [Performance Monitoring](#📈-performance-monitoring)
19. [AI Enhancement Tools](#🤖-ai-enhancement-tools) - NEW!
20. [Usage Examples](#📋-usage-examples)
21. [Query Logging & Automatic SQL Display](#📝-query-logging--automatic-sql-display)

Control which database operations are available to AI using a **dual-layer filtering system**:

- **Layer 1 (Permissions)**: Broad operation-level control using legacy categories (required)
- **Layer 2 (Categories)**: Fine-grained tool-level filtering using documentation categories (optional)

**Filtering Logic**: `Tool enabled = (Has Permission) AND (Has Category OR No categories specified)`

### Why Use Dual-Layer Filtering?

- **Security**: Multiple layers of protection - broad permissions + specific tool access
- **Flexibility**: Simple permission-only mode OR advanced dual-layer mode
- **Backward Compatible**: Existing single-layer configurations continue to work
- **Granular Control**: 10 permissions × 22 categories = precise access control
- **Clear Intent**: Separate "what operations are allowed" from "which specific tools"

### Filtering Modes

| Mode | Configuration | Use Case |
|------|--------------|----------|
| **No Filtering** | No args specified | Development, full trust |
| **Single-Layer** | Permissions only (2nd arg) | Simple, broad control |
| **Dual-Layer** | Permissions + Categories (2nd + 3rd args) | Production, precise control |

### Documentation Categories Reference

```bash
# All 23 available categories (comma-separated):
database_discovery,crud_operations,bulk_operations,custom_queries,
schema_management,utilities,transaction_management,stored_procedures,
views_management,triggers_management,functions_management,index_management,
constraint_management,table_maintenance,server_management,
performance_monitoring,cache_management,query_optimization,
backup_restore,import_export,data_migration,schema_migrations,
analysis,ai_enhancement
```

### Configuration Examples

#### Example 1: Single-Layer (Permissions Only) - Backward Compatible

Use only the 2nd argument for broad control:

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": [
        "/path/to/bin/mcp-mysql.js",
        "mysql://user:pass@localhost:3306/db",
        "list,read,utility"
      ]
    }
  }
}
```

**Result**: All tools within `list`, `read`, and `utility` permissions are enabled.

**Enabled tools**: `list_databases`, `list_tables`, `read_records`, `run_query`, `test_connection`, `export_table_to_csv`, etc.

#### Example 2: Dual-Layer (Permissions + Categories) - Production Read-Only

Use both 2nd argument (permissions) and 3rd argument (categories):

```json
{
  "mcpServers": {
    "mysql-prod": {
      "command": "node",
      "args": [
        "/path/to/bin/mcp-mysql.js",
        "mysql://readonly:pass@prod:3306/app_db",
        "list,read,utility",
        "database_discovery,performance_monitoring"
      ]
    }
  }
}
```

**Layer 1 (Permissions)**: Allows `list`, `read`, `utility` operations
**Layer 2 (Categories)**: Further restricts to `database_discovery` and `performance_monitoring` tools

**Enabled tools**: `list_databases`, `list_tables`, `read_table_schema`, `get_table_relationships`, `get_performance_metrics`, `get_slow_queries`, etc.

**Disabled tools**:
- `read_records` - Has `read` permission but category is `crud_operations` (not allowed)
- `test_connection` - Has `utility` permission but category is `utilities` (not in category list)
- `create_record` - No `create` permission (blocked by Layer 1)

#### Example 3: Development Environment - Single-Layer

Full access using permissions only:

```json
{
  "mcpServers": {
    "mysql-dev": {
      "command": "node",
      "args": [
        "/path/to/bin/mcp-mysql.js",
        "mysql://dev:pass@localhost:3306/dev_db",
        "list,read,create,update,delete,ddl,transaction,utility"
      ]
    }
  }
}
```

**Result**: All tools within specified permissions are enabled (no category filtering).

#### Example 4: DBA Tasks - Dual-Layer

Schema management and maintenance only:

```json
{
  "mcpServers": {
    "mysql-dba": {
      "command": "node",
      "args": [
        "/path/to/bin/mcp-mysql.js",
        "mysql://dba:pass@server:3306/app_db",
        "list,ddl,utility",
        "database_discovery,schema_management,table_maintenance,backup_restore,index_management"
      ]
    }
  }
}
```

**Enabled**: Schema changes, backups, maintenance - NO data modification.

#### Example 5: Application Backend - Dual-Layer

Data operations without schema changes:

```json
{
  "mcpServers": {
    "mysql-app": {
      "command": "node",
      "args": [
        "/path/to/bin/mcp-mysql.js",
        "mysql://app:pass@localhost:3306/app_db",
        "list,read,create,update,delete,transaction,utility",
        "crud_operations,bulk_operations,transaction_management,cache_management"
      ]
    }
  }
}
```

**Enabled**: Full data CRUD + bulk ops + transactions - NO schema changes (no `ddl` permission).

### Adaptive Permission Presets (ReadOnly/Analyst/DBA Lite)

Preset bundles provide safe starting points and **merge** with any explicit permissions/categories you pass (CLI args or env vars).

| Preset | Permissions | Categories | Intended Use |
|--------|-------------|------------|--------------|
| `readonly` | `list,read,utility` | `database_discovery,crud_operations,custom_queries,utilities,import_export,performance_monitoring,analysis` | Safe read-only access, exports, and diagnostics |
| `analyst` | `list,read,utility` | `database_discovery,crud_operations,custom_queries,utilities,import_export,performance_monitoring,analysis,query_optimization,cache_management,server_management` | Exploration with EXPLAIN, cache, and performance visibility |
| `dba-lite` | `list,read,utility,ddl,transaction,procedure` | `database_discovery,custom_queries,utilities,server_management,schema_management,table_maintenance,index_management,constraint_management,backup_restore,schema_migrations,performance_monitoring,views_management,triggers_management,functions_management,stored_procedures` | Admin-lite schema care, maintenance, and migrations |
| `dev` | ALL | ALL | Full access to all tools (Development environment) |
| `stage` | `list,read,create,update,delete,utility,transaction` | Most categories (except schema_management) | Data modification allowed, but destructive DDL (drop_table, truncate_table) is **explicitly denied** |
| `prod` | `list,read,utility` | `database_discovery,crud_operations,custom_queries,utilities,performance_monitoring,analysis` | Strict read-only. Data modification and DDL are **strictly denied** (even if permissions suggest otherwise) |

### Connection Profiles (Allow/Deny Lists)

The new mechanism introduces "Connection Profiles" which can enforce strict `allow` and `deny` lists for tools, providing security beyond standard permissions.

- **Explicit Deny**: Tools in the `deniedTools` list are blocked *regardless* of their permissions. E.g., `prod` profile denies `create_record` even if `create` permission is somehow granted.
- **Explicit Allow**: Tools in the `allowedTools` list are enabled even if their category is not listed (unless denied).

**Usage**

- CLI: `mcp-mysql mysql://user:pass@host:3306/db --preset readonly`
- CLI with overrides: `mcp-mysql mysql://... --preset analyst "list,read,utility" "performance_monitoring"`
- Env: `MCP_PRESET=analyst` (or `MCP_PERMISSION_PRESET=analyst`) and optionally extend with `MCP_PERMISSIONS` / `MCP_CATEGORIES`

If a preset name is not recognized and no overrides are provided, the server falls back to a safe read-only baseline instead of enabling everything.

### Permissions Reference (Layer 1)

| Permission | Operations Allowed | Example Tools |
|------------|-------------------|---------------|
| `list` | List/discover database objects | `list_databases`, `list_tables`, `list_views` |
| `read` | Read data from tables | `read_records`, `run_query` |
| `create` | Insert new records | `create_record`, `bulk_insert` |
| `update` | Update existing records | `update_record`, `bulk_update` |
| `delete` | Delete records | `delete_record`, `bulk_delete` |
| `execute` | Execute custom SQL | `execute_sql`, `run_query` |
| `ddl` | Schema changes | `create_table`, `alter_table`, `drop_table` |
| `utility` | Utility operations | `test_connection`, `analyze_table` |
| `transaction` | Transaction management | `begin_transaction`, `commit_transaction` |
| `procedure` | Stored procedures/functions | `create_stored_procedure`, `execute_function` |

### Categories Reference (Layer 2)

See the full list of 22 documentation categories in the [README.md](README.md#-documentation-categories-recommended).

### How Filtering Works

The system uses both arguments to determine access:

**Argument positions**:
- **2nd argument**: Permissions (Layer 1) - comma-separated legacy categories
- **3rd argument**: Categories (Layer 2, optional) - comma-separated documentation categories

**Decision logic**:
1. If no arguments: All 120 tools enabled
2. If only 2nd argument (permissions): Tools enabled if they match permission
3. If both arguments: Tools enabled if they match BOTH permission AND category

**Example**:
```bash
# Tool: bulk_insert
# Permission required: create
# Category required: bulk_operations

# Single-layer (permissions only)
args: ["mysql://...", "list,create,read"]
Result: ✅ Enabled (has 'create' permission)

# Dual-layer (permissions + categories)
args: ["mysql://...", "list,create,read", "database_discovery,crud_operations"]
Result: ✗ Disabled (has 'create' but category is 'bulk_operations', not in list)

# Dual-layer with correct category
args: ["mysql://...", "list,create,read", "bulk_operations,crud_operations"]
Result: ✅ Enabled (has both 'create' permission AND 'bulk_operations' category)
```

### Troubleshooting Filters

If a tool is not available, check the error message which tells you which layer blocked it:

**Layer 1 (Permission) error**:
```
Permission denied: This tool requires 'create' permission (Layer 1).
Your current permissions: list,read,utility.
Add 'create' to the permissions argument.
```

**Layer 2 (Category) error**:
```
Permission denied: This tool requires 'bulk_operations' category (Layer 2).
Your current categories: database_discovery,crud_operations.
Add 'bulk_operations' to the categories argument.
```

---

## 🔧 Complete Tools Reference

This section provides a comprehensive reference of all 120 available tools organized by category.

### Database Discovery

| Tool | Description |
|------|-------------|
| `list_databases` | Lists all databases on the MySQL server |
| `list_tables` | Lists all tables in the current/specified database |
| `read_table_schema` | Gets detailed schema (columns, types, keys, indexes) |
| `get_table_relationships` | Discovers foreign key relationships |

### Data Operations - CRUD

| Tool | Description |
|------|-------------|
| `create_record` | Insert new records with automatic SQL generation |
| `read_records` | Query records with filtering, pagination, and sorting |
| `update_record` | Update records based on conditions |
| `delete_record` | Delete records with safety checks |

### Bulk Operations

| Tool | Description | Performance |
|------|-------------|-------------|
| `bulk_insert` | Insert multiple records in batches | Up to 10,000 records/batch |
| `bulk_update` | Update multiple records with different conditions | Up to 1,000 ops/batch |
| `bulk_delete` | Delete multiple record sets | Up to 1,000 ops/batch |

### Custom Queries

| Tool | Description |
|------|-------------|
| `run_query` | Execute read-only SELECT queries |
| `execute_sql` | Execute write operations (INSERT, UPDATE, DELETE, or DDL) |

### Schema Management - DDL

| Tool | Description | Requires |
|------|-------------|----------|
| `create_table` | Create new tables with columns and indexes | `ddl` |
| `alter_table` | Modify table structure | `ddl` |
| `drop_table` | Delete tables | `ddl` |
| `execute_ddl` | Execute raw DDL SQL | `ddl` |

### Utilities

| Tool | Description |
|------|-------------|
| `test_connection` | Test database connectivity and measure latency |
| `describe_connection` | Get current connection information |
| `read_changelog` | Read the changelog to see new features/changes |
| `export_table_to_csv` | Export table data to CSV format |
| `export_query_to_csv` | Export query results to CSV format |

### Transaction Management

| Tool | Description |
|------|-------------|
| `begin_transaction` | Start a new database transaction |
| `commit_transaction` | Commit the current transaction |
| `rollback_transaction` | Rollback the current transaction |
| `get_transaction_status` | Check if a transaction is active |
| `execute_in_transaction` | Execute SQL within a transaction context |

### Stored Procedures

| Tool | Description | Requires |
|------|-------------|----------|
| `list_stored_procedures` | List all stored procedures | `procedure` |
| `create_stored_procedure` | Create new stored procedures | `procedure` |
| `get_stored_procedure_info` | Get procedure details | `procedure` |
| `execute_stored_procedure` | Execute with IN/OUT/INOUT params | `procedure` |
| `drop_stored_procedure` | Delete stored procedures | `procedure` |
| `show_create_procedure` | Show CREATE statement | `procedure` |

### Views Management

| Tool | Description | Requires |
|------|-------------|----------|
| `list_views` | List all views in the database | `list` |
| `get_view_info` | Get detailed view information | `list` |
| `create_view` | Create a new view | `ddl` |
| `alter_view` | Alter an existing view | `ddl` |
| `drop_view` | Drop a view | `ddl` |
| `show_create_view` | Show CREATE statement | `list` |

### Triggers Management

| Tool | Description | Requires |
|------|-------------|----------|
| `list_triggers` | List all triggers | `list` |
| `get_trigger_info` | Get trigger details | `list` |
| `create_trigger` | Create a new trigger | `ddl` |
| `drop_trigger` | Drop a trigger | `ddl` |
| `show_create_trigger` | Show CREATE statement | `list` |

### Functions Management

| Tool | Description | Requires |
|------|-------------|----------|
| `list_functions` | List all user-defined functions | `list` |
| `get_function_info` | Get function details | `list` |
| `create_function` | Create a new function | `ddl` |
| `drop_function` | Drop a function | `ddl` |
| `show_create_function` | Show CREATE statement | `list` |
| `execute_function` | Execute and return result | `read` |

### Index Management

| Tool | Description | Requires |
|------|-------------|----------|
| `list_indexes` | List all indexes for a table | `list` |
| `get_index_info` | Get index details | `list` |
| `create_index` | Create index (BTREE, HASH, FULLTEXT, SPATIAL) | `ddl` |
| `drop_index` | Drop an index | `ddl` |
| `analyze_index` | Analyze index statistics | `utility` |

### Constraint Management

| Tool | Description | Requires |
|------|-------------|----------|
| `list_foreign_keys` | List all foreign keys | `list` |
| `list_constraints` | List all constraints (PK, FK, UNIQUE, CHECK) | `list` |
| `add_foreign_key` | Add a foreign key constraint | `ddl` |
| `drop_foreign_key` | Drop a foreign key | `ddl` |
| `add_unique_constraint` | Add a unique constraint | `ddl` |
| `drop_constraint` | Drop UNIQUE or CHECK constraint | `ddl` |
| `add_check_constraint` | Add CHECK constraint (MySQL 8.0.16+) | `ddl` |

### Table Maintenance

| Tool | Description | Requires |
|------|-------------|----------|
| `analyze_table` | Update index statistics | `utility` |
| `optimize_table` | Reclaim space and defragment | `utility` |
| `check_table` | Check table for errors | `utility` |
| `repair_table` | Repair corrupted table | `utility` |
| `truncate_table` | Remove all rows quickly | `ddl` |
| `get_table_status` | Get table status and statistics | `list` |
| `flush_table` | Close and reopen table(s) | `utility` |
| `get_table_size` | Get size information | `list` |

### Process & Server Management

| Tool | Description | Requires |
|------|-------------|----------|
| `show_process_list` | Show running MySQL processes | `utility` |
| `kill_process` | Kill a MySQL process/connection | `utility` |
| `show_status` | Show server status variables | `utility` |
| `show_variables` | Show server configuration | `utility` |
| `explain_query` | Show query execution plan | `utility` |
| `show_engine_status` | Show storage engine status | `utility` |
| `get_server_info` | Get comprehensive server info | `utility` |
| `show_binary_logs` | Show binary log files | `utility` |
| `show_replication_status` | Show replication status | `utility` |

### Performance Monitoring

| Tool | Description | Requires |
|------|-------------|----------|
| `get_performance_metrics` | Get comprehensive performance metrics | `utility` |
| `get_top_queries_by_time` | Find slowest queries by execution time | `utility` |
| `get_top_queries_by_count` | Find most frequently executed queries | `utility` |
| `get_slow_queries` | Identify queries exceeding time threshold | `utility` |
| `get_table_io_stats` | Monitor table I/O operations | `utility` |
| `get_index_usage_stats` | Track index usage statistics | `utility` |
| `get_unused_indexes` | Identify unused indexes | `utility` |
| `get_connection_pool_stats` | Monitor connection pool health | `utility` |
| `get_database_health_check` | Comprehensive health assessment | `utility` |
| `reset_performance_stats` | Reset performance schema statistics | `utility` |

### Cache Management

| Tool | Description |
|------|-------------|
| `get_cache_stats` | Get query cache statistics |
| `get_cache_config` | Get current cache configuration |
| `configure_cache` | Configure cache settings |
| `clear_cache` | Clear all cached results |
| `invalidate_table_cache` | Invalidate cache for specific table |

### Query Optimization

| Tool | Description |
|------|-------------|
| `analyze_query` | Analyze query and get optimization suggestions |
| `get_optimization_hints` | Get optimizer hints for SPEED, MEMORY, or STABILITY |

### Database Backup & Restore

| Tool | Description | Requires |
|------|-------------|----------|
| `backup_table` | Backup single table to SQL dump | `utility` |
| `backup_database` | Backup entire database to SQL dump | `utility` |
| `restore_from_sql` | Restore from SQL dump content | `ddl` |
| `get_create_table_statement` | Get CREATE TABLE statement | `list` |
| `get_database_schema` | Get complete database schema | `list` |

### Data Import/Export

| Tool | Description | Requires |
|------|-------------|----------|
| `export_table_to_json` | Export table to JSON format | `utility` |
| `export_query_to_json` | Export query results to JSON | `utility` |
| `export_table_to_sql` | Export to SQL INSERT statements | `utility` |
| `import_from_csv` | Import from CSV string | `create` |
| `import_from_json` | Import from JSON array | `create` |

### Data Migration

| Tool | Description | Requires |
|------|-------------|----------|
| `copy_table_data` | Copy data with optional column mapping | `create` |
| `move_table_data` | Move data (copy + delete source) | `create`, `delete` |
| `clone_table` | Clone table structure with optional data | `ddl` |
| `compare_table_structure` | Compare two table structures | `list` |
| `sync_table_data` | Sync data between tables | `update` |

### Schema Versioning & Migrations

| Tool | Description | Requires |
|------|-------------|----------|
| `init_migrations_table` | Initialize migrations tracking table | `ddl` |
| `create_migration` | Create migration with up/down SQL | `ddl` |
| `apply_migrations` | Apply pending migrations (dry-run support) | `ddl` |
| `rollback_migration` | Rollback by steps or version | `ddl` |
| `get_migration_status` | Get migration history and status | `list` |
| `get_schema_version` | Get current schema version | `list` |
| `validate_migrations` | Validate migrations for issues | `list` |
| `reset_failed_migration` | Reset failed migration to pending | `ddl` |
| `generate_migration_from_diff` | Generate migration from table diff | `ddl` |

### AI Context & Analysis Tools

| Tool | Description | Requires |
|------|-------------|----------|
| `get_database_summary` | High-level overview (tables, columns, rows) for AI context | `list` |
| `get_schema_erd` | Generate Mermaid.js ER diagram for visualization | `list` |
| `get_schema_rag_context` | Condensed schema snapshot (tables, PK/FK, row estimates) for RAG prompts | `list` |
| `get_column_statistics` | Profile data (min, max, nulls, distinct) for analysis | `read` |

#### Schema-Aware RAG Context Pack
- Purpose-built for embeddings: returns a `context_text` block plus structured `tables` and `relationships` so agents can self-orient without pulling a full ERD.
- Tunable size: `max_tables` (default 50, max 200) and `max_columns` (default 12) to control output length; set `include_relationships` to `false` to omit FK lines.
- Safety: respects the connected database only—cannot introspect other schemas—and notes when tables/columns are truncated.
- Output includes per-table PKs, FK targets, nullable flags, and approximate row counts from `INFORMATION_SCHEMA.TABLES` (InnoDB estimates).

#### Agent-Facing Changelog Feed
- **`read_changelog`**: Allows AI agents to read the project's CHANGELOG.md directly.
- **Purpose**: Enables the agent to understand new features, changes, and deprecations in the version it is running.
- **Usage**: Call `read_changelog()` to get the latest changes, or `read_changelog(version='1.15.0')` for specific version details.

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

## 🔄 Workflow Macros

Workflow Macros are composite tools designed to execute complex, multi-step operations safely and efficiently. They encapsulate best practices and security policies (like data masking) into single, atomic tool calls.

### Available Macros

| Tool | Description |
|------|-------------|
| `safe_export_table` | Exports table data to CSV with mandated data masking (redaction/hashing) |

### safe_export_table

Exports table data to CSV format *with enforced data masking*. This is safer than standard export tools because it ensures sensitive data is masked before leaving the database layer, regardless of the global masking configuration.

**Parameters:**
- `table_name` (required): Name of the table to export.
- `masking_profile` (optional): "strict" (default), "partial", or "soft".
- `limit` (optional): Maximum rows to export (default 1000, max 10000).
- `include_headers` (optional): Whether to include CSV headers (default true).

**Example:**
*User prompt: "Safely export the users table to a CSV file"*

```json
{
  "tool": "safe_export_table",
  "arguments": {
    "table_name": "users",
    "masking_profile": "strict"
  }
}
```

**Result:**
CSV content where:
- Emails are masked (e.g., `j***@domain.com`)
- Passwords/secrets are `[REDACTED]`
- Phone numbers are partially hidden

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

## 🔄 Data Migration Tools

The MySQL MCP Server provides powerful data migration utilities for copying, moving, and synchronizing data between tables.

### Data Migration Tools Overview

| Tool | Description | Permission |
|------|-------------|------------|
| `copy_table_data` | Copy data from one table to another | `create` |
| `move_table_data` | Move data (copy + delete from source) | `create`, `delete` |
| `clone_table` | Clone table structure with optional data | `ddl` |
| `compare_table_structure` | Compare structure of two tables | `list` |
| `sync_table_data` | Synchronize data between tables | `update` |

### Copy Table Data

Copy data from one table to another with optional column mapping and filtering.

```json
{
  "tool": "copy_table_data",
  "arguments": {
    "source_table": "users",
    "target_table": "users_backup",
    "batch_size": 1000
  }
}
```

**With Column Mapping:**
```json
{
  "tool": "copy_table_data",
  "arguments": {
    "source_table": "old_customers",
    "target_table": "customers",
    "column_mapping": {
      "customer_name": "name",
      "customer_email": "email",
      "customer_phone": "phone"
    }
  }
}
```

**With Filters:**
```json
{
  "tool": "copy_table_data",
  "arguments": {
    "source_table": "orders",
    "target_table": "archived_orders",
    "filters": [
      { "field": "status", "operator": "eq", "value": "completed" },
      { "field": "created_at", "operator": "lt", "value": "2024-01-01" }
    ]
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": "Data copied successfully",
    "rows_copied": 5000,
    "source_table": "orders",
    "target_table": "archived_orders"
  }
}
```

### Move Table Data

Move data from one table to another (copies data then deletes from source).

```json
{
  "tool": "move_table_data",
  "arguments": {
    "source_table": "active_sessions",
    "target_table": "expired_sessions",
    "filters": [
      { "field": "expires_at", "operator": "lt", "value": "2024-01-01" }
    ]
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": "Data moved successfully",
    "rows_moved": 1500,
    "source_table": "active_sessions",
    "target_table": "expired_sessions"
  }
}
```

### Clone Table

Clone a table structure with or without data.

```json
{
  "tool": "clone_table",
  "arguments": {
    "source_table": "products",
    "new_table_name": "products_staging",
    "include_data": false,
    "include_indexes": true
  }
}
```

**Clone with Data:**
```json
{
  "tool": "clone_table",
  "arguments": {
    "source_table": "users",
    "new_table_name": "users_test",
    "include_data": true
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": "Table cloned successfully",
    "source_table": "products",
    "new_table": "products_staging",
    "include_data": false,
    "include_indexes": true
  }
}
```

### Compare Table Structure

Compare the structure of two tables to identify differences.

```json
{
  "tool": "compare_table_structure",
  "arguments": {
    "table1": "users",
    "table2": "users_backup"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "table1": "users",
    "table2": "users_backup",
    "identical": false,
    "differences": {
      "columns_only_in_table1": ["last_login", "avatar_url"],
      "columns_only_in_table2": [],
      "column_type_differences": [
        {
          "column": "email",
          "table1_type": "VARCHAR(255)",
          "table2_type": "VARCHAR(100)"
        }
      ],
      "index_differences": {
        "only_in_table1": ["idx_last_login"],
        "only_in_table2": []
      }
    }
  }
}
```

### Sync Table Data

Synchronize data between two tables based on a key column. Supports three modes:
- **insert_only**: Only insert new records that don't exist in target
- **update_only**: Only update existing records in target
- **upsert**: Both insert new and update existing records (default)

```json
{
  "tool": "sync_table_data",
  "arguments": {
    "source_table": "products_master",
    "target_table": "products_replica",
    "key_column": "product_id",
    "sync_mode": "upsert"
  }
}
```

**Sync Specific Columns:**
```json
{
  "tool": "sync_table_data",
  "arguments": {
    "source_table": "inventory_main",
    "target_table": "inventory_cache",
    "key_column": "sku",
    "columns_to_sync": ["quantity", "price", "updated_at"],
    "sync_mode": "update_only"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": "Sync completed successfully",
    "source_table": "products_master",
    "target_table": "products_replica",
    "rows_inserted": 150,
    "rows_updated": 3200,
    "sync_mode": "upsert"
  }
}
```

### Migration Best Practices

1. **Backup before migration** - Always backup target tables before large migrations
2. **Use filters** - Migrate data in chunks using filters to avoid timeouts
3. **Test with small batches** - Test migration logic with small datasets first
4. **Verify data integrity** - Use `compare_table_structure` before migration
5. **Monitor performance** - Adjust `batch_size` based on table size and server capacity

### Common Migration Patterns

**Pattern 1: Archive Old Data**
```json
// Move old orders to archive table
{
  "tool": "move_table_data",
  "arguments": {
    "source_table": "orders",
    "target_table": "orders_archive",
    "filters": [
      { "field": "created_at", "operator": "lt", "value": "2023-01-01" }
    ]
  }
}
```

**Pattern 2: Create Staging Table**
```json
// Clone structure for staging
{
  "tool": "clone_table",
  "arguments": {
    "source_table": "products",
    "new_table_name": "products_staging",
    "include_data": false
  }
}
```

**Pattern 3: Replicate Data Across Tables**
```json
// Keep replica in sync with master
{
  "tool": "sync_table_data",
  "arguments": {
    "source_table": "users_master",
    "target_table": "users_read_replica",
    "key_column": "id",
    "sync_mode": "upsert"
  }
}
```

---

## 🔄 Schema Versioning and Migrations

The MySQL MCP Server provides comprehensive schema versioning and migration tools for managing database schema changes in a controlled, trackable manner. This feature enables version control for your database schema with support for applying and rolling back migrations.

### Schema Versioning Tools Overview

| Tool | Description | Permission |
|------|-------------|------------|
| `init_migrations_table` | Initialize the migrations tracking table | ddl |
| `create_migration` | Create a new migration entry | ddl |
| `apply_migrations` | Apply pending migrations | ddl |
| `rollback_migration` | Rollback applied migrations | ddl |
| `get_migration_status` | Get migration history and status | list |
| `get_schema_version` | Get current schema version | list |
| `validate_migrations` | Validate migrations for issues | list |
| `reset_failed_migration` | Reset a failed migration to pending | ddl |
| `generate_migration_from_diff` | Generate migration from table comparison | ddl |

### ⚠️ Enable Schema Versioning

Schema versioning operations require `ddl` permission:

```json
"args": [
  "--mysql-host", "localhost",
  "--mysql-user", "root",
  "--mysql-password", "password",
  "--mysql-database", "mydb",
  "--permissions", "list,read,create,update,delete,ddl"
]
```

### Initialize Migrations Table

Before using migrations, initialize the tracking table:

```json
{
  "tool": "init_migrations_table",
  "arguments": {}
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": "Migrations table '_schema_migrations' initialized successfully",
    "table_name": "_schema_migrations"
  }
}
```

### Creating Migrations

Create a migration with up and down SQL:

```json
{
  "tool": "create_migration",
  "arguments": {
    "name": "add_users_table",
    "description": "Create the users table with basic fields",
    "up_sql": "CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, name VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);",
    "down_sql": "DROP TABLE IF EXISTS users;"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": "Migration 'add_users_table' created successfully",
    "version": "20240115120000",
    "name": "add_users_table",
    "checksum": "a1b2c3d4",
    "status": "pending"
  }
}
```

#### Multi-Statement Migrations

Migrations can contain multiple SQL statements separated by semicolons:

```json
{
  "tool": "create_migration",
  "arguments": {
    "name": "add_orders_and_items",
    "up_sql": "CREATE TABLE orders (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, total DECIMAL(10,2), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); CREATE TABLE order_items (id INT AUTO_INCREMENT PRIMARY KEY, order_id INT, product_id INT, quantity INT, price DECIMAL(10,2)); ALTER TABLE order_items ADD CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id);",
    "down_sql": "DROP TABLE IF EXISTS order_items; DROP TABLE IF EXISTS orders;"
  }
}
```

### Applying Migrations

Apply all pending migrations:

```json
{
  "tool": "apply_migrations",
  "arguments": {}
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": "Successfully applied 3 migration(s)",
    "applied_count": 3,
    "failed_count": 0,
    "applied_migrations": [
      {"version": "20240115120000", "name": "add_users_table", "execution_time_ms": 45},
      {"version": "20240115130000", "name": "add_orders_table", "execution_time_ms": 32},
      {"version": "20240115140000", "name": "add_products_table", "execution_time_ms": 28}
    ]
  }
}
```

#### Apply to Specific Version

```json
{
  "tool": "apply_migrations",
  "arguments": {
    "target_version": "20240115130000"
  }
}
```

#### Dry Run Mode

Preview migrations without executing:

```json
{
  "tool": "apply_migrations",
  "arguments": {
    "dry_run": true
  }
}
```

### Rolling Back Migrations

Rollback the last migration:

```json
{
  "tool": "rollback_migration",
  "arguments": {
    "steps": 1
  }
}
```

Rollback multiple migrations:

```json
{
  "tool": "rollback_migration",
  "arguments": {
    "steps": 3
  }
}
```

Rollback to a specific version (exclusive):

```json
{
  "tool": "rollback_migration",
  "arguments": {
    "target_version": "20240115120000"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": "Successfully rolled back 2 migration(s)",
    "rolled_back_count": 2,
    "failed_count": 0,
    "rolled_back_migrations": [
      {"version": "20240115140000", "name": "add_products_table", "execution_time_ms": 15},
      {"version": "20240115130000", "name": "add_orders_table", "execution_time_ms": 12}
    ]
  }
}
```

### Getting Schema Version

Check the current schema version:

```json
{
  "tool": "get_schema_version",
  "arguments": {}
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "current_version": "20240115140000",
    "current_migration_name": "add_products_table",
    "applied_at": "2024-01-15T14:30:00.000Z",
    "pending_migrations": 2,
    "migrations_table_exists": true
  }
}
```

### Getting Migration Status

View migration history with status:

```json
{
  "tool": "get_migration_status",
  "arguments": {
    "limit": 10
  }
}
```

Filter by status:

```json
{
  "tool": "get_migration_status",
  "arguments": {
    "status": "failed"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "current_version": "20240115140000",
    "summary": {
      "total": 5,
      "pending": 1,
      "applied": 3,
      "failed": 1,
      "rolled_back": 0
    },
    "migrations": [
      {
        "id": 5,
        "version": "20240115150000",
        "name": "add_analytics_table",
        "status": "pending",
        "applied_at": null,
        "execution_time_ms": null
      },
      {
        "id": 4,
        "version": "20240115140000",
        "name": "add_products_table",
        "status": "applied",
        "applied_at": "2024-01-15T14:30:00.000Z",
        "execution_time_ms": 28
      }
    ]
  }
}
```

### Validating Migrations

Check migrations for potential issues:

```json
{
  "tool": "validate_migrations",
  "arguments": {}
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "valid": false,
    "total_migrations": 5,
    "issues_count": 1,
    "warnings_count": 2,
    "issues": [
      {
        "type": "checksum_mismatch",
        "version": "20240115120000",
        "name": "add_users_table",
        "message": "Migration 'add_users_table' checksum mismatch - migration may have been modified after being applied"
      }
    ],
    "warnings": [
      {
        "type": "missing_down_sql",
        "version": "20240115150000",
        "name": "add_analytics_table",
        "message": "Migration 'add_analytics_table' has no down_sql - rollback will not be possible"
      },
      {
        "type": "blocked_migrations",
        "message": "1 pending migration(s) are blocked by failed migration 'add_audit_table'"
      }
    ]
  }
}
```

### Resetting Failed Migrations

Reset a failed migration to try again:

```json
{
  "tool": "reset_failed_migration",
  "arguments": {
    "version": "20240115145000"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": "Migration 'add_audit_table' (20240115145000) has been reset to pending status",
    "version": "20240115145000",
    "name": "add_audit_table",
    "previous_status": "failed",
    "new_status": "pending"
  }
}
```

### Generating Migrations from Table Differences

Automatically generate a migration by comparing two table structures:

```json
{
  "tool": "generate_migration_from_diff",
  "arguments": {
    "table1": "users_v2",
    "table2": "users",
    "migration_name": "update_users_to_v2"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": "Migration 'update_users_to_v2' generated with 3 change(s)",
    "version": "20240115160000",
    "changes_count": 3,
    "up_sql": "ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(20) NULL;\nALTER TABLE `users` ADD COLUMN `avatar_url` VARCHAR(500) NULL;\nALTER TABLE `users` MODIFY COLUMN `name` VARCHAR(200) NOT NULL;",
    "down_sql": "ALTER TABLE `users` DROP COLUMN `phone`;\nALTER TABLE `users` DROP COLUMN `avatar_url`;\nALTER TABLE `users` MODIFY COLUMN `name` VARCHAR(100) NULL;",
    "source_table": "users_v2",
    "target_table": "users"
  }
}
```

### Migration Best Practices

1. **Always include down_sql**: Enable rollback capability for all migrations
2. **Test migrations first**: Use `dry_run: true` to preview changes
3. **Validate before applying**: Run `validate_migrations` to check for issues
4. **Use descriptive names**: Make migration names clear and meaningful
5. **Keep migrations small**: One logical change per migration
6. **Version control migrations**: Store migration SQL in your VCS
7. **Never modify applied migrations**: Create new migrations for changes
8. **Backup before migrating**: Always backup production databases first

### Common Migration Patterns

#### Adding a Column

```json
{
  "tool": "create_migration",
  "arguments": {
    "name": "add_user_phone",
    "up_sql": "ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL AFTER email;",
    "down_sql": "ALTER TABLE users DROP COLUMN phone;"
  }
}
```

#### Adding an Index

```json
{
  "tool": "create_migration",
  "arguments": {
    "name": "add_email_index",
    "up_sql": "CREATE INDEX idx_users_email ON users(email);",
    "down_sql": "DROP INDEX idx_users_email ON users;"
  }
}
```

#### Renaming a Column

```json
{
  "tool": "create_migration",
  "arguments": {
    "name": "rename_user_name_to_full_name",
    "up_sql": "ALTER TABLE users CHANGE COLUMN name full_name VARCHAR(100);",
    "down_sql": "ALTER TABLE users CHANGE COLUMN full_name name VARCHAR(100);"
  }
}
```

#### Adding Foreign Key

```json
{
  "tool": "create_migration",
  "arguments": {
    "name": "add_orders_user_fk",
    "up_sql": "ALTER TABLE orders ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;",
    "down_sql": "ALTER TABLE orders DROP FOREIGN KEY fk_orders_user;"
  }
}
```

### Migration Table Schema

The `_schema_migrations` table stores all migration information:

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Auto-increment primary key |
| version | VARCHAR(14) | Migration version (timestamp-based) |
| name | VARCHAR(255) | Migration name |
| description | TEXT | Optional description |
| up_sql | LONGTEXT | SQL to apply migration |
| down_sql | LONGTEXT | SQL to rollback migration |
| checksum | VARCHAR(64) | Checksum of up_sql for integrity |
| applied_at | TIMESTAMP | When migration was applied |
| applied_by | VARCHAR(255) | User who applied migration |
| execution_time_ms | INT | Execution time in milliseconds |
| status | ENUM | pending, applied, failed, rolled_back |
| error_message | TEXT | Error message if failed |
| created_at | TIMESTAMP | When migration was created |

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

## 📈 Performance Monitoring

Monitor database performance, identify bottlenecks, and optimize query execution.

### Performance Monitoring Tools Overview

- **`get_performance_metrics`** - Get comprehensive performance metrics
- **`get_top_queries_by_time`** - Find slowest queries by execution time
- **`get_top_queries_by_count`** - Find most frequently executed queries
- **`get_slow_queries`** - Identify queries exceeding time threshold
- **`get_table_io_stats`** - Monitor table I/O operations
- **`get_index_usage_stats`** - Track index usage statistics
- **`get_unused_indexes`** - Identify unused indexes
- **`get_connection_pool_stats`** - Monitor connection pool health
- **`get_database_health_check`** - Comprehensive health assessment
- **`reset_performance_stats`** - Reset performance schema statistics

**Requirements:**
- MySQL Performance Schema must be enabled
- Tools use standard `utility` permission
- No special permissions required

### Get Performance Metrics

Get comprehensive performance metrics including query performance, connections, buffer pool, and InnoDB statistics.

**User:** *"Show me the database performance metrics"*

```json
{
  "tool": "get_performance_metrics",
  "arguments": {}
}
```

**Returns:**
```json
{
  "status": "success",
  "data": {
    "query_performance": {
      "total_execution_time_sec": 123.45,
      "total_lock_time_sec": 2.34,
      "total_rows_examined": 1000000,
      "total_rows_sent": 50000,
      "full_table_scans": 10,
      "queries_without_indexes": 5
    },
    "connections": {
      "threads_connected": 10,
      "threads_running": 2,
      "max_used_connections": 50,
      "connections": 1000,
      "aborted_connects": 5
    },
    "innodb": {
      "buffer_pool_hit_ratio": "99.95%",
      "innodb_rows_read": 500000,
      "innodb_rows_inserted": 10000
    },
    "slow_queries": {
      "slow_queries": 100,
      "questions": 100000,
      "slow_query_percentage": "0.1000%"
    }
  }
}
```

### Get Top Queries by Execution Time

Identify the slowest queries consuming the most time.

**User:** *"Show me the top 5 slowest queries"*

```json
{
  "tool": "get_top_queries_by_time",
  "arguments": {
    "limit": 5
  }
}
```

**Returns:**
```json
{
  "status": "success",
  "data": [
    {
      "query_pattern": "SELECT * FROM orders WHERE user_id = ?",
      "execution_count": 1000,
      "avg_execution_time_sec": 2.5,
      "max_execution_time_sec": 10.2,
      "total_execution_time_sec": 2500.0,
      "rows_examined": 50000,
      "rows_sent": 1000
    }
  ]
}
```

### Get Top Queries by Execution Count

Find the most frequently executed queries.

**User:** *"What queries are executed most often?"*

```json
{
  "tool": "get_top_queries_by_count",
  "arguments": {
    "limit": 10
  }
}
```

### Get Slow Queries

Find queries exceeding a specific execution time threshold.

**User:** *"Show me queries taking longer than 2 seconds"*

```json
{
  "tool": "get_slow_queries",
  "arguments": {
    "limit": 20,
    "threshold_seconds": 2
  }
}
```

**Response includes:**
- Query pattern (with `?` for parameters)
- Execution count and timing statistics
- Lock time and rows examined
- Number of times executed without indexes

### Get Table I/O Statistics

Monitor read/write operations on tables to identify hot tables.

**User:** *"Show me table I/O statistics"*

```json
{
  "tool": "get_table_io_stats",
  "arguments": {
    "limit": 20,
    "table_schema": "myapp"
  }
}
```

**Returns:**
```json
{
  "status": "success",
  "data": [
    {
      "table_schema": "myapp",
      "table_name": "orders",
      "read_operations": 10000,
      "write_operations": 5000,
      "fetch_operations": 8000,
      "insert_operations": 2000,
      "update_operations": 2500,
      "delete_operations": 500,
      "total_read_time_sec": 45.2,
      "total_write_time_sec": 23.1
    }
  ]
}
```

### Get Index Usage Statistics

Track how often indexes are being used.

**User:** *"Show me index usage statistics"*

```json
{
  "tool": "get_index_usage_stats",
  "arguments": {
    "limit": 20,
    "table_schema": "myapp"
  }
}
```

**Use cases:**
- Identify most-used indexes
- Verify new indexes are being utilized
- Monitor index efficiency

### Get Unused Indexes

Identify indexes that are never used - candidates for removal.

**User:** *"Find indexes that are not being used"*

```json
{
  "tool": "get_unused_indexes",
  "arguments": {
    "table_schema": "myapp"
  }
}
```

**Returns:**
```json
{
  "status": "success",
  "data": [
    {
      "table_schema": "myapp",
      "table_name": "users",
      "index_name": "idx_old_field",
      "column_name": "old_field",
      "is_non_unique": 1
    }
  ]
}
```

**Benefits:**
- Unused indexes slow down INSERT/UPDATE/DELETE operations
- Removing unused indexes saves storage space
- Improves write performance

### Get Connection Pool Statistics

Monitor connection pool health and usage.

**User:** *"Check connection pool statistics"*

```json
{
  "tool": "get_connection_pool_stats",
  "arguments": {}
}
```

**Returns:**
```json
{
  "status": "success",
  "data": {
    "current_status": {
      "threads_connected": 25,
      "threads_running": 5,
      "max_used_connections": 100,
      "connections": 50000,
      "aborted_connects": 10
    },
    "configuration": {
      "max_connections": 200,
      "thread_cache_size": 8,
      "wait_timeout": 28800
    },
    "health_indicators": {
      "connection_usage_percentage": "12.50%",
      "max_usage_percentage": "50.00%",
      "available_connections": 175,
      "aborted_connection_percentage": "0.0200%",
      "thread_cache_hit_rate": "95.50%"
    }
  }
}
```

### Get Database Health Check

Perform a comprehensive health assessment.

**User:** *"Perform a database health check"*

```json
{
  "tool": "get_database_health_check",
  "arguments": {}
}
```

**Returns:**
```json
{
  "status": "success",
  "data": {
    "overall_status": "healthy",
    "checks": [
      {
        "name": "Connection Usage",
        "status": "healthy",
        "current": 25,
        "max": 200,
        "usage_percentage": "12.50%"
      },
      {
        "name": "Buffer Pool Hit Ratio",
        "status": "healthy",
        "hit_ratio": "99.85%"
      },
      {
        "name": "Aborted Connections",
        "status": "healthy",
        "aborted": 10,
        "total": 50000,
        "abort_rate": "0.0200%"
      },
      {
        "name": "Slow Queries",
        "status": "healthy",
        "slow_queries": 50,
        "total_queries": 100000,
        "slow_query_rate": "0.0500%"
      }
    ],
    "warnings": [],
    "errors": []
  }
}
```

**Status Levels:**
- `healthy` - All metrics within acceptable ranges
- `warning` - Some metrics need attention
- `critical` - Immediate action required

**Health Checks Include:**
- Connection usage (warning >80%, critical >90%)
- Buffer pool hit ratio (warning <95%, critical <85%)
- Aborted connection rate (warning >1%, critical >5%)
- Slow query percentage (warning >1%, critical >5%)

### Reset Performance Statistics

Reset Performance Schema statistics to start fresh monitoring.

**User:** *"Reset performance statistics"*

```json
{
  "tool": "reset_performance_stats",
  "arguments": {}
}
```

**What gets reset:**
- Query digest statistics
- Table I/O wait statistics
- Index usage statistics
- All performance_schema summary tables

**Use cases:**
- Start monitoring from a clean slate
- After major application changes
- For specific performance testing periods

### Performance Monitoring Best Practices

**Regular Monitoring:**
```json
// Daily health check
{ "tool": "get_database_health_check" }

// Weekly deep dive
{ "tool": "get_performance_metrics" }
{ "tool": "get_top_queries_by_time", "arguments": { "limit": 20 } }
{ "tool": "get_unused_indexes" }
```

**Query Optimization Workflow:**
1. Identify slow queries with `get_slow_queries`
2. Analyze execution plan with `explain_query`
3. Check index usage with `get_index_usage_stats`
4. Find unused indexes with `get_unused_indexes`
5. Monitor improvements with `get_performance_metrics`

**Connection Pool Monitoring:**
```json
// Check connection health
{ "tool": "get_connection_pool_stats" }

// If issues found, check active processes
{ "tool": "show_process_list", "arguments": { "full": true } }
```

**Table I/O Analysis:**
```json
// Find hot tables
{ "tool": "get_table_io_stats", "arguments": { "limit": 10 } }

// Check specific table indexes
{ "tool": "get_index_usage_stats", "arguments": { "table_schema": "myapp" } }
```

### Common Performance Patterns

#### Finding Query Bottlenecks
```json
// Step 1: Get top slow queries
{
  "tool": "get_top_queries_by_time",
  "arguments": { "limit": 10 }
}

// Step 2: Check if indexes are being used
{
  "tool": "get_slow_queries",
  "arguments": {
    "threshold_seconds": 1,
    "limit": 20
  }
}

// Step 3: Review query execution plans
{
  "tool": "explain_query",
  "arguments": {
    "query": "SELECT * FROM orders WHERE user_id = 5",
    "format": "JSON"
  }
}
```

#### Optimizing Indexes
```json
// Step 1: Find unused indexes
{
  "tool": "get_unused_indexes",
  "arguments": { "table_schema": "myapp" }
}

// Step 2: Check current index usage
{
  "tool": "get_index_usage_stats",
  "arguments": { "table_schema": "myapp", "limit": 50 }
}

// Step 3: Drop unused indexes (requires DDL permission)
{
  "tool": "drop_index",
  "arguments": {
    "table_name": "users",
    "index_name": "idx_unused"
  }
}
```

#### Monitoring After Changes
```json
// Reset stats before deployment
{ "tool": "reset_performance_stats" }

// After deployment, check metrics
{ "tool": "get_performance_metrics" }
{ "tool": "get_database_health_check" }

// Monitor specific queries
{
  "tool": "get_top_queries_by_count",
  "arguments": { "limit": 10 }
}
```

---

## 🤖 AI Enhancement Tools

The AI Enhancement tools provide intelligent, AI-powered features for database exploration, query generation, and documentation. These tools are part of **Phase 1: Core AI Enhancement**.

### Tool Overview

| Tool | Description | Category |
|------|-------------|----------|
| `build_query_from_intent` | Converts natural language to optimized SQL with context-aware generation | `ai_enhancement` |
| `suggest_query_improvements` | Analyzes SQL queries and suggests optimizations | `ai_enhancement` |
| `smart_search` | Finds relevant tables, columns, and patterns using semantic search | `ai_enhancement` |
| `find_similar_columns` | Discovers columns with similar names or data across tables | `ai_enhancement` |
| `discover_data_patterns` | Analyzes tables for data patterns and quality issues | `ai_enhancement` |
| `generate_documentation` | Generates comprehensive database documentation | `ai_enhancement` |
| `generate_data_dictionary` | Creates detailed data dictionaries for tables | `ai_enhancement` |
| `generate_business_glossary` | Builds business glossaries from column names | `ai_enhancement` |

### Intelligent Query Assistant

#### `build_query_from_intent`

Converts natural language descriptions to optimized SQL queries with context-aware generation.

```javascript
// Basic usage
{
  "tool": "build_query_from_intent",
  "arguments": {
    "natural_language": "show me all users who signed up last month"
  }
}

// With context and safety settings
{
  "tool": "build_query_from_intent",
  "arguments": {
    "natural_language": "count orders by product category for 2024",
    "context": "analytics",
    "max_complexity": "medium",
    "safety_level": "moderate"
  }
}
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `natural_language` | string | Natural language description of what you want to query (required) |
| `context` | string | Query context: `analytics`, `reporting`, `data_entry`, `schema_exploration` |
| `max_complexity` | string | Maximum complexity: `simple`, `medium`, `complex` |
| `safety_level` | string | Safety level: `strict`, `moderate`, `permissive` |

**Response includes:**
- Generated SQL query
- Explanation of what the query does
- Tables and columns involved
- Safety notes and optimization hints
- Alternative query suggestions

#### `suggest_query_improvements`

Analyzes a SQL query and provides suggestions for optimization.

```javascript
{
  "tool": "suggest_query_improvements",
  "arguments": {
    "query": "SELECT * FROM users WHERE email LIKE '%@gmail.com'",
    "optimization_goal": "speed"
  }
}
```

**Optimization Goals:**
- `speed` - Focuses on query execution time (default)
- `memory` - Focuses on memory usage optimization
- `readability` - Suggests formatting and clarity improvements

### Smart Data Discovery

#### `smart_search`

Search across the database schema using semantic matching to find relevant tables, columns, and data patterns.

```javascript
// Search for anything related to "customer"
{
  "tool": "smart_search",
  "arguments": {
    "search_term": "customer",
    "search_type": "all",
    "include_sample_data": true
  }
}

// Search specifically for columns
{
  "tool": "smart_search",
  "arguments": {
    "search_term": "email",
    "search_type": "column",
    "similarity_threshold": 0.5
  }
}
```

**Search Types:**
- `all` - Search across tables, columns, patterns, and relationships
- `table` - Search table names only
- `column` - Search column names only
- `data_pattern` - Search for patterns in actual data
- `relationship` - Search for relationships between tables

#### `find_similar_columns`

Discover columns with similar names or data across tables to identify potential joins and relationships.

```javascript
// Find columns similar to "user_id" in "orders" table
{
  "tool": "find_similar_columns",
  "arguments": {
    "column_name": "user_id",
    "table_name": "orders",
    "include_data_comparison": true
  }
}

// Find all potential join candidates across the database
{
  "tool": "find_similar_columns",
  "arguments": {
    "include_data_comparison": false,
    "max_results": 50
  }
}
```

#### `discover_data_patterns`

Analyze a table to discover data patterns, quality issues, and get recommendations.

```javascript
{
  "tool": "discover_data_patterns",
  "arguments": {
    "table_name": "users",
    "pattern_types": ["unique", "null", "duplicate", "format", "range"]
  }
}
```

**Pattern Types:**
- `unique` - Find potentially unique columns not marked as UNIQUE
- `null` - Detect high null rates and nullable mismatches
- `duplicate` - Find duplicate values in columns
- `format` - Detect data formats (email, phone, etc.)
- `range` - Analyze numeric ranges and detect outliers

**Response includes:**
- Data quality score (0-100)
- Patterns found per column
- Recommendations for each issue
- Column-level metrics

### Documentation Generator

#### `generate_documentation`

Generate comprehensive database documentation in Markdown, HTML, or JSON format.

```javascript
// Generate full database documentation
{
  "tool": "generate_documentation",
  "arguments": {
    "format": "markdown",
    "include_business_glossary": true,
    "include_examples": true,
    "include_statistics": true
  }
}

// Document a specific table
{
  "tool": "generate_documentation",
  "arguments": {
    "scope": "table",
    "table_name": "orders",
    "format": "html"
  }
}
```

**Output Formats:**
- `markdown` - Best for GitHub/GitLab wikis and documentation sites
- `html` - Standalone HTML page with styling
- `json` - Structured data for programmatic use

**Documentation includes:**
- Table of contents
- ER relationship diagrams (Mermaid.js in markdown)
- Column details with data types and constraints
- Foreign key relationships
- Index information
- Example SQL queries
- Business glossary

#### `generate_data_dictionary`

Generate a detailed data dictionary for a specific table.

```javascript
{
  "tool": "generate_data_dictionary",
  "arguments": {
    "table_name": "products",
    "include_sample_values": true,
    "include_constraints": true
  }
}
```

**Response includes:**
- Column name, type, and description
- Constraints (PK, FK, NOT NULL, UNIQUE)
- Default values
- Sample values from actual data
- Business terms (auto-inferred)

#### `generate_business_glossary`

Create a business glossary from database column names with auto-generated descriptions.

```javascript
{
  "tool": "generate_business_glossary",
  "arguments": {
    "include_descriptions": true,
    "group_by": "category"
  }
}
```

**Grouping Options:**
- `category` - Group by inferred category (Identifiers, Timestamps, Contact, etc.)
- `table` - Group by source table
- `alphabetical` - A-Z sorting

### AI Enhancement Best Practices

1. **Start with Discovery**: Use `smart_search` and `find_similar_columns` to understand unfamiliar databases
2. **Use Context**: When building queries, specify the `context` parameter for better results
3. **Validate Generated SQL**: Always review generated SQL before executing, especially for complex queries
4. **Update Documentation**: Regenerate documentation after schema changes
5. **Quality Checks**: Run `discover_data_patterns` regularly to catch data quality issues early

### Example Workflow: Exploring a New Database

```javascript
// Step 1: Get an overview
{ "tool": "get_database_summary" }

// Step 2: Search for relevant tables
{
  "tool": "smart_search",
  "arguments": { "search_term": "order sales revenue" }
}

// Step 3: Generate documentation
{
  "tool": "generate_documentation",
  "arguments": { "format": "markdown" }
}

// Step 4: Build a query from natural language
{
  "tool": "build_query_from_intent",
  "arguments": {
    "natural_language": "total sales by month for the last year"
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
  
  "✅ SQL Query #1 - SUCCESS": "\n⏱️ 107ms\n📝 SHOW TABLES",
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

---

## 🤖 Guided Query Builder/Fixer

The `repair_query` tool acts as an AI-powered assistant for SQL query optimization and troubleshooting.

### Features

- **Query Analysis**: Uses `EXPLAIN` to understand query execution plans.
- **Auto-Fixing**: Identifying missing indexes, inefficient scans, and syntax errors.
- **Heuristic suggestions**: Provides actionable advice (e.g. "Add index on column X", "Add LIMIT clause").

### Usage Example

**Request:**
```json
{
  "tool": "repair_query",
  "arguments": {
    "query": "SELECT * FROM users WHERE email = 'test@example.com'",
    "error_message": "Optional error message if query failed"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "analysis": {
    "complexity": "HIGH",
    "issues": ["Full Table Scan on table 'users'"],
    "suggestions": ["Consider adding an index on table 'users' for the columns used in WHERE clause."]
  },
  "fixed_query": "SELECT * FROM users WHERE email = 'test@example.com'",
  "suggestions": [
    "Consider adding an index on table 'users' for the columns used in WHERE clause.",
    "Consider adding 'LIMIT 100' to prevent massive data transfer."
  ]
}
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

## 🎭 Data Masking
 
 The MySQL MCP server includes a robust data masking layer to protect sensitive information (PII, credentials) in query results. This is useful when sharing database access with AI agents or third parties.
 
 ### Features
 
 - **Profile-Based Masking**: Easy configuration profiles (`none`, `soft`, `partial`, `strict`)
 - **Automatic Detection**: Automatically identifies sensitive columns by name (e.g., `email`, `password`, `ssn`)
 - **Multiple Strategies**:
   - **REDACT**: Replaces value with `[REDACTED]`
   - **PARTIAL**: Partially masks email (`j***@d.com`) and phone/CC (`***1234`)
   - **HASH**: (Internal placeholder)
 
 ### Configuration
 
 Configure the masking profile via the `MCP_MASKING_PROFILE` environment variable:
 
 ```bash
 MCP_MASKING_PROFILE=partial
 ```
 
 ### Profiles Reference
 
 | Profile | Description | Credentials (password, key) | PII (email, phone, ssn) |
 |---------|-------------|-----------------------------|-------------------------|
 | `none` | No masking (default) | Show | Show |
 | `soft` | Protect secrets only | **REDACT** | Show |
 | `partial` | Balanced security | **REDACT** | **PARTIAL** (j***@...) |
 | `strict` | Maximum security | **REDACT** | **REDACT** |
 
 ### Behavior
 
 - Masking applies automatically to `run_query` and `read_records` results.
 - It filters output **after** the query is run, so WHERE clauses still work on the real data (e.g., you can search by email, but the result will be masked).
 
 ---
 

 ---
 
 ## ⚡ Workflow Macros

 Workflow macros are high-level tools that combine multiple operations into a single, safe, and efficient workflow. They are designed to simplify complex tasks and ensure best practices (like data masking) are automatically applied.

 ### Safe Export Table

 The `safe_export_table` tool allows you to export table data to CSV while strictly enforcing data masking rules. This ensures that sensitive information (PII) is never leaked during exports, even if the agent forgets to apply masking manually.

 #### Features

 - **Forced Masking**: Applies a masking profile (default: `strict`) to all exported data.
 - **Hard Limit**: Enforces a maximum row limit (10,000) to prevent Out-Of-Memory errors during large exports.
 - **CSV Formatting**: Automatically handles special characters, quotes, and newlines.
 - **Header Control**: Option to include or exclude CSV headers.

 #### Usage

 ```json
 {
   "tool": "safe_export_table",
   "arguments": {
     "table_name": "users",
     "masking_profile": "partial",
     "limit": 1000
   }
 }
 ```

 #### Parameters

 | Parameter | Type | Required | Description | Default |
 |-----------|------|----------|-------------|---------|
 | `table_name` | string | Yes | Name of the table to export | - |
 | `masking_profile` | string | No | Masking profile to apply (`strict`, `partial`, `soft`) | `strict` |
 | `limit` | number | No | Number of rows to export (max 10,000) | 1000 |
 | `include_headers` | boolean | No | Whether to include CSV headers | `true` |

 #### Response

 ```json
 {
   "status": "success",
   "data": {
     "csv": "id,name,email\n1,John Doe,j***@example.com...",
     "row_count": 50,
     "applied_profile": "partial"
   }
 }
 ```

 ---

 ## 🤖 OpenAI Codex Integration

OpenAI Codex CLI and VS Code Extension support MCP servers through a shared TOML configuration file. This section provides detailed setup instructions for integrating the MySQL MCP Server with Codex.

### Configuration Overview

| Feature | Details |
|---------|---------|
| **Config File** | `~/.codex/config.toml` |
| **Shared Config** | CLI and VS Code extension use the same file |
| **Transport** | STDIO (standard input/output) |
| **Format** | TOML |

### Quick Setup via CLI

The fastest way to add MySQL MCP to Codex:

```bash
# Basic setup with connection string
codex mcp add mysql -- npx -y @berthojoris/mcp-mysql-server mysql://user:password@localhost:3306/database list,read,utility

# With environment variables
codex mcp add mysql --env DB_HOST=localhost --env DB_PORT=3306 --env DB_USER=root --env DB_PASSWORD=secret --env DB_NAME=mydb --env MCP_PERMISSIONS=list,read,utility -- npx -y @berthojoris/mcp-mysql-server
```

### Manual TOML Configuration

Edit `~/.codex/config.toml` directly for more control:

#### Basic Configuration

```toml
[mcp_servers.mysql]
command = "npx"
args = ["-y", "@berthojoris/mcp-mysql-server", "mysql://user:password@localhost:3306/database", "list,read,utility"]
```

#### With Environment Variables

```toml
[mcp_servers.mysql]
command = "npx"
args = ["-y", "@berthojoris/mcp-mysql-server"]

[mcp_servers.mysql.env]
DB_HOST = "localhost"
DB_PORT = "3306"
DB_USER = "root"
DB_PASSWORD = "your_password"
DB_NAME = "your_database"
MCP_PERMISSIONS = "list,read,utility"
```

#### Local Path Configuration (Development)

```toml
[mcp_servers.mysql]
command = "node"
args = ["C:\\DEKSTOP\\MCP\\mcp_mysql\\bin\\mcp-mysql.js", "mysql://user:pass@localhost:3306/database", "list,read,utility"]
cwd = "C:\\DEKSTOP\\MCP\\mcp_mysql"
```

### Configuration Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `command` | String | Required | The executable to launch the server |
| `args` | Array | `[]` | Command-line arguments passed to the server |
| `env` | Table | `{}` | Environment variables for the server process |
| `env_vars` | Array | `[]` | Additional env vars to whitelist/forward |
| `cwd` | String | - | Working directory to launch the server from |
| `startup_timeout_sec` | Number | `10` | Server startup timeout in seconds |
| `tool_timeout_sec` | Number | `60` | Per-tool execution timeout in seconds |
| `enabled` | Boolean | `true` | Set to `false` to disable without deleting |
| `enabled_tools` | Array | - | Allow-list of tools to expose from server |
| `disabled_tools` | Array | - | Deny-list of tools to hide |

### Advanced Configurations

#### Production (Read-Only) + Development (Full Access)

```toml
# Production database - Read Only
[mcp_servers.mysql-prod]
command = "npx"
args = ["-y", "@berthojoris/mcp-mysql-server", "mysql://reader:pass@prod-server:3306/prod_db", "list,read,utility"]
startup_timeout_sec = 30
tool_timeout_sec = 120

# Development database - Full Access
[mcp_servers.mysql-dev]
command = "npx"
args = ["-y", "@berthojoris/mcp-mysql-server", "mysql://root:pass@localhost:3306/dev_db", "list,read,create,update,delete,execute,ddl,transaction,utility"]
```

#### With Tool Filtering (Limit Exposed Tools)

```toml
[mcp_servers.mysql]
command = "npx"
args = ["-y", "@berthojoris/mcp-mysql-server", "mysql://user:pass@localhost:3306/db", "list,read,utility"]

# Only expose specific tools
enabled_tools = [
  "list_tables",
  "read_table_schema",
  "read_records",
  "run_query",
  "test_connection"
]

# Or hide specific dangerous tools
# disabled_tools = ["drop_table", "delete_record", "execute_sql"]
```

#### With Custom Timeouts for Large Operations

```toml
[mcp_servers.mysql]
command = "npx"
args = ["-y", "@berthojoris/mcp-mysql-server", "mysql://user:pass@localhost:3306/db", "list,read,create,update,delete,utility"]
startup_timeout_sec = 30    # Allow more time for startup
tool_timeout_sec = 300      # 5 minutes for large bulk operations
```

### Codex MCP Management Commands

```bash
# List all configured MCP servers
codex mcp list

# List with JSON output (for scripting)
codex mcp list --json

# Get details about a specific server
codex mcp get mysql

# Remove an MCP server
codex mcp remove mysql

# Add server with multiple env vars
codex mcp add mysql --env DB_HOST=localhost --env DB_USER=root -- npx -y @berthojoris/mcp-mysql-server
```

### VS Code Extension Setup

1. Install the Codex VS Code Extension
2. Open the extension settings (gear icon in top right)
3. Click "MCP settings" > "Open config.toml"
4. Add your MySQL MCP configuration
5. Save the file - changes apply immediately

### Verifying the Setup

After configuration, test your setup:

```bash
# In Codex CLI
codex mcp list

# You should see:
# mysql: npx -y @berthojoris/mcp-mysql-server ...
```

Then ask Codex:
- "What databases are available?"
- "List all tables in my database"
- "Show me the structure of the users table"

### Troubleshooting Codex Integration

#### Server Not Starting

1. **Check TOML syntax** - A single syntax error breaks both CLI and VS Code extension
2. **Verify paths** - Use absolute paths for local installations
3. **Check startup timeout** - Increase `startup_timeout_sec` if server takes time to initialize

#### Tools Not Appearing

1. Verify server configuration with `codex mcp list --json`
2. Check that `enabled = true` (or not set, defaults to true)
3. Ensure `enabled_tools` doesn't accidentally filter out needed tools

#### Connection Errors

1. Test MySQL connection manually: `mysql -u user -p -h host database`
2. Verify credentials in connection string
3. Check network connectivity to MySQL server

#### Common TOML Syntax Errors

```toml
# WRONG - missing quotes around string values
args = [-y, @berthojoris/mcp-mysql-server]

# CORRECT
args = ["-y", "@berthojoris/mcp-mysql-server"]

# WRONG - using JSON syntax
"mcp_servers": { "mysql": { ... } }

# CORRECT - TOML table syntax
[mcp_servers.mysql]
command = "npx"
```

### Permission Sets for Common Use Cases

| Use Case | Permissions |
|----------|-------------|
| Read-Only Analysis | `list,read,utility` |
| Data Entry | `list,read,create,utility` |
| Full Data Access | `list,read,create,update,delete,utility` |
| With Transactions | `list,read,create,update,delete,transaction,utility` |
| Development (Full) | `list,read,create,update,delete,execute,ddl,transaction,procedure,utility` |

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
- ✅ **Database backup and restore tools** - **COMPLETED!**
- ✅ **Data export/import utilities** (CSV, JSON, SQL dumps) - **COMPLETED!**
- ✅ **Data migration utilities** - **COMPLETED!**
- ✅ **Schema versioning and migrations** - **COMPLETED!**

### Recommended Implementation Order

#### **Phase 1: Performance & Monitoring** 🚀
- ✅ **Query result caching** - Dramatically improve response times for repeated queries - **COMPLETED!**
- ✅ **Performance metrics** - Track query execution times and database performance - **COMPLETED!**
- ✅ **Connection pool monitoring** - Monitor database connection health and usage - **COMPLETED!**
- ✅ **Database health checks** - Comprehensive system health monitoring - **COMPLETED!**

#### **Phase 2: Data Management** 📊
- ✅ **Database backup and restore tools** - Essential for production data safety - **COMPLETED!**
- ✅ **Data migration utilities** - Move data between databases and environments - **COMPLETED!**
- ✅ **Enhanced export/import** - Support for JSON, SQL dump formats - **COMPLETED!**

#### **Phase 3: Enterprise Features** 🏢
- ✅ **Schema versioning and migrations** - Version control for database schema changes - **COMPLETED!**
- ✅ **Query optimization** - Automatic query analysis and optimization suggestions - **COMPLETED!**

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
| Data Migration | High | High | 12 | ✅ COMPLETED |
| Schema Versioning | Medium | Medium | 13 | ✅ COMPLETED |
| Performance Monitoring | High | Medium | 14 | ✅ COMPLETED |

#### **Proposed Enhancements (AI Productivity)**

| Feature | Impact | Effort | Priority | Status |
|---------|--------|--------|----------|--------|
| Adaptive Permission Presets (ReadOnly/Analyst/DBA Lite) | High | Medium | 1 | ✅ Completed |
| Schema-Aware RAG Context Pack | High | Medium | 2 | ✅ Completed |
| Guided Query Builder/Fixer (Intent → Safe SQL + EXPLAIN Repair) | High | Medium | 3 | ✅ Completed |
| Drift & Migration Assistant (Schema diff + risk summary) | High | High | 4 | ✅ Completed |
| Safety Sandbox Mode (runQuery dry-run/EXPLAIN-only) | Medium | Low | 5 | ✅ Completed |
| Anomaly & Slow-Query Watcher | Medium | Medium | 6 | ✅ Completed |
| Data Masking Profiles for Responses | Medium | Medium | 7 | ✅ Completed |
| Workflow Macros (e.g., safe_export_table) | Medium | Low | 8 | ✅ Completed |
| Agent-Facing Changelog Feed | Medium | Low | 9 | ✅ Completed |
| Connection Profiles (dev/stage/prod with allow/deny) | High | Low | 10 | ✅ Completed |

---

**Made with ❤️ for the AI community**

*Help AI agents interact with MySQL databases safely and efficiently!*
