"use strict";
/**
 * MySQL Query Optimization Hints
 *
 * Supports MySQL 8.0+ optimizer hints and provides query analysis
 * for performance optimization suggestions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryOptimizer = void 0;
/**
 * Query Optimizer class
 * Provides MySQL query optimization hints and analysis
 */
class QueryOptimizer {
    constructor() { }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!QueryOptimizer.instance) {
            QueryOptimizer.instance = new QueryOptimizer();
        }
        return QueryOptimizer.instance;
    }
    /**
     * Escape special regex characters in a string
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    /**
     * Sanitize identifier (table name, index name) to prevent injection
     * Only allows alphanumeric characters, underscores, and dots (for schema.table)
     */
    sanitizeIdentifier(identifier) {
        // Remove any characters that aren't alphanumeric, underscore, or dot
        return identifier.replace(/[^a-zA-Z0-9_\.]/g, "");
    }
    /**
     * Validate that an identifier is safe to use
     */
    isValidIdentifier(identifier) {
        // Must start with letter or underscore, contain only valid chars
        // Max length 64 (MySQL limit)
        return /^[a-zA-Z_][a-zA-Z0-9_\.]{0,63}$/.test(identifier);
    }
    /**
     * Apply optimizer hints to a SELECT query
     */
    applyHints(query, hints) {
        const normalizedQuery = query.trim();
        const upperQuery = normalizedQuery.toUpperCase();
        // Only apply hints to SELECT queries
        if (!upperQuery.startsWith("SELECT")) {
            return normalizedQuery;
        }
        let hintBlock = this.buildHintBlock(hints);
        let modifiedQuery = normalizedQuery;
        // Handle STRAIGHT_JOIN
        if (hints.straightJoin) {
            modifiedQuery = modifiedQuery.replace(/^SELECT/i, "SELECT STRAIGHT_JOIN");
        }
        // Handle SQL modifiers (HIGH_PRIORITY, SQL_BIG_RESULT, etc.)
        const sqlModifiers = [];
        if (hints.highPriority)
            sqlModifiers.push("HIGH_PRIORITY");
        if (hints.sqlBigResult)
            sqlModifiers.push("SQL_BIG_RESULT");
        if (hints.sqlSmallResult)
            sqlModifiers.push("SQL_SMALL_RESULT");
        if (hints.sqlBufferResult)
            sqlModifiers.push("SQL_BUFFER_RESULT");
        if (hints.sqlCalcFoundRows)
            sqlModifiers.push("SQL_CALC_FOUND_ROWS");
        if (hints.noCache)
            sqlModifiers.push("SQL_NO_CACHE");
        if (sqlModifiers.length > 0) {
            const modifiersStr = sqlModifiers.join(" ");
            modifiedQuery = modifiedQuery.replace(/^SELECT(\s+STRAIGHT_JOIN)?/i, `SELECT$1 ${modifiersStr}`);
        }
        // Insert hint block after SELECT keyword
        if (hintBlock) {
            // Find the position after SELECT (and any modifiers)
            const selectMatch = modifiedQuery.match(/^SELECT(\s+STRAIGHT_JOIN)?(\s+(?:HIGH_PRIORITY|SQL_BIG_RESULT|SQL_SMALL_RESULT|SQL_BUFFER_RESULT|SQL_CALC_FOUND_ROWS|SQL_NO_CACHE)\s*)*/i);
            if (selectMatch) {
                const insertPos = selectMatch[0].length;
                modifiedQuery =
                    modifiedQuery.slice(0, insertPos) +
                        ` /*+ ${hintBlock} */ ` +
                        modifiedQuery.slice(insertPos);
            }
        }
        // Handle USE INDEX / FORCE INDEX / IGNORE INDEX (traditional syntax)
        modifiedQuery = this.applyIndexHintsTraditional(modifiedQuery, hints);
        return modifiedQuery.replace(/\s+/g, " ").trim();
    }
    /**
     * Build the optimizer hint block string
     */
    buildHintBlock(hints) {
        const hintParts = [];
        // Process explicit hints array
        if (hints.hints && hints.hints.length > 0) {
            for (const hint of hints.hints) {
                const hintStr = this.formatHint(hint);
                if (hintStr) {
                    hintParts.push(hintStr);
                }
            }
        }
        // Process shorthand hints
        if (hints.maxExecutionTime !== undefined) {
            // Validate maxExecutionTime is a positive integer
            const maxTime = Math.floor(Math.abs(Number(hints.maxExecutionTime)));
            if (maxTime > 0 && maxTime <= 31536000000) {
                // Max 1 year in ms
                hintParts.push(`MAX_EXECUTION_TIME(${maxTime})`);
            }
        }
        if (hints.forceIndex) {
            const indexes = Array.isArray(hints.forceIndex)
                ? hints.forceIndex
                : [hints.forceIndex];
            const sanitizedIndexes = indexes
                .map((idx) => this.sanitizeIdentifier(idx))
                .filter((idx) => this.isValidIdentifier(idx));
            if (sanitizedIndexes.length > 0) {
                hintParts.push(`INDEX(${sanitizedIndexes.join(", ")})`);
            }
        }
        if (hints.ignoreIndex) {
            const indexes = Array.isArray(hints.ignoreIndex)
                ? hints.ignoreIndex
                : [hints.ignoreIndex];
            const sanitizedIndexes = indexes
                .map((idx) => this.sanitizeIdentifier(idx))
                .filter((idx) => this.isValidIdentifier(idx));
            if (sanitizedIndexes.length > 0) {
                hintParts.push(`NO_INDEX(${sanitizedIndexes.join(", ")})`);
            }
        }
        return hintParts.join(" ");
    }
    /**
     * Format a single optimizer hint
     */
    formatHint(hint) {
        switch (hint.type) {
            // Join-Order Hints
            case "JOIN_FIXED_ORDER":
                return "JOIN_FIXED_ORDER()";
            case "JOIN_ORDER":
            case "JOIN_PREFIX":
            case "JOIN_SUFFIX":
                if (hint.tables && hint.tables.length > 0) {
                    return `${hint.type}(${hint.tables.join(", ")})`;
                }
                return "";
            // Table-Level Hints
            case "BKA":
            case "NO_BKA":
            case "BNL":
            case "NO_BNL":
            case "HASH_JOIN":
            case "NO_HASH_JOIN":
            case "MERGE":
            case "NO_MERGE":
                if (hint.table) {
                    return `${hint.type}(${hint.table})`;
                }
                return `${hint.type}()`;
            // Index-Level Hints
            case "INDEX":
            case "NO_INDEX":
            case "INDEX_MERGE":
            case "NO_INDEX_MERGE":
            case "MRR":
            case "NO_MRR":
            case "NO_ICP":
            case "NO_RANGE_OPTIMIZATION":
            case "SKIP_SCAN":
            case "NO_SKIP_SCAN":
                if (hint.table && hint.index) {
                    const indexes = Array.isArray(hint.index)
                        ? hint.index.join(", ")
                        : hint.index;
                    return `${hint.type}(${hint.table} ${indexes})`;
                }
                else if (hint.table) {
                    return `${hint.type}(${hint.table})`;
                }
                return "";
            // Subquery Hints
            case "SEMIJOIN":
            case "NO_SEMIJOIN":
                if (hint.strategy) {
                    return `${hint.type}(${hint.strategy})`;
                }
                return `${hint.type}()`;
            case "SUBQUERY":
                if (hint.strategy) {
                    return `SUBQUERY(${hint.strategy})`;
                }
                return "";
            // Miscellaneous
            case "MAX_EXECUTION_TIME":
                if (hint.value !== undefined) {
                    return `MAX_EXECUTION_TIME(${hint.value})`;
                }
                return "";
            case "RESOURCE_GROUP":
                if (hint.value) {
                    return `RESOURCE_GROUP(${hint.value})`;
                }
                return "";
            case "SET_VAR":
                if (hint.value) {
                    return `SET_VAR(${hint.value})`;
                }
                return "";
            // Cache hints (legacy)
            case "SQL_NO_CACHE":
            case "SQL_CACHE":
                return ""; // These are handled as SQL modifiers, not hint block
            default:
                return "";
        }
    }
    /**
     * Apply traditional USE INDEX / FORCE INDEX / IGNORE INDEX syntax
     */
    applyIndexHintsTraditional(query, hints) {
        if (!hints.useIndex) {
            return query;
        }
        // Find table references and add USE INDEX after them
        const indexes = Array.isArray(hints.useIndex)
            ? hints.useIndex
            : [hints.useIndex];
        const useIndexClause = `USE INDEX (${indexes.join(", ")})`;
        // Simple approach: add after FROM clause table
        // This is a basic implementation - complex queries may need more sophisticated parsing
        const fromMatch = query.match(/FROM\s+[\`"']?(\w+)[\`"']?(\s+(?:AS\s+)?[\`"']?\w+[\`"']?)?/i);
        if (fromMatch) {
            const fullMatch = fromMatch[0];
            const insertPos = query.indexOf(fullMatch) + fullMatch.length;
            return (query.slice(0, insertPos) +
                " " +
                useIndexClause +
                query.slice(insertPos));
        }
        return query;
    }
    /**
     * Analyze a query and provide optimization suggestions
     */
    analyzeQuery(query) {
        const normalizedQuery = query.trim();
        const upperQuery = normalizedQuery.toUpperCase();
        // Determine query type
        let queryType = "OTHER";
        if (upperQuery.startsWith("SELECT"))
            queryType = "SELECT";
        else if (upperQuery.startsWith("INSERT"))
            queryType = "INSERT";
        else if (upperQuery.startsWith("UPDATE"))
            queryType = "UPDATE";
        else if (upperQuery.startsWith("DELETE"))
            queryType = "DELETE";
        // Extract tables
        const tables = this.extractTables(normalizedQuery);
        // Analyze query structure
        const hasJoins = /\bJOIN\b/i.test(normalizedQuery);
        const hasSubqueries = /\(\s*SELECT\b/i.test(normalizedQuery);
        const hasGroupBy = /\bGROUP\s+BY\b/i.test(normalizedQuery);
        const hasOrderBy = /\bORDER\s+BY\b/i.test(normalizedQuery);
        const hasLimit = /\bLIMIT\b/i.test(normalizedQuery);
        // Estimate complexity
        let complexity = "LOW";
        if (hasSubqueries || (hasJoins && tables.length > 3)) {
            complexity = "HIGH";
        }
        else if (hasJoins || hasGroupBy) {
            complexity = "MEDIUM";
        }
        // Generate suggestions
        const suggestions = this.generateSuggestions({
            queryType,
            tables,
            hasJoins,
            hasSubqueries,
            hasGroupBy,
            hasOrderBy,
            hasLimit,
            query: normalizedQuery,
        });
        return {
            originalQuery: normalizedQuery,
            queryType,
            tables,
            hasJoins,
            hasSubqueries,
            hasGroupBy,
            hasOrderBy,
            hasLimit,
            estimatedComplexity: complexity,
            suggestions,
        };
    }
    /**
     * Extract table names from a query
     */
    extractTables(query) {
        const tables = new Set();
        // Match FROM clause
        const fromMatch = query.match(/FROM\s+([^\s,;()]+)/gi);
        if (fromMatch) {
            for (const match of fromMatch) {
                const table = match.replace(/FROM\s+/i, "").replace(/[\`"']/g, "");
                if (table && !this.isKeyword(table)) {
                    tables.add(table);
                }
            }
        }
        // Match JOIN clauses
        const joinMatch = query.match(/JOIN\s+([^\s,;()]+)/gi);
        if (joinMatch) {
            for (const match of joinMatch) {
                const table = match.replace(/JOIN\s+/i, "").replace(/[\`"']/g, "");
                if (table && !this.isKeyword(table)) {
                    tables.add(table);
                }
            }
        }
        // Match UPDATE
        const updateMatch = query.match(/UPDATE\s+([^\s,;()]+)/gi);
        if (updateMatch) {
            for (const match of updateMatch) {
                const table = match.replace(/UPDATE\s+/i, "").replace(/[\`"']/g, "");
                if (table && !this.isKeyword(table)) {
                    tables.add(table);
                }
            }
        }
        // Match INSERT INTO
        const insertMatch = query.match(/INSERT\s+INTO\s+([^\s,;()]+)/gi);
        if (insertMatch) {
            for (const match of insertMatch) {
                const table = match
                    .replace(/INSERT\s+INTO\s+/i, "")
                    .replace(/[\`"']/g, "");
                if (table && !this.isKeyword(table)) {
                    tables.add(table);
                }
            }
        }
        // Match DELETE FROM
        const deleteMatch = query.match(/DELETE\s+FROM\s+([^\s,;()]+)/gi);
        if (deleteMatch) {
            for (const match of deleteMatch) {
                const table = match
                    .replace(/DELETE\s+FROM\s+/i, "")
                    .replace(/[\`"']/g, "");
                if (table && !this.isKeyword(table)) {
                    tables.add(table);
                }
            }
        }
        return Array.from(tables);
    }
    /**
     * Check if a word is a SQL keyword
     */
    isKeyword(word) {
        const keywords = [
            "SELECT",
            "FROM",
            "WHERE",
            "AND",
            "OR",
            "NOT",
            "IN",
            "LIKE",
            "JOIN",
            "INNER",
            "LEFT",
            "RIGHT",
            "OUTER",
            "CROSS",
            "ON",
            "GROUP",
            "BY",
            "ORDER",
            "HAVING",
            "LIMIT",
            "OFFSET",
            "INSERT",
            "INTO",
            "VALUES",
            "UPDATE",
            "SET",
            "DELETE",
            "CREATE",
            "ALTER",
            "DROP",
            "TABLE",
            "INDEX",
            "VIEW",
            "AS",
            "DISTINCT",
            "ALL",
            "UNION",
            "EXCEPT",
            "INTERSECT",
        ];
        return keywords.includes(word.toUpperCase());
    }
    /**
     * Generate optimization suggestions based on query analysis
     */
    generateSuggestions(analysis) {
        const suggestions = [];
        // Suggestion: Use index for JOIN operations
        if (analysis.hasJoins && analysis.tables.length > 2) {
            suggestions.push({
                type: "HINT",
                priority: "MEDIUM",
                description: "Consider using HASH_JOIN for large table joins",
                suggestedAction: "Add HASH_JOIN hint for better performance on large datasets",
                hint: { type: "HASH_JOIN" },
            });
        }
        // Suggestion: Subquery optimization
        if (analysis.hasSubqueries) {
            suggestions.push({
                type: "HINT",
                priority: "HIGH",
                description: "Subqueries detected - consider semi-join optimization",
                suggestedAction: "Use SEMIJOIN hint or rewrite as JOIN",
                hint: { type: "SEMIJOIN", strategy: "MATERIALIZATION" },
            });
        }
        // Suggestion: ORDER BY without LIMIT
        if (analysis.hasOrderBy && !analysis.hasLimit) {
            suggestions.push({
                type: "STRUCTURE",
                priority: "MEDIUM",
                description: "ORDER BY without LIMIT may cause full result set sorting",
                suggestedAction: "Consider adding LIMIT clause to improve performance",
            });
        }
        // Suggestion: GROUP BY optimization
        if (analysis.hasGroupBy) {
            suggestions.push({
                type: "INDEX",
                priority: "MEDIUM",
                description: "GROUP BY operations benefit from indexes on grouped columns",
                suggestedAction: "Ensure indexes exist on GROUP BY columns",
            });
        }
        // Suggestion: Multiple table joins
        if (analysis.tables.length >= 3) {
            suggestions.push({
                type: "HINT",
                priority: "MEDIUM",
                description: "Multiple tables joined - join order may impact performance",
                suggestedAction: "Consider using JOIN_ORDER hint if you know the optimal order",
                hint: { type: "JOIN_ORDER", tables: analysis.tables },
            });
        }
        // Suggestion: Long-running query protection
        if (analysis.hasSubqueries || (analysis.hasJoins && analysis.hasGroupBy)) {
            suggestions.push({
                type: "HINT",
                priority: "LOW",
                description: "Complex query may run long - consider execution time limit",
                suggestedAction: "Add MAX_EXECUTION_TIME hint to prevent runaway queries",
                hint: { type: "MAX_EXECUTION_TIME", value: 30000 },
            });
        }
        return suggestions;
    }
    /**
     * Get suggested hints for a specific optimization goal
     */
    getSuggestedHints(goal) {
        switch (goal) {
            case "SPEED":
                return {
                    hints: [{ type: "HASH_JOIN" }, { type: "MRR" }],
                    sqlBigResult: true,
                };
            case "MEMORY":
                return {
                    hints: [{ type: "NO_HASH_JOIN" }, { type: "NO_BNL" }],
                    sqlSmallResult: true,
                };
            case "STABILITY":
                return {
                    maxExecutionTime: 30000, // 30 seconds
                    hints: [{ type: "JOIN_FIXED_ORDER" }],
                };
            default:
                return {};
        }
    }
}
exports.QueryOptimizer = QueryOptimizer;
exports.default = QueryOptimizer;
