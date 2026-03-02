type Severity = "info" | "low" | "medium" | "high" | "critical";
export declare class SecurityAuditTools {
    private db;
    constructor();
    private validateDatabaseAccess;
    auditDatabaseSecurity(params?: {
        database?: string;
        include_user_account_checks?: boolean;
        include_privilege_checks?: boolean;
    }): Promise<{
        status: string;
        data?: {
            database: string;
            findings: Array<{
                severity: Severity;
                title: string;
                evidence?: string;
                recommendation: string;
            }>;
            summary: {
                critical: number;
                high: number;
                medium: number;
                low: number;
                info: number;
            };
            notes: string[];
        };
        error?: string;
    }>;
    private severityRank;
    private summarizeFindings;
    private asOnOff;
    private asInt;
    private readVariables;
    private tryReadUserAccounts;
    private tryReadPrivilegeSummaries;
}
export {};
