import SecurityLayer from "../security/securityLayer";
/**
 * Schema Versioning and Migrations Tools for MySQL MCP Server
 * Provides utilities for managing database schema versions and migrations
 */
export declare class SchemaVersioningTools {
    private db;
    private security;
    private migrationsTable;
    constructor(security: SecurityLayer);
    /**
     * Validate database access
     */
    private validateDatabaseAccess;
    /**
     * Generate a migration version based on timestamp
     */
    private generateVersion;
    /**
     * Escape string value for SQL
     */
    private escapeValue;
    /**
     * Initialize the migrations tracking table if it doesn't exist
     */
    initMigrationsTable(params: {
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Create a new migration entry
     */
    createMigration(params: {
        name: string;
        up_sql: string;
        down_sql?: string;
        description?: string;
        version?: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Generate a simple checksum for SQL content
     */
    private generateChecksum;
    /**
     * Apply pending migrations
     */
    applyMigrations(params: {
        target_version?: string;
        dry_run?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Split SQL content into individual statements
     */
    private splitSqlStatements;
    /**
     * Rollback the last applied migration or to a specific version
     */
    rollbackMigration(params: {
        target_version?: string;
        steps?: number;
        dry_run?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Get migration history and status
     */
    getMigrationStatus(params: {
        version?: string;
        status?: "pending" | "applied" | "failed" | "rolled_back";
        limit?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Get the current schema version
     */
    getSchemaVersion(params: {
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Validate pending migrations (check for conflicts or issues)
     */
    validateMigrations(params: {
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Mark a failed migration as resolved (reset to pending status)
     */
    resetFailedMigration(params: {
        version: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Generate a migration from table comparison
     */
    generateMigrationFromDiff(params: {
        table1: string;
        table2: string;
        migration_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
