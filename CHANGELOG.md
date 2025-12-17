# Changelog

All notable changes to the MySQL MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.20.0] - 2025-12-17

### Changed
- Version increment for implemented features and improvements

## [Unreleased]

### Security
- Fixed critical SQL execution bypass in transactions by adding comprehensive security validation
- Enhanced stored procedure creation with body content validation and injection prevention
- Improved DDL operations with proper default value sanitization to prevent SQL injection
- Added transaction timeout mechanism (30 minutes) with automatic cleanup to prevent resource exhaustion
- Integrated security layer across all transaction operations for complete coverage

### Changed
- Updated TransactionTools to require SecurityLayer for proper validation
- Enhanced DdlTools with comprehensive input sanitization
- Improved database connection management with timeout and cleanup features

### Fixed
- Resolved TypeScript compilation error in SecurityLayer access patterns
- Eliminated all security bypass paths through the system

### Removed
- Preset-based access control configuration: CLI `--preset` flag and `MCP_PRESET` / `MCP_PERMISSION_PRESET` environment variables. Use `MCP_PERMISSIONS` and optionally `MCP_CATEGORIES`.
- Global masking configuration via `MCP_MASKING_PROFILE`. If you need enforced masking for exports, use the `safe_export_table` macro's `masking_profile` argument.


## [1.18.2] - 2025-12-13

### Removed
- Removed outdated comparison docs under `docs/comparison` (and the related README section). The canonical documentation is `DOCUMENTATIONS.md`.


## [1.18.1] - 2025-12-13

### Changed
- Updated documentation files with current datetime stamps

## [1.17.0] - 2025-12-12

### Added
- **Phase 3: AI Enhancement Tools** - 5 new tools for data generation, schema review, visualization, and forecasting:
  - `generate_test_data` - Generate FK-aware SQL INSERT statements for synthetic test data (does not execute)
  - `analyze_schema_patterns` - Detect common schema anti-patterns (missing PKs, wide tables, unindexed FKs, EAV-like design)
  - `visualize_query` - Produce a Mermaid flowchart representation of a query using EXPLAIN FORMAT=JSON
  - `predict_query_performance` - Heuristic prediction of query scan/cost impact under growth assumptions
  - `forecast_database_growth` - Forecast table/database size growth from current INFORMATION_SCHEMA sizes and user-supplied rates

### Changed
- Updated total tool count from 145 to 150 tools.

### Documentation
- Updated README.md and DOCUMENTATIONS.md to include Phase 3 AI Enhancement tools.

## [1.16.4] - 2025-12-12

### Added
- **Phase 2: AI Enhancement Tools** - 3 new tools to improve AI-assisted database engineering:
  - `design_schema_from_requirements` - Natural-language schema design assistant that proposes tables, relationships, and DDL (non-executing)
  - `audit_database_security` - Best-effort database security audit assistant with prioritized findings and recommendations
  - `recommend_indexes` - Automated index recommendation system using performance_schema query digests and existing index introspection

### Documentation
- Updated README.md and DOCUMENTATIONS.md to include the new Phase 2 AI Enhancement tools.

## [1.16.3] - 2025-12-11

### Documentation
- **README.md Enhancement** - Added comprehensive AI Enhancement tools documentation
  - Updated total tool count from 134 to 142 tools
  - Added detailed "🤖 AI Enhancement Tools (Phase 1 - Implemented)" section
  - Listed all 8 AI tools in Available Tools table with full names
  - Included practical use cases for each AI tool category
  - Tools documented: `build_query_from_intent`, `suggest_query_improvements`, `smart_search`, 
    `find_similar_columns`, `discover_data_patterns`, `generate_documentation`, 
    `generate_data_dictionary`, `generate_business_glossary`

## [1.16.2] - 2025-12-11

### Fixed
- **Documentation Update** - Added missing `ai_enhancement` category to the Documentation Categories table in README.md
  - The table now correctly shows all 24 documentation categories
  - Added entry for `ai_enhancement` category with 8 tools and description

## [1.16.1] - 2025-12-09

### Improved
- **Enhanced Tool Descriptions** - Improved tool descriptions to help LLMs select the correct tool:
  - `run_query`: Now explicitly states "⚡ USE THIS FOR SELECT QUERIES"
  - `execute_sql`: Now explicitly states "⚡ USE THIS FOR INSERT/UPDATE/DELETE"
  - `execute_ddl`: Now explicitly states "⚡ USE THIS FOR DDL ONLY" with clear guidance
  - Added "NO SELECT queries!" warning to `execute_ddl` parameter description

