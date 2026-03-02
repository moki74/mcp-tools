import { SecurityLayer } from "../security/securityLayer";
export declare class ProcessTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    /**
     * Show all running processes/connections
     */
    showProcessList(params?: {
        full?: boolean;
    }): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    /**
     * Kill a specific process/connection
     */
    killProcess(params: {
        process_id: number;
        type?: "CONNECTION" | "QUERY";
    }): Promise<{
        status: string;
        message?: string;
        error?: string;
    }>;
    /**
     * Show server status variables
     */
    showStatus(params?: {
        like?: string;
        global?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Show server variables
     */
    showVariables(params?: {
        like?: string;
        global?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Explain a query (show execution plan)
     */
    explainQuery(params: {
        query: string;
        format?: "TRADITIONAL" | "JSON" | "TREE";
        analyze?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Show engine status (InnoDB, etc.)
     */
    showEngineStatus(params?: {
        engine?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Get server information
     */
    getServerInfo(): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Show binary logs
     */
    showBinaryLogs(): Promise<{
        status: string;
        data?: any[];
        error?: string;
    }>;
    /**
     * Show master/replica status
     */
    showReplicationStatus(params?: {
        type?: "MASTER" | "REPLICA" | "SLAVE";
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
