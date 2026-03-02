"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaskingLayer = exports.MaskingProfile = exports.MaskingStrategy = void 0;
var MaskingStrategy;
(function (MaskingStrategy) {
    MaskingStrategy["REDACT"] = "redact";
    MaskingStrategy["PARTIAL"] = "partial";
    MaskingStrategy["HASH"] = "hash";
    MaskingStrategy["NONE"] = "none"; // No masking
})(MaskingStrategy || (exports.MaskingStrategy = MaskingStrategy = {}));
var MaskingProfile;
(function (MaskingProfile) {
    MaskingProfile["NONE"] = "none";
    MaskingProfile["SOFT"] = "soft";
    MaskingProfile["PARTIAL"] = "partial";
    MaskingProfile["STRICT"] = "strict"; // Redact all PII and credentials
})(MaskingProfile || (exports.MaskingProfile = MaskingProfile = {}));
/**
 * Data Masking Layer
 * Handles identifying and masking sensitive data in query results
 */
class MaskingLayer {
    constructor(profile = "none") {
        this.profile = this.parseProfile(profile);
        this.rules = this.getRulesForProfile(this.profile);
    }
    parseProfile(input) {
        const normalized = input.toLowerCase().trim();
        if (Object.values(MaskingProfile).includes(normalized)) {
            return normalized;
        }
        return MaskingProfile.NONE;
    }
    getRulesForProfile(profile) {
        const credentialsPattern = /^(password|passwd|pwd|secret|token|api_key|auth_key|access_token|refresh_token)$/i;
        const piiPattern = /^(email|phone|mobile|cell|ssn|social_security|credit_card|cc_number|card_number|iban|dob|date_of_birth)$/i;
        switch (profile) {
            case MaskingProfile.NONE:
                return [];
            case MaskingProfile.SOFT:
                return [
                    { columnPattern: credentialsPattern, strategy: MaskingStrategy.REDACT }
                ];
            case MaskingProfile.PARTIAL:
                return [
                    { columnPattern: credentialsPattern, strategy: MaskingStrategy.REDACT },
                    { columnPattern: piiPattern, strategy: MaskingStrategy.PARTIAL }
                ];
            case MaskingProfile.STRICT:
                return [
                    { columnPattern: credentialsPattern, strategy: MaskingStrategy.REDACT },
                    { columnPattern: piiPattern, strategy: MaskingStrategy.REDACT }
                ];
            default:
                return [];
        }
    }
    /**
     * Check if filtering is active
     */
    isEnabled() {
        return this.profile !== MaskingProfile.NONE;
    }
    getProfile() {
        return this.profile;
    }
    /**
     * Apply masking to a dataset (array of objects)
     */
    processResults(data) {
        if (!this.isEnabled() || !data || data.length === 0) {
            return data;
        }
        // Identify columns to mask based on the first record (optimization)
        const firstRecord = data[0];
        const columns = Object.keys(firstRecord);
        const columnsToMask = [];
        for (const col of columns) {
            for (const rule of this.rules) {
                if (rule.columnPattern.test(col)) {
                    columnsToMask.push({ col, strategy: rule.strategy });
                    break; // Apply first matching rule
                }
            }
        }
        if (columnsToMask.length === 0) {
            // No sensitive columns found
            return data;
        }
        // Apply masking to all records
        return data.map(record => {
            const maskedRecord = { ...record };
            for (const { col, strategy } of columnsToMask) {
                if (maskedRecord[col] !== null && maskedRecord[col] !== undefined) {
                    maskedRecord[col] = this.applyStrategy(maskedRecord[col], strategy);
                }
            }
            return maskedRecord;
        });
    }
    applyStrategy(value, strategy) {
        const strVal = String(value);
        switch (strategy) {
            case MaskingStrategy.REDACT:
                return "[REDACTED]";
            case MaskingStrategy.PARTIAL:
                if (strVal.includes('@')) {
                    // Email masking: j***@domain.com
                    const [local, domain] = strVal.split('@');
                    const maskedLocal = local.length > 2 ? local[0] + '***' + local[local.length - 1] : '***';
                    return `${maskedLocal}@${domain}`;
                }
                else if (strVal.length > 4) {
                    // Generic partial: show last 4 chars (e.g. phone/cc)
                    // or first 1 + last 4
                    return '***' + strVal.slice(-4);
                }
                else {
                    return "***";
                }
            case MaskingStrategy.HASH:
                // Simple placeholder for hash to avoid crypto dependency if not needed,
                // or use a simple consistent hash if strictly required. 
                // For now, let's use a redaction-like placeholder to indicate hashing intent.
                return "[HASHED]";
            default:
                return value;
        }
    }
}
exports.MaskingLayer = MaskingLayer;
