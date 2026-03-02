import { SecurityLayer } from "../security/securityLayer";
export declare class AiTools {
    private db;
    private security;
    private analyzer;
    private optimizer;
    constructor(security: SecurityLayer);
    /**
     * guided_query_fixer
     * Analyzes a query (and optional error) to suggest repairs or optimizations using EXPLAIN.
     */
    repairQuery(params: {
        query: string;
        error_message?: string;
    }): Promise<{
        status: string;
        analysis?: any;
        fixed_query?: string;
        suggestions?: string[];
        error?: string;
    }>;
}
