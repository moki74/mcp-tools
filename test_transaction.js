#!/usr/bin/env node

/**
 * Simple test script to verify transaction functionality
 * Run with: node test_transaction.js
 */

const { MySQLMCP } = require('./dist/index.js');

async function testTransactions() {
  console.log('🧪 Testing MySQL Transaction Support...\n');
  
  try {
    // Initialize MySQL MCP
    const mysqlMCP = new MySQLMCP();
    
    // Test 1: Begin a transaction
    console.log('1️⃣ Testing begin_transaction...');
    const beginResult = await mysqlMCP.beginTransaction();
    console.log('Result:', JSON.stringify(beginResult, null, 2));
    
    if (beginResult.status !== 'success') {
      throw new Error('Failed to begin transaction');
    }
    
    const transactionId = beginResult.transactionId;
    console.log(`✅ Transaction started with ID: ${transactionId}\n`);
    
    // Test 2: Get transaction status
    console.log('2️⃣ Testing get_transaction_status...');
    const statusResult = await mysqlMCP.getTransactionStatus();
    console.log('Result:', JSON.stringify(statusResult, null, 2));
    console.log('');
    
    // Test 3: Execute a query within the transaction
    console.log('3️⃣ Testing execute_in_transaction...');
    const queryResult = await mysqlMCP.executeInTransaction({
      transactionId: transactionId,
      query: 'SELECT 1 as test_value'
    });
    console.log('Result:', JSON.stringify(queryResult, null, 2));
    console.log('');
    
    // Test 4: Commit the transaction
    console.log('4️⃣ Testing commit_transaction...');
    const commitResult = await mysqlMCP.commitTransaction({
      transactionId: transactionId
    });
    console.log('Result:', JSON.stringify(commitResult, null, 2));
    console.log('');
    
    // Test 5: Test rollback functionality with a new transaction
    console.log('5️⃣ Testing rollback_transaction...');
    const beginResult2 = await mysqlMCP.beginTransaction();
    const transactionId2 = beginResult2.transactionId;
    
    const rollbackResult = await mysqlMCP.rollbackTransaction({
      transactionId: transactionId2
    });
    console.log('Result:', JSON.stringify(rollbackResult, null, 2));
    console.log('');
    
    // Test 6: Final status check
    console.log('6️⃣ Final transaction status check...');
    const finalStatus = await mysqlMCP.getTransactionStatus();
    console.log('Result:', JSON.stringify(finalStatus, null, 2));
    
    console.log('\n🎉 All transaction tests completed successfully!');
    
    // Close the connection
    await mysqlMCP.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testTransactions().catch(console.error);