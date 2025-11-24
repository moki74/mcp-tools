# Example Workflows

[Back to Comparison Overview](../../README.md#-mysql-mcp-vs-manual-database-access-a-comprehensive-comparison)

## Without MCP (Manual)

```sql
-- Connect to MySQL client
mysql -u user -p database
-- Write schema query
DESCRIBE users;
SHOW INDEX FROM users;
-- Write analysis query  
EXPLAIN SELECT * FROM users WHERE email LIKE '%@gmail.com';
-- Check if safe, then run
SELECT * FROM users WHERE email LIKE '%@gmail.com';
```

## With MCP (AI-Assisted)

> "Show me the users table structure and find all Gmail users"

- AI calls `read_table_schema`, `explain_query`, `read_records`
- Returns formatted results with execution time
- All queries logged, validated, parameterized automatically
