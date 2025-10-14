#!/usr/bin/env node

/**
 * MCP MySQL Server CLI
 * This script allows the MySQL MCP server to be run via NPX
 * It implements the Model Context Protocol using stdio transport
 */

const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config();

// Get MySQL connection string and optional permissions from command line arguments
const mysqlUrl = process.argv[2];
const permissions = process.argv[3]; // Optional: comma-separated list of permissions

if (!mysqlUrl) {
  console.error('Error: MySQL connection URL is required');
  console.error('Usage: mcp-mysql mysql://user:password@host:port/dbname [permissions]');
  console.error('');
  console.error('Examples:');
  console.error('  mcp-mysql mysql://root:pass@localhost:3306/mydb');
  console.error('  mcp-mysql mysql://root:pass@localhost:3306/mydb "list,read,utility"');
  console.error('  mcp-mysql mysql://root:pass@localhost:3306/mydb "list,read,create,update,delete,utility"');
  console.error('');
  console.error('Available permissions: list, read, create, update, delete, execute, utility');
  console.error('If not specified, all permissions are enabled.');
  process.exit(1);
}

// Parse the MySQL URL to extract connection details
let connectionConfig;
let database;
try {
  const url = new URL(mysqlUrl);
  
  // Remove leading slash from pathname and make database optional
  database = url.pathname.replace(/^\//, '') || null;
  
  // Extract username and password from auth
  const auth = url.username && url.password 
    ? { user: url.username, password: url.password }
    : { user: url.username || 'root', password: url.password || '' };
  
  connectionConfig = {
    host: url.hostname,
    port: url.port || 3306,
    ...auth,
    ...(database ? { database } : {})
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
  console.error('Error parsing MySQL URL:', error.message);
  console.error('Usage: npx @modelcontextprotocol/server-mysql mysql://user:password@host:port/dbname');
  process.exit(1);
}

const dbMessage = database 
  ? `${connectionConfig.host}:${connectionConfig.port}/${database}`
  : `${connectionConfig.host}:${connectionConfig.port} (no specific database selected)`;

// Set permissions as environment variable if provided
if (permissions) {
  process.env.MCP_PERMISSIONS = permissions;
  console.error(`Permissions: ${permissions}`);
} else {
  console.error('Permissions: all (default)');
}

// Log to stderr (not stdout, which is used for MCP protocol)
console.error(`Starting MySQL MCP server with connection to ${dbMessage}`);

// Run the MCP server
try {
  // Determine the path to the compiled MCP server file
  const serverPath = path.resolve(__dirname, '../dist/mcp-server.js');
  
  // Spawn the MCP server process with stdio transport
  // stdin/stdout are used for MCP protocol communication
  // stderr is used for logging
  const server = spawn('node', [serverPath], {
    stdio: ['inherit', 'inherit', 'inherit'],
    env: process.env
  });
  
  // Handle server process events
  server.on('error', (err) => {
    console.error('Failed to start MCP server:', err);
    process.exit(1);
  });
  
  server.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`MCP server exited with code ${code}`);
      process.exit(code);
    }
  });
  
  // Handle termination signals
  process.on('SIGINT', () => {
    console.error('Shutting down MySQL MCP server...');
    server.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.error('Shutting down MySQL MCP server...');
    server.kill('SIGTERM');
  });
  
} catch (error) {
  console.error('Error starting MCP server:', error.message);
  process.exit(1);
}