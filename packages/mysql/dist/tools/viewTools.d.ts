import { SecurityLayer } from "../security/securityLayer";
export declare class ViewTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    /**
     * Validate database access - ensures only the connected database can be accessed
     */
    private validateDatabaseAccess;
    /**
     * List all views in the current database
     */
    listViews(params: {
        database?: string;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    /**
     * Get detailed information about a specific view
     */
    getViewInfo(params: {
        view_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Create a new view
     */
    createView(params: {
        view_name: string;
        definition: string;
        or_replace?: boolean;
        algorithm?: "UNDEFINED" | "MERGE" | "TEMPTABLE";
        security?: "DEFINER" | "INVOKER";
        check_option?: "CASCADED" | "LOCAL";
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Alter an existing view
     */
    alterView(params: {
        view_name: string;
        definition: string;
        algorithm?: "UNDEFINED" | "MERGE" | "TEMPTABLE";
        security?: "DEFINER" | "INVOKER";
        check_option?: "CASCADED" | "LOCAL";
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Drop a view
     */
    dropView(params: {
        view_name: string;
        if_exists?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
    /**
     * Show the CREATE statement for a view
     */
    showCreateView(params: {
        view_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
