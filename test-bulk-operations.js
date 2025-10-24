#!/usr/bin/env node

/**
 * Test script for bulk operations functionality
 * This script tests the bulk insert, update, and delete operations
 */

const { MySQLMCP } = require('./dist/index.js');

async function testBulkOperations() {
  console.log('🧪 Testing Bulk Operations Functionality...\n');
  
  // Initialize MySQLMCP with all permissions
  const mysqlMCP = new MySQLMCP('all');
  
  try {
    // Test 1: Bulk Insert
    console.log('📝 Testing Bulk Insert...');
    const bulkInsertData = [
      { name: 'Test User 1', email: 'test1@example.com', age: 25 },
      { name: 'Test User 2', email: 'test2@example.com', age: 30 },
      { name: 'Test User 3', email: 'test3@example.com', age: 35 }
    ];
    
    const insertResult = await mysqlMCP.bulkInsert('test_users', bulkInsertData, 1000);
    console.log('✅ Bulk Insert Result:', insertResult);
    
    // Test 2: Bulk Update
    console.log('\n📝 Testing Bulk Update...');
    const bulkUpdateData = [
      {
        data: { age: 26 },
        conditions: [{ field: 'name', operator: 'eq', value: 'Test User 1' }]
      },
      {
        data: { age: 31 },
        conditions: [{ field: 'name', operator: 'eq', value: 'Test User 2' }]
      }
    ];
    
    const updateResult = await mysqlMCP.bulkUpdate('test_users', bulkUpdateData, 100);
    console.log('✅ Bulk Update Result:', updateResult);
    
    // Test 3: Bulk Delete
    console.log('\n📝 Testing Bulk Delete...');
    const bulkDeleteConditions = [
      [{ field: 'name', operator: 'eq', value: 'Test User 1' }],
      [{ field: 'name', operator: 'eq', value: 'Test User 2' }],
      [{ field: 'name', operator: 'eq', value: 'Test User 3' }]
    ];
    
    const deleteResult = await mysqlMCP.bulkDelete('test_users', bulkDeleteConditions, 100);
    console.log('✅ Bulk Delete Result:', deleteResult);
    
    console.log('\n🎉 All bulk operations tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close the connection
    await mysqlMCP.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testBulkOperations().catch(console.error);
}

module.exports = { testBulkOperations };