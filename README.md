# MySQL MCP Server

<div align="center">

**A production-ready Model Context Protocol (MCP) server for MySQL database integration with AI agents**

[![npm version](https://img.shields.io/npm/v/@berthojoris/mcp-mysql-server)](https://www.npmjs.com/package/@berthojoris/mysql-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@berthojoris/mysql-mcp)](https://www.npmjs.com/package/@berthojoris/mysql-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io/)

[Installation](#-installation) · [Quick Start](#-quick-start) · [Configuration](#-ai-agent-configuration) · [Permissions](#-permission-system) · [Tools](#-available-tools) · [Documentation](DOCUMENTATIONS.md)

</div>

---

## TL;DR - Quick Setup

```bash
# Run directly with npx (no installation needed)
npx @berthojoris/mysql-mcp mysql://user:pass@localhost:3306/mydb "list,read,utility"
```

Add to your AI agent config (`.mcp.json`, `.cursor/mcp.json`, etc.):

```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": ["-y", "@berthojoris/mysql-mcp", "mysql://user:pass@localhost:3306/mydb", "list,read,utility"]
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
- [Available Tools (119 total)](#-available-tools)
- [Documentation](#-detailed-documentation)
- [Comparison: MCP vs Manual Access](#-mysql-mcp-vs-manual-database-access)
- [License](#-license)

---

## Features

| Category | Description |
|----------|-------------|
| **Full MCP Support** | Works with Claude Code, Cursor, Windsurf, Zed, Cline, Kilo Code, Roo Code, Gemini CLI, OpenAI Codex, and any MCP-compatible AI agent |
| **Security First** | Parameterized queries, SQL injection protection, permission-based access control |
| **119 Powerful Tools** | Complete database operations including CRUD, DDL, transactions, stored procedures, backup/restore, migrations |
| **🆕 Category Filtering** | 22 documentation categories for intuitive, fine-grained access control (backward compatible with 10 legacy categories) |
| **Transaction Support** | Full ACID transaction management (BEGIN, COMMIT, ROLLBACK) |
| **Schema Migrations** | Version control for database schema with up/down migrations |
| **Dual Mode** | Run as MCP server OR as REST API |
| **TypeScript** | Fully typed with TypeScript definitions |

---

## Installation

### Option 1: Quick Start with npx (Recommended)

No installation required - run directly:

```bash
npx @berthojoris/mysql-mcp mysql://user:pass@localhost:3306/db "list,read,utility"
```

### Option 2: Global Installation

```bash
npm install -g @berthojoris/mysql-mcp
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

**Option 1: Single-Layer (Permissions Only) - Simple Setup**
```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": [
        "-y",
        "@berthojoris/mysql-mcp",
        "mysql://user:password@localhost:3306/database",
        "list,read,utility"
      ]
    }
  }
}
```

**Option 2: Dual-Layer (Permissions + Categories) - Recommended for Fine Control**
```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": [
        "-y",
        "@berthojoris/mysql-mcp",
        "mysql://user:password@localhost:3306/database",
        "list,read,utility",
        "database_discovery,crud_operations,custom_queries"
      ]
    }
  }
}
```

> **💡 Tip:** The dual-layer approach provides granular control. The 4th argument (permissions) controls broad access levels, while the 5th argument (categories) fine-tunes which specific tools are available.

<details>
<summary><strong>Multiple Database Configuration</strong></summary>

```json
{
  "mcpServers": {
    "mysql-prod": {
      "command": "npx",
      "args": [
        "-y",
        "@berthojoris/mysql-mcp",
        "mysql://reader:pass@prod-server:3306/prod_db",
        "list,read,utility"
      ]
    },
    "mysql-dev": {
      "command": "npx",
      "args": [
        "-y",
        "@berthojoris/mysql-mcp",
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
codex mcp add mysql -- npx -y @berthojoris/mysql-mcp mysql://user:pass@localhost:3306/db list,read,utility
```

**Manual TOML configuration:**

```toml
[mcp_servers.mysql]
command = "npx"
args = ["-y", "@berthojoris/mysql-mcp", "mysql://user:pass@localhost:3306/db", "list,read,utility"]
startup_timeout_sec = 20
```

<details>
<summary><strong>Advanced Codex Configuration</strong></summary>

**With environment variables:**

```toml
[mcp_servers.mysql]
command = "npx"
args = ["-y", "@berthojoris/mysql-mcp"]

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
args = ["-y", "@berthojoris/mysql-mcp", "mysql://reader:pass@prod:3306/prod_db", "list,read,utility"]
startup_timeout_sec = 30

# Development - Full Access
[mcp_servers.mysql-dev]
command = "npx"
args = ["-y", "@berthojoris/mysql-mcp", "mysql://root:pass@localhost:3306/dev_db", "list,read,create,update,delete,execute,ddl,utility"]
```

**Advanced options:**

```toml
[mcp_servers.mysql]
command = "npx"
args = ["-y", "@berthojoris/mysql-mcp", "mysql://user:pass@localhost:3306/db", "list,read,utility"]
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
          "@berthojoris/mysql-mcp",
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

**Option 1: Permissions Only (Simple)**

```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": ["-y", "@berthojoris/mysql-mcp"],
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

**Option 2: Permissions + Categories (Recommended)**

```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": ["-y", "@berthojoris/mysql-mcp"],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "3306",
        "DB_USER": "root",
        "DB_PASSWORD": "your_password",
        "DB_NAME": "your_database",
        "MCP_PERMISSIONS": "list,read,utility",
        "MCP_CATEGORIES": "database_discovery,performance_monitoring"
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

Control database access with a **dual-layer filtering system** that provides both broad and fine-grained control:

- **Layer 1 (Permissions)**: Broad operation-level control using legacy categories
- **Layer 2 (Categories)**: Optional fine-grained tool-level filtering using documentation categories

**Filtering Logic**: `Tool enabled = (Has Permission) AND (Has Category OR No categories specified)`

### 🆕 Documentation Categories (Recommended)

Use these categories for fine-grained control that matches the tool organization:

| Category | Tools Count | Description |
|----------|-------------|-------------|
| `database_discovery` | 4 | List databases, tables, schemas, relationships |
| `crud_operations` | 4 | Basic Create, Read, Update, Delete operations |
| `bulk_operations` | 3 | Bulk insert, update, delete with batching |
| `custom_queries` | 2 | Run custom SELECT or execute SQL |
| `schema_management` | 4 | CREATE/ALTER/DROP tables (DDL) |
| `utilities` | 4 | Connection testing, diagnostics, CSV export |
| `transaction_management` | 5 | BEGIN, COMMIT, ROLLBACK transactions |
| `stored_procedures` | 6 | Create, execute, manage stored procedures |
| `views_management` | 6 | Create, alter, drop views |
| `triggers_management` | 5 | Create, drop triggers |
| `functions_management` | 6 | Create, execute functions |
| `index_management` | 5 | Create, drop, analyze indexes |
| `constraint_management` | 7 | Foreign keys, unique, check constraints |
| `table_maintenance` | 8 | Analyze, optimize, repair tables |
| `server_management` | 9 | Process list, explain queries, server info |
| `performance_monitoring` | 10 | Metrics, slow queries, health checks |
| `cache_management` | 5 | Query cache stats and configuration |
| `query_optimization` | 2 | Analyze queries, get optimization hints |
| `backup_restore` | 5 | Backup/restore database and tables |
| `import_export` | 5 | Import/export JSON, CSV, SQL |
| `data_migration` | 5 | Copy, move, clone, sync table data |
| `schema_migrations` | 9 | Version control for database schema |

### Legacy Categories (Backward Compatible)

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

### Common Category Sets

#### Using Documentation Categories (Recommended)

| Environment | Categories | Description |
|-------------|------------|-------------|
| **Production Read-Only** | `database_discovery,utilities` | Safe exploration only |
| **Analytics & Reporting** | `database_discovery,crud_operations,custom_queries,performance_monitoring` | Read and analyze |
| **Data Entry** | `database_discovery,crud_operations,utilities` | Basic CRUD operations |
| **Data Management** | `database_discovery,crud_operations,bulk_operations,utilities` | CRUD + bulk operations |
| **Application Backend** | `database_discovery,crud_operations,bulk_operations,custom_queries,transaction_management` | Full app support |
| **Development & Testing** | `database_discovery,crud_operations,bulk_operations,custom_queries,schema_management,utilities,transaction_management` | Development access |
| **DBA & DevOps** | `database_discovery,schema_management,table_maintenance,backup_restore,schema_migrations,performance_monitoring` | Admin tasks |
| **Full Access** | *(leave empty)* | All 119 tools enabled |

#### Using Legacy Categories (Backward Compatible)

| Environment | Permissions | Description |
|-------------|-------------|-------------|
| **Production (Safe)** | `list,read,utility` | Read-only access |
| **Data Entry** | `list,read,create,utility` | Can add records |
| **Full Data Access** | `list,read,create,update,delete,utility` | All CRUD operations |
| **With Transactions** | `list,read,create,update,delete,transaction,utility` | CRUD + ACID |
| **Development** | `list,read,create,update,delete,execute,ddl,transaction,utility` | Full access |
| **DBA Tasks** | `list,ddl,utility` | Schema management only |

### Per-Project Configuration

#### Single-Layer: Permissions Only (Backward Compatible)

Use only the 2nd argument for broad permission-based filtering:

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": [
        "/path/to/bin/mcp-mysql.js",
        "mysql://user:password@localhost:3306/db",
        "list,read,utility"
      ]
    }
  }
}
```

**Result**: All tools within `list`, `read`, and `utility` permissions are enabled.

#### Dual-Layer: Permissions + Categories (Recommended for Fine Control)

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

**Result**: Only tools that have BOTH:
- Permission: `list`, `read`, OR `utility` AND
- Category: `database_discovery` OR `performance_monitoring`

**Enabled**: `list_databases`, `list_tables`, `read_table_schema`, `get_table_relationships`, `get_performance_metrics`, `get_slow_queries`, etc.

**Disabled**: `test_connection` (has `utility` permission but not in allowed categories), `read_records` (has `read` permission but category is `crud_operations`), etc.

#### Multiple Environments Example

```json
{
  "mcpServers": {
    "mysql-prod-readonly": {
      "command": "node",
      "args": [
        "/path/to/bin/mcp-mysql.js",
        "mysql://readonly:pass@prod:3306/app_db",
        "list,read,utility",
        "database_discovery,performance_monitoring"
      ]
    },
    "mysql-dev-full": {
      "command": "node",
      "args": [
        "/path/to/bin/mcp-mysql.js",
        "mysql://dev:pass@localhost:3306/dev_db",
        "list,read,create,update,delete,ddl,transaction,utility"
      ]
    },
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

---

## Available Tools

The MCP server provides **119 powerful tools** organized into categories:

### Quick Reference

**119 Tools Available** - Organized into 22 categories

| Category | Count | Key Tools |
|----------|-------|-----------|
| Database Discovery | 4 | `list_databases`, `list_tables`, `read_table_schema` |
| CRUD Operations | 4 | `create_record`, `read_records`, `update_record`, `delete_record` |
| Bulk Operations | 3 | `bulk_insert`, `bulk_update`, `bulk_delete` |
| Custom Queries | 2 | `run_query`, `execute_sql` |
| Schema Management | 4 | `create_table`, `alter_table`, `drop_table` |
| Transactions | 5 | `begin_transaction`, `commit_transaction`, `rollback_transaction` |
| Stored Procedures | 6 | `create_stored_procedure`, `execute_stored_procedure` |
| Views | 6 | `create_view`, `alter_view`, `drop_view` |
| Triggers | 5 | `create_trigger`, `drop_trigger` |
| Functions | 6 | `create_function`, `execute_function` |
| Indexes | 5 | `create_index`, `drop_index`, `analyze_index` |
| Constraints | 7 | `add_foreign_key`, `add_unique_constraint` |
| Table Maintenance | 8 | `analyze_table`, `optimize_table`, `repair_table` |
| Server Management | 9 | `show_process_list`, `explain_query` |
| Performance Monitoring | 10 | `get_performance_metrics`, `get_database_health_check` |
| Cache | 5 | `get_cache_stats`, `clear_cache` |
| Query Optimization | 2 | `analyze_query`, `get_optimization_hints` |
| Backup & Restore | 5 | `backup_database`, `restore_from_sql` |
| Import/Export | 5 | `export_table_to_json`, `import_from_csv` |
| Data Migration | 5 | `copy_table_data`, `sync_table_data` |
| Schema Migrations | 9 | `create_migration`, `apply_migrations` |
| Utilities | 4 | `test_connection`, `export_table_to_csv` |

> **📖 For detailed tool descriptions, parameters, and examples, see [DOCUMENTATIONS.md](DOCUMENTATIONS.md#🔧-complete-tools-reference)**

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

[Report Bug](https://github.com/berthojoris/mysql-mcp/issues) · [Request Feature](https://github.com/berthojoris/mysql-mcp/issues) · [Documentation](DOCUMENTATIONS.md)

</div>
