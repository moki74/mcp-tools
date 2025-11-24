# MySQL MCP Server

A fully-featured **Model Context Protocol (MCP)** server for MySQL database integration with AI agents like Claude Code, Cursor, Windsurf, Zed, Cline, Kilo Code, Roo Code, Gemini CLI, and other MCP-compatible tools.

[![npm version](https://img.shields.io/npm/v/@berthojoris/mcp-mysql-server)](https://www.npmjs.com/package/@berthojoris/mcp-mysql-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Features

- ✅ **Full MCP Protocol Support** - Works with Claude Code, Cursor, Windsurf, Zed, Cline, Kilo Code, Roo Code, Gemini CLI, and any MCP-compatible AI agent
- 🔐 **Secure by Default** - Parameterized queries, SQL injection protection, permission-based access control
- 🛠️ **100 Powerful Tools** - Complete database operations (CRUD, DDL, queries, schema inspection, transactions, stored procedures, bulk operations, backup/restore, import/export, data migration)
- 🎛️ **Dynamic Per-Project Permissions** - Each AI agent can have different access levels
- 🗃️ **DDL Support** - Create, alter, and drop tables (when explicitly enabled)
- 💎 **Transaction Support** - Full ACID transaction management (BEGIN, COMMIT, ROLLBACK)
- 🌐 **Dual Mode** - Run as MCP server OR as REST API
- 📊 **Rich Metadata** - Table schemas, relationships, connection info
- ⚡ **TypeScript** - Fully typed with TypeScript definitions

---

## 🔄 MySQL MCP vs Manual Database Access: A Comprehensive Comparison

This MySQL MCP is a **powerful intermediary layer** between AI assistants and MySQL databases. Here's how it compares to manual database access:

### Data Access & Querying

| Feature | MySQL MCP | Manual Database Access |
|---------|-----------|------------------------|
| **Query Execution** | AI can run SELECT/INSERT/UPDATE/DELETE via natural language | Requires manual SQL writing in terminal/client |
| **Parameterized Queries** | Automatic protection against SQL injection | Must manually parameterize |
| **Bulk Operations** | Up to 10,000 records per batch with auto-batching | Manual scripting required |
| **Query Caching** | Built-in LRU cache with TTL | Must implement yourself |

### Data Analysis

| Feature | MySQL MCP | Manual Database Access |
|---------|-----------|------------------------|
| **Query Analysis** | Auto-detects complexity, joins, bottlenecks | Run EXPLAIN manually, interpret yourself |
| **Optimization Hints** | Auto-generates MySQL 8.0+ optimizer hints | Must know hint syntax |
| **Execution Plans** | Get EXPLAIN in JSON/TREE/TRADITIONAL formats | Run EXPLAIN manually |
| **Server Diagnostics** | 9 tools for status, processes, replication | Multiple manual commands |

### Data Validation

| Feature | MySQL MCP | Manual Database Access |
|---------|-----------|------------------------|
| **Input Validation** | Automatic type/length/format validation | Manual validation code |
| **SQL Injection Prevention** | Multi-layer protection (identifiers, keywords, params) | Depends on your code |
| **Permission Enforcement** | 10 granular permission categories | Configure in MySQL grants |
| **Dangerous Query Blocking** | Blocks GRANT, DROP USER, system schema access | No automatic protection |

### Schema Inspection

| Feature | MySQL MCP | Manual Database Access |
|---------|-----------|------------------------|
| **Table Structure** | One command shows columns, keys, indexes | Multiple SHOW/DESCRIBE commands |
| **Foreign Key Discovery** | Auto-discovers relationships | Manual INFORMATION_SCHEMA queries |
| **Full Schema Export** | Get entire DB schema (tables, views, procs, triggers) | Multiple manual exports |
| **Object Comparison** | Compare table structures automatically | Manual diff work |

### Debugging & Diagnostics

| Feature | MySQL MCP | Manual Database Access |
|---------|-----------|------------------------|
| **Query Logging** | Automatic logging with timing, params, status | Enable general_log manually |
| **Formatted Output** | SQL formatted with highlighted keywords | Raw output |
| **Process Management** | View/kill processes via simple commands | SHOW PROCESSLIST + KILL manually |
| **Cache Monitoring** | Hit rate, memory usage, statistics | No built-in tracking |

### Advanced Operations

| Feature | MySQL MCP | Manual Database Access |
|---------|-----------|------------------------|
| **Transactions** | Begin/Commit/Rollback via commands | Manual SQL |
| **Stored Procedures** | Create, execute, manage with parameter handling | Write DDL manually |
| **Data Migration** | Copy, move, clone, sync tables with one command | Complex scripts required |
| **Backup/Restore** | Full DB or table backup/restore | mysqldump + manual restore |
| **Import/Export** | CSV, JSON, SQL formats supported | Manual scripting |

### Key Benefits of Using This MCP

1. **Natural Language Interface** - Ask Claude "show me all users with orders > $100" instead of writing SQL

2. **Built-in Security** - 5+ validation layers protect against:
   - SQL injection
   - Privilege escalation
   - Cross-database access
   - Dangerous operations

3. **Audit Trail** - Every query automatically logged with timing and parameters

4. **100 Tools in 16 Categories** - Covers virtually every database task

5. **Permission Granularity** - Give AI read-only access in production, full access in dev

6. **Error Handling** - Detailed, human-readable error messages

### Example Workflows

**Without MCP (Manual):**
```sql
-- Connect to MySQL client
mysql -u user -p database
-- Write schema query
DESCRIBE users;
SHOW INDEX FROM users;
-- Write analysis query  
EXPLAIN SELECT * FROM users WHERE email LIKE '%@gmail.com';
-- Check if safe, then run
SELECT * FROM users WHERE email LIKE '%@gmail.com';
```

**With MCP (AI-Assisted):**
> "Show me the users table structure and find all Gmail users"
- AI calls `read_table_schema`, `explain_query`, `read_records`
- Returns formatted results with execution time
- All queries logged, validated, parameterized automatically

### When to Use This MCP

| Use Case | Recommendation |
|----------|----------------|
| Quick data lookups | MCP - faster, safer |
| Complex analysis | MCP - AI can iterate and refine |
| Schema exploration | MCP - comprehensive tools |
| Production debugging | MCP with read-only permissions |
| Bulk data operations | MCP - auto-batching |
| Data migrations | MCP - 5 migration tools |
| Learning SQL | Both - MCP shows what it executes |

This MCP transforms database work from "write SQL, hope it's safe, interpret results" to "describe what you need, get validated results with full audit trail."

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

This MCP server works with multiple AI coding assistants. Below are configuration examples for each platform.

#### Claude Code (CLI)

Claude Code uses a `.mcp.json` file in your project root or home directory.

**Project-level config (`.mcp.json` in project root):**

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

**Global config (`~/.mcp.json`):**

```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": [
        "-y",
        "@berthojoris/mcp-mysql-server",
        "mysql://user:password@localhost:3306/database",
        "list,read,create,update,delete,ddl"
      ]
    }
  }
}
```

#### Cursor

Cursor uses `.cursor/mcp.json` in your project root.

**Configuration (`.cursor/mcp.json`):**

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

#### Windsurf

Windsurf uses `~/.codeium/windsurf/mcp_config.json`.

**Configuration:**

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

Add to Cline MCP settings in VS Code settings or cline config file.

**Configuration:**

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

#### Gemini CLI

Gemini CLI uses `~/.gemini/settings.json`.

**Configuration:**

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

#### Trae AI

Trae AI uses MCP configuration in its settings.

**Configuration:**

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

#### Qwen Code

Qwen Code supports MCP servers with standard configuration.

**Configuration:**

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

#### Droid CLI

Droid CLI uses MCP configuration in its settings file.

**Configuration:**

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

#### Zed IDE

Zed IDE uses `~/.config/zed/settings.json` for MCP configuration.

**Configuration:**

```json
{
  "context_servers": {
    "mysql": {
      "command": {
        "path": "npx",
        "args": [
          "-y",
          "@berthojoris/mcp-mysql-server",
          "mysql://user:password@localhost:3306/database",
          "list,read,utility"
        ]
      }
    }
  }
}
```

#### Kilo Code (VS Code Extension)

Kilo Code is a VS Code extension that supports MCP servers.

**Configuration:**

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

#### Roo Code (VS Code Extension)

Roo Code is a VS Code extension with MCP support.

**Configuration:**

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

#### Local Path Configuration (for development)

If you've cloned the repository locally:

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": [
        "/path/to/mcp_mysql/bin/mcp-mysql.js",
        "mysql://user:password@localhost:3306/database",
        "list,read,utility"
      ]
    }
  }
}
```

#### Environment Variables Configuration

Alternative approach using environment variables:

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": [
        "/path/to/mcp_mysql/dist/mcp-server.js"
      ],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "3306",
        "DB_USER": "root",
        "DB_PASSWORD": "your_password",
        "DB_NAME": "your_database",
        "MCP_PERMISSIONS": "list,read,utility"
      }
    }
  }
}
```