### Fixed
- **Better Error Messages** - `execute_ddl` now suggests the correct tool when called with wrong query type:
  - "For SELECT queries, use the 'run_query' tool instead"
  - "For INSERT/UPDATE/DELETE, use the 'execute_sql' tool"

## [1.16.0] - 2025-12-09

### Added
- **Phase 1: AI Enhancement Tools** - 8 new intelligent tools for AI-powered database interactions:

  #### Intelligent Query Assistant
  - `build_query_from_intent` - Converts natural language to optimized SQL with context-aware query generation. Supports analytics, reporting, data_entry, and schema_exploration contexts. Includes safety levels and complexity controls.
  - `suggest_query_improvements` - Analyzes SQL queries and suggests optimizations for speed, memory, or readability.

  #### Smart Data Discovery Agent
  - `smart_search` - Finds relevant tables, columns, data patterns, and relationships using semantic search. Essential for exploring large databases with hundreds of tables.
  - `find_similar_columns` - Discovers columns with similar names or data across tables. Identifies potential join candidates and implicit relationships.
  - `discover_data_patterns` - Analyzes tables for patterns including uniqueness, null rates, duplicates, formats, and value ranges. Provides data quality scores and recommendations.

  #### AI-Powered Documentation Generator
  - `generate_documentation` - Creates comprehensive database documentation with business glossary in Markdown, HTML, or JSON format. Includes schema, relationships, and example queries.
  - `generate_data_dictionary` - Generates detailed data dictionaries for specific tables with column descriptions, constraints, sample values, and business terms.
  - `generate_business_glossary` - Creates business glossaries from database column names with inferred descriptions and categorization.

- **New Documentation Category** - Added `ai_enhancement` category for organizing the new AI tools.
- **Updated Presets** - Added AI Enhancement tools to the `analyst` preset for immediate access.

### Changed
- Updated tool count from 126 to 134 tools.
- Enhanced enhancement tracking file to mark Phase 1 as completed.

## [1.15.0] - 2025-12-08

### Added
- **Connection Profiles** - New `dev`, `stage`, and `prod` presets.
  - `dev`: Full access to all tools.
  - `stage`: Allows CRUD but blocks destructive DDL (drop, truncate).
  - `prod`: Strict read-only with explicit denials for modification tools.
  - Implements allowed/denied tools logic for robust security enforcement.
- **Agent-Facing Changelog Feed** - New `read_changelog` tool.
  - Allows AI agents to read the CHANGELOG.md directly to understand new features and changes.

## [1.14.1] - 2025-12-08

### Added
- **Workflow Macros** - New `safe_export_table` tool that combines data export with mandatory masking.
  - Allows safe export of sensitive data by enforcing masking before the data leaves the database.
  - Supports configurable masking profiles (strict (default), partial, soft).

## [1.14.0] - 2025-12-08

### Added
- **Data Masking Profiles** - New security feature to mask sensitive data in query responses.
  - Configurable via `MCP_MASKING_PROFILE` environment variable.
  - Profiles: `none` (default), `soft` (secrets), `partial` (secrets + PII), `strict` (all sensitive).
  - Automatically applies to `run_query` and `read_records`.

## [1.13.0] - 2025-12-07

### Added
- **Guided Query Builder/Fixer** - New `repair_query` tool that uses deterministic heuristics and `EXPLAIN` to analyze and fix SQL queries.
  - Suggests optimizations (e.g., adding indexes, limits).
  - Analyzes execution plans for performance issues like full table scans.
  - Provides actionable feedback for specific error messages.

## [1.12.0] - 2025-12-05

### Added
- Schema-Aware RAG Context Pack via `get_schema_rag_context`, delivering compact table/column/PK/FK snapshots with row estimates for embeddings-friendly prompts.

### Fixed
- Exposed analysis tools (`get_database_summary`, `get_schema_erd`, `get_column_statistics`) and the new RAG context pack through MCP tool registration and routing.

### Changed
- Updated documentation and tool counts to 120, reflecting the new analysis capability and refreshed README guidance.

