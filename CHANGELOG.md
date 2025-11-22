# Changelog

All notable changes to the MySQL MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.16] - 2025-11-22

### Added
- **get_table_size tool** - Added get_table_size tool to manifest.json and documentation
  - Tool was implemented in server code but missing from manifest causing "Unknown tool" error
  - Added proper input/output schema to manifest.json
  - Enhanced documentation with usage examples and parameter details
  - Updated version in manifest.json to match server code (1.4.4)

### Fixed
- **Manifest synchronization** - Fixed manifest.json to include all implemented tools
  - Many tools were implemented in server code but missing from manifest.json
  - get_table_size tool now properly exposed to MCP clients
  - Version number synchronized between manifest and server code

### Documentation
- Enhanced Table Maintenance section with complete get_table_size examples
- Added proper usage patterns and parameter documentation

## [1.4.15] - 2025-11-22

### Fixed
- **README.md Unicode encoding** - Fixed broken Unicode characters in Features section
  - Corrected emoji encodings: 🌟 (star), ✅ (checkmark), 🔐 (lock), 🛠️ (tools), 🎛️ (control knobs), 🗃️ (file cabinet), 💎 (gem), 🌐 (globe), 📊 (chart)
  - Removed BOM (Byte Order Mark) from file
  - All emojis now display correctly across all platforms
  - Fixed table formatting in Bulk Operations section

### Documentation
- Enhanced visual consistency in Features section
- Improved readability with proper emoji rendering

## [1.4.14] - 2025-11-22

### Fixed
- **Emoji encoding issues** - Fixed emoji rendering issues in README.md and DOCUMENTATIONS.md
  - Replaced escaped Unicode sequences with proper emoji characters
  - Fixed broken emoji displays throughout documentation
  - Improved visual consistency across all documentation sections

### Documentation
- All emojis in section headers and feature lists now display correctly
- Enhanced readability with proper emoji rendering

## [1.4.13] - 2025-11-22

### Changed
- **Documentation restructuring** - Split comprehensive README.md into two files for better organization and maintainability
  - **README.md (569 lines)** - Now focused on quick start, installation, configuration, and tool overview
  - **DOCUMENTATIONS.md (1269 lines)** - Contains detailed documentation for all features including DDL operations, transactions, stored procedures, query logging, security, bulk operations, troubleshooting, and roadmap
- **Improved navigation** - Added clear reference in README.md pointing to DOCUMENTATIONS.md with table of contents
- **Better user experience** - Users can now quickly get started with README.md and deep dive into DOCUMENTATIONS.md when needed

### Added
- **DOCUMENTATIONS.md** - New comprehensive documentation file with detailed coverage of:
  - DDL Operations (create, alter, drop tables)
  - Data Export Tools (CSV export)
  - Transaction Management (ACID transactions)
  - Stored Procedures (create, execute, manage)
  - Usage Examples (real-world scenarios)
  - Query Logging & Automatic SQL Display
  - Security Features and best practices
  - Bulk Operations (high-performance batch processing)
  - Troubleshooting guide
  - License information
  - Roadmap and future features
- **Table of Contents** - Added comprehensive table of contents in DOCUMENTATIONS.md for easy navigation

### Technical Changes
- README.md reduced from 1,787 lines to 568 lines (68% reduction)
- All detailed documentation moved to DOCUMENTATIONS.md (1,269 lines)
- DOCUMENTATIONS.md added to npm package files list for distribution
- Both documentation files are now included in the npm package

## [1.4.12] - 2025-11-21

### Added
- **Explicit LLM instruction field** - Added `⚠️ IMPORTANT_INSTRUCTION_TO_ASSISTANT` field that explicitly instructs the LLM to always display SQL query information to users
- **Mandatory display directive** - Clear instruction stating "ALWAYS display the SQL query execution details below to the user in your response"

### Technical Changes
- Response now includes three fields in order:
  1. `⚠️ IMPORTANT_INSTRUCTION_TO_ASSISTANT` - Direct instruction to the LLM
  2. `⚠️ SQL_QUERY_EXECUTED` - The SQL query details
  3. `📊 RESULTS` - The query results
- This approach ensures LLMs understand that SQL query information is not optional context

## [1.4.11] - 2025-11-21

### Changed
- **SQL query as data field (BREAKING)** - Restructured response to embed SQL query directly in the data JSON as `⚠️ SQL_QUERY_EXECUTED` field
- **Results wrapped** - Actual query results now under `📊 RESULTS` field
- **LLM-proof approach** - By making SQL query part of the data structure itself, LLMs cannot filter it out when describing results

### Technical Changes
- Response format changed from `{data: [...]}` to `{"⚠️ SQL_QUERY_EXECUTED": "...", "📊 RESULTS": [...]}`
- SQL query information is now a required part of the response structure, not optional metadata
- This forces AI assistants to acknowledge and communicate SQL query details to users

## [1.4.10] - 2025-11-21

