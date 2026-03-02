import { SecurityLayer } from "../security/securityLayer";
export declare class SchemaPatternTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    private validateDatabaseAccess;
    /**
     * Recognize common schema patterns and anti-patterns based on INFORMATION_SCHEMA.
     */
    analyzeSchemaPatterns(params?: {
        scope?: "database" | "table";
        table_name?: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
