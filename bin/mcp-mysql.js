#!/usr/bin/env node

/**
 * MCP MySQL Server CLI
 * This script allows the MySQL MCP server to be run via NPX
 * It implements the Model Context Protocol using stdio transport
 */

const path = require("path");
const { spawn } = require("child_process");
require("dotenv").config();

// Get MySQL connection string, permissions, and optional categories
const args = process.argv.slice(2);
const mysqlUrl = args.shift();

let permissions;
let categories;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (permissions === undefined) {
    permissions = arg;
    continue;
  }

  if (categories === undefined) {
    categories = arg;
    continue;
  }
}

if (!mysqlUrl) {
  console.error("Error: MySQL connection URL is required");
  console.error(
    "Usage: mcp-mysql mysql://user:password@host:port/dbname [permissions] [categories]",
  );
  console.error("");
  console.error("Examples:");
  console.error("  # All tools enabled (no filtering)");
  console.error("  mcp-mysql mysql://root:pass@localhost:3306/mydb");
  console.error("");
  console.error("  # Permission-based filtering only (Layer 1)");
  console.error(
    '  mcp-mysql mysql://root:pass@localhost:3306/mydb "list,read,utility"',
  );
  console.error("");
  console.error(
    "  # Dual-layer: Permissions + Categories (fine-grained control)",
  );
  console.error(
    '  mcp-mysql mysql://root:pass@localhost:3306/mydb "list,read,utility" "database_discovery,performance_monitoring"',
  );
  console.error("");
  console.error("Permissions (Layer 1 - Broad Control):");
  console.error(
    "  list, read, create, update, delete, execute, ddl, utility, transaction, procedure",
  );
  console.error("");
  console.error("Categories (Layer 2 - Fine-Grained Control, Optional):");
  console.error(
    "  database_discovery, crud_operations, bulk_operations, custom_queries,",
  );
  console.error(
    "  schema_management, utilities, transaction_management, stored_procedures,",
  );
  console.error(
    "  views_management, triggers_management, functions_management, index_management,",
  );
  console.error(
    "  constraint_management, table_maintenance, server_management,",
  );
  console.error(
    "  performance_monitoring, cache_management, query_optimization,",
  );
  console.error(
    "  backup_restore, import_export, data_migration, schema_migrations",
  );
  console.error("");
  console.error("Filtering Logic:");
  console.error(
    "  - If only permissions: All tools within those permissions enabled",
  );
  console.error(
    "  - If permissions + categories: Only tools matching BOTH layers enabled",
  );
  console.error("  - If nothing specified: All tools enabled");
  process.exit(1);
}

// Parse the MySQL URL to extract connection details
let connectionConfig;
let database;
try {
  const url = new URL(mysqlUrl);

  // Remove leading slash from pathname and make database optional
  database = url.pathname.replace(/^\//, "") || null;

  // Extract username and password from auth
  const auth =
    url.username && url.password
      ? { user: url.username, password: url.password }
      : { user: url.username || "root", password: url.password || "" };

  connectionConfig = {
    host: url.hostname,
    port: url.port || 3306,
    ...auth,
    ...(database ? { database } : {}),
  };

  // Set environment variables for the server
  process.env.DB_HOST = connectionConfig.host;
  process.env.DB_PORT = connectionConfig.port;
  process.env.DB_USER = connectionConfig.user;
  process.env.DB_PASSWORD = connectionConfig.password;
  if (database) {
    process.env.DB_NAME = database;
  }
} catch (error) {
  console.error("Error parsing MySQL URL:", error.message);
  console.error(
    "Usage: npx @berthojoris/mcp-mysql-server mysql://user:password@host:port/dbname",
  );
  process.exit(1);
}

const dbMessage = database
  ? `${connectionConfig.host}:${connectionConfig.port}/${database}`
  : `${connectionConfig.host}:${connectionConfig.port} (no specific database selected)`;

// Set permissions/categories as environment variables if provided
if (permissions) {
  process.env.MCP_PERMISSIONS = permissions;
  console.error(`Permissions (Layer 1): ${permissions}`);
}

if (categories) {
  process.env.MCP_CATEGORIES = categories;
  console.error(`Categories (Layer 2): ${categories}`);
}

if (!permissions && !categories) {
  console.error("Access Control: All tools enabled (no filtering)");
} else if (permissions && categories) {
  console.error("Filtering Mode: Dual-layer (Permissions + Categories)");
} else if (permissions && !categories) {
  console.error("Filtering Mode: Permission-based only");
} else if (!permissions && categories) {
  console.error("Filtering Mode: Category-only");
}

// Log to stderr (not stdout, which is used for MCP protocol)
console.error(`Starting MySQL MCP server with connection to ${dbMessage}`);

// Run the MCP server
try {
  // Determine the path to the compiled MCP server file
  const serverPath = path.resolve(__dirname, "../dist/mcp-server.js");

  // Spawn the MCP server process with stdio transport
  // stdin/stdout are used for MCP protocol communication
  // stderr is used for logging
  const server = spawn("node", [serverPath], {
    stdio: ["inherit", "inherit", "inherit"],
    env: process.env,
  });

  // Handle server process events
  server.on("error", (err) => {
    console.error("Failed to start MCP server:", err);
    process.exit(1);
  });

  server.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`MCP server exited with code ${code}`);
      process.exit(code);
    }
  });

  // Handle termination signals
  process.on("SIGINT", () => {
    console.error("Shutting down MySQL MCP server...");
    server.kill("SIGINT");
  });

  process.on("SIGTERM", () => {
    console.error("Shutting down MySQL MCP server...");
    server.kill("SIGTERM");
  });
} catch (error) {
  console.error("Error starting MCP server:", error.message);
  process.exit(1);
}
