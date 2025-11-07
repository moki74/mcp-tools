# Changelog

All notable changes to the MySQL MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
