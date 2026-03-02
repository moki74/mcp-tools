"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplainAnalyzer = void 0;
class ExplainAnalyzer {
    constructor() { }
    static getInstance() {
        if (!ExplainAnalyzer.instance) {
            ExplainAnalyzer.instance = new ExplainAnalyzer();
        }
        return ExplainAnalyzer.instance;
    }
    /**
     * Analyze EXPLAIN output (assumed to be in JSON format or standard table format)
     * Note: The server should prefer EXPLAIN FORMAT=JSON for better analysis,
     * but we will handle the standard result set array as well.
     */
    analyze(explainResult) {
        const issues = [];
        const suggestions = [];
        let maxComplexity = 0;
        // Check if result is empty
        if (!explainResult || explainResult.length === 0) {
            return {
                complexity: "LOW",
                issues: ["No EXPLAIN output returned"],
                suggestions: [],
                summary: "Query validation failed or produced no execution plan."
            };
        }
        // Detect format (JSON string in first column or standard columns)
        // If using EXPLAIN FORMAT=JSON, output is usually [{ EXPLAIN: '...json...' }]
        const firstRow = explainResult[0];
        if (firstRow && (firstRow['EXPLAIN'] || firstRow['JSON_EXPLAIN'])) {
            return this.analyzeJsonFormat(firstRow['EXPLAIN'] || firstRow['JSON_EXPLAIN']);
        }
        // Analyze standard tabular format
        for (const row of explainResult) {
            this.analyzeRow(row, issues, suggestions);
            // Heuristic for complexity
            if (row.type === 'ALL')
                maxComplexity = Math.max(maxComplexity, 3);
            else if (row.type === 'index')
                maxComplexity = Math.max(maxComplexity, 2);
            else
                maxComplexity = Math.max(maxComplexity, 1);
        }
        let complexity = "LOW";
        if (maxComplexity >= 3)
            complexity = "HIGH";
        else if (maxComplexity === 2)
            complexity = "MEDIUM";
        return {
            complexity,
            issues: Array.from(new Set(issues)),
            suggestions: Array.from(new Set(suggestions)),
            summary: this.generateSummary(complexity, issues)
        };
    }
    analyzeJsonFormat(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            const queryBlock = data.query_block || data; // Root might be query_block directly in some versions
            const issues = [];
            const suggestions = [];
            this.traverseJsonPlan(queryBlock, issues, suggestions);
            const distinctIssues = Array.from(new Set(issues));
            const complexity = distinctIssues.some(i => i.includes("Full Table Scan")) ? "HIGH" : "MEDIUM"; // Simplified
            return {
                complexity,
                issues: distinctIssues,
                suggestions: Array.from(new Set(suggestions)),
                summary: this.generateSummary(complexity, distinctIssues)
            };
        }
        catch (e) {
            return {
                complexity: "LOW",
                issues: ["Failed to parse EXPLAIN JSON output"],
                suggestions: [],
                summary: "Could not analyze the execution plan details."
            };
        }
    }
    traverseJsonPlan(node, issues, suggestions) {
        if (!node)
            return;
        // Check for full table scans
        if (node.access_type === 'ALL') {
            issues.push(`Full Table Scan on table '${node.table_name || 'unknown'}'`);
            suggestions.push(`Consider adding an index on table '${node.table_name || 'unknown'}' for the columns used in WHERE clause.`);
        }
        // Check for filesort
        if (node.filesort || (node.extra && node.extra.includes('Using filesort'))) {
            issues.push("Using Filesort (sorting without index)");
            suggestions.push("Consider adding an index that matches the ORDER BY clause.");
        }
        // Check for temporary tables
        if (node.temporary_table || (node.extra && node.extra.includes('Using temporary'))) {
            issues.push("Using Temporary Table");
            suggestions.push("Optimize query to avoid temporary tables (e.g. check GROUP BY or ORDER BY columns).");
        }
        // Recursive traversal (simplified)
        if (node.nested_loop) {
            for (const child of node.nested_loop) {
                this.traverseJsonPlan(child.table, issues, suggestions);
            }
        }
        // TODO: Add more structural traversal if needed for specific JSON structures
    }
    analyzeRow(row, issues, suggestions) {
        const table = row.table || 'unknown';
        const type = row.type;
        const extra = row.Extra || '';
        const possible_keys = row.possible_keys;
        const key = row.key;
        if (type === 'ALL') {
            issues.push(`Full Table Scan on table '${table}'`);
            suggestions.push(`Add an index to '${table}' to avoid full scan.`);
        }
        if (type === 'index') {
            issues.push(`Full Index Scan on table '${table}'`);
            suggestions.push(`Query scans entire index tree for '${table}'. Consider specific range or key.`);
        }
        if (!key && possible_keys && type !== 'ALL') {
            // Indexes exist but not used? Rare case if not ALL.
        }
        if (extra.includes('Using filesort')) {
            issues.push(`Using Filesort on table '${table}'`);
            suggestions.push(`Add index for ORDER BY clause on '${table}'.`);
        }
        if (extra.includes('Using temporary')) {
            issues.push(`Using Temporary Table for '${table}'`);
            suggestions.push(`Check GROUP BY / ORDER BY columns on '${table}'.`);
        }
        if (extra.includes('Range checked for each record')) {
            issues.push(`Inefficient join buffer usage on '${table}'`);
            suggestions.push(`Check join conditions and indexes on '${table}'.`);
        }
    }
    generateSummary(complexity, issues) {
        if (issues.length === 0) {
            return "Query plan looks good. No obvious performance issues detected.";
        }
        return `Query has ${complexity} complexity with ${issues.length} potential performance issue(s): ${issues.join("; ")}`;
    }
}
exports.ExplainAnalyzer = ExplainAnalyzer;
