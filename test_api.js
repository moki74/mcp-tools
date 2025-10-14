// Simple test script for the MySQL MCP API server
const fetch = require('node-fetch');

// Configuration
const API_URL = 'http://localhost:3000';
const API_KEY = 'your_api_key'; // Replace with your actual API key

// Helper function for API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  const headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  };

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error.message);
    return { status: 500, error: error.message };
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n--- Testing Health Check ---');
  const result = await fetch(`${API_URL}/health`);
  const data = await result.json();
  console.log('Health check:', data);
}

async function testListTables() {
  console.log('\n--- Testing List Tables ---');
  const result = await apiRequest('/api/tables');
  console.log('Tables:', result.data);
}

async function testTableSchema(tableName) {
  console.log(`\n--- Testing Table Schema for ${tableName} ---`);
  const result = await apiRequest(`/api/tables/${tableName}/schema`);
  console.log('Schema:', result.data);
}

async function testReadRecords(tableName) {
  console.log(`\n--- Testing Read Records from ${tableName} ---`);
  const result = await apiRequest(`/api/tables/${tableName}/records?limit=5`);
  console.log('Records:', result.data);
}

async function testRunQuery() {
  console.log('\n--- Testing Run Query ---');
  const result = await apiRequest('/api/query', 'POST', {
    query: 'SELECT 1 + 1 as result'
  });
  console.log('Query result:', result.data);
}

async function testConnection() {
  console.log('\n--- Testing Connection ---');
  const result = await apiRequest('/api/connection/test');
  console.log('Connection test:', result.data);
}

// Run all tests
async function runTests() {
  try {
    console.log('Starting MySQL MCP API tests...');
    
    await testHealthCheck();
    await testConnection();
    
    // Get list of tables
    const tablesResult = await apiRequest('/api/tables');
    
    if (tablesResult.status === 200 && Array.isArray(tablesResult.data)) {
      // If we have tables, test with the first one
      if (tablesResult.data.length > 0) {
        const tableName = tablesResult.data[0];
        await testTableSchema(tableName);
        await testReadRecords(tableName);
      }
    }
    
    await testRunQuery();
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Test suite error:', error);
  }
}

// Run the tests
runTests();