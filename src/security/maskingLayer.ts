
export enum MaskingStrategy {
    REDACT = "redact",     // Replace with [REDACTED]
    PARTIAL = "partial",   // Show first/last chars: a***@b.com
    HASH = "hash",         // SHA256 hash (simulated for simplicity or real)
    NONE = "none"          // No masking
}

export interface MaskingRule {
    columnPattern: RegExp; // Regex to match column name
    strategy: MaskingStrategy;
}

export enum MaskingProfile {
    NONE = "none",
    SOFT = "soft",       // Mask only credentials (passwords, secrets)
    PARTIAL = "partial", // Mask credentials + partial mask PII (email, phone)
    STRICT = "strict"    // Redact all PII and credentials
}

/**
 * Data Masking Layer
 * Handles identifying and masking sensitive data in query results
 */
export class MaskingLayer {
    private profile: MaskingProfile;
    private rules: MaskingRule[];

    constructor(profile: string = "none") {
        this.profile = this.parseProfile(profile);
        this.rules = this.getRulesForProfile(this.profile);
    }

    private parseProfile(input: string): MaskingProfile {
        const normalized = input.toLowerCase().trim();
        if (Object.values(MaskingProfile).includes(normalized as MaskingProfile)) {
            return normalized as MaskingProfile;
        }
        return MaskingProfile.NONE;
    }

    private getRulesForProfile(profile: MaskingProfile): MaskingRule[] {
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
    public isEnabled(): boolean {
        return this.profile !== MaskingProfile.NONE;
    }

    public getProfile(): MaskingProfile {
        return this.profile;
    }

    /**
     * Apply masking to a dataset (array of objects)
     */
    public processResults(data: any[]): any[] {
        if (!this.isEnabled() || !data || data.length === 0) {
            return data;
        }

        // Identify columns to mask based on the first record (optimization)
        const firstRecord = data[0];
        const columns = Object.keys(firstRecord);
        const columnsToMask: Array<{ col: string, strategy: MaskingStrategy }> = [];

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

    private applyStrategy(value: any, strategy: MaskingStrategy): any {
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
                } else if (strVal.length > 4) {
                    // Generic partial: show last 4 chars (e.g. phone/cc)
                    // or first 1 + last 4
                    return '***' + strVal.slice(-4);
                } else {
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
