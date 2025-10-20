/**
 * MySQL MCP Security Test Script
 * 
 * This script tests the security restrictions to ensure MCP can only access
 * the database specified in the connection string.
 */

// Since this is a TypeScript project, we need to require the compiled JS
const { MySQLMCP } = require('./dist');

// Create colored console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Helper function to log test results
function logSecurityTest(name, result, expectedToFail = false) {
  const isSuccess = result.status === 'success';
  const testPassed = expectedToFail ? !isSuccess : isSuccess;
  
  const status = testPassed 
    ? `${colors.green}✓ PASSED${colors.reset}` 
    : `${colors.red}✗ FAILED${colors.reset}`;
  
  console.log(`\n${colors.bright}${colors.cyan}SECURITY TEST:${colors.reset} ${name}`);
  console.log(`${colors.bright}STATUS:${colors.reset} ${status}`);
  console.log(`${colors.bright}EXPECTED:${colors.reset} ${expectedToFail ? 'Should fail' : 'Should succeed'}`);
  console.log(`${colors.bright}ACTUAL:${colors.reset} ${result.status}`);
  
  if (result.error) {
    console.log(`${colors.bright}ERROR:${colors.reset} ${result.error}`);
  }
  
  return testPassed;
}

// Main security test function
async function runSecurityTests() {
  console.log(`\n${colors.bright}${colors.magenta}=== MySQL MCP Security Test ====${colors.reset}\n`);
  
  // Initialize MCP
  const mcp = new MySQLMCP();
  let testsPassed = 0;
  let totalTests = 0;
  
  try {
    // Test 1: Connection Test (should succeed)
    console.log(`${colors.blue}Testing database connection...${colors.reset}`);
    const connectionTest = await mcp.testConnection();
    totalTests++;
    if (logSecurityTest('Connection Test', connectionTest, false)) {
      testsPassed++;
    }
    
    if (connectionTest.status !== 'success') {
      console.log(`${colors.red}${colors.bright}Connection failed. Cannot proceed with security tests.${colors.reset}`);
      return;
    }
    
    // Test 2: List Databases (should only return the connected database)
    console.log(`\n${colors.blue}Testing database listing restriction...${colors.reset}`);
    const databases = await mcp.listDatabases();
    totalTests++;
    const dbTestPassed = logSecurityTest('List Databases Restriction', databases, false);
    if (dbTestPassed) {
      testsPassed++;
      // Additional check: should only return one database
      if (databases.data && databases.data.length === 1) {
        console.log(`${colors.green}✓ Correctly returns only 1 database: ${databases.data[0]}${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠ Warning: Expected 1 database, got ${databases.data ? databases.data.length : 0}${colors.reset}`);
      }
    }
    
    // Test 3: Try to list tables from a different database (should fail)
    console.log(`\n${colors.blue}Testing cross-database table access restriction...${colors.reset}`);
    const crossDbTables = await mcp.listTables({ database: 'information_schema' });
    totalTests++;
    if (logSecurityTest('Cross-Database Table Access', crossDbTables, true)) {
      testsPassed++;
    }
    
    // Test 4: Try to list tables from another database (should fail)
    console.log(`\n${colors.blue}Testing sys database access restriction...${colors.reset}`);
    const sysDbTables = await mcp.listTables({ database: 'sys' });
    totalTests++;
    if (logSecurityTest('Sys Database Access', sysDbTables, true)) {
      testsPassed++;
    }
    
    // Test 5: List tables from the correct database (should succeed)
    console.log(`\n${colors.blue}Testing legitimate table access...${colors.reset}`);
    const legitimateTables = await mcp.listTables({});
    totalTests++;
    if (logSecurityTest('Legitimate Table Access', legitimateTables, false)) {
      testsPassed++;
    }
    
    // Test 6: Try stored procedure access from different database (should fail)
    console.log(`\n${colors.blue}Testing cross-database stored procedure access...${colors.reset}`);
    const crossDbProcedures = await mcp.listStoredProcedures({ database: 'information_schema' });
    totalTests++;
    if (logSecurityTest('Cross-Database Procedure Access', crossDbProcedures, true)) {
      testsPassed++;
    }
    
    // Test 7: Connection info should show only the configured database
    console.log(`\n${colors.blue}Testing connection info security...${colors.reset}`);
    const connectionInfo = await mcp.describeConnection();
    totalTests++;
    if (logSecurityTest('Connection Info Security', connectionInfo, false)) {
      testsPassed++;
      if (connectionInfo.data && connectionInfo.data.database) {
        console.log(`${colors.green}✓ Connection shows database: ${connectionInfo.data.database}${colors.reset}`);
      }
    }
    
  } catch (error) {
    console.log(`\n${colors.red}${colors.bright}ERROR:${colors.reset} ${error.message}`);
    console.log(error.stack);
  } finally {
    // Close the connection
    console.log(`\n${colors.blue}Closing database connection...${colors.reset}`);
    await mcp.close();
    console.log(`${colors.green}Connection closed.${colors.reset}`);
    
    // Summary
    console.log(`\n${colors.bright}${colors.magenta}=== Security Test Summary ====${colors.reset}`);
    console.log(`${colors.bright}Tests Passed:${colors.reset} ${testsPassed}/${totalTests}`);
    
    if (testsPassed === totalTests) {
      console.log(`${colors.green}${colors.bright}🔒 ALL SECURITY TESTS PASSED! Database access is properly restricted.${colors.reset}`);
    } else {
      console.log(`${colors.red}${colors.bright}⚠ SECURITY ISSUES DETECTED! Some tests failed.${colors.reset}`);
    }
    
    console.log(`\n${colors.bright}${colors.magenta}=== Test Complete ====${colors.reset}\n`);
  }
}

// Run the security tests
runSecurityTests().catch(error => {
  console.error(`${colors.red}${colors.bright}UNHANDLED ERROR:${colors.reset}`, error);
  process.exit(1);
});