### 4. Restart AI Agent

Completely restart your AI agent application to load the MCP server.

### 5. Test It!

Try asking your AI:
- *"What databases are available?"*
- *"Show me all tables in my database"*
- *"What's the structure of the users table?"*
- *"Show me the first 5 records from users"*

---

## Local vs NPX Configuration

### When to Use Local Path Configuration

Use the local path approach when you:
- **Want full control** over the version and source code
- **Need offline access** without internet dependency
- **Want to modify the source** for custom functionality
- **Need faster startup** without package download
- **Are developing/debugging** the MCP server
- **Have network restrictions** or security policies

### Local Configuration Benefits

| Feature | Local Path | NPX |
|---------|------------|-----|
| **Control** | Full control over code | Depends on npm registry |
| **Offline** | Works completely offline | Requires internet download |
| **Speed** | Instant startup | Download time |
| **Customization** | Can modify source code | Limited to published version |
| **Debugging** | Full source access available | Limited debugging |
| **Updates** | Manual updates | Automatic updates |
| **Setup** | Requires building project | Zero setup |

### Local Setup Requirements

1. **Build the project:**
   ```bash
   cd "C:\DEKSTOP\MCP\mcp_mysql"
   npm run build
   ```

2. **Ensure paths are absolute** - Use full paths to avoid ambiguity
3. **Use correct binaries:**
   - `bin/mcp-mysql.js` - CLI wrapper with argument parsing
   - `dist/mcp-server.js` - Direct server executable

