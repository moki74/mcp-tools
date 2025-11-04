# Changelog

All notable changes to the MySQL MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.1] - 2025-01-04

### Fixed
- **Critical Parameter Validation Fix**: Fixed "Invalid parameters: must be object" error that occurred when AI agents called MCP tools without parameters
  - Applied defensive parameter handling to all 27 tools that accept parameters
  - Tools now properly handle cases where MCP SDK passes `undefined` or `null` instead of empty object `{}`
  - Pattern applied: `(args || {})` ensures parameters are always objects before validation
  - No breaking changes - existing valid calls continue to work exactly as before

### Changed
- Enhanced parameter handling in `mcp-server.ts` for all tool handlers:
  - Database Tools: `list_tables`, `read_table_schema`, `get_table_relationships`
  - CRUD Tools: `create_record`, `read_records`, `update_record`, `delete_record`, `bulk_insert`, `bulk_update`, `bulk_delete`
  - Query Tools: `run_query`, `execute_sql`, `execute_ddl`
  - DDL Tools: `create_table`, `alter_table`, `drop_table`
  - Transaction Tools: `begin_transaction`, `commit_transaction`, `rollback_transaction`, `execute_in_transaction`
  - Stored Procedure Tools: `list_stored_procedures`, `get_stored_procedure_info`, `execute_stored_procedure`, `create_stored_procedure`, `drop_stored_procedure`, `show_create_procedure`
  - Data Export Tools: `export_table_to_csv`, `export_query_to_csv`

### Documentation
- Added troubleshooting section in README.md for parameter validation errors
- Created CHANGELOG.md to track version changes
- Documented the fix and upgrade path for users experiencing this issue

## [1.4.0] - 2024-12-XX

### Added
- Data Export Tools (`export_table_to_csv`, `export_query_to_csv`)
- Bulk Operations (`bulk_insert`, `bulk_update`, `bulk_delete`)
- Transaction Management (5 tools)
- Stored Procedure Support (5 tools)
- Enhanced permission error messages
- Per-project permission configuration

### Changed
- Improved security with fine-grained permission system
- Better error handling and user feedback
- Performance optimizations for bulk operations

## [1.3.0] - 2024-XX-XX

### Added
- DDL Operations (Create, Alter, Drop Table)
- Schema Management Tools
- Permission-based access control
- MCP protocol support

## [1.2.0] - 2024-XX-XX

### Added
- REST API mode
- Connection testing utilities
- Foreign key relationship discovery

## [1.1.0] - 2024-XX-XX

### Added
- CRUD operations
- Custom SQL query execution
- Parameterized queries

## [1.0.0] - 2024-XX-XX

### Added
- Initial release
- Basic database listing
- Table schema inspection
- MySQL connection support
