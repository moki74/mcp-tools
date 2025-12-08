import DatabaseConnection from "../db/connection";
import SecurityLayer from "../security/securityLayer";
import { MaskingLayer, MaskingProfile } from "../security/maskingLayer";

export class MacroTools {
    private db: DatabaseConnection;
    private security: SecurityLayer;

    constructor(security: SecurityLayer) {
        this.db = DatabaseConnection.getInstance();
        this.security = security;
    }

    /**
     * Safe Export Table: Exports table data to CSV with enforced data masking
     * This macro prioritizes data safety by applying masking rules before export.
     */
    async safeExportTable(params: {
        table_name: string;
        masking_profile?: string;
        limit?: number;
        include_headers?: boolean;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }> {
        try {
            const {
                table_name,
                masking_profile = "strict",
                limit = 1000,
                include_headers = true,
            } = params;

            // 1. Validate table name
            const tableValidation = this.security.validateIdentifier(table_name);
            if (!tableValidation.valid) {
                return {
                    status: "error",
                    error: tableValidation.error,
                };
            }

            // 2. Fetch data (with hard limit to prevent OOM on large safe exports)
            const maxLimit = 10000;
            const actualLimit = Math.min(limit, maxLimit);

            const escapedTableName = this.security.escapeIdentifier(table_name);
            const query = `SELECT * FROM ${escapedTableName} LIMIT ?`;
            const results = (await this.db.query(query, [actualLimit])) as any[];

            if (results.length === 0) {
                return {
                    status: "success",
                    data: {
                        csv: include_headers ? "" : "",
                        row_count: 0,
                        applied_profile: masking_profile,
                    },
                };
            }

            // 3. Apply masking explicitly using a new temporary layer to ensure strictness
            // We don't rely on the global masking profile here; we use the one requested (default strict)
            const tempMaskingLayer = new MaskingLayer(masking_profile);
            const maskedResults = tempMaskingLayer.processResults(results);

            // 4. Convert to CSV
            let csv = "";

            if (include_headers) {
                const headers = Object.keys(maskedResults[0]).join(",");
                csv += headers + "\n";
            }

            for (const row of maskedResults) {
                const values = Object.values(row)
                    .map((value) => {
                        if (value === null) return "";
                        if (value === undefined) return "";

                        let str = String(value);
                        // Escape quotes and wrap in quotes if contains comma, newline or quotes
                        if (
                            str.includes(",") ||
                            str.includes("\n") ||
                            str.includes('"')
                        ) {
                            return `"${str.replace(/"/g, '""')}"`;
                        }
                        return str;
                    })
                    .join(",");
                csv += values + "\n";
            }

            return {
                status: "success",
                data: {
                    csv: csv,
                    row_count: maskedResults.length,
                    applied_profile: tempMaskingLayer.getProfile(),
                },
            };
        } catch (error: any) {
            return {
                status: "error",
                error: error.message,
            };
        }
    }
}