### Common Local Configuration Patterns

**Direct binary with arguments:**
```json
{
  "command": "node",
  "args": [
    "C:\\DEKSTOP\\MCP\\mcp_mysql\\bin\\mcp-mysql.js",
    "mysql://user:pass@localhost:3306/database",
    "permissions"
  ]
}
```

**Direct server with environment variables:**
```json
{
  "command": "node",
  "args": ["C:\\DEKSTOP\\MCP\\mcp_mysql\\dist\\mcp-server.js"],
  "env": {
    "DB_HOST": "localhost",
    "DB_PORT": "3306",
    "DB_USER": "root",
    "DB_PASSWORD": "",
    "DB_NAME": "database",
    "MCP_PERMISSIONS": "permissions"
  }
}
```

### Path Tips

- **Windows paths:** Use double backslashes `\\` in JSON
- **Cross-platform:** Use forward slashes `/` if supported by your AI agent
- **Environment variables:** Can use `%USERPROFILE%` or `$HOME` in some systems
- **Relative paths:** Not recommended - use absolute paths for reliability

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

**Using NPX:**
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

**Using Local Paths:**
```json
{
  "mcpServers": {
    "mysql-prod": {
      "command": "node",
      "args": [
        "C:\\DEKSTOP\\MCP\\mcp_mysql\\bin\\mcp-mysql.js",
        "mysql://reader:pass@prod-server:3306/prod_db",
        "list,read,utility"
      ]
    },
    "mysql-dev": {
      "command": "node",
      "args": [
        "C:\\DEKSTOP\\MCP\\mcp_mysql\\bin\\mcp-mysql.js",
        "mysql://root:pass@localhost:3306/dev_db",
        "list,read,create,update,delete,execute,ddl,utility"
      ]
    }
  }
}
```

---

## 🛠️ Available Tools

The MCP server provides **100 powerful tools**:

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

### Stored Procedures (6 tools)

| Tool | Description | Requires |
|------|-------------|----------|
| `list_stored_procedures` | List all stored procedures in a database | `procedure` permission |
| `create_stored_procedure` | Create new stored procedures with parameters | `procedure` permission |
| `get_stored_procedure_info` | Get detailed information about a stored procedure | `procedure` permission |
| `execute_stored_procedure` | Execute stored procedures with IN/OUT/INOUT parameters | `procedure` permission |
| `drop_stored_procedure` | Delete stored procedures | `procedure` permission |
| `show_create_procedure` | Show CREATE statement for a stored procedure | `procedure` permission |

