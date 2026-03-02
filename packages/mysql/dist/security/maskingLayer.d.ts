export declare enum MaskingStrategy {
    REDACT = "redact",// Replace with [REDACTED]
    PARTIAL = "partial",// Show first/last chars: a***@b.com
    HASH = "hash",// SHA256 hash (simulated for simplicity or real)
    NONE = "none"
}
export interface MaskingRule {
    columnPattern: RegExp;
    strategy: MaskingStrategy;
}
export declare enum MaskingProfile {
    NONE = "none",
    SOFT = "soft",// Mask only credentials (passwords, secrets)
    PARTIAL = "partial",// Mask credentials + partial mask PII (email, phone)
    STRICT = "strict"
}
/**
 * Data Masking Layer
 * Handles identifying and masking sensitive data in query results
 */
export declare class MaskingLayer {
    private profile;
    private rules;
    constructor(profile?: string);
    private parseProfile;
    private getRulesForProfile;
    /**
     * Check if filtering is active
     */
    isEnabled(): boolean;
    getProfile(): MaskingProfile;
    /**
     * Apply masking to a dataset (array of objects)
     */
    processResults(data: any[]): any[];
    private applyStrategy;
}
