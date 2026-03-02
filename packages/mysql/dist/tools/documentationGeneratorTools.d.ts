import { SecurityLayer } from "../security/securityLayer";
/**
 * AI-Powered Documentation Generator
 * Automatic database documentation generation with business glossary
 */
export declare class DocumentationGeneratorTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    /**
     * Validate database access - ensures only the connected database can be accessed
     */
    private validateDatabaseAccess;
    /**
     * Generate comprehensive database documentation
     */
    generateDocumentation(params: {
        scope?: "database" | "table" | "column" | "relationship";
        table_name?: string;
        include_business_glossary?: boolean;
        format?: "markdown" | "html" | "json";
        include_examples?: boolean;
        include_statistics?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            format: string;
            scope: string;
            content: string;
            metadata: {
                generated_at: string;
                database: string;
                tables_documented: number;
                columns_documented: number;
            };
        };
        error?: string;
    }>;
    /**
     * Generate data dictionary for a specific table
     */
    generateDataDictionary(params: {
        table_name: string;
        include_sample_values?: boolean;
        include_constraints?: boolean;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            table_name: string;
            description: string;
            columns: Array<{
                name: string;
                data_type: string;
                description: string;
                constraints: string[];
                is_nullable: boolean;
                default_value: string | null;
                sample_values?: any[];
                business_term?: string;
            }>;
            primary_key: string[];
            foreign_keys: Array<{
                column: string;
                references_table: string;
                references_column: string;
            }>;
            indexes: Array<{
                name: string;
                columns: string[];
                is_unique: boolean;
            }>;
        };
        error?: string;
    }>;
    /**
     * Generate a business glossary from the schema
     */
    generateBusinessGlossaryReport(params: {
        include_descriptions?: boolean;
        group_by?: "table" | "category" | "alphabetical";
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            glossary: Array<{
                term: string;
                technical_name: string;
                source_table: string;
                data_type: string;
                description: string;
                category: string;
                related_terms?: string[];
            }>;
            categories: string[];
            total_terms: number;
        };
        error?: string;
    }>;
    /**
     * Generate business glossary from columns
     */
    private generateBusinessGlossary;
    /**
     * Get table statistics
     */
    private getTableStatistics;
    /**
     * Generate Markdown documentation
     */
    private generateMarkdown;
    /**
     * Generate HTML documentation
     */
    private generateHTML;
    /**
     * Generate JSON documentation
     */
    private generateJSON;
    /**
     * Group indexes by name
     */
    private groupIndexes;
    /**
     * Infer business term from column name
     */
    private inferBusinessTerm;
    /**
     * Infer column description from name and type
     */
    private inferColumnDescription;
    /**
     * Infer table description from name
     */
    private inferTableDescription;
    /**
     * Infer category from column name and type
     */
    private inferCategory;
    /**
     * Normalize column name for comparison
     */
    private normalizeColumnName;
}