## [1.10.5] - 2025-12-02

### Changed
- Removed queryLog field from all tool responses - simplified response structure
- Updated source code to remove query logging output from tool responses
- Streamlined tool response format for cleaner API interaction

## [1.10.4] - 2025-12-02

### Added
- **AI Context Optimization** - Added 4 new AI-centric tools:
  - `get_database_summary` - High-level database overview (tables, columns, row counts) optimized for context window
  - `get_schema_erd` - Generates Mermaid.js ER diagrams for visual schema representation
  - `get_column_statistics` - Deep data profiling (min/max, nulls, distinct counts) for intelligent query building
  - `run_query` Safe Mode - Added `dry_run` flag to preview query plans and costs without execution

### Fixed
- Removed "IMPORTANT_INSTRUCTION_TO_ASSISTANT" instruction from documentation - no longer needed
- Removed "SQL_QUERY_EXECUTED" message references from documentation - simplified response structure
- Updated changelog entries to reflect cleaner field naming without instruction prefixes

### Changed
- Simplified documentation language around SQL query display
- Streamlined response format documentation

## [1.10.3] - 2025-11-26

### Fixed
- Fixed inconsistency in documentation category names in the Dual-Layer configuration example
- Changed from 'data_read,schema_inspection' to 'crud_operations,custom_queries' to match the Documentation Categories table
- Ensures consistency throughout the documentation

## [1.10.0] - 2025-11-25

### Added
- **Performance Monitoring** - Complete performance analysis toolkit with 10 new tools:
  - `get_performance_metrics` - Comprehensive metrics (query performance, connections, buffer pool, InnoDB stats)
  - `get_top_queries_by_time` - Identify slowest queries by execution time
  - `get_top_queries_by_count` - Find most frequently executed queries
  - `get_slow_queries` - Queries exceeding custom time thresholds
  - `get_table_io_stats` - Monitor table I/O operations and identify hot tables
  - `get_index_usage_stats` - Track index usage patterns
  - `get_unused_indexes` - Identify unused indexes for optimization
  - `get_connection_pool_stats` - Monitor connection pool health
  - `get_database_health_check` - Comprehensive health assessment with status levels
  - `reset_performance_stats` - Reset performance schema statistics
- Added comprehensive Performance Monitoring section to DOCUMENTATIONS.md
- Updated README.md tool count from 109 to 119 tools
- All performance tools require only `utility` permission (no special setup needed)

### Fixed
- **test_connection Enhanced Diagnostics** - Significantly improved error reporting:
  - Added error-specific troubleshooting steps for common issues
  - Platform-specific guidance (Windows/Linux/Mac) for MySQL server management
  - Shows current configuration (host, port, user, database) for verification
  - Detects and diagnoses: ECONNREFUSED, ER_ACCESS_DENIED_ERROR, ER_BAD_DB_ERROR, ETIMEDOUT, ENOTFOUND
  - Clear success messages with connection latency
- **run_query SHOW Support** - Fixed rejection of read-only information queries:
  - Now supports: SHOW TABLES, SHOW DATABASES, SHOW COLUMNS, SHOW CREATE TABLE, etc.
  - Added support for: DESCRIBE, DESC, EXPLAIN, HELP commands
  - These queries work with `read` permission (no `execute` permission needed)
- **Performance Tools Registration** - Added all 10 performance monitoring tools to `featureConfig.ts`
  - Ensures AI agents can discover and use performance tools correctly
  - All mapped to `ToolCategory.UTILITY` permission

### Changed
- Enhanced error handling in `test_connection` to return detailed diagnostic information
- Updated security layer to recognize SHOW, DESCRIBE, EXPLAIN as valid read-only queries
- Improved error messages throughout with clearer guidance

### Documentation
- Added "Performance Monitoring" section to DOCUMENTATIONS.md with:
  - Complete tool reference with examples
  - Best practices for regular monitoring
  - Query optimization workflows
  - Common performance patterns and troubleshooting
- Updated README.md with Performance Monitoring category
- Updated roadmap to mark Performance Monitoring as completed

## [1.9.1] - 2025-11-24

