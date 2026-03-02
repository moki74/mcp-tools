import { SecurityLayer } from "../security/securityLayer";
export declare class QueryVisualizationTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    private extractExplainNodes;
    private sqlJoinEdges;
    private buildMermaid;
    /**
     * Create a lightweight visual representation of a SQL query.
     * Returns Mermaid flowchart + EXPLAIN FORMAT=JSON summary.
     */
    visualizeQuery(params: {
        query: string;
        include_explain_json?: boolean;
        format?: "mermaid" | "json" | "both";
    }): Promise<{
        status: string;
        data?: any;
        error?: string;
    }>;
}
