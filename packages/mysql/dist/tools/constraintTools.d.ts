import { SecurityLayer } from "../security/securityLayer";
export declare class ConstraintTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    /**
     * Validate database access - ensures only the connected database can be accessed
     */
    private validateDatabaseAccess;
    /**
     * List all foreign keys for a table
     */
    listForeignKeys(params: {
        table_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    /**
     * List all constraints (PK, FK, UNIQUE, CHECK) for a table
     */
    listConstraints(params: {
        table_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    /**
     * Add a foreign key constraint
     */
    addForeignKey(params: {
        table_name: string;
        constraint_name: string;
        columns: string[];
        referenced_table: string;
        referenced_columns: string[];
        on_delete?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION" | "SET DEFAULT";
        on_update?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION" | "SET DEFAULT";
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Drop a foreign key constraint
     */
    dropForeignKey(params: {
        table_name: string;
        constraint_name: string;
        database?: string;
    }): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
    /**
     * Add a unique constraint
     */
    addUniqueConstraint(params: {
        table_name: string;
        constraint_name: string;
        columns: string[];
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Drop a constraint (UNIQUE or CHECK)
     */
    dropConstraint(params: {
        table_name: string;
        constraint_name: string;
        constraint_type: "UNIQUE" | "CHECK";
        database?: string;
    }): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
    /**
     * Add a check constraint (MySQL 8.0.16+)
     */
    addCheckConstraint(params: {
        table_name: string;
        constraint_name: string;
        expression: string;
        enforced?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