### Added
- **OpenAI Codex Integration** - Full support for OpenAI Codex CLI and VS Code Extension
  - Added Codex configuration examples to README.md
  - Added comprehensive Codex Integration section to DOCUMENTATIONS.md
  - TOML configuration format (`~/.codex/config.toml`)
  - CLI setup via `codex mcp add` command
  - Environment variables configuration
  - Multiple database configurations (prod/dev)
  - Advanced options (timeouts, tool filtering)
  - Codex MCP management commands reference
  - Troubleshooting section for Codex-specific issues

### Changed
- Updated package.json keywords to include "codex" and "openai-codex"
- Updated feature list to include OpenAI Codex as supported AI agent

### Documentation
- README.md: Added OpenAI Codex CLI & VS Code Extension configuration section
- DOCUMENTATIONS.md: Added new section "OpenAI Codex Integration" with:
  - Configuration overview table
  - Quick setup via CLI
  - Manual TOML configuration examples
  - Configuration options reference table
  - Advanced configurations (prod+dev, tool filtering, custom timeouts)
  - VS Code Extension setup steps
  - Verification instructions
  - Common TOML syntax errors
  - Permission sets for common use cases

## [1.9.0] - 2025-11-24

### Added
- **Schema Versioning & Migrations** - Complete database migration management system with 9 new tools:
  - `initMigrationsTable` - Initialize the migrations tracking table (`_schema_migrations`)
  - `createMigration` - Create new migration files with up/down SQL and automatic versioning
  - `applyMigrations` - Apply pending migrations with dry-run support and transaction safety
  - `rollbackMigration` - Rollback migrations with automatic down SQL execution
  - `getMigrationStatus` - Get detailed status of all migrations
  - `getSchemaVersion` - Get current schema version quickly
  - `validateMigrations` - Validate migration checksums and detect tampering
  - `resetFailedMigration` - Reset failed migrations for retry
  - `generateMigrationFromDiff` - Auto-generate migrations by comparing table structures

### Changed
- **README.md Restructured** - Complete overhaul of MCP integration documentation
  - Changed "Claude Desktop" references to "Claude Code"
  - Added configuration examples for 12 AI tools/IDEs:
    - Claude Code (CLI) - `.mcp.json`
    - Cursor - `.cursor/mcp.json`
    - Windsurf - `~/.codeium/windsurf/mcp_config.json`
    - Cline (VS Code Extension)
    - Gemini CLI - `~/.gemini/settings.json`
    - Trae AI
    - Qwen Code
    - Droid CLI
    - Zed IDE - `~/.config/zed/settings.json`
    - Kilo Code (VS Code Extension)
    - Roo Code (VS Code Extension)
    - Continue (VS Code Extension)

### Documentation
- Added comprehensive Schema Versioning documentation to DOCUMENTATIONS.md
- Includes tool overview, permission requirements, best practices
- Common migration patterns with real-world examples
- Updated roadmap to mark Schema Versioning as COMPLETED

### Technical Details
- Migration tracking table stores: version, name, description, up_sql, down_sql, checksum, execution_time, status
- MD5 checksum validation prevents migration tampering
- Multi-statement SQL support for complex migrations
- Dry-run mode for safe migration testing
- Automatic version generation using timestamp format (YYYYMMDDHHMMSS)

---

## [1.8.0] - 2025-11-24

### Added
- **Data Migration Tools** - Tools for data import/export and database transfer:
  - Data import/export functionality
  - Cross-database migration support

---

## [1.7.0] - 2025-11-24

### Added
- **Database Backup/Restore** - Complete backup and restore functionality:
  - Database backup tools
  - Database restore tools
  - Data import/export tools

---

## [1.6.3] - 2025-11-23

### Fixed
- **Missing tools in toolCategoryMap** - Added 42 missing tools to the permission system
  - View tools: listViews, getViewInfo, createView, alterView, dropView, showCreateView
  - Trigger tools: listTriggers, getTriggerInfo, createTrigger, dropTrigger, showCreateTrigger
  - Function tools: listFunctions, getFunctionInfo, createFunction, dropFunction, showCreateFunction, executeFunction
  - Index tools: listIndexes, getIndexInfo, createIndex, dropIndex, analyzeIndex
  - Constraint tools: listForeignKeys, listConstraints, addForeignKey, dropForeignKey, addUniqueConstraint, dropConstraint, addCheckConstraint
  - Maintenance tools: analyzeTable, optimizeTable, checkTable, repairTable, truncateTable, getTableStatus, flushTable, getTableSize
  - Server tools: showProcessList, killProcess, showStatus, showVariables, explainQuery, showEngineStatus, getServerInfo, showBinaryLogs, showReplicationStatus