### Views Management (6 tools) - NEW!

| Tool | Description | Requires |
|------|-------------|----------|
| `list_views` | List all views in the database | `list` permission |
| `get_view_info` | Get detailed information about a view | `list` permission |
| `create_view` | Create a new view with SELECT definition | `ddl` permission |
| `alter_view` | Alter an existing view definition | `ddl` permission |
| `drop_view` | Drop a view | `ddl` permission |
| `show_create_view` | Show CREATE statement for a view | `list` permission |

### Triggers Management (5 tools) - NEW!

| Tool | Description | Requires |
|------|-------------|----------|
| `list_triggers` | List all triggers in the database | `list` permission |
| `get_trigger_info` | Get detailed information about a trigger | `list` permission |
| `create_trigger` | Create a new trigger on a table | `ddl` permission |
| `drop_trigger` | Drop a trigger | `ddl` permission |
| `show_create_trigger` | Show CREATE statement for a trigger | `list` permission |

### Functions Management (6 tools) - NEW!

| Tool | Description | Requires |
|------|-------------|----------|
| `list_functions` | List all user-defined functions | `list` permission |
| `get_function_info` | Get detailed information about a function | `list` permission |
| `create_function` | Create a new user-defined function | `ddl` permission |
| `drop_function` | Drop a function | `ddl` permission |
| `show_create_function` | Show CREATE statement for a function | `list` permission |
| `execute_function` | Execute a function and return its result | `read` permission |

### Index Management (5 tools) - NEW!

| Tool | Description | Requires |
|------|-------------|----------|
| `list_indexes` | List all indexes for a table | `list` permission |
| `get_index_info` | Get detailed information about an index | `list` permission |
| `create_index` | Create a new index (BTREE, HASH, FULLTEXT, SPATIAL) | `ddl` permission |
| `drop_index` | Drop an index from a table | `ddl` permission |
| `analyze_index` | Analyze index statistics | `utility` permission |

### Constraint Management (7 tools) - NEW!

| Tool | Description | Requires |
|------|-------------|----------|
| `list_foreign_keys` | List all foreign keys for a table | `list` permission |
| `list_constraints` | List all constraints (PK, FK, UNIQUE, CHECK) | `list` permission |
| `add_foreign_key` | Add a foreign key constraint | `ddl` permission |
| `drop_foreign_key` | Drop a foreign key constraint | `ddl` permission |
| `add_unique_constraint` | Add a unique constraint | `ddl` permission |
| `drop_constraint` | Drop a UNIQUE or CHECK constraint | `ddl` permission |
| `add_check_constraint` | Add a CHECK constraint (MySQL 8.0.16+) | `ddl` permission |

### Table Maintenance (8 tools) - NEW!

| Tool | Description | Requires |
|------|-------------|----------|
| `analyze_table` | Update index statistics for optimizer | `utility` permission |
| `optimize_table` | Reclaim unused space and defragment | `utility` permission |
| `check_table` | Check table for errors | `utility` permission |
| `repair_table` | Repair corrupted table (MyISAM, ARCHIVE, CSV) | `utility` permission |
| `truncate_table` | Remove all rows quickly | `ddl` permission |
| `get_table_status` | Get detailed table status and statistics | `list` permission |
| `flush_table` | Close and reopen table(s) | `utility` permission |
| `get_table_size` | Get size information for tables | `list` permission |

### Process & Server Management (9 tools) - NEW!

| Tool | Description | Requires |
|------|-------------|----------|
| `show_process_list` | Show all running MySQL processes | `utility` permission |
| `kill_process` | Kill a MySQL process/connection | `utility` permission |
| `show_status` | Show MySQL server status variables | `utility` permission |
| `show_variables` | Show MySQL server configuration variables | `utility` permission |
| `explain_query` | Show query execution plan (EXPLAIN) | `utility` permission |
| `show_engine_status` | Show storage engine status (InnoDB) | `utility` permission |
| `get_server_info` | Get comprehensive server information | `utility` permission |
| `show_binary_logs` | Show binary log files | `utility` permission |
| `show_replication_status` | Show replication status | `utility` permission |

### Cache Management (5 tools)

