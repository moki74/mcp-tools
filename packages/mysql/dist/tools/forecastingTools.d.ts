import { SecurityLayer } from "../security/securityLayer";
export declare class ForecastingTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    private validateDatabaseAccess;
    private extractExplainNodes;
    /**
     * Predict how query cost/scan volume might change under table growth assumptions.
     * This is heuristic-based and uses EXPLAIN FORMAT=JSON estimates.
     */
    predictQueryPerformance(params: {
        query: string;
        row_growth_multiplier?: number;
        per_table_row_growth?: Record<string, number>;
        include_explain_json?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    /**
     * Forecast database/table growth based on current sizes and user-supplied growth rate assumptions.
     */
    forecastDatabaseGrowth(params?: {
        horizon_days?: number;
        growth_rate_percent_per_day?: number;
        growth_rate_percent_per_month?: number;
        per_table_growth_rate_percent_per_day?: Record<string, number>;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
