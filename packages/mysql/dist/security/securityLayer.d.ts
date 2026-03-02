import { FeatureConfig } from "../config/featureConfig.js";
import { MaskingLayer } from "./maskingLayer.js";
export declare class SecurityLayer {
    private ajv;
    private readonly dangerousKeywords;
    private readonly allowedOperations;
    private readonly ddlOperations;
    private featureConfig;
    masking: MaskingLayer;
    constructor(featureConfig?: FeatureConfig);
    /**
     * Check if a specific tool is enabled in the feature configuration
     */
    isToolEnabled(toolName: string): boolean;
    /**
     * Check if a query is a read-only information query (SHOW, DESCRIBE, EXPLAIN, etc.)
     */
    private isInformationQuery;
    /**
     * Validate input against a JSON schema
     */
    validateInput(schema: object, data: any): {
        valid: boolean;
        errors?: any;
    };
    /**
     * Validate and sanitize table/column names to prevent SQL injection
     */
    validateIdentifier(identifier: string): {
        valid: boolean;
        error?: string;
    };
    /**
     * Enhanced SQL query validation for security issues
     * @param query - The SQL query to validate
     * @param bypassDangerousCheck - If true, skips dangerous keyword check (for users with 'execute' permission)
     */
    validateQuery(query: string, bypassDangerousCheck?: boolean): {
        valid: boolean;
        error?: string;
        queryType?: string;
    };
    /**
     * Enhanced comment detection to prevent bypass techniques
     */
    private detectComments;
    /**
     * Enhanced multiple statement detection
     */
    private detectMultipleStatements;
    /**
     * Enhanced query type detection
     */
    private detectQueryType;
    /**
     * Enhanced dangerous keyword detection
     */
    private detectDangerousKeywords;
    /**
     * Enhanced SELECT query validation
     */
    private validateSelectQuery;
    /**
     * Validate parameter values to prevent injection
     */
    validateParameters(params: any[]): {
        valid: boolean;
        error?: string;
        sanitizedParams?: any[];
    };
    /**
     * Check if a query is a read-only SELECT query or information query (SHOW, DESCRIBE, etc.)
     */
    isReadOnlyQuery(query: string): boolean;
    /**
     * Check if a query contains dangerous operations
     */
    hasDangerousOperations(query: string): boolean;
    /**
     * Check if execute permission is enabled
     */
    hasExecutePermission(): boolean;
    /**
     * Escape identifier for safe use in SQL queries
     */
    escapeIdentifier(identifier: string): string;
}
export default SecurityLayer;
