import { SecurityLayer } from "../security/securityLayer";
export declare class TriggerTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    /**
     * Validate database access - ensures only the connected database can be accessed
     */
    private validateDatabaseAccess;
    /**
     * List all triggers in the current database
     */
    listTriggers(params: {
        database?: string;
        table_name?: string;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    /**
     * Get detailed information about a specific trigger
     */
    getTriggerInfo(params: {
        trigger_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Create a new trigger
     */
    createTrigger(params: {
        trigger_name: string;
        table_name: string;
        timing: "BEFORE" | "AFTER";
        event: "INSERT" | "UPDATE" | "DELETE";
        body: string;
        definer?: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Drop a trigger
     */
    dropTrigger(params: {
        trigger_name: string;
        if_exists?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
    /**
     * Show the CREATE statement for a trigger
     */
    showCreateTrigger(params: {
        trigger_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
