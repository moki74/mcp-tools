import { SecurityLayer } from "../security/securityLayer";
type NamingConvention = "snake_case" | "camelCase";
export declare class SchemaDesignTools {
    private security;
    constructor(security: SecurityLayer);
    designSchemaFromRequirements(params: {
        requirements_text: string;
        entities?: Array<{
            name: string;
            fields?: string[];
        }>;
        naming_convention?: NamingConvention;
        include_audit_columns?: boolean;
        id_type?: "BIGINT" | "UUID";
        engine?: string;
        charset?: string;
        collation?: string;
    }): Promise<{
        status: string;
        data?: {
            input: {
                requirements_text: string;
                inferred_entities_count: number;
            };
            tables: Array<{
                table_name: string;
                columns: Array<{
                    name: string;
                    type: string;
                    nullable: boolean;
                    primary_key?: boolean;
                    unique?: boolean;
                    references?: {
                        table: string;
                        column: string;
                    };
                }>;
                indexes: Array<{
                    name: string;
                    columns: string[];
                    unique?: boolean;
                }>;
            }>;
            relationships: Array<{
                from_table: string;
                from_column: string;
                to_table: string;
                to_column: string;
                type: "one_to_many" | "many_to_one";
            }>;
            ddl_statements: string[];
            notes: string[];
        };
        error?: string;
    }>;
    private normalizeLoose;
    private toSnakeCase;
    private toCamelCase;
    private normalizeIdentifier;
    private inferColumnType;
    private extractEntitiesAndRelations;
    private findTableNameForRaw;
    private makeIndexName;
    private generateCreateTableDDL;
    private generateCreateIndexDDL;
}
export {};
