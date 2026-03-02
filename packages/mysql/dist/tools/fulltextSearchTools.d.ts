import { SecurityLayer } from "../security/securityLayer";
export declare class FulltextSearchTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    private validateDatabaseAccess;
    createFulltextIndex(params: {
        table_name: string;
        columns: string[];
        index_name?: string;
        parser?: "ngram" | "mecab";
        ngram_token_size?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    fulltextSearch(params: {
        table_name: string;
        search_term: string;
        columns?: string[];
        mode?: "natural_language" | "natural_language_with_query_expansion" | "boolean" | "query_expansion";
        limit?: number;
        offset?: number;
        order_by?: string;
        order_direction?: "ASC" | "DESC";
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    getFulltextInfo(params: {
        table_name: string;
        index_name?: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    dropFulltextIndex(params: {
        table_name: string;
        index_name?: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    getFulltextStats(params: {
        table_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
    optimizeFulltext(params: {
        table_name: string;
        database?: string;
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
