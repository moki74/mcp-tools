import { SecurityLayer } from "../security/securityLayer";
export declare class StoredProcedureTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    /**
     * Validate database access - ensures only the connected database can be accessed
     */
    private validateDatabaseAccess;
    /**
     * List all stored procedures in the current database
     */
    listStoredProcedures(params: {
        database?: string;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    /**
     * Get detailed information about a specific stored procedure
     */
    getStoredProcedureInfo(params: {
        procedure_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Execute a stored procedure with parameters
     */
    executeStoredProcedure(params: {
        procedure_name: string;
        parameters?: any[];
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Validate stored procedure body content for security
     */
    private validateProcedureBody;
    /**
     * Create a new stored procedure
     */
    createStoredProcedure(params: {
        procedure_name: string;
        parameters?: Array<{
            name: string;
            mode: "IN" | "OUT" | "INOUT";
            data_type: string;
        }>;
        body: string;
        comment?: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Drop a stored procedure
     */
    dropStoredProcedure(params: {
        procedure_name: string;
        if_exists?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
    /**
     * Show the CREATE statement for a stored procedure
     */
    showCreateProcedure(params: {
        procedure_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
