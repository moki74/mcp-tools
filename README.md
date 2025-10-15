# MySQL MCP Server

A fully-featured **Model Context Protocol (MCP)** server for MySQL database integration with AI agents like Claude Desktop, Cline, Windsurf, and other MCP-compatible tools.

[![npm version](https://img.shields.io/npm/v/@modelcontextprotocol/server-mysql)](https://www.npmjs.com/package/@modelcontextprotocol/server-mysql)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Features

- ✅ **Full MCP Protocol Support** - Works with Claude Desktop, Cline, Windsurf, and any MCP-compatible AI agent
- 🔒 **Secure by Default** - Parameterized queries, SQL injection protection, permission-based access control
- 🛠️ **21 Powerful Tools** - Complete database operations (CRUD, DDL, queries, schema inspection, transactions)
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
npx @modelcontextprotocol/server-mysql mysql://user:pass@localhost:3306/db "list,read,utility"
```

### Option 2: Clone and Build

```bash
git clone <your-repo-url>
cd mcp_mysql
npm install
npm run build
```

### Option 3: Global Installation

```bash
npm install -g @modelcontextprotocol/server-mysql
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

**Configuration:**

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": [
        "C:\\path\\to\\mcp_mysql\\bin\\mcp-mysql.js",
        "mysql://user:password@localhost:3306/database",
        "list,read,utility"
      ]
    }
  }
}
```

**Or use npx (if published):**

```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-mysql",
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

The MCP server provides **21 powerful tools**:

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

**Development (Full Access):**
```
list,read,create,update,delete,execute,ddl,utility
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
      "command": "node",
      "args": [
        "C:\\path\\to\\bin\\mcp-mysql.js",
        "mysql://reader:pass@prod-server:3306/prod_db",
        "list,read,utility"
      ]
    },
    "mysql-dev": {
      "command": "node",
      "args": [
        "C:\\path\\to\\bin\\mcp-mysql.js",
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
# Test connection
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

## 🚀 Publishing to npm

To make your MCP server available to the world:

### 1. Update package.json

```json
{
  "name": "@your-username/mcp-mysql",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/mcp-mysql.git"
  }
}
```

### 2. Build

```bash
npm run build
```

### 3. Publish

```bash
# Login to npm
npm login

# Publish (for scoped packages)
npm publish --access public
```

### 4. Users Can Install

```bash
npx @your-username/mcp-mysql mysql://user:pass@localhost:3306/db "list,read,utility"
```

---

## 🐛 Troubleshooting

### MCP Server Not Connecting

**Problem:** AI agent doesn't see tools

**Solutions:**
1. Check config file path is correct
2. Restart AI agent completely  
3. Verify bin/mcp-mysql.js exists
4. Check for JSON syntax errors

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
mcp_mysql/
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

- **Issues:** [GitHub Issues](https://github.com/your-username/mcp-mysql/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-username/mcp-mysql/discussions)
- **Documentation:** This README

---

## 🗺️ Roadmap

- ✅ **Transaction support (BEGIN, COMMIT, ROLLBACK)** - **COMPLETED!**
- [ ] Stored procedure execution
- [ ] Bulk operations
- [ ] Query result caching
- [ ] PostgreSQL adapter
- [ ] MongoDB adapter
- [ ] SQLite adapter

---

**Made with ❤️ for the AI community**

*Help AI agents interact with MySQL databases safely and efficiently!*
