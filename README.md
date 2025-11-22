# MySQL MCP Server

A fully-featured **Model Context Protocol (MCP)** server for MySQL database integration with AI agents like Claude Desktop, Cline, Windsurf, and other MCP-compatible tools.

[![npm version](https://img.shields.io/npm/v/@berthojoris/mcp-mysql-server)](https://www.npmjs.com/package/@berthojoris/mcp-mysql-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Features

- ✅ **Full MCP Protocol Support** - Works with Claude Desktop, Cline, Windsurf, and any MCP-compatible AI agent
- 🔐 **Secure by Default** - Parameterized queries, SQL injection protection, permission-based access control
- 🛠️ **30 Powerful Tools** - Complete database operations (CRUD, DDL, queries, schema inspection, transactions, stored procedures, bulk operations)
- 🎛️ **Dynamic Per-Project Permissions** - Each AI agent can have different access levels
- 🗃️ **DDL Support** - Create, alter, and drop tables (when explicitly enabled)
- 💎 **Transaction Support** - Full ACID transaction management (BEGIN, COMMIT, ROLLBACK)
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

**Configuration (using local path - for development):**

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": [
        "C:\\DEKSTOP\\MCP\\mcp_mysql\\bin\\mcp-mysql.js",
        "mysql://user:password@localhost:3306/database",
        "list,read,utility"
      ]
    }
  }
}
```

**Configuration (using environment variables - alternative local approach):**

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": [
        "C:\\DEKSTOP\\MCP\\mcp_mysql\\dist\\mcp-server.js"
      ],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "3306",
        "DB_USER": "root",
        "DB_PASSWORD": "",
        "DB_NAME": "your_database",
        "MCP_PERMISSIONS": "list,read,utility"
      }
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
5. **🔐 Security** - Prevents unauthorized operations while being helpful

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

| Tool | Description | 

| Performance |
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

## 📚 Detailed Documentation

For comprehensive documentation on all features, please see **[DOCUMENTATIONS.md](DOCUMENTATIONS.md)** which includes:

- 🗃️ **DDL Operations** - Create, alter, and drop tables
- 📤 **Data Export Tools** - Export data to CSV format
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
