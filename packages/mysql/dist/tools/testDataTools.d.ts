import { SecurityLayer } from "../security/securityLayer";
export declare class TestDataTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    private validateDatabaseAccess;
    private escapeValue;
    private parseEnumValues;
    private clampString;
    private generateValueForColumn;
    /**
     * Generate SQL INSERT statements (does not execute) for synthetic test data.
     * Attempts to maintain referential integrity by sampling referenced keys when foreign keys exist.
     */
    generateTestData(params: {
        table_name: string;
        row_count: number;
        batch_size?: number;
        include_nulls?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
