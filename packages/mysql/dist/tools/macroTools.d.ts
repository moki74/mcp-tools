import SecurityLayer from "../security/securityLayer";
export declare class MacroTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    /**
     * Safe Export Table: Exports table data to CSV with enforced data masking
     * This macro prioritizes data safety by applying masking rules before export.
     */
    safeExportTable(params: {
        table_name: string;
        masking_profile?: string;
        limit?: number;
        include_headers?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
