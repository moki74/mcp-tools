# MySQL MCP Server

<div align="center">

**A production-ready Model Context Protocol (MCP) server for MySQL database integration with AI agents**

[![npm version](https://img.shields.io/npm/v/@berthojoris/mcp-mysql-server)](https://www.npmjs.com/package/@berthojoris/mcp-mysql-server)
[![npm downloads](https://img.shields.io/npm/dm/@berthojoris/mcp-mysql-server)](https://www.npmjs.com/package/@berthojoris/mcp-mysql-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io/)

[Installation](#-installation) · [Quick Start](#-quick-start) · [Configuration](#-ai-agent-configuration) · [Permissions](#-permission-system) · [Tools](#-available-tools) · [Documentation](DOCUMENTATIONS.md)

</div>

---

## TL;DR - Quick Setup

```bash
# Run directly with npx (no installation needed)
npx @berthojoris/mcp-mysql-server mysql://user:pass@localhost:3306/mydb "list,read,utility"
```

Add to your AI agent config (`.mcp.json`, `.cursor/mcp.json`, etc.):

```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": ["-y", "@berthojoris/mcp-mysql-server", "mysql://user:pass@localhost:3306/mydb", "list,read,utility"]
    }
  }
}
```

---

## Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [AI Agent Configuration](#-ai-agent-configuration)
  - [Standard JSON Config](#standard-json-configuration)
  - [OpenAI Codex (TOML)](#openai-codex-cli--vs-code-extension)
  - [Zed IDE](#zed-ide)
  - [Environment Variables](#environment-variables-configuration)
  - [Local Development](#local-path-configuration)
- [Permission System](#-permission-system)
- [Available Tools (98 total)](#-available-tools)
- [Documentation](#-detailed-documentation)
- [Comparison: MCP vs Manual Access](#-mysql-mcp-vs-manual-database-access)
- [License](#-license)

---

## Features

| Category | Description |
|----------|-------------|
| **Full MCP Support** | Works with Claude Code, Cursor, Windsurf, Zed, Cline, Kilo Code, Roo Code, Gemini CLI, OpenAI Codex, and any MCP-compatible AI agent |
| **Security First** | Parameterized queries, SQL injection protection, permission-based access control |
| **98 Powerful Tools** | Complete database operations including CRUD, DDL, transactions, stored procedures, backup/restore, migrations |
| **Granular Permissions** | 10 permission categories for fine-grained access control per project |
| **Transaction Support** | Full ACID transaction management (BEGIN, COMMIT, ROLLBACK) |
| **Schema Migrations** | Version control for database schema with up/down migrations |
| **Dual Mode** | Run as MCP server OR as REST API |
| **TypeScript** | Fully typed with TypeScript definitions |

---

## Installation

### Option 1: Quick Start with npx (Recommended)

No installation required - run directly:

```bash
npx @berthojoris/mcp-mysql-server mysql://user:pass@localhost:3306/db "list,read,utility"
```

### Option 2: Global Installation

```bash
npm install -g @berthojoris/mcp-mysql-server
mcp-mysql mysql://user:pass@localhost:3306/db "list,read,utility"
```

---

## Quick Start

### 1. Set Up Environment (Optional)

Create `.env` file for local development:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=yourdatabase
MCP_CONFIG=list,read,utility
```

### 2. Build Project (If Cloned Locally)

```bash
npm install
npm run build
```

### 3. Configure Your AI Agent

See [AI Agent Configuration](#-ai-agent-configuration) section below.

### 4. Restart Your AI Agent

Completely restart your AI agent application to load the MCP server.

### 5. Test It!

Try asking your AI:

> "What databases are available?"
> "Show me all tables in my database"
> "What's the structure of the users table?"
> "Show me the first 5 records from users"

---

## AI Agent Configuration

### Standard JSON Configuration

Most AI agents use a similar JSON configuration format. Use the appropriate config file for your tool:

| AI Agent | Config File Location |
|----------|---------------------|
| **Claude Code** | `.mcp.json` (project root) or `~/.mcp.json` (global) |
| **Cursor** | `.cursor/mcp.json` |
| **Windsurf** | `~/.codeium/windsurf/mcp_config.json` |
| **Cline** | VS Code settings or Cline config file |
| **Gemini CLI** | `~/.gemini/settings.json` |
| **Kilo Code** | VS Code MCP settings |
| **Roo Code** | VS Code MCP settings |
| **Trae AI** | MCP configuration in settings |
| **Qwen Code** | MCP configuration in settings |
| **Droid CLI** | MCP configuration in settings |

**Universal Configuration Template:**

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

<details>
<summary><strong>Multiple Database Configuration</strong></summary>

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

</details>

---

### OpenAI Codex CLI & VS Code Extension

OpenAI Codex uses TOML format in `~/.codex/config.toml`.

**Quick setup via CLI:**

```bash
codex mcp add mysql -- npx -y @berthojoris/mcp-mysql-server mysql://user:pass@localhost:3306/db list,read,utility
```

**Manual TOML configuration:**

```toml
[mcp_servers.mysql]
command = "npx"
args = ["-y", "@berthojoris/mcp-mysql-server", "mysql://user:pass@localhost:3306/db", "list,read,utility"]
startup_timeout_sec = 20
```

<details>
<summary><strong>Advanced Codex Configuration</strong></summary>

**With environment variables:**

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

**Multiple databases:**

```toml
# Production - Read Only
[mcp_servers.mysql-prod]
command = "npx"
args = ["-y", "@berthojoris/mcp-mysql-server", "mysql://reader:pass@prod:3306/prod_db", "list,read,utility"]
startup_timeout_sec = 30

# Development - Full Access
[mcp_servers.mysql-dev]
command = "npx"
args = ["-y", "@berthojoris/mcp-mysql-server", "mysql://root:pass@localhost:3306/dev_db", "list,read,create,update,delete,execute,ddl,utility"]
```

**Advanced options:**

```toml
[mcp_servers.mysql]
command = "npx"
args = ["-y", "@berthojoris/mcp-mysql-server", "mysql://user:pass@localhost:3306/db", "list,read,utility"]
startup_timeout_sec = 20        # Server startup timeout (default: 10)
tool_timeout_sec = 120          # Per-tool execution timeout (default: 60)
enabled = true                  # Set false to disable without deleting
# enabled_tools = ["list_tables", "read_records"]  # Optional: limit exposed tools
# disabled_tools = ["drop_table", "delete_record"] # Optional: hide specific tools
```

**Codex management commands:**

```bash
codex mcp list          # List all configured MCP servers
codex mcp list --json   # List with JSON output
codex mcp remove mysql  # Remove an MCP server
codex mcp get mysql     # Get details about a specific server
```

</details>

---

### Zed IDE

Zed IDE uses a different structure in `~/.config/zed/settings.json`:

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

---

### Environment Variables Configuration

Alternative approach using environment variables instead of connection string:

```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": ["-y", "@berthojoris/mcp-mysql-server"],
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

---

### Local Path Configuration

For development or when you need full control over the source code:

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

<details>
<summary><strong>When to Use Local Path</strong></summary>

Use local path configuration when you:

- Want full control over the version and source code
- Need offline access without internet dependency
- Want to modify the source for custom functionality
- Need faster startup without package download
- Are developing/debugging the MCP server
- Have network restrictions or security policies

| Feature | Local Path | NPX |
|---------|------------|-----|
| **Control** | Full control over code | Depends on npm registry |
| **Offline** | Works completely offline | Requires internet |
| **Speed** | Instant startup | Download time |
| **Customization** | Can modify source | Limited to published version |
| **Updates** | Manual updates | Automatic updates |
| **Setup** | Requires building | Zero setup |

**Setup requirements:**

```bash
cd /path/to/mcp_mysql
npm install
npm run build
```

**Available binaries:**

- `bin/mcp-mysql.js` - CLI wrapper with argument parsing
- `dist/mcp-server.js` - Direct server executable

**Path tips:**

- Windows: Use double backslashes `\\` in JSON
- Cross-platform: Use forward slashes `/` if supported
- Always use absolute paths for reliability

</details>

---

## Permission System

Control database access with granular permission categories:

### Permission Categories

| Permission | Operations | Use Case |
|------------|------------|----------|
| `list` | List databases, tables, schemas | Database exploration |
| `read` | SELECT queries, read data | Analytics, reporting |
| `create` | INSERT new records | Data entry |
| `update` | UPDATE existing records | Data maintenance |
| `delete` | DELETE records | Data cleanup |
| `execute` | Execute custom SQL (DML) + Advanced SQL | Complex operations |
| `ddl` | CREATE/ALTER/DROP tables | Schema management |
| `procedure` | Stored procedures (CREATE/DROP/EXECUTE) | Procedure management |
| `transaction` | BEGIN, COMMIT, ROLLBACK | ACID operations |
| `utility` | Connection testing, diagnostics | Troubleshooting |

### Common Permission Sets

| Environment | Permissions | Description |
|-------------|-------------|-------------|
| **Production (Safe)** | `list,read,utility` | Read-only access |
| **Data Entry** | `list,read,create,utility` | Can add records |
| **Full Data Access** | `list,read,create,update,delete,utility` | All CRUD operations |
| **With Transactions** | `list,read,create,update,delete,transaction,utility` | CRUD + ACID |
| **Development** | `list,read,create,update,delete,execute,ddl,transaction,utility` | Full access |
| **DBA Tasks** | `list,ddl,utility` | Schema management only |

### Per-Project Configuration

Each project can have different permissions - specify as the second argument after the connection string:

```json
{
  "args": [
    "mysql://user:pass@localhost:3306/db",
    "list,read,utility"
  ]
}
```

---

## Available Tools

The MCP server provides **119 powerful tools** organized into categories:

### Quick Reference

| Category | Count | Key Tools |
|----------|-------|-----------|
| [Database Discovery](#database-discovery) | 4 | `list_databases`, `list_tables`, `read_table_schema` |
| [CRUD Operations](#data-operations---crud) | 4 | `create_record`, `read_records`, `update_record`, `delete_record` |
| [Bulk Operations](#bulk-operations) | 3 | `bulk_insert`, `bulk_update`, `bulk_delete` |
| [Custom Queries](#custom-queries) | 2 | `run_query`, `execute_sql` |
| [Schema Management](#schema-management---ddl) | 4 | `create_table`, `alter_table`, `drop_table`, `execute_ddl` |
| [Transactions](#transaction-management) | 5 | `begin_transaction`, `commit_transaction`, `rollback_transaction` |
| [Stored Procedures](#stored-procedures) | 6 | `create_stored_procedure`, `execute_stored_procedure` |
| [Views](#views-management) | 6 | `create_view`, `alter_view`, `drop_view` |
| [Triggers](#triggers-management) | 5 | `create_trigger`, `drop_trigger` |
| [Functions](#functions-management) | 6 | `create_function`, `execute_function` |
| [Indexes](#index-management) | 5 | `create_index`, `drop_index`, `analyze_index` |
| [Constraints](#constraint-management) | 7 | `add_foreign_key`, `add_unique_constraint` |
| [Table Maintenance](#table-maintenance) | 8 | `analyze_table`, `optimize_table`, `repair_table` |
| [Server Management](#process--server-management) | 9 | `show_process_list`, `explain_query` |
| [Performance Monitoring](#performance-monitoring) | 10 | `get_performance_metrics`, `get_database_health_check` |
| [Cache](#cache-management) | 5 | `get_cache_stats`, `clear_cache` |
| [Query Optimization](#query-optimization) | 2 | `analyze_query`, `get_optimization_hints` |
| [Backup & Restore](#database-backup--restore) | 5 | `backup_database`, `restore_from_sql` |
| [Import/Export](#data-importexport) | 5 | `export_table_to_json`, `import_from_csv` |
| [Data Migration](#data-migration) | 5 | `copy_table_data`, `sync_table_data` |
| [Schema Migrations](#schema-versioning--migrations) | 9 | `create_migration`, `apply_migrations` |
| [Utilities](#utilities) | 4 | `test_connection`, `export_table_to_csv` |

---

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

---

## Detailed Documentation

For comprehensive documentation, see **[DOCUMENTATIONS.md](DOCUMENTATIONS.md)**:

- **DDL Operations** - Create, alter, and drop tables
- **Data Export Tools** - Export to CSV, JSON, and SQL formats
- **Data Import Tools** - Import from CSV and JSON sources
- **Database Backup & Restore** - Full backup/restore with SQL dumps
- **Data Migration Tools** - Copy, move, clone, compare, and sync data
- **Schema Versioning** - Version control for database schema changes
- **Transaction Management** - ACID transactions
- **Stored Procedures** - Create and execute with IN/OUT/INOUT parameters
- **Query Logging** - See all SQL queries executed automatically
- **Security Features** - Built-in security and best practices
- **Bulk Operations** - High-performance batch processing
- **Troubleshooting** - Common issues and solutions

---

## MySQL MCP vs Manual Database Access

This MySQL MCP is a **powerful intermediary layer** between AI assistants and MySQL databases.

| Comparison Topic | Documentation |
|------------------|---------------|
| Data Access & Querying | [docs/comparison/data-access-querying.md](docs/comparison/data-access-querying.md) |
| Data Analysis | [docs/comparison/data-analysis.md](docs/comparison/data-analysis.md) |
| Data Validation | [docs/comparison/data-validation.md](docs/comparison/data-validation.md) |
| Schema Inspection | [docs/comparison/schema-inspection.md](docs/comparison/schema-inspection.md) |
| Debugging & Diagnostics | [docs/comparison/debugging-diagnostics.md](docs/comparison/debugging-diagnostics.md) |
| Advanced Operations | [docs/comparison/advanced-operations.md](docs/comparison/advanced-operations.md) |
| Key Benefits | [docs/comparison/key-benefits.md](docs/comparison/key-benefits.md) |
| Example Workflows | [docs/comparison/example-workflows.md](docs/comparison/example-workflows.md) |
| When to Use | [docs/comparison/when-to-use.md](docs/comparison/when-to-use.md) |

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with care for the AI development community**

*Enabling AI agents to interact with MySQL databases safely and efficiently*

[Report Bug](https://github.com/berthojoris/mcp-mysql-server/issues) · [Request Feature](https://github.com/berthojoris/mcp-mysql-server/issues) · [Documentation](DOCUMENTATIONS.md)

</div>