- **Security keyword false positives in run_query** - Refined dangerous keywords to avoid blocking common table/column names
  - Removed generic keywords: `USER`, `PASSWORD`, `MYSQL`, `SYS` that blocked legitimate queries
  - Added specific security patterns: `MYSQL.USER`, `MYSQL.DB`, `CREATE USER`, `DROP USER`, `ALTER USER`, `SET PASSWORD`, `LOAD_FILE`, `INFORMATION_SCHEMA.USER_PRIVILEGES`
  - Queries like `SELECT * FROM users` or `SELECT user, password FROM accounts` now work correctly

## [1.6.2] - 2025-11-22

### Fixed
- **Security keyword false positive bug** - Fixed issue where `run_query` rejected valid SELECT queries containing table names like "users"
  - The dangerous keyword check was using substring matching (`includes()`) which caused "USER" to match "USERS"
  - Changed to word boundary regex matching (`\bKEYWORD\b`) to only match whole words
  - `SELECT * FROM users` now works correctly while `SELECT USER()` is still blocked as intended

### Changed
- **Updated tool count in README.md** - Corrected tool count from 30/73 to 85 powerful tools
  - Accurate count of all available MCP tools across all categories

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
- **Query field name** - SQL query details are now directly embedded in response data
- **Mandatory display directive** - Clear instruction stating "ALWAYS display the SQL query execution details below to the user in your response"

### Technical Changes
- Response now includes three fields in order:
  
  2. "Query Details" - The SQL query details
  3. `📊 RESULTS` - The query results
- This approach ensures LLMs understand that SQL query information is not optional context

## [1.4.11] - 2025-11-21

### Changed
- **SQL query as data field (BREAKING)** - Restructured response to embed SQL query directly in the data JSON as query details field
- **Results wrapped** - Actual query results now under `📊 RESULTS` field
- **LLM-proof approach** - By making SQL query part of the data structure itself, LLMs cannot filter it out when describing results

### Technical Changes
- Response format changed from `{data: [...]}` to `{"Query Details": "...", "📊 RESULTS": [...]}`
- SQL query information is now a required part of the response structure, not optional metadata
- This forces AI assistants to acknowledge and communicate SQL query details to users

## [1.4.10] - 2025-11-21

### Improved  
- **SQL query embedded in data structure** - SQL query is now embedded as a field in the response JSON, forcing LLMs to include it when describing results
- **Visual field names** - Using descriptive field names for query information to make it stand out
- **Guaranteed visibility** - By making SQL query part of the actual data structure instead of metadata, LLMs must process and describe it

### Technical Changes
- Changed response structure to wrap data in object with SQL query as a top-level field
- SQL query appears as query details field containing formatted query information
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

## [1.11.0] - 2025-12-05

### Added
- Adaptive permission presets (`readonly`, `analyst`, `dba-lite`) with mergeable overrides
- CLI `--preset` flag and `MCP_PRESET`/`MCP_PERMISSION_PRESET` env support with resolved-config logging

### Changed
- Safe fallback to read-only defaults when an unknown preset is requested without overrides
- Feature status endpoint now exposes preset-aware configuration snapshots for easier debugging

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

- **1.11.0** - Adaptive permission presets with CLI/env support and preset-aware logging
- **1.9.0** - Schema Versioning & Migrations (9 new tools), MCP integration for 12 AI tools
- **1.8.0** - Data Migration Tools
- **1.7.0** - Database Backup/Restore, Data Import/Export
- **1.6.3** - Fixed missing tools in toolCategoryMap, security keyword refinement
- **1.6.2** - Fixed security keyword false positive bug
- **1.4.16** - Added get_table_size tool to manifest
- **1.4.4** - Bug fixes: First call failure & execute permission
- **1.4.3** - Permission error handling improvements
- **1.4.2** - Dynamic per-project permissions
- **1.4.1** - Stored procedures, transactions, bulk operations
- **1.4.0** - Data export, DDL operations, utilities
- **1.3.x** - Core CRUD operations and query tools
- **1.2.x** - Security layer implementation
- **1.1.x** - MCP protocol integration
- **1.0.x** - Initial release
