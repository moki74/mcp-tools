"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryVisualizationTools = void 0;
const connection_1 = __importDefault(require("../db/connection"));
class QueryVisualizationTools {
    constructor(security) {
        this.db = connection_1.default.getInstance();
        this.security = security;
    }
    extractExplainNodes(explainJson) {
        const nodes = [];
        const visit = (obj) => {
            if (!obj || typeof obj !== "object")
                return;
            if (obj.table && typeof obj.table === "object") {
                const t = obj.table;
                nodes.push({
                    table_name: t.table_name,
                    access_type: t.access_type,
                    possible_keys: t.possible_keys,
                    key: t.key,
                    rows_examined_per_scan: t.rows_examined_per_scan,
                    rows_produced_per_join: t.rows_produced_per_join,
                    filtered: t.filtered,
                    attached_condition: t.attached_condition,
                });
            }
            for (const v of Object.values(obj)) {
                if (Array.isArray(v))
                    v.forEach(visit);
                else if (v && typeof v === "object")
                    visit(v);
            }
        };
        visit(explainJson);
        return nodes;
    }
    sqlJoinEdges(query) {
        const edges = [];
        const q = query.replace(/\s+/g, " ");
        // Very lightweight parser: FROM <t> ... JOIN <t2> ON <cond>
        const fromMatch = q.match(/\bFROM\s+([`"']?\w+[`"']?)(?:\s+AS\s+\w+|\s+\w+)?/i);
        const base = fromMatch ? fromMatch[1].replace(/[`"']/g, "") : undefined;
        if (!base)
            return edges;
        const joinRegex = /\bJOIN\s+([`"']?\w+[`"']?)(?:\s+AS\s+\w+|\s+\w+)?\s+ON\s+(.+?)(?=\bJOIN\b|\bWHERE\b|\bGROUP\b|\bORDER\b|\bLIMIT\b|$)/gi;
        let m;
        let prev = base;
        while ((m = joinRegex.exec(q))) {
            const table = m[1].replace(/[`"']/g, "");
            const on = m[2].trim();
            edges.push({ from: prev, to: table, on });
            prev = table;
        }
        return edges;
    }
    buildMermaid(nodes, edges) {
        const lines = [];
        lines.push("graph TD");
        const uniqTables = Array.from(new Set(nodes.map((n) => n.table_name).filter(Boolean)));
        const nodeId = (t) => `t_${t.replace(/[^a-zA-Z0-9_]/g, "_")}`;
        for (const t of uniqTables) {
            const n = nodes.find((x) => x.table_name === t);
            const labelParts = [t];
            if (n?.access_type)
                labelParts.push(`access=${n.access_type}`);
            if (n?.key)
                labelParts.push(`key=${n.key}`);
            if (typeof n?.rows_examined_per_scan === "number") {
                labelParts.push(`rows≈${n.rows_examined_per_scan}`);
            }
            lines.push(`${nodeId(t)}["${labelParts.join("\\n")}"]`);
        }
        if (edges.length) {
            for (const e of edges) {
                lines.push(`${nodeId(e.from)} -->|"${(e.on || "").replace(/"/g, "'").slice(0, 60)}"| ${nodeId(e.to)}`);
            }
            return lines.join("\n");
        }
        // Fallback: join order from EXPLAIN
        for (let i = 0; i < uniqTables.length - 1; i++) {
            lines.push(`${nodeId(uniqTables[i])} --> ${nodeId(uniqTables[i + 1])}`);
        }
        return lines.join("\n");
    }
    /**
     * Create a lightweight visual representation of a SQL query.
     * Returns Mermaid flowchart + EXPLAIN FORMAT=JSON summary.
     */
    async visualizeQuery(params) {
        try {
            const query = params.query;
            if (!query || typeof query !== "string") {
                return { status: "error", error: "query is required" };
            }
            if (!this.security.isReadOnlyQuery(query)) {
                return {
                    status: "error",
                    error: "Only read-only queries (SELECT/SHOW/DESCRIBE/EXPLAIN) are supported for visualization.",
                };
            }
            const includeExplain = params.include_explain_json ?? true;
            const format = params.format ?? "both";
            const explainQuery = `EXPLAIN FORMAT=JSON ${query}`;
            const explainRows = await this.db.query(explainQuery);
            let explainJson = null;
            let queryCost = null;
            if (explainRows[0] && explainRows[0].EXPLAIN) {
                try {
                    explainJson = JSON.parse(explainRows[0].EXPLAIN);
                    queryCost =
                        explainJson?.query_block?.cost_info?.query_cost?.toString?.() ?? null;
                }
                catch {
                    explainJson = explainRows;
                }
            }
            const nodes = explainJson ? this.extractExplainNodes(explainJson) : [];
            const edges = this.sqlJoinEdges(query);
            const mermaid = this.buildMermaid(nodes, edges);
            const data = {
                mermaid,
                explain_summary: {
                    query_cost: queryCost,
                    tables: nodes.map((n) => ({
                        table_name: n.table_name,
                        access_type: n.access_type,
                        key: n.key,
                        rows_examined_per_scan: n.rows_examined_per_scan,
                        filtered: n.filtered,
                    })),
                },
            };
            if (includeExplain)
                data.explain_json = explainJson;
            if (format === "mermaid") {
                return { status: "success", data: { mermaid } };
            }
            if (format === "json") {
                return {
                    status: "success",
                    data: { explain_summary: data.explain_summary, explain_json: explainJson },
                };
            }
            return { status: "success", data };
        }
        catch (error) {
            return { status: "error", error: error.message };
        }
    }
}
exports.QueryVisualizationTools = QueryVisualizationTools;
