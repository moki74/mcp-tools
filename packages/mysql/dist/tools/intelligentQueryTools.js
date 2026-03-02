"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligentQueryTools = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const config_1 = require("../config/config");
/**
 * Intelligent Query Assistant
 * Converts natural language to optimized SQL with context-aware query generation
 */
class IntelligentQueryTools {
    constructor(security) {
        this.db = connection_1.default.getInstance();
        this.security = security;
    }
    /**
     * Validate database access - ensures only the connected database can be accessed
     */
    validateDatabaseAccess(requestedDatabase) {
        const connectedDatabase = config_1.dbConfig.database;
        if (!connectedDatabase) {
            return {
                valid: false,
                database: "",
                error: "No database specified in connection string. Cannot access any database.",
            };
        }
        if (!requestedDatabase) {
            return {
                valid: true,
                database: connectedDatabase,
            };
        }
        if (requestedDatabase !== connectedDatabase) {
            return {
                valid: false,
                database: "",
                error: `Access denied. You can only access the connected database '${connectedDatabase}'. Requested database '${requestedDatabase}' is not allowed.`,
            };
        }
        return {
            valid: true,
            database: connectedDatabase,
        };
    }
    /**
     * Build a natural language query based on intent and context
     * This is the core "Intelligent Query Assistant" feature
     */
    async buildQueryFromIntent(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { natural_language, context = "analytics", max_complexity = "medium", safety_level = "moderate", } = params;
            const database = dbValidation.database;
            if (!natural_language?.trim()) {
                return {
                    status: "error",
                    error: "natural_language parameter is required",
                };
            }
            // Step 1: Get database schema context
            const schemaContext = await this.getSchemaContext(database);
            if (!schemaContext.tables.length) {
                return {
                    status: "error",
                    error: "No tables found in the database. Cannot generate query.",
                };
            }
            // Step 2: Parse natural language intent
            const intentAnalysis = this.analyzeIntent(natural_language, schemaContext);
            // Step 3: Match tables and columns based on intent
            const matchedEntities = this.matchEntitiesToSchema(intentAnalysis, schemaContext);
            // Step 4: Generate SQL based on analysis
            const generatedQuery = this.generateSQL(intentAnalysis, matchedEntities, context, max_complexity, safety_level, database);
            // Step 5: Validate generated query
            const validation = this.security.validateQuery(generatedQuery.sql, false);
            // Step 6: Generate optimization hints
            const optimizationHints = this.generateOptimizationHints(generatedQuery.sql, matchedEntities, schemaContext);
            // Step 7: Generate safety notes
            const safetyNotes = this.generateSafetyNotes(generatedQuery.sql, safety_level, matchedEntities);
            return {
                status: "success",
                data: {
                    generated_sql: generatedQuery.sql,
                    explanation: generatedQuery.explanation,
                    tables_involved: matchedEntities.tables,
                    columns_involved: matchedEntities.columns,
                    estimated_complexity: this.estimateComplexity(generatedQuery.sql),
                    safety_notes: safetyNotes,
                    optimization_hints: optimizationHints,
                    alternatives: generatedQuery.alternatives,
                },
            };
        }
        catch (error) {
            return {
                status: "error",
                error: error.message,
            };
        }
    }
    /**
     * Get database schema context for query generation
     */
    async getSchemaContext(database) {
        // Get tables
        const tables = await this.db.query(`SELECT TABLE_NAME, TABLE_ROWS 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`, [database]);
        if (!tables.length) {
            return { tables: [], relationships: [] };
        }
        // Get columns for all tables
        const tableNames = tables.map((t) => t.TABLE_NAME);
        const placeholders = tableNames.map(() => "?").join(",");
        const columns = await this.db.query(`SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_KEY
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${placeholders})
       ORDER BY TABLE_NAME, ORDINAL_POSITION`, [database, ...tableNames]);
        // Get foreign key relationships
        const foreignKeys = await this.db.query(`SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
       FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${placeholders})
         AND REFERENCED_TABLE_NAME IS NOT NULL`, [database, ...tableNames]);
        // Build relationships map
        const fkMap = new Map();
        foreignKeys.forEach((fk) => {
            fkMap.set(`${fk.TABLE_NAME}.${fk.COLUMN_NAME}`, {
                table: fk.REFERENCED_TABLE_NAME,
                column: fk.REFERENCED_COLUMN_NAME,
            });
        });
        // Build table schema
        const tableSchemas = tables.map((table) => {
            const tableCols = columns.filter((c) => c.TABLE_NAME === table.TABLE_NAME);
            return {
                name: table.TABLE_NAME,
                columns: tableCols.map((col) => {
                    const fkRef = fkMap.get(`${col.TABLE_NAME}.${col.COLUMN_NAME}`);
                    return {
                        name: col.COLUMN_NAME,
                        type: col.DATA_TYPE,
                        isPrimaryKey: col.COLUMN_KEY === "PRI",
                        isForeignKey: !!fkRef,
                        referencedTable: fkRef?.table,
                        referencedColumn: fkRef?.column,
                    };
                }),
                rowCount: parseInt(table.TABLE_ROWS || "0", 10) || 0,
            };
        });
        // Build relationships list
        const relationships = foreignKeys.map((fk) => ({
            fromTable: fk.TABLE_NAME,
            fromColumn: fk.COLUMN_NAME,
            toTable: fk.REFERENCED_TABLE_NAME,
            toColumn: fk.REFERENCED_COLUMN_NAME,
        }));
        return { tables: tableSchemas, relationships };
    }
    /**
     * Analyze natural language intent
     */
    analyzeIntent(naturalLanguage, schemaContext) {
        const text = naturalLanguage.toLowerCase().trim();
        // Detect action type
        let action = "unknown";
        if (/\b(count|how many|number of)\b/i.test(text)) {
            action = "count";
        }
        else if (/\b(total|sum|average|avg|min|max|group by)\b/i.test(text)) {
            action = "aggregate";
        }
        else if (/\b(join|combine|merge|with|and their|along with)\b/i.test(text)) {
            action = "join";
        }
        else if (/\b(show|get|find|list|select|display|retrieve|fetch)\b/i.test(text)) {
            action = "select";
        }
        // Extract keywords (potential table/column references)
        const words = text.split(/\s+/).filter((w) => w.length > 2);
        const keywords = words.filter((w) => !this.isStopWord(w) && /^[a-z_]+$/i.test(w));
        // Detect aggregation functions
        const aggregations = [];
        if (/\btotal\b|\bsum\b/i.test(text))
            aggregations.push("SUM");
        if (/\baverage\b|\bavg\b/i.test(text))
            aggregations.push("AVG");
        if (/\bmin(imum)?\b/i.test(text))
            aggregations.push("MIN");
        if (/\bmax(imum)?\b/i.test(text))
            aggregations.push("MAX");
        if (/\bcount\b|\bhow many\b/i.test(text))
            aggregations.push("COUNT");
        // Detect conditions
        const conditions = [];
        if (/\bwhere\b/i.test(text)) {
            const whereMatch = text.match(/where\s+(.+?)(?:\s+order|\s+limit|\s+group|$)/i);
            if (whereMatch)
                conditions.push(whereMatch[1]);
        }
        // Pattern: "with [column] = [value]" or "[column] is [value]"
        const conditionPatterns = [
            /(\w+)\s*(?:is|=|equals?)\s*['"]?([^'"]+)['"]?/gi,
            /with\s+(\w+)\s+['"]?([^'"]+)['"]?/gi,
            /(\w+)\s+greater\s+than\s+(\d+)/gi,
            /(\w+)\s+less\s+than\s+(\d+)/gi,
        ];
        conditionPatterns.forEach((pattern) => {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                conditions.push(`${match[1]} = ${match[2]}`);
            }
        });
        // Detect order by
        let orderBy = null;
        const orderPatterns = [
            /order(?:ed)?\s+by\s+(\w+)/i,
            /sort(?:ed)?\s+by\s+(\w+)/i,
            /\b(latest|newest|oldest|highest|lowest|first|last)\b/i,
        ];
        for (const pattern of orderPatterns) {
            const match = text.match(pattern);
            if (match) {
                orderBy = match[1];
                break;
            }
        }
        // Detect limit
        let limit = null;
        const limitPatterns = [
            /(?:top|first|last)\s+(\d+)/i,
            /limit\s+(\d+)/i,
            /(\d+)\s+(?:records?|rows?|items?|entries?)/i,
        ];
        for (const pattern of limitPatterns) {
            const match = text.match(pattern);
            if (match) {
                limit = parseInt(match[1], 10);
                break;
            }
        }
        // Detect group by
        let groupBy = null;
        const groupMatch = text.match(/(?:group|grouped)\s+by\s+(\w+)/i);
        if (groupMatch) {
            groupBy = groupMatch[1];
        }
        else if (/\bper\s+(\w+)\b/i.test(text)) {
            const perMatch = text.match(/\bper\s+(\w+)\b/i);
            if (perMatch)
                groupBy = perMatch[1];
        }
        else if (/\bby\s+(\w+)\b/i.test(text) && action === "aggregate") {
            const byMatch = text.match(/\bby\s+(\w+)\b/i);
            if (byMatch)
                groupBy = byMatch[1];
        }
        return {
            action,
            keywords,
            aggregations,
            conditions,
            orderBy,
            limit,
            groupBy,
        };
    }
    /**
     * Check if a word is a common stop word
     */
    isStopWord(word) {
        const stopWords = new Set([
            "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
            "have", "has", "had", "do", "does", "did", "will", "would", "could",
            "should", "may", "might", "must", "shall", "can", "and", "or", "but",
            "if", "then", "else", "when", "where", "which", "who", "whom", "what",
            "how", "why", "all", "each", "every", "both", "few", "more", "most",
            "other", "some", "such", "no", "not", "only", "own", "same", "so",
            "than", "too", "very", "just", "also", "now", "here", "there",
            "show", "get", "find", "list", "select", "display", "retrieve", "fetch",
            "from", "to", "in", "on", "at", "by", "for", "with", "about", "into",
            "through", "during", "before", "after", "above", "below", "up", "down",
            "out", "off", "over", "under", "again", "further", "once", "me", "my",
        ]);
        return stopWords.has(word.toLowerCase());
    }
    /**
     * Match intent entities to actual schema objects
     */
    matchEntitiesToSchema(intent, schemaContext) {
        const matchedTables = [];
        const matchedColumns = [];
        const tableToColumns = new Map();
        const joinPaths = [];
        // Score tables and columns based on keyword matching
        const tableScores = new Map();
        const columnScores = new Map();
        for (const table of schemaContext.tables) {
            const tableName = table.name.toLowerCase();
            let tableScore = 0;
            for (const keyword of intent.keywords) {
                const kw = keyword.toLowerCase();
                // Exact match
                if (tableName === kw) {
                    tableScore += 10;
                }
                // Plural/singular match
                else if (tableName === kw + "s" ||
                    tableName + "s" === kw ||
                    tableName === kw.replace(/ies$/, "y") ||
                    tableName.replace(/ies$/, "y") === kw) {
                    tableScore += 8;
                }
                // Contains match
                else if (tableName.includes(kw) || kw.includes(tableName)) {
                    tableScore += 5;
                }
                // Partial match
                else if (this.similarityScore(tableName, kw) > 0.6) {
                    tableScore += 3;
                }
            }
            if (tableScore > 0) {
                tableScores.set(table.name, tableScore);
            }
            // Check columns
            for (const col of table.columns) {
                const colName = col.name.toLowerCase();
                let colScore = 0;
                for (const keyword of intent.keywords) {
                    const kw = keyword.toLowerCase();
                    if (colName === kw) {
                        colScore += 10;
                    }
                    else if (colName.includes(kw) || kw.includes(colName)) {
                        colScore += 5;
                    }
                    else if (this.similarityScore(colName, kw) > 0.6) {
                        colScore += 3;
                    }
                }
                // Boost score for aggregation-related columns
                if (intent.aggregations.length > 0) {
                    if (col.type.includes("int") ||
                        col.type.includes("decimal") ||
                        col.type.includes("float") ||
                        col.type.includes("double")) {
                        colScore += 2;
                    }
                }
                if (colScore > 0) {
                    const existing = columnScores.get(col.name);
                    if (!existing || existing.score < colScore) {
                        columnScores.set(col.name, { table: table.name, score: colScore });
                    }
                }
            }
        }
        // Select top tables
        const sortedTables = [...tableScores.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        for (const [tableName] of sortedTables) {
            matchedTables.push(tableName);
        }
        // If no tables matched, use the largest table as primary
        if (matchedTables.length === 0 && schemaContext.tables.length > 0) {
            const largestTable = schemaContext.tables.reduce((a, b) => a.rowCount > b.rowCount ? a : b);
            matchedTables.push(largestTable.name);
        }
        // Select matched columns
        for (const [colName, { table }] of columnScores) {
            if (matchedTables.includes(table)) {
                matchedColumns.push(colName);
                if (!tableToColumns.has(table)) {
                    tableToColumns.set(table, []);
                }
                tableToColumns.get(table).push(colName);
            }
        }
        // Find join paths between matched tables
        if (matchedTables.length > 1) {
            for (const rel of schemaContext.relationships) {
                if (matchedTables.includes(rel.fromTable) &&
                    matchedTables.includes(rel.toTable)) {
                    joinPaths.push({
                        from: rel.fromTable,
                        to: rel.toTable,
                        on: `${rel.fromTable}.${rel.fromColumn} = ${rel.toTable}.${rel.toColumn}`,
                    });
                }
            }
        }
        // Determine primary table
        const primaryTable = matchedTables.length > 0
            ? matchedTables.reduce((a, b) => (tableScores.get(a) || 0) > (tableScores.get(b) || 0) ? a : b)
            : null;
        return {
            tables: matchedTables,
            columns: matchedColumns,
            tableToColumns,
            joinPaths,
            primaryTable,
        };
    }
    /**
     * Calculate similarity score between two strings (simple Jaccard-like)
     */
    similarityScore(a, b) {
        const setA = new Set(a.toLowerCase().split(""));
        const setB = new Set(b.toLowerCase().split(""));
        const intersection = [...setA].filter((x) => setB.has(x)).length;
        const union = new Set([...setA, ...setB]).size;
        return union > 0 ? intersection / union : 0;
    }
    /**
     * Generate SQL based on analysis
     */
    generateSQL(intent, matchedEntities, context, maxComplexity, safetyLevel, database) {
        const alternatives = [];
        let sql = "";
        let explanation = "";
        if (!matchedEntities.primaryTable) {
            return {
                sql: "-- Unable to generate query: no matching tables found",
                explanation: "Could not identify relevant tables from the natural language input.",
                alternatives: [],
            };
        }
        const primaryTable = matchedEntities.primaryTable;
        const columns = matchedEntities.tableToColumns.get(primaryTable) || [];
        // Build SELECT clause
        let selectClause = "";
        if (intent.action === "count") {
            selectClause = "COUNT(*) AS total_count";
            explanation = `Counting records in ${primaryTable}`;
        }
        else if (intent.aggregations.length > 0 && columns.length > 0) {
            const aggCols = columns.slice(0, 3).map((col, i) => {
                const agg = intent.aggregations[i % intent.aggregations.length];
                return `${agg}(\`${col}\`) AS ${agg.toLowerCase()}_${col}`;
            });
            selectClause = aggCols.join(", ");
            explanation = `Aggregating ${intent.aggregations.join(", ")} on ${columns.slice(0, 3).join(", ")}`;
        }
        else if (columns.length > 0) {
            selectClause = columns.map((c) => `\`${c}\``).join(", ");
            explanation = `Selecting columns ${columns.join(", ")} from ${primaryTable}`;
        }
        else {
            selectClause = "*";
            explanation = `Selecting all columns from ${primaryTable}`;
        }
        // Build FROM clause with JOINs
        let fromClause = `\`${database}\`.\`${primaryTable}\``;
        if (matchedEntities.joinPaths.length > 0 && maxComplexity !== "simple") {
            for (const join of matchedEntities.joinPaths) {
                if (join.from === primaryTable) {
                    fromClause += `\n  LEFT JOIN \`${database}\`.\`${join.to}\` ON ${join.on}`;
                }
                else if (join.to === primaryTable) {
                    fromClause += `\n  LEFT JOIN \`${database}\`.\`${join.from}\` ON ${join.on}`;
                }
            }
            explanation += ` with joins to ${matchedEntities.tables.filter((t) => t !== primaryTable).join(", ")}`;
        }
        // Build WHERE clause
        let whereClause = "";
        if (intent.conditions.length > 0) {
            // Parse simple conditions
            const parsedConditions = intent.conditions.map((cond) => {
                const parts = cond.match(/(\w+)\s*(?:=|is|equals?)\s*(.+)/i);
                if (parts) {
                    const [, col, val] = parts;
                    return `\`${col}\` = '${val.trim()}'`;
                }
                return null;
            }).filter(Boolean);
            if (parsedConditions.length > 0) {
                whereClause = `\nWHERE ${parsedConditions.join(" AND ")}`;
            }
        }
        // Build GROUP BY clause
        let groupByClause = "";
        if (intent.groupBy) {
            groupByClause = `\nGROUP BY \`${intent.groupBy}\``;
            explanation += `, grouped by ${intent.groupBy}`;
        }
        // Build ORDER BY clause
        let orderByClause = "";
        if (intent.orderBy) {
            const direction = /\b(latest|newest|highest|last)\b/i.test(intent.orderBy)
                ? "DESC"
                : "ASC";
            const orderCol = intent.orderBy.match(/^(latest|newest|oldest|highest|lowest|first|last)$/i)
                ? columns[0] || "id"
                : intent.orderBy;
            orderByClause = `\nORDER BY \`${orderCol}\` ${direction}`;
        }
        // Build LIMIT clause
        let limitClause = "";
        if (intent.limit) {
            limitClause = `\nLIMIT ${intent.limit}`;
        }
        else if (safetyLevel !== "permissive" && context !== "data_entry") {
            // Add safety limit for non-permissive modes
            limitClause = "\nLIMIT 100";
            explanation += " (limited to 100 rows for safety)";
        }
        // Assemble final SQL
        sql = `SELECT ${selectClause}\nFROM ${fromClause}${whereClause}${groupByClause}${orderByClause}${limitClause}`;
        // Generate alternatives
        if (intent.action !== "count") {
            alternatives.push(`SELECT COUNT(*) FROM \`${database}\`.\`${primaryTable}\`${whereClause}`);
        }
        if (!groupByClause && columns.length > 0) {
            alternatives.push(`SELECT ${columns[0]}, COUNT(*) AS count FROM \`${database}\`.\`${primaryTable}\`${whereClause} GROUP BY \`${columns[0]}\` ORDER BY count DESC LIMIT 10`);
        }
        return { sql, explanation, alternatives };
    }
    /**
     * Estimate query complexity
     */
    estimateComplexity(sql) {
        const lowerSql = sql.toLowerCase();
        let score = 0;
        if (lowerSql.includes("join"))
            score += 2;
        if (lowerSql.includes("group by"))
            score += 1;
        if (lowerSql.includes("having"))
            score += 1;
        if (lowerSql.includes("subquery") || (lowerSql.match(/select/g) || []).length > 1)
            score += 3;
        if (lowerSql.includes("union"))
            score += 2;
        if ((lowerSql.match(/and|or/g) || []).length > 3)
            score += 1;
        if (score >= 5)
            return "HIGH";
        if (score >= 2)
            return "MEDIUM";
        return "LOW";
    }
    /**
     * Generate optimization hints
     */
    generateOptimizationHints(sql, matchedEntities, schemaContext) {
        const hints = [];
        // Check for SELECT *
        if (sql.includes("SELECT *")) {
            hints.push("Consider selecting specific columns instead of '*' for better performance.");
        }
        // Check for missing LIMIT
        if (!sql.toLowerCase().includes("limit")) {
            hints.push("Consider adding a LIMIT clause to prevent fetching too many rows.");
        }
        // Check for JOINs without proper indexes hint
        if (sql.toLowerCase().includes("join")) {
            hints.push("Ensure JOIN columns are indexed for optimal performance.");
        }
        // Check for large tables
        const largeTables = schemaContext.tables.filter((t) => matchedEntities.tables.includes(t.name) && t.columns.length > 20);
        if (largeTables.length > 0) {
            hints.push(`Tables ${largeTables.map((t) => t.name).join(", ")} have many columns. Select only needed columns.`);
        }
        // Suggest using EXPLAIN
        hints.push("Use EXPLAIN to analyze query execution plan before running on large datasets.");
        return hints;
    }
    /**
     * Generate safety notes
     */
    generateSafetyNotes(sql, safetyLevel, matchedEntities) {
        const notes = [];
        if (!sql.toLowerCase().includes("limit")) {
            notes.push("Query has no LIMIT - may return large result sets.");
        }
        if (matchedEntities.tables.length > 2) {
            notes.push("Query involves multiple tables - verify JOIN conditions are correct.");
        }
        if (safetyLevel === "strict") {
            notes.push("Running in strict safety mode - only SELECT queries are allowed.");
        }
        // Check for potentially sensitive column names
        const sensitivePatterns = ["password", "secret", "token", "ssn", "credit"];
        for (const col of matchedEntities.columns) {
            if (sensitivePatterns.some((p) => col.toLowerCase().includes(p))) {
                notes.push(`Column '${col}' may contain sensitive data. Ensure proper access controls.`);
            }
        }
        return notes;
    }
    /**
     * Suggest query improvements
     */
    async suggestQueryImprovements(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { query, optimization_goal = "speed", } = params;
            if (!query?.trim()) {
                return { status: "error", error: "query parameter is required" };
            }
            const suggestions = [];
            const lowerQuery = query.toLowerCase();
            // Check for SELECT *
            if (lowerQuery.includes("select *")) {
                suggestions.push({
                    type: "COLUMN_SELECTION",
                    description: "Replace SELECT * with specific column names for better performance",
                    improved_query: query.replace(/select\s+\*/i, "SELECT /* specify columns here */"),
                });
            }
            // Check for missing WHERE clause with DELETE/UPDATE
            if ((lowerQuery.includes("delete") || lowerQuery.includes("update")) &&
                !lowerQuery.includes("where")) {
                suggestions.push({
                    type: "SAFETY",
                    description: "DELETE/UPDATE without WHERE clause will affect all rows - add conditions",
                });
            }
            // Check for inefficient LIKE patterns
            if (lowerQuery.match(/like\s+['"]%/)) {
                suggestions.push({
                    type: "INDEX_USAGE",
                    description: "Leading wildcard in LIKE pattern prevents index usage. Consider FULLTEXT search.",
                });
            }
            // Check for functions on indexed columns
            if (lowerQuery.match(/where\s+\w+\s*\([^)]+\)\s*=/)) {
                suggestions.push({
                    type: "INDEX_USAGE",
                    description: "Using functions on columns in WHERE clause prevents index usage. Move function to the right side.",
                });
            }
            // Check for ORDER BY without LIMIT
            if (lowerQuery.includes("order by") && !lowerQuery.includes("limit")) {
                suggestions.push({
                    type: "PERFORMANCE",
                    description: "ORDER BY without LIMIT may be slow on large datasets. Consider adding LIMIT.",
                });
            }
            // Check for SELECT DISTINCT on many columns
            if (lowerQuery.match(/select\s+distinct.*,.*,/)) {
                suggestions.push({
                    type: "PERFORMANCE",
                    description: "SELECT DISTINCT on multiple columns can be slow. Consider using GROUP BY instead.",
                });
            }
            // Memory optimization suggestions
            if (optimization_goal === "memory") {
                if (!lowerQuery.includes("limit")) {
                    suggestions.push({
                        type: "MEMORY",
                        description: "Add LIMIT clause to reduce memory usage for large result sets.",
                    });
                }
                if (lowerQuery.includes("order by")) {
                    suggestions.push({
                        type: "MEMORY",
                        description: "ORDER BY requires memory for sorting. Consider indexing the ORDER BY column.",
                    });
                }
            }
            // Readability suggestions
            if (optimization_goal === "readability") {
                if (!lowerQuery.includes("\n")) {
                    suggestions.push({
                        type: "READABILITY",
                        description: "Consider formatting query with line breaks for better readability.",
                    });
                }
                if (lowerQuery.match(/\bt\d+\b|\btbl\d+\b/)) {
                    suggestions.push({
                        type: "READABILITY",
                        description: "Use meaningful table aliases instead of t1, t2, tbl1, etc.",
                    });
                }
            }
            if (suggestions.length === 0) {
                suggestions.push({
                    type: "GENERAL",
                    description: "Query appears well-formed. Use EXPLAIN for detailed analysis.",
                });
            }
            return {
                status: "success",
                data: {
                    original_query: query,
                    suggestions,
                    estimated_improvement: suggestions.length > 2 ? "SIGNIFICANT" : suggestions.length > 0 ? "MODERATE" : "MINIMAL",
                },
            };
        }
        catch (error) {
            return {
                status: "error",
                error: error.message,
            };
        }
    }
}
exports.IntelligentQueryTools = IntelligentQueryTools;
