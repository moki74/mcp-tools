export interface QueryLog {
    sql: string;
    params?: any[];
    duration: number;
    timestamp: string;
    status: "success" | "error";
    error?: string;
    cacheHit?: boolean;
}
export declare class QueryLogger {
    private static logs;
    private static readonly MAX_LOGS;
    private static readonly MAX_SQL_LENGTH;
    private static readonly MAX_PARAM_LENGTH;
    private static readonly MAX_PARAM_ITEMS;
    /**
     * Safely stringify a value with truncation and error handling
     */
    private static safeStringify;
    /**
     * Truncate SQL string to prevent memory issues
     */
    private static truncateSQL;
    /**
     * Create a memory-safe copy of parameters
     */
    private static sanitizeParams;
    /**
     * Log a query execution
     */
    static log(sql: string, params: any[] | undefined, duration: number, status: "success" | "error", error?: string, cacheHit?: boolean): void;
    /**
     * Get all logged queries (returns shallow copy of array)
     */
    static getLogs(): QueryLog[];
    /**
     * Get the last N logged queries
     */
    static getLastLogs(count?: number): QueryLog[];
    /**
     * Get logs for the current session (last query execution)
     */
    static getLastLog(): QueryLog | undefined;
    /**
     * Clear all logs
     */
    static clearLogs(): void;
    /**
     * Format SQL for better readability
     */
    private static formatSQL;
    /**
     * Get logs as formatted string for output with enhanced human readability
     * Optimized for Kilocode and other MCP clients
     */
    static formatLogs(logs: QueryLog[]): string;
    /**
     * Get logs as compact formatted string (for backward compatibility)
     */
    static formatLogsCompact(logs: QueryLog[]): string;
}
