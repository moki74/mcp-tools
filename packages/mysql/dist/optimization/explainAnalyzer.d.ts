export interface ExplainAnalysis {
    complexity: "LOW" | "MEDIUM" | "HIGH";
    issues: string[];
    suggestions: string[];
    summary: string;
}
export declare class ExplainAnalyzer {
    private static instance;
    private constructor();
    static getInstance(): ExplainAnalyzer;
    /**
     * Analyze EXPLAIN output (assumed to be in JSON format or standard table format)
     * Note: The server should prefer EXPLAIN FORMAT=JSON for better analysis,
     * but we will handle the standard result set array as well.
     */
    analyze(explainResult: any[]): ExplainAnalysis;
    private analyzeJsonFormat;
    private traverseJsonPlan;
    private analyzeRow;
    private generateSummary;
}
