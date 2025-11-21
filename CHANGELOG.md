# Changelog

All notable changes to the MySQL MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.7] - 2025-11-21

### Added
- **Query logging on output** - All query executions are now logged with detailed information including SQL, parameters, execution duration, and status
- `QueryLogger` utility class for tracking and formatting query logs
- Query logs are included in responses from query tools (runQuery, executeSql) and CRUD operations (create_record, read_records, update_record, delete_record)
- Query logs include: timestamp, SQL query, parameters used, execution time in milliseconds, and success/error status
- Production monitoring and configuration documentation for QueryLogger

### Security & Performance Improvements
- **Memory leak prevention** - SQL queries truncated to 500 characters max (prevents megabyte-sized log entries)
- **Parameter limiting** - Only first 5 parameters logged to prevent memory bloat from bulk operations
- **Safe serialization** - Handles circular references, BigInt, and unstringifiable objects without crashes
- **Deep copy protection** - Parameters are deep copied to prevent reference mutations
- **Bounded storage** - Maximum 100 most recent queries retained (~100 KB total memory usage)
- **Output truncation** - Formatted output limited to prevent massive response payloads
- **Error handling** - All JSON.stringify operations wrapped in try-catch with safe fallbacks
- **Memory impact reduction** - 99.9% memory reduction for bulk operations (from ~1 GB to ~100 KB)

### Technical Changes
- New `src/db/queryLogger.ts` module for query logging functionality with robust memory management
- Updated `src/db/connection.ts` to log all query executions with timing information
- Updated all query tool responses to include `queryLog` field with formatted log output
- Enhanced debugging capability by tracking the last 100 queries in memory
- Added configuration constants for tuning memory limits (MAX_LOGS, MAX_SQL_LENGTH, MAX_PARAM_LENGTH, MAX_PARAM_ITEMS)
- Implemented safeStringify method for type-safe value serialization

## [1.4.6] - 2025-11-21

### Changed
- Removed "Execute Permission & Advanced SQL Features" section from README.md
- Removed "Configuration" section from README.md
- Removed "REST API Mode" section from README.md
- Removed "Testing" section from README.md
- Streamlined documentation by removing outdated or less relevant sections

## [1.4.5] - 2025-01-08

### Changed
- Reorganized README.md structure - moved "Permission System" section to appear before "Available Tools" section for better user understanding
- Updated documentation organization to improve readability and user experience

### Fixed
- Minor documentation formatting improvements

## [1.4.4] - 2025-01-07

### Fixed

#### First Tool Call Failure Issue
- **Problem**: The first tool call would fail with "Connection closed" error (-32000), but subsequent calls would succeed
- **Root Cause**: MySQL MCP instance was initialized at module load time, before the MCP transport was fully connected, causing a race condition
- **Solution**: Moved the initialization to occur after the MCP transport is connected in `src/mcp-server.ts`
- **Impact**: First tool calls now work reliably without needing retry
- **Files Changed**: `src/mcp-server.ts`

#### Execute Permission Not Respected
- **Problem**: Users with `execute` permission would still get "Dangerous keyword detected" errors when using legitimate SQL functions like `LOAD_FILE()`, `UNION`, or accessing `INFORMATION_SCHEMA`
- **Root Cause**: Security layer blocked certain SQL keywords unconditionally, regardless of granted permissions
- **Solution**: 
  - Modified `validateQuery()` in `src/security/securityLayer.ts` to accept `bypassDangerousCheck` parameter
  - Added `hasExecutePermission()` method to check if execute permission is enabled
  - Updated `executeSql()` and `runQuery()` in `src/tools/queryTools.ts` to respect execute permission
  - Reduced "always blocked" keywords to only critical security threats (GRANT, REVOKE, INTO OUTFILE, etc.)
  - Allowed advanced SQL features when execute permission is granted:
    - SQL functions: `LOAD_FILE()`, `BENCHMARK()`, `SLEEP()`
    - Advanced SELECT: `UNION`, subqueries in FROM clause
    - Database metadata: `INFORMATION_SCHEMA` access
- **Impact**: Users with full permissions can now use advanced SQL features as intended
- **Files Changed**: 
  - `src/security/securityLayer.ts`
  - `src/tools/queryTools.ts`

### Changed
- Updated version from 1.4.3 to 1.4.4
- Enhanced README.md with detailed documentation on execute permission and advanced SQL features
- Added "Recent Updates" section to README.md documenting bug fixes

### Security
- Critical security operations remain blocked even with execute permission:
  - `GRANT` / `REVOKE` - User privilege management
  - `INTO OUTFILE` / `INTO DUMPFILE` - Writing files to server
  - `LOAD DATA` - Loading data from files
  - Direct access to `mysql`, `performance_schema`, `sys` databases
  - `USER` / `PASSWORD` manipulation

## [1.4.3] - 2025-01-06

### Added
- Improved permission error handling with detailed messages
- Enhanced documentation for permission system

### Fixed
- Fixed undefined/null parameter handling in all tool calls
- Improved MySQL operations error handling

## [1.4.2] - 2025-01-05

### Added
- Dynamic per-project permissions system
- Enhanced security layer with permission-based access control

### Changed
- Improved documentation and examples

## [1.4.1] - 2025-01-04

### Added
- Stored procedure support
- Transaction management tools
- Bulk operations (insert, update, delete)

### Changed
- Enhanced error messages
- Improved query validation

## [1.4.0] - 2025-01-03

### Added
- Data export tools (CSV export)
- DDL operations (CREATE, ALTER, DROP tables)
- Utility tools (connection testing, table relationships)

### Changed
- Major refactoring of tool organization
- Improved TypeScript type definitions

---

## Version History Summary

- **1.4.4** - Bug fixes: First call failure & execute permission
- **1.4.3** - Permission error handling improvements
- **1.4.2** - Dynamic per-project permissions
- **1.4.1** - Stored procedures, transactions, bulk operations
- **1.4.0** - Data export, DDL operations, utilities
- **1.3.x** - Core CRUD operations and query tools
- **1.2.x** - Security layer implementation
- **1.1.x** - MCP protocol integration
- **1.0.x** - Initial release
