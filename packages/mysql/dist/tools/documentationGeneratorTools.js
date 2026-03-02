"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentationGeneratorTools = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const config_1 = require("../config/config");
/**
 * AI-Powered Documentation Generator
 * Automatic database documentation generation with business glossary
 */
class DocumentationGeneratorTools {
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
     * Generate comprehensive database documentation
     */
    async generateDocumentation(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { scope = "database", table_name, include_business_glossary = true, format = "markdown", include_examples = true, include_statistics = true, } = params;
            const database = dbValidation.database;
            // Validate table_name if provided
            if (table_name && !this.security.validateIdentifier(table_name).valid) {
                return { status: "error", error: "Invalid table name" };
            }
            // Gather schema information
            let tables = [];
            if (scope === "table" && table_name) {
                tables = await this.db.query(`SELECT TABLE_NAME, TABLE_COMMENT, ENGINE, TABLE_ROWS, CREATE_TIME, UPDATE_TIME
           FROM INFORMATION_SCHEMA.TABLES
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND TABLE_TYPE = 'BASE TABLE'`, [database, table_name]);
            }
            else {
                tables = await this.db.query(`SELECT TABLE_NAME, TABLE_COMMENT, ENGINE, TABLE_ROWS, CREATE_TIME, UPDATE_TIME
           FROM INFORMATION_SCHEMA.TABLES
           WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
           ORDER BY TABLE_NAME`, [database]);
            }
            if (tables.length === 0) {
                return {
                    status: "error",
                    error: scope === "table" && table_name
                        ? `Table '${table_name}' not found`
                        : "No tables found in the database",
                };
            }
            const tableNames = tables.map((t) => t.TABLE_NAME);
            const placeholders = tableNames.map(() => "?").join(",");
            // Get columns
            const columns = await this.db.query(`SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, 
                COLUMN_DEFAULT, EXTRA, COLUMN_COMMENT, CHARACTER_MAXIMUM_LENGTH
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${placeholders})
         ORDER BY TABLE_NAME, ORDINAL_POSITION`, [database, ...tableNames]);
            // Get foreign keys
            const foreignKeys = await this.db.query(`SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, 
                REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${placeholders})
           AND REFERENCED_TABLE_NAME IS NOT NULL`, [database, ...tableNames]);
            // Get indexes
            const indexes = await this.db.query(`SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME, NON_UNIQUE, SEQ_IN_INDEX
         FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${placeholders})
         ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`, [database, ...tableNames]);
            // Generate business glossary
            let businessGlossary = new Map();
            if (include_business_glossary) {
                businessGlossary = this.generateBusinessGlossary(columns);
            }
            // Get sample data and statistics if requested
            let tableStats = new Map();
            if (include_statistics) {
                for (const table of tables) {
                    try {
                        const stats = await this.getTableStatistics(database, table.TABLE_NAME);
                        tableStats.set(table.TABLE_NAME, stats);
                    }
                    catch {
                        // Skip if error
                    }
                }
            }
            // Generate documentation
            let content = "";
            switch (format) {
                case "markdown":
                    content = this.generateMarkdown(database, tables, columns, foreignKeys, indexes, businessGlossary, tableStats, include_examples);
                    break;
                case "html":
                    content = this.generateHTML(database, tables, columns, foreignKeys, indexes, businessGlossary, tableStats, include_examples);
                    break;
                case "json":
                    content = this.generateJSON(database, tables, columns, foreignKeys, indexes, businessGlossary, tableStats);
                    break;
            }
            return {
                status: "success",
                data: {
                    format,
                    scope,
                    content,
                    metadata: {
                        generated_at: new Date().toISOString(),
                        database,
                        tables_documented: tables.length,
                        columns_documented: columns.length,
                    },
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
     * Generate data dictionary for a specific table
     */
    async generateDataDictionary(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { table_name, include_sample_values = true, include_constraints = true, } = params;
            const database = dbValidation.database;
            // Validate table name
            if (!this.security.validateIdentifier(table_name).valid) {
                return { status: "error", error: "Invalid table name" };
            }
            // Get table info
            const tableInfo = await this.db.query(`SELECT TABLE_COMMENT FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`, [database, table_name]);
            if (tableInfo.length === 0) {
                return { status: "error", error: `Table '${table_name}' not found` };
            }
            // Get columns
            const columnsResult = await this.db.query(`SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, 
                COLUMN_DEFAULT, EXTRA, COLUMN_COMMENT
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
         ORDER BY ORDINAL_POSITION`, [database, table_name]);
            // Get foreign keys
            const fkResult = await this.db.query(`SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL`, [database, table_name]);
            // Get indexes
            const indexResult = await this.db.query(`SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE
         FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
         ORDER BY INDEX_NAME, SEQ_IN_INDEX`, [database, table_name]);
            // Get check constraints (MySQL 8.0.16+)
            let checkConstraints = [];
            if (include_constraints) {
                try {
                    checkConstraints = await this.db.query(`SELECT CONSTRAINT_NAME, CHECK_CLAUSE
             FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = ?`, [database]);
                }
                catch {
                    // Ignore if check constraints are not supported
                }
            }
            // Build column information
            const columns = await Promise.all(columnsResult.map(async (col) => {
                const constraints = [];
                if (col.COLUMN_KEY === "PRI")
                    constraints.push("PRIMARY KEY");
                if (col.COLUMN_KEY === "UNI")
                    constraints.push("UNIQUE");
                if (col.IS_NULLABLE === "NO")
                    constraints.push("NOT NULL");
                if (col.EXTRA.includes("auto_increment"))
                    constraints.push("AUTO_INCREMENT");
                // Check for foreign key
                const fk = fkResult.find((f) => f.COLUMN_NAME === col.COLUMN_NAME);
                if (fk)
                    constraints.push(`FOREIGN KEY -> ${fk.REFERENCED_TABLE_NAME}`);
                // Get sample values
                let sampleValues;
                if (include_sample_values) {
                    try {
                        const samples = await this.db.query(`SELECT DISTINCT \`${col.COLUMN_NAME}\`
                 FROM \`${database}\`.\`${table_name}\`
                 WHERE \`${col.COLUMN_NAME}\` IS NOT NULL
                 LIMIT 5`);
                        sampleValues = samples.map((s) => s[col.COLUMN_NAME]);
                    }
                    catch {
                        // Ignore errors
                    }
                }
                return {
                    name: col.COLUMN_NAME,
                    data_type: col.COLUMN_TYPE,
                    description: col.COLUMN_COMMENT ||
                        this.inferColumnDescription(col.COLUMN_NAME, col.DATA_TYPE),
                    constraints,
                    is_nullable: col.IS_NULLABLE === "YES",
                    default_value: col.COLUMN_DEFAULT,
                    sample_values: sampleValues,
                    business_term: this.inferBusinessTerm(col.COLUMN_NAME),
                };
            }));
            // Build primary key
            const primaryKey = columnsResult
                .filter((c) => c.COLUMN_KEY === "PRI")
                .map((c) => c.COLUMN_NAME);
            // Build foreign keys
            const foreignKeys = fkResult.map((fk) => ({
                column: fk.COLUMN_NAME,
                references_table: fk.REFERENCED_TABLE_NAME,
                references_column: fk.REFERENCED_COLUMN_NAME,
            }));
            // Build indexes (group by index name)
            const indexMap = new Map();
            for (const idx of indexResult) {
                if (!indexMap.has(idx.INDEX_NAME)) {
                    indexMap.set(idx.INDEX_NAME, {
                        columns: [],
                        is_unique: idx.NON_UNIQUE === 0,
                    });
                }
                indexMap.get(idx.INDEX_NAME).columns.push(idx.COLUMN_NAME);
            }
            const indexes = Array.from(indexMap.entries()).map(([name, info]) => ({
                name,
                columns: info.columns,
                is_unique: info.is_unique,
            }));
            return {
                status: "success",
                data: {
                    table_name,
                    description: tableInfo[0].TABLE_COMMENT ||
                        this.inferTableDescription(table_name),
                    columns,
                    primary_key: primaryKey,
                    foreign_keys: foreignKeys,
                    indexes,
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
     * Generate a business glossary from the schema
     */
    async generateBusinessGlossaryReport(params) {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error };
            }
            const { include_descriptions = true, group_by = "category", } = params;
            const database = dbValidation.database;
            // Get all columns
            const columns = await this.db.query(`SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_COMMENT
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ?
         ORDER BY TABLE_NAME, ORDINAL_POSITION`, [database]);
            const glossary = [];
            const categorySet = new Set();
            const termsByName = new Map();
            for (const col of columns) {
                const businessTerm = this.inferBusinessTerm(col.COLUMN_NAME);
                const category = this.inferCategory(col.COLUMN_NAME, col.DATA_TYPE);
                const description = col.COLUMN_COMMENT ||
                    (include_descriptions
                        ? this.inferColumnDescription(col.COLUMN_NAME, col.DATA_TYPE)
                        : "");
                categorySet.add(category);
                // Track related terms (same normalized name across tables)
                const normalizedName = this.normalizeColumnName(col.COLUMN_NAME);
                if (!termsByName.has(normalizedName)) {
                    termsByName.set(normalizedName, []);
                }
                termsByName
                    .get(normalizedName)
                    .push(`${col.TABLE_NAME}.${col.COLUMN_NAME}`);
                glossary.push({
                    term: businessTerm,
                    technical_name: col.COLUMN_NAME,
                    source_table: col.TABLE_NAME,
                    data_type: col.DATA_TYPE,
                    description,
                    category,
                });
            }
            // Add related terms
            for (const entry of glossary) {
                const normalizedName = this.normalizeColumnName(entry.technical_name);
                const related = termsByName.get(normalizedName) || [];
                if (related.length > 1) {
                    entry.related_terms = related.filter((r) => r !== `${entry.source_table}.${entry.technical_name}`);
                }
            }
            // Sort based on group_by
            if (group_by === "alphabetical") {
                glossary.sort((a, b) => a.term.localeCompare(b.term));
            }
            else if (group_by === "category") {
                glossary.sort((a, b) => {
                    const catCompare = a.category.localeCompare(b.category);
                    if (catCompare !== 0)
                        return catCompare;
                    return a.term.localeCompare(b.term);
                });
            }
            else if (group_by === "table") {
                glossary.sort((a, b) => {
                    const tableCompare = a.source_table.localeCompare(b.source_table);
                    if (tableCompare !== 0)
                        return tableCompare;
                    return a.term.localeCompare(b.term);
                });
            }
            return {
                status: "success",
                data: {
                    glossary,
                    categories: Array.from(categorySet).sort(),
                    total_terms: glossary.length,
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
    // ==================== Private Helper Methods ====================
    /**
     * Generate business glossary from columns
     */
    generateBusinessGlossary(columns) {
        const glossary = new Map();
        for (const col of columns) {
            const term = this.inferBusinessTerm(col.COLUMN_NAME);
            const description = col.COLUMN_COMMENT ||
                this.inferColumnDescription(col.COLUMN_NAME, col.DATA_TYPE);
            glossary.set(col.COLUMN_NAME, `${term}: ${description}`);
        }
        return glossary;
    }
    /**
     * Get table statistics
     */
    async getTableStatistics(database, tableName) {
        const result = await this.db.query(`SELECT COUNT(*) as row_count FROM \`${database}\`.\`${tableName}\``);
        return {
            row_count: result[0]?.row_count || 0,
        };
    }
    /**
     * Generate Markdown documentation
     */
    generateMarkdown(database, tables, columns, foreignKeys, indexes, businessGlossary, tableStats, includeExamples) {
        const lines = [];
        lines.push(`# Database Documentation: ${database}`);
        lines.push("");
        lines.push(`*Generated on ${new Date().toISOString()}*`);
        lines.push("");
        lines.push("## Table of Contents");
        lines.push("");
        for (const table of tables) {
            lines.push(`- [${table.TABLE_NAME}](#${table.TABLE_NAME.toLowerCase()})`);
        }
        lines.push("");
        // Relationships overview
        if (foreignKeys.length > 0) {
            lines.push("## Relationships");
            lines.push("");
            lines.push("```mermaid");
            lines.push("erDiagram");
            for (const fk of foreignKeys) {
                lines.push(`    ${fk.TABLE_NAME} ||--o{ ${fk.REFERENCED_TABLE_NAME} : "${fk.COLUMN_NAME}"`);
            }
            lines.push("```");
            lines.push("");
        }
        // Table documentation
        for (const table of tables) {
            lines.push(`## ${table.TABLE_NAME}`);
            lines.push("");
            if (table.TABLE_COMMENT) {
                lines.push(`> ${table.TABLE_COMMENT}`);
                lines.push("");
            }
            const stats = tableStats.get(table.TABLE_NAME);
            if (stats) {
                lines.push(`**Rows:** ${stats.row_count} | **Engine:** ${table.ENGINE || "N/A"}`);
                lines.push("");
            }
            // Columns table
            lines.push("### Columns");
            lines.push("");
            lines.push("| Column | Type | Nullable | Key | Description |");
            lines.push("|--------|------|----------|-----|-------------|");
            const tableCols = columns.filter((c) => c.TABLE_NAME === table.TABLE_NAME);
            for (const col of tableCols) {
                const keyBadge = col.COLUMN_KEY === "PRI"
                    ? "🔑 PK"
                    : col.COLUMN_KEY === "UNI"
                        ? "🔒 UNI"
                        : col.COLUMN_KEY === "MUL"
                            ? "🔗 FK"
                            : "";
                const description = col.COLUMN_COMMENT ||
                    businessGlossary.get(col.COLUMN_NAME)?.split(": ")[1] ||
                    "-";
                lines.push(`| \`${col.COLUMN_NAME}\` | ${col.COLUMN_TYPE} | ${col.IS_NULLABLE} | ${keyBadge} | ${description} |`);
            }
            lines.push("");
            // Foreign keys
            const tableFKs = foreignKeys.filter((fk) => fk.TABLE_NAME === table.TABLE_NAME);
            if (tableFKs.length > 0) {
                lines.push("### Foreign Keys");
                lines.push("");
                for (const fk of tableFKs) {
                    lines.push(`- \`${fk.COLUMN_NAME}\` → \`${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}\``);
                }
                lines.push("");
            }
            // Indexes
            const tableIndexes = indexes.filter((idx) => idx.TABLE_NAME === table.TABLE_NAME);
            if (tableIndexes.length > 0) {
                lines.push("### Indexes");
                lines.push("");
                const indexGroups = new Map();
                for (const idx of tableIndexes) {
                    if (!indexGroups.has(idx.INDEX_NAME)) {
                        indexGroups.set(idx.INDEX_NAME, []);
                    }
                    indexGroups.get(idx.INDEX_NAME).push(idx.COLUMN_NAME);
                }
                for (const [indexName, cols] of indexGroups) {
                    const isUnique = tableIndexes.find((i) => i.INDEX_NAME === indexName)?.NON_UNIQUE === 0;
                    lines.push(`- **${indexName}**${isUnique ? " (UNIQUE)" : ""}: ${cols.join(", ")}`);
                }
                lines.push("");
            }
            // Example queries
            if (includeExamples) {
                lines.push("### Example Queries");
                lines.push("");
                lines.push("```sql");
                lines.push(`-- Select all from ${table.TABLE_NAME}`);
                lines.push(`SELECT * FROM \`${database}\`.\`${table.TABLE_NAME}\` LIMIT 10;`);
                lines.push("");
                lines.push(`-- Count records`);
                lines.push(`SELECT COUNT(*) FROM \`${database}\`.\`${table.TABLE_NAME}\`;`);
                lines.push("```");
                lines.push("");
            }
            lines.push("---");
            lines.push("");
        }
        // Business glossary
        if (businessGlossary.size > 0) {
            lines.push("## Business Glossary");
            lines.push("");
            lines.push("| Term | Description |");
            lines.push("|------|-------------|");
            const sortedTerms = Array.from(businessGlossary.entries()).sort((a, b) => a[0].localeCompare(b[0]));
            for (const [term, desc] of sortedTerms.slice(0, 50)) {
                lines.push(`| ${term} | ${desc} |`);
            }
            lines.push("");
        }
        return lines.join("\n");
    }
    /**
     * Generate HTML documentation
     */
    generateHTML(database, tables, columns, foreignKeys, indexes, businessGlossary, tableStats, includeExamples) {
        const html = [];
        html.push("<!DOCTYPE html>");
        html.push('<html lang="en">');
        html.push("<head>");
        html.push('  <meta charset="UTF-8">');
        html.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
        html.push(`  <title>Database Documentation: ${database}</title>`);
        html.push("  <style>");
        html.push("    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }");
        html.push("    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }");
        html.push("    h2 { color: #34495e; margin-top: 30px; }");
        html.push("    h3 { color: #7f8c8d; }");
        html.push("    table { width: 100%; border-collapse: collapse; margin: 15px 0; }");
        html.push("    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }");
        html.push("    th { background: #3498db; color: white; }");
        html.push("    tr:nth-child(even) { background: #f9f9f9; }");
        html.push("    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }");
        html.push("    pre { background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 5px; overflow-x: auto; }");
        html.push("    .badge { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 12px; }");
        html.push("    .badge-pk { background: #e74c3c; color: white; }");
        html.push("    .badge-fk { background: #3498db; color: white; }");
        html.push("    .badge-uni { background: #9b59b6; color: white; }");
        html.push("    .toc { background: #f8f9fa; padding: 15px; border-radius: 5px; }");
        html.push("    .toc a { color: #3498db; text-decoration: none; }");
        html.push("    .toc a:hover { text-decoration: underline; }");
        html.push("  </style>");
        html.push("</head>");
        html.push("<body>");
        html.push(`  <h1>📊 Database Documentation: ${database}</h1>`);
        html.push(`  <p><em>Generated on ${new Date().toISOString()}</em></p>`);
        // Table of contents
        html.push('  <div class="toc">');
        html.push("    <h3>📑 Table of Contents</h3>");
        html.push("    <ul>");
        for (const table of tables) {
            html.push(`      <li><a href="#${table.TABLE_NAME}">${table.TABLE_NAME}</a></li>`);
        }
        html.push("    </ul>");
        html.push("  </div>");
        // Tables documentation
        for (const table of tables) {
            html.push(`  <h2 id="${table.TABLE_NAME}">📋 ${table.TABLE_NAME}</h2>`);
            if (table.TABLE_COMMENT) {
                html.push(`  <blockquote>${table.TABLE_COMMENT}</blockquote>`);
            }
            const stats = tableStats.get(table.TABLE_NAME);
            if (stats) {
                html.push(`  <p><strong>Rows:</strong> ${stats.row_count} | <strong>Engine:</strong> ${table.ENGINE || "N/A"}</p>`);
            }
            // Columns
            html.push("  <h3>Columns</h3>");
            html.push("  <table>");
            html.push("    <tr><th>Column</th><th>Type</th><th>Nullable</th><th>Key</th><th>Description</th></tr>");
            const tableCols = columns.filter((c) => c.TABLE_NAME === table.TABLE_NAME);
            for (const col of tableCols) {
                let keyBadge = "";
                if (col.COLUMN_KEY === "PRI") {
                    keyBadge = '<span class="badge badge-pk">PK</span>';
                }
                else if (col.COLUMN_KEY === "UNI") {
                    keyBadge = '<span class="badge badge-uni">UNI</span>';
                }
                else if (col.COLUMN_KEY === "MUL") {
                    keyBadge = '<span class="badge badge-fk">FK</span>';
                }
                const description = col.COLUMN_COMMENT ||
                    businessGlossary.get(col.COLUMN_NAME)?.split(": ")[1] ||
                    "-";
                html.push(`    <tr><td><code>${col.COLUMN_NAME}</code></td><td>${col.COLUMN_TYPE}</td><td>${col.IS_NULLABLE}</td><td>${keyBadge}</td><td>${description}</td></tr>`);
            }
            html.push("  </table>");
            // Example queries
            if (includeExamples) {
                html.push("  <h3>Example Queries</h3>");
                html.push("  <pre>");
                html.push(`-- Select all from ${table.TABLE_NAME}`);
                html.push(`SELECT * FROM \`${database}\`.\`${table.TABLE_NAME}\` LIMIT 10;`);
                html.push("");
                html.push("-- Count records");
                html.push(`SELECT COUNT(*) FROM \`${database}\`.\`${table.TABLE_NAME}\`;`);
                html.push("  </pre>");
            }
            html.push("  <hr>");
        }
        html.push("</body>");
        html.push("</html>");
        return html.join("\n");
    }
    /**
     * Generate JSON documentation
     */
    generateJSON(database, tables, columns, foreignKeys, indexes, businessGlossary, tableStats) {
        const doc = {
            database,
            generated_at: new Date().toISOString(),
            tables: tables.map((table) => {
                const tableCols = columns.filter((c) => c.TABLE_NAME === table.TABLE_NAME);
                const tableFKs = foreignKeys.filter((fk) => fk.TABLE_NAME === table.TABLE_NAME);
                const tableIdxs = indexes.filter((idx) => idx.TABLE_NAME === table.TABLE_NAME);
                return {
                    name: table.TABLE_NAME,
                    comment: table.TABLE_COMMENT || null,
                    engine: table.ENGINE,
                    stats: tableStats.get(table.TABLE_NAME) || null,
                    columns: tableCols.map((col) => ({
                        name: col.COLUMN_NAME,
                        type: col.COLUMN_TYPE,
                        data_type: col.DATA_TYPE,
                        is_nullable: col.IS_NULLABLE === "YES",
                        column_key: col.COLUMN_KEY || null,
                        default_value: col.COLUMN_DEFAULT,
                        extra: col.EXTRA || null,
                        comment: col.COLUMN_COMMENT || null,
                        business_term: businessGlossary.get(col.COLUMN_NAME)?.split(": ")[0] || null,
                    })),
                    foreign_keys: tableFKs.map((fk) => ({
                        column: fk.COLUMN_NAME,
                        references_table: fk.REFERENCED_TABLE_NAME,
                        references_column: fk.REFERENCED_COLUMN_NAME,
                    })),
                    indexes: this.groupIndexes(tableIdxs),
                };
            }),
            relationships: foreignKeys.map((fk) => ({
                from_table: fk.TABLE_NAME,
                from_column: fk.COLUMN_NAME,
                to_table: fk.REFERENCED_TABLE_NAME,
                to_column: fk.REFERENCED_COLUMN_NAME,
            })),
        };
        return JSON.stringify(doc, null, 2);
    }
    /**
     * Group indexes by name
     */
    groupIndexes(indexes) {
        const groups = new Map();
        for (const idx of indexes) {
            if (!groups.has(idx.INDEX_NAME)) {
                groups.set(idx.INDEX_NAME, {
                    columns: [],
                    is_unique: idx.NON_UNIQUE === 0,
                });
            }
            groups.get(idx.INDEX_NAME).columns.push(idx.COLUMN_NAME);
        }
        return Array.from(groups.entries()).map(([name, info]) => ({
            name,
            columns: info.columns,
            is_unique: info.is_unique,
        }));
    }
    /**
     * Infer business term from column name
     */
    inferBusinessTerm(columnName) {
        // Convert snake_case or camelCase to Title Case
        return columnName
            .replace(/_/g, " ")
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/\b\w/g, (c) => c.toUpperCase());
    }
    /**
     * Infer column description from name and type
     */
    inferColumnDescription(columnName, dataType) {
        const name = columnName.toLowerCase();
        // Common patterns
        if (name === "id" || name.endsWith("_id")) {
            return "Unique identifier";
        }
        if (name.includes("created")) {
            return "Record creation timestamp";
        }
        if (name.includes("updated") || name.includes("modified")) {
            return "Last update timestamp";
        }
        if (name.includes("deleted")) {
            return "Soft delete indicator/timestamp";
        }
        if (name.includes("email")) {
            return "Email address";
        }
        if (name.includes("phone") || name.includes("mobile")) {
            return "Phone number";
        }
        if (name.includes("name")) {
            return "Name or title";
        }
        if (name.includes("description") || name.includes("desc")) {
            return "Detailed description";
        }
        if (name.includes("status")) {
            return "Status indicator";
        }
        if (name.includes("type")) {
            return "Type or category";
        }
        if (name.includes("price") || name.includes("amount") || name.includes("cost")) {
            return "Monetary value";
        }
        if (name.includes("count") || name.includes("quantity") || name.includes("qty")) {
            return "Numeric count";
        }
        if (name.includes("is_") || name.includes("has_") || name.startsWith("is") || name.startsWith("has")) {
            return "Boolean flag";
        }
        if (name.includes("url") || name.includes("link")) {
            return "URL or web link";
        }
        if (name.includes("address")) {
            return "Physical or mailing address";
        }
        if (name.includes("date")) {
            return "Date value";
        }
        // Type-based defaults
        if (dataType.includes("text") || dataType.includes("blob")) {
            return "Extended text content";
        }
        if (dataType.includes("int") || dataType.includes("decimal") || dataType.includes("float")) {
            return "Numeric value";
        }
        if (dataType.includes("date") || dataType.includes("time")) {
            return "Date/time value";
        }
        if (dataType.includes("enum") || dataType.includes("set")) {
            return "Enumerated value";
        }
        return "Data field";
    }
    /**
     * Infer table description from name
     */
    inferTableDescription(tableName) {
        const name = tableName.toLowerCase();
        if (name.includes("user"))
            return "Stores user account information";
        if (name.includes("order"))
            return "Stores order records";
        if (name.includes("product"))
            return "Stores product catalog";
        if (name.includes("customer"))
            return "Stores customer information";
        if (name.includes("invoice"))
            return "Stores invoice records";
        if (name.includes("payment"))
            return "Stores payment transactions";
        if (name.includes("log"))
            return "Stores activity/event logs";
        if (name.includes("config") || name.includes("setting"))
            return "Stores configuration settings";
        if (name.includes("session"))
            return "Stores session data";
        if (name.includes("cache"))
            return "Stores cached data";
        if (name.includes("migration"))
            return "Stores database migration history";
        return `Stores ${this.inferBusinessTerm(tableName).toLowerCase()} data`;
    }
    /**
     * Infer category from column name and type
     */
    inferCategory(columnName, dataType) {
        const name = columnName.toLowerCase();
        if (name === "id" || name.endsWith("_id"))
            return "Identifiers";
        if (name.includes("created") || name.includes("updated") || name.includes("deleted") || name.includes("date") || name.includes("time"))
            return "Timestamps";
        if (name.includes("email") || name.includes("phone") || name.includes("address"))
            return "Contact";
        if (name.includes("name") || name.includes("title"))
            return "Names";
        if (name.includes("price") || name.includes("amount") || name.includes("cost") || name.includes("total"))
            return "Financial";
        if (name.includes("status") || name.includes("type") || name.includes("category"))
            return "Classification";
        if (name.startsWith("is_") || name.startsWith("has_"))
            return "Flags";
        if (name.includes("description") || name.includes("notes") || name.includes("comment"))
            return "Text Content";
        if (name.includes("url") || name.includes("link") || name.includes("path"))
            return "References";
        return "General";
    }
    /**
     * Normalize column name for comparison
     */
    normalizeColumnName(name) {
        return name
            .toLowerCase()
            .replace(/^(fk_|pk_|idx_)/, "")
            .replace(/_id$/, "")
            .replace(/[_-]/g, "");
    }
}
exports.DocumentationGeneratorTools = DocumentationGeneratorTools;
