# MySQL MCP Server

<div align="center">

**A production-ready Model Context Protocol (MCP) server for MySQL database integration with AI agents**

**Last Updated:** 2025-12-19 03:59:00

[![npm version](https://img.shields.io/npm/v/@berthojoris/mcp-mysql-server)](https://www.npmjs.com/package/@berthojoris/mysql-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@berthojoris/mysql-mcp)](https://www.npmjs.com/package/@berthojoris/mysql-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io/)

[Installation](#-installation) · [Quick Start](#-quick-start) · [Configuration](#-ai-agent-configuration) · [Permissions](#-permission-system) · [Tools](#-available-tools) · [Documentation](DOCUMENTATIONS.md)

</div>

---

## TL;DR - Quick Setup

Run directly with `npx`:

```bash
npx @berthojoris/mysql-mcp mysql://user:pass@localhost:3306/mydb "list,read,utility"
```

Add to your AI agent config (`.mcp.json`, `.cursor/mcp.json`, etc.):

```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": [
        "-y",
        "@berthojoris/mysql-mcp",
        "mysql://user:pass@localhost:3306/mydb",
        "list,read,utility"
      ]
    }
  }
}
```

For agent-specific examples (Codex TOML, Zed, local path, multi-DB), see **[DOCUMENTATIONS.md → Setup & Configuration](DOCUMENTATIONS.md#setup--configuration-extended)**.

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

Most AI agents use a similar JSON configuration format (the file location varies by tool).

If you want ready-to-copy snippets per client (Claude Code/Cursor/Windsurf/Cline/Codex/Zed), see **[DOCUMENTATIONS.md → Agent Configuration Examples](DOCUMENTATIONS.md#agent-configuration-examples)**.

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
        "list,read,utility,create,update,ddl"
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
        "mysql://user:password@localhost:3306/database_name_here",
        "list,read,utility,create,update,ddl",
        "database_discovery,crud_operations,custom_queries,schema_management,index_management,constraint_management,table_maintenance,query_optimization,analysis"
      ]
    }
  }
}
```

> **💡 Tip:** The dual-layer approach provides granular control. The 4th argument (permissions) controls broad access levels, while the 5th argument (categories) fine-tunes which specific tools are available.

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

For more client-specific config snippets, see **[DOCUMENTATIONS.md → Setup & Configuration](DOCUMENTATIONS.md#setup--configuration-extended)**.

---

## Permission System

Control database access with a **dual-layer filtering system** that provides both broad and fine-grained control:

- **Layer 1 (Permissions)**: Broad operation-level control using legacy categories
- **Layer 2 (Categories)**: Optional fine-grained tool-level filtering using documentation categories

**Filtering Logic**: `Tool enabled = (Has Permission) AND (Has Category OR No categories specified)`

### Documentation Categories (Recommended)

Use documentation categories to fine-tune which tools are exposed (Layer 2):

<table>
  <thead>
    <tr>
      <th align="left">Category A</th>
      <th align="left">Category B</th>
      <th align="left">Category C</th>
      <th align="left">Category D</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>database_discovery</code></td>
      <td><code>crud_operations</code></td>
      <td><code>bulk_operations</code></td>
      <td><code>custom_queries</code></td>
    </tr>
    <tr>
      <td><code>schema_management</code></td>
      <td><code>utilities</code></td>
      <td><code>transaction_management</code></td>
      <td><code>stored_procedures</code></td>
    </tr>
    <tr>
      <td><code>views_management</code></td>
      <td><code>triggers_management</code></td>
      <td><code>functions_management</code></td>
      <td><code>index_management</code></td>
    </tr>
    <tr>
      <td><code>constraint_management</code></td>
      <td><code>table_maintenance</code></td>
      <td><code>server_management</code></td>
      <td><code>performance_monitoring</code></td>
    </tr>
    <tr>
      <td><code>cache_management</code></td>
      <td><code>query_optimization</code></td>
      <td><code>backup_restore</code></td>
      <td><code>import_export</code></td>
    </tr>
    <tr>
      <td><code>data_migration</code></td>
      <td><code>schema_migrations</code></td>
      <td><code>analysis</code></td>
      <td><code>ai_enhancement</code></td>
    </tr>
  </tbody>
</table>

<details>
  <summary>Copy/paste list (comma-separated, no spaces)</summary>

```text
database_discovery,crud_operations,bulk_operations,custom_queries,schema_management,utilities,transaction_management,stored_procedures,views_management,triggers_management,functions_management,index_management,constraint_management,table_maintenance,server_management,performance_monitoring,cache_management,query_optimization,backup_restore,import_export,data_migration,schema_migrations,analysis,ai_enhancement
```

</details>

Full category → tool mapping (and examples) lives in **[DOCUMENTATIONS.md → Category Filtering System](DOCUMENTATIONS.md#🆕-category-filtering-system)**.

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

Common configuration examples are documented in **[DOCUMENTATIONS.md → Category Filtering System](DOCUMENTATIONS.md#🆕-category-filtering-system)**.

---

## Available Tools

The server exposes **145 tools** organized into categories (CRUD, schema, backups, migrations, perf/monitoring, and AI enhancement).

- Complete list of tools: **[DOCUMENTATIONS.md → Complete Tools Reference](DOCUMENTATIONS.md#🔧-complete-tools-reference)**
- AI enhancement tools overview: **[DOCUMENTATIONS.md → AI Enhancement Tools](DOCUMENTATIONS.md#🤖-ai-enhancement-tools)**

### 🤖 AI Enhancement Tools

The full **Phase 1–3 (implemented)** overview, examples, and per-tool documentation lives in **[DOCUMENTATIONS.md](DOCUMENTATIONS.md#🤖-ai-enhancement-tools)**.

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
- **🤖 AI Enhancement** - Natural language to SQL, smart data discovery, schema design, security audit, index recommendations, data generation, visualization, and forecasting (Phase 1-3)
- **Query Logging** - See all SQL queries executed automatically
- **Security Features** - Built-in security and best practices
- **Bulk Operations** - High-performance batch processing
- **Troubleshooting** - Common issues and solutions

---

## MySQL MCP vs Manual Database Access

This MySQL MCP is a **powerful intermediary layer** between AI assistants and MySQL databases.

For full feature coverage and usage examples, see **[DOCUMENTATIONS.md](DOCUMENTATIONS.md)**.

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with care for the AI development community**

*Enabling AI agents to interact with MySQL databases safely and efficiently*

[Report Bug](https://github.com/berthojoris/mysql-mcp/issues) · [Request Feature](https://github.com/berthojoris/mysql-mcp/issues) · [Documentation](DOCUMENTATIONS.md)

</div>