### Improved  
- **SQL query embedded in data structure** - SQL query is now embedded as a field in the response JSON, forcing LLMs to include it when describing results
- **Visual field names** - Using emoji-prefixed field names (`⚠️ SQL_QUERY_EXECUTED` and `📊 RESULTS`) to make SQL query information stand out
- **Guaranteed visibility** - By making SQL query part of the actual data structure instead of metadata, LLMs must process and describe it

### Technical Changes
- Changed response structure to wrap data in object with SQL query as a top-level field
- SQL query appears as `"⚠️ SQL_QUERY_EXECUTED"` field containing formatted query details
- Results appear as `"📊 RESULTS"` field containing the actual query results
- This approach treats SQL execution details as primary data, not optional metadata
- Forces LLMs to acknowledge and describe the SQL query when processing tool responses

## [1.4.9] - 2025-11-21

### Improved
- **Multi-block content response** - SQL query and results are now returned as separate MCP content blocks for better visibility in client UIs
- **Enhanced MCP client compatibility** - Completely redesigned query log output format for better rendering in Kilocode and other MCP clients
- **Visual query log hierarchy** - Added clear visual separators using box-drawing characters (━) for better readability
- **Prominent SQL display** - SQL queries are now displayed at the TOP of responses with clear emoji indicators (✅/❌)
- **Better information architecture** - Query execution details (time, timestamp, status) now prominently displayed before SQL
- **Improved emoji usage** - Added contextual emojis (📝 for SQL, 📋 for parameters, ⏱️ for time, 🕐 for timestamp) for quick visual scanning
- **Response structure optimization** - Query logs appear as FIRST content block, results as second block
- **Enhanced error visibility** - Error messages now include ❌ emoji for immediate identification
- **Explicit LLM instructions** - Added explicit notes instructing LLMs to display SQL query information to users

### Technical Changes
- **Breaking improvement**: Changed response structure from single text content to multiple content blocks (MCP spec compliant)
- First content block contains SQL query execution details
- Second content block contains query results
- Updated `QueryLogger.formatLogs()` with new visual hierarchy using Unicode box-drawing characters
- Modified `mcp-server.ts` response builder to use separate content blocks
- Added explicit user-facing notes to SQL query blocks
- Improved line spacing and formatting for better readability across different client UIs

### Fixed
- Query logs now render properly in Kilocode without markdown parsing issues
- SQL query information is structurally separated from results for better LLM and UI handling
- Visual hierarchy prevents information from being buried in JSON output

## [1.4.8] - 2025-11-21

### Added
- **Enhanced human-readable SQL query formatting** - All SQL queries in logs are now automatically formatted with proper line breaks, indentation, and structure for better readability
- **Markdown-friendly query logs** - Query logs use markdown syntax (###, ```, **bold**, ---) for optimal rendering in AI agent UIs
- **SQL syntax highlighting** - SQL queries wrapped in ```sql code blocks for syntax highlighting support
- **Formatted parameter display** - Query parameters now displayed with JSON pretty-printing for better readability
- **Universal query logging** - Extended query log output to ALL 30 tools (previously only available in query and CRUD operations)
- **Structured log separators** - Added markdown horizontal rules (---) to clearly delineate query sections

### Enhanced Tools with Query Logging
- ✅ Database Discovery: `list_databases`, `list_tables`, `read_table_schema`, `get_table_relationships`
- ✅ DDL Operations: `create_table`, `alter_table`, `drop_table`, `execute_ddl`
- ✅ Transaction Management: `execute_in_transaction`
- ✅ Stored Procedures: `list_stored_procedures`, `get_stored_procedure_info`, `execute_stored_procedure`, `create_stored_procedure`, `drop_stored_procedure`, `show_create_procedure`
- ✅ Data Export: `export_table_to_csv`, `export_query_to_csv`
- ✅ Utilities: `get_table_relationships`

### Technical Changes
- Enhanced `QueryLogger.formatSQL()` method for intelligent SQL formatting with keyword detection and line breaking
- Added `formatLogs()` method with visual enhancements replacing previous compact format
- Retained `formatLogsCompact()` for backward compatibility
- Updated return type signatures for all 30 tools to include `queryLog?: string`
- Improved query log output consistency across all tool categories
- **Fixed MCP server handler** - Query logs are now properly included in LLM responses (previously only data was forwarded)
- Added visual separator header "📝 SQL QUERY LOG" in MCP responses for better readability

### Fixed
- **Critical: Query logs now visible to AI agents** - Fixed MCP server handler to properly forward `queryLog` field to LLM responses
- Query logs now appear in both success and error responses

### Improved
- **SQL readability** - Complex queries with multiple columns, JOINs, and conditions are now formatted for easy reading
- **UI rendering** - Switched from Unicode box characters to markdown for better compatibility with AI agent interfaces (Kilocode, Claude Desktop, etc.)
- **Developer experience** - Logs are now optimized for human consumption with markdown formatting that renders beautifully in chat interfaces
- **Debugging efficiency** - Clean markdown structure makes it faster to identify query patterns and issues
- **Documentation** - Comprehensive README updates with markdown-friendly examples of the new query log format
- **Error transparency** - Failed queries now also show the SQL that was attempted with proper formatting

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
