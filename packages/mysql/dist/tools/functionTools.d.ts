import { SecurityLayer } from "../security/securityLayer";
export declare class FunctionTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    /**
     * Validate database access - ensures only the connected database can be accessed
     */
    private validateDatabaseAccess;
    /**
     * List all functions in the current database
     */
    listFunctions(params: {
        database?: string;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    /**
     * Get detailed information about a specific function
     */
    getFunctionInfo(params: {
        function_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Create a new function
     */
    createFunction(params: {
        function_name: string;
        parameters?: Array<{
            name: string;
            data_type: string;
        }>;
        returns: string;
        body: string;
        deterministic?: boolean;
        data_access?: "CONTAINS SQL" | "NO SQL" | "READS SQL DATA" | "MODIFIES SQL DATA";
        security?: "DEFINER" | "INVOKER";
        comment?: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Drop a function
     */
    dropFunction(params: {
        function_name: string;
        if_exists?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
    /**
     * Show the CREATE statement for a function
     */
    showCreateFunction(params: {
        function_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Execute a function and return its result
     */
    executeFunction(params: {
        function_name: string;
        parameters?: any[];
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
