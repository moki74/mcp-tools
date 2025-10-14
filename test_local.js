/**
 * MySQL MCP Local Test Script
 * 
 * This script tests the MySQL MCP library functionality locally.
 * Make sure you have configured your .env file before running.
 */

// Since this is a TypeScript project, we need to require the compiled JS
const { MySQLMCP } = require('./dist');

// Create colored console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Helper function to log test results
function logTest(name, result) {
  const status = result.status === 'success' 
    ? `${colors.green}✓ SUCCESS${colors.reset}` 
    : `${colors.red}✗ FAILED${colors.reset}`;
  
  console.log(`\n${colors.bright}${colors.cyan}TEST:${colors.reset} ${name}`);
  console.log(`${colors.bright}STATUS:${colors.reset} ${status}`);
  
  if (result.status === 'error') {
    console.log(`${colors.bright}ERROR:${colors.reset} ${result.error}`);
  } else if (result.data) {
    console.log(`${colors.bright}DATA:${colors.reset}`);
    console.log(colors.dim);
    console.dir(result.data, { depth: 4, colors: true });
    console.log(colors.reset);
  }
}

// Main test function
async function runTests() {
  console.log(`\n${colors.bright}${colors.magenta}=== MySQL MCP Local Test ====${colors.reset}\n`);
  
  // Initialize MCP
  const mcp = new MySQLMCP();
  
  try {
    // Test 1: Connection Test
    console.log(`${colors.blue}Testing database connection...${colors.reset}`);
    const connectionTest = await mcp.testConnection();
    logTest('Connection Test', connectionTest);
    
    if (connectionTest.status !== 'success') {
      console.log(`${colors.red}${colors.bright}Connection failed. Please check your .env configuration.${colors.reset}`);
      return;
    }
    
    // Test 2: Feature Configuration Status
    console.log(`\n${colors.blue}Checking feature configuration...${colors.reset}`);
    const featureStatus = mcp.getFeatureStatus();
    logTest('Feature Configuration', featureStatus);
    
    // Test 3: List Tables
    console.log(`\n${colors.blue}Listing database tables...${colors.reset}`);
    const tables = await mcp.listTables({});
    logTest('List Tables', tables);
    
    if (tables.status === 'success' && tables.data.length > 0) {
      const tableName = tables.data[0];
      
      // Test 4: Table Schema
      console.log(`\n${colors.blue}Reading schema for table: ${tableName}...${colors.reset}`);
      const schema = await mcp.readTableSchema({ table_name: tableName });
      logTest(`Table Schema (${tableName})`, schema);
      
      // Test 5: Read Records
      console.log(`\n${colors.blue}Reading records from table: ${tableName}...${colors.reset}`);
      const records = await mcp.readRecords({ 
        table_name: tableName,
        pagination: { page: 1, limit: 5 }
      });
      logTest(`Read Records (${tableName})`, records);
      
      // Test 6: Run Query
      console.log(`\n${colors.blue}Running a SELECT query on table: ${tableName}...${colors.reset}`);
      const query = await mcp.runQuery({ 
        query: `SELECT * FROM ${tableName} LIMIT 3` 
      });
      logTest('Run Query', query);
    }
    
    // Test 7: Connection Info
    console.log(`\n${colors.blue}Getting connection information...${colors.reset}`);
    const connectionInfo = await mcp.describeConnection();
    logTest('Connection Info', connectionInfo);
    
  } catch (error) {
    console.log(`\n${colors.red}${colors.bright}ERROR:${colors.reset} ${error.message}`);
    console.log(error.stack);
  } finally {
    // Close the connection
    console.log(`\n${colors.blue}Closing database connection...${colors.reset}`);
    await mcp.close();
    console.log(`${colors.green}Connection closed.${colors.reset}`);
    
    console.log(`\n${colors.bright}${colors.magenta}=== Test Complete ====${colors.reset}\n`);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}${colors.bright}UNHANDLED ERROR:${colors.reset}`, error);
  process.exit(1);
});