| Tool | Description |
|------|-------------|
| `get_cache_stats` | Get query cache statistics |
| `get_cache_config` | Get current cache configuration |
| `configure_cache` | Configure cache settings (TTL, max size) |
| `clear_cache` | Clear all cached query results |
| `invalidate_table_cache` | Invalidate cache for a specific table |

### Query Optimization (2 tools)

| Tool | Description |
|------|-------------|
| `analyze_query` | Analyze query and get optimization suggestions |
| `get_optimization_hints` | Get optimizer hints for SPEED, MEMORY, or STABILITY goals |

### Database Backup & Restore (5 tools) - NEW!

| Tool | Description | Requires |
|------|-------------|----------|
| `backup_table` | Backup single table to SQL dump format | `utility` permission |
| `backup_database` | Backup entire database to SQL dump | `utility` permission |
| `restore_from_sql` | Restore database from SQL dump content | `ddl` permission |
| `get_create_table_statement` | Get CREATE TABLE statement for a table | `list` permission |
| `get_database_schema` | Get complete database schema (tables, views, procedures, functions, triggers) | `list` permission |

### Data Import/Export (5 tools)

| Tool | Description | Requires |
|------|-------------|----------|
| `export_table_to_json` | Export table data to JSON format | `utility` permission |
| `export_query_to_json` | Export query results to JSON format | `utility` permission |
| `export_table_to_sql` | Export table data to SQL INSERT statements | `utility` permission |
| `import_from_csv` | Import data from CSV string into a table | `create` permission |
| `import_from_json` | Import data from JSON array into a table | `create` permission |

### Data Migration (5 tools)

| Tool | Description | Requires |
|------|-------------|----------|
| `copy_table_data` | Copy data from one table to another with optional column mapping | `create` permission |
| `move_table_data` | Move data (copy + delete from source) | `create`, `delete` permission |
| `clone_table` | Clone table structure with optional data | `ddl` permission |
| `compare_table_structure` | Compare structure of two tables and identify differences | `list` permission |
| `sync_table_data` | Synchronize data between tables (insert_only, update_only, upsert) | `update` permission |

### Schema Versioning & Migrations (9 tools) - NEW!

| Tool | Description | Requires |
|------|-------------|----------|
| `init_migrations_table` | Initialize the migrations tracking table | `ddl` permission |
| `create_migration` | Create a new migration with up/down SQL | `ddl` permission |
| `apply_migrations` | Apply pending migrations (with dry-run support) | `ddl` permission |
| `rollback_migration` | Rollback applied migrations by steps or version | `ddl` permission |
| `get_migration_status` | Get migration history and status | `list` permission |
| `get_schema_version` | Get current schema version | `list` permission |
| `validate_migrations` | Validate migrations for issues | `list` permission |
| `reset_failed_migration` | Reset failed migration to pending | `ddl` permission |
| `generate_migration_from_diff` | Generate migration from table comparison | `ddl` permission |

---

## 📚 Detailed Documentation

For comprehensive documentation on all features, please see **[DOCUMENTATIONS.md](DOCUMENTATIONS.md)** which includes:

- 🗃️ **DDL Operations** - Create, alter, and drop tables
- 📤 **Data Export Tools** - Export data to CSV, JSON, and SQL formats
- 📥 **Data Import Tools** - Import data from CSV and JSON sources
- 💾 **Database Backup & Restore** - Full backup/restore with SQL dumps
- 🔄 **Data Migration Tools** - Copy, move, clone, compare, and sync table data
- 🔄 **Schema Versioning & Migrations** - Version control for database schema changes
- 💎 **Transaction Management** - ACID transactions with BEGIN, COMMIT, ROLLBACK
- 🔧 **Stored Procedures** - Create and execute stored procedures with IN/OUT/INOUT parameters
- 📋 **Usage Examples** - Real-world examples for all tools
- 🔍 **Query Logging & Automatic SQL Display** - See all SQL queries executed automatically
- 🔐 **Security Features** - Built-in security and best practices
- 🚀 **Bulk Operations** - High-performance batch processing
- 🛠️ **Troubleshooting** - Common issues and solutions
- 📄 **License** - MIT License details
- 🗺️ **Roadmap** - Upcoming features and improvements

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for the AI community**

*Help AI agents interact with MySQL databases safely and efficiently!*
