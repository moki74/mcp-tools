import DatabaseConnection from "../db/connection";
import { SecurityLayer } from "../security/securityLayer";
import { dbConfig } from "../config/config";

/**
 * Smart Data Discovery Agent
 * Finds relevant tables/columns using semantic search and pattern matching
 * Discovers hidden relationships automatically
 */
export class SmartDiscoveryTools {
    private db: DatabaseConnection;
    private security: SecurityLayer;

    constructor(security: SecurityLayer) {
        this.db = DatabaseConnection.getInstance();
        this.security = security;
    }

    /**
     * Validate database access - ensures only the connected database can be accessed
     */
    private validateDatabaseAccess(requestedDatabase?: string): {
        valid: boolean;
        database: string;
        error?: string;
    } {
        const connectedDatabase = dbConfig.database;

        if (!connectedDatabase) {
            return {
                valid: false,
                database: "",
                error:
                    "No database specified in connection string. Cannot access any database.",
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
     * Smart search across database objects (tables, columns, data patterns)
     */
    async smartSearch(params: {
        search_term: string;
        search_type?: "column" | "table" | "data_pattern" | "relationship" | "all";
        similarity_threshold?: number;
        include_sample_data?: boolean;
        max_results?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            search_term: string;
            search_type: string;
            results: {
                tables: Array<{
                    name: string;
                    relevance_score: number;
                    match_reason: string;
                    column_count: number;
                    row_estimate: number;
                    matching_columns?: string[];
                }>;
                columns: Array<{
                    table_name: string;
                    column_name: string;
                    data_type: string;
                    relevance_score: number;
                    match_reason: string;
                    sample_values?: any[];
                }>;
                data_patterns: Array<{
                    table_name: string;
                    column_name: string;
                    pattern_type: string;
                    description: string;
                    sample_matches?: any[];
                }>;
                relationships: Array<{
                    from_table: string;
                    from_column: string;
                    to_table: string;
                    to_column: string;
                    relationship_type: string;
                    confidence: number;
                }>;
            };
            total_matches: number;
            search_time_ms: number;
        };
        error?: string;
    }> {
        const startTime = Date.now();

        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error! };
            }

            const {
                search_term,
                search_type = "all",
                similarity_threshold = 0.3,
                include_sample_data = false,
                max_results = 20,
            } = params;
            const database = dbValidation.database;

            if (!search_term?.trim()) {
                return { status: "error", error: "search_term is required" };
            }

            const searchTermLower = search_term.toLowerCase().trim();
            const searchTokens = this.tokenize(searchTermLower);

            // Get all tables and columns
            const tablesResult = await this.db.query<any[]>(
                `SELECT TABLE_NAME, TABLE_ROWS
         FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
                [database]
            );

            const columnsResult = await this.db.query<any[]>(
                `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_KEY
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ?
         ORDER BY TABLE_NAME, ORDINAL_POSITION`,
                [database]
            );

            // Get foreign key relationships
            const fkResult = await this.db.query<any[]>(
                `SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
                [database]
            );

            const results = {
                tables: [] as Array<{
                    name: string;
                    relevance_score: number;
                    match_reason: string;
                    column_count: number;
                    row_estimate: number;
                    matching_columns?: string[];
                }>,
                columns: [] as Array<{
                    table_name: string;
                    column_name: string;
                    data_type: string;
                    relevance_score: number;
                    match_reason: string;
                    sample_values?: any[];
                }>,
                data_patterns: [] as Array<{
                    table_name: string;
                    column_name: string;
                    pattern_type: string;
                    description: string;
                    sample_matches?: any[];
                }>,
                relationships: [] as Array<{
                    from_table: string;
                    from_column: string;
                    to_table: string;
                    to_column: string;
                    relationship_type: string;
                    confidence: number;
                }>,
            };

            // Search tables
            if (search_type === "all" || search_type === "table") {
                for (const table of tablesResult) {
                    const tableName = table.TABLE_NAME.toLowerCase();
                    const score = this.calculateRelevanceScore(searchTokens, tableName, searchTermLower);

                    if (score >= similarity_threshold) {
                        const tableColumns = columnsResult.filter(
                            (c) => c.TABLE_NAME === table.TABLE_NAME
                        );
                        const matchingCols = tableColumns
                            .filter((c) =>
                                this.calculateRelevanceScore(searchTokens, c.COLUMN_NAME.toLowerCase(), searchTermLower) >= similarity_threshold
                            )
                            .map((c) => c.COLUMN_NAME);

                        results.tables.push({
                            name: table.TABLE_NAME,
                            relevance_score: Math.round(score * 100) / 100,
                            match_reason: this.getMatchReason(searchTokens, tableName),
                            column_count: tableColumns.length,
                            row_estimate: parseInt(table.TABLE_ROWS || "0", 10) || 0,
                            matching_columns: matchingCols.length > 0 ? matchingCols : undefined,
                        });
                    }
                }
            }

            // Search columns
            if (search_type === "all" || search_type === "column") {
                for (const column of columnsResult) {
                    const colName = column.COLUMN_NAME.toLowerCase();
                    const score = this.calculateRelevanceScore(searchTokens, colName, searchTermLower);

                    if (score >= similarity_threshold) {
                        const colResult: any = {
                            table_name: column.TABLE_NAME,
                            column_name: column.COLUMN_NAME,
                            data_type: column.DATA_TYPE,
                            relevance_score: Math.round(score * 100) / 100,
                            match_reason: this.getMatchReason(searchTokens, colName),
                        };

                        // Include sample data if requested
                        if (include_sample_data) {
                            try {
                                const samples = await this.db.query<any[]>(
                                    `SELECT DISTINCT \`${column.COLUMN_NAME}\` 
                   FROM \`${database}\`.\`${column.TABLE_NAME}\`
                   WHERE \`${column.COLUMN_NAME}\` IS NOT NULL
                   LIMIT 5`
                                );
                                colResult.sample_values = samples.map(
                                    (s) => s[column.COLUMN_NAME]
                                );
                            } catch {
                                // Ignore errors when fetching samples
                            }
                        }

                        results.columns.push(colResult);
                    }
                }
            }

            // Search for data patterns (look for the search term in actual data)
            if (search_type === "all" || search_type === "data_pattern") {
                // Only search text and varchar columns for data patterns
                const textColumns = columnsResult.filter((c) =>
                    ["varchar", "text", "char", "longtext", "mediumtext", "tinytext", "enum", "set"].includes(
                        c.DATA_TYPE.toLowerCase()
                    )
                );

                // Limit to prevent too many queries
                const columnsToSearch = textColumns.slice(0, 20);

                for (const column of columnsToSearch) {
                    try {
                        const patternQuery = `
              SELECT DISTINCT \`${column.COLUMN_NAME}\`
              FROM \`${database}\`.\`${column.TABLE_NAME}\`
              WHERE LOWER(\`${column.COLUMN_NAME}\`) LIKE ?
              LIMIT 5
            `;
                        const matches = await this.db.query<any[]>(patternQuery, [
                            `%${searchTermLower}%`,
                        ]);

                        if (matches.length > 0) {
                            results.data_patterns.push({
                                table_name: column.TABLE_NAME,
                                column_name: column.COLUMN_NAME,
                                pattern_type: "CONTAINS",
                                description: `Found ${matches.length}+ values containing "${search_term}"`,
                                sample_matches: matches.map((m) => m[column.COLUMN_NAME]),
                            });
                        }
                    } catch {
                        // Ignore errors when searching patterns
                    }
                }
            }

            // Search relationships
            if (search_type === "all" || search_type === "relationship") {
                // Explicit foreign keys
                for (const fk of fkResult) {
                    const score = Math.max(
                        this.calculateRelevanceScore(searchTokens, fk.TABLE_NAME.toLowerCase(), searchTermLower),
                        this.calculateRelevanceScore(searchTokens, fk.REFERENCED_TABLE_NAME.toLowerCase(), searchTermLower),
                        this.calculateRelevanceScore(searchTokens, fk.COLUMN_NAME.toLowerCase(), searchTermLower)
                    );

                    if (score >= similarity_threshold) {
                        results.relationships.push({
                            from_table: fk.TABLE_NAME,
                            from_column: fk.COLUMN_NAME,
                            to_table: fk.REFERENCED_TABLE_NAME,
                            to_column: fk.REFERENCED_COLUMN_NAME,
                            relationship_type: "FOREIGN_KEY",
                            confidence: 1.0,
                        });
                    }
                }

                // Discover implicit relationships (naming conventions)
                const implicitRels = this.discoverImplicitRelationships(
                    tablesResult,
                    columnsResult,
                    searchTokens,
                    similarity_threshold
                );
                results.relationships.push(...implicitRels);
            }

            // Sort and limit results
            results.tables.sort((a, b) => b.relevance_score - a.relevance_score);
            results.columns.sort((a, b) => b.relevance_score - a.relevance_score);

            // Apply max_results limit
            results.tables = results.tables.slice(0, max_results);
            results.columns = results.columns.slice(0, max_results);
            results.data_patterns = results.data_patterns.slice(0, max_results);
            results.relationships = results.relationships.slice(0, max_results);

            const totalMatches =
                results.tables.length +
                results.columns.length +
                results.data_patterns.length +
                results.relationships.length;

            return {
                status: "success",
                data: {
                    search_term,
                    search_type,
                    results,
                    total_matches: totalMatches,
                    search_time_ms: Date.now() - startTime,
                },
            };
        } catch (error: any) {
            return {
                status: "error",
                error: error.message,
            };
        }
    }

    /**
     * Find similar columns across tables (potential join candidates)
     */
    async findSimilarColumns(params: {
        column_name?: string;
        table_name?: string;
        include_data_comparison?: boolean;
        max_results?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            reference_column?: {
                table: string;
                column: string;
                data_type: string;
            };
            similar_columns: Array<{
                table_name: string;
                column_name: string;
                data_type: string;
                similarity_score: number;
                similarity_type: string;
                data_overlap_percentage?: number;
            }>;
            potential_joins: Array<{
                table1: string;
                column1: string;
                table2: string;
                column2: string;
                confidence: number;
                reason: string;
            }>;
        };
        error?: string;
    }> {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error! };
            }

            const {
                column_name,
                table_name,
                include_data_comparison = false,
                max_results = 20,
            } = params;
            const database = dbValidation.database;

            // Get all columns
            const allColumns = await this.db.query<any[]>(
                `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_KEY
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ?
         ORDER BY TABLE_NAME, ORDINAL_POSITION`,
                [database]
            );

            const similarColumns: Array<{
                table_name: string;
                column_name: string;
                data_type: string;
                similarity_score: number;
                similarity_type: string;
                data_overlap_percentage?: number;
            }> = [];

            const potentialJoins: Array<{
                table1: string;
                column1: string;
                table2: string;
                column2: string;
                confidence: number;
                reason: string;
            }> = [];

            let referenceColumn: { table: string; column: string; data_type: string } | undefined;

            if (column_name && table_name) {
                // Find reference column
                const refCol = allColumns.find(
                    (c) =>
                        c.TABLE_NAME.toLowerCase() === table_name.toLowerCase() &&
                        c.COLUMN_NAME.toLowerCase() === column_name.toLowerCase()
                );

                if (!refCol) {
                    return {
                        status: "error",
                        error: `Column '${column_name}' not found in table '${table_name}'`,
                    };
                }

                referenceColumn = {
                    table: refCol.TABLE_NAME,
                    column: refCol.COLUMN_NAME,
                    data_type: refCol.DATA_TYPE,
                };

                // Find similar columns
                const refNameTokens = this.tokenize(refCol.COLUMN_NAME.toLowerCase());

                for (const col of allColumns) {
                    if (
                        col.TABLE_NAME === refCol.TABLE_NAME &&
                        col.COLUMN_NAME === refCol.COLUMN_NAME
                    ) {
                        continue;
                    }

                    const colNameLower = col.COLUMN_NAME.toLowerCase();
                    const nameSimilarity = this.calculateNameSimilarity(
                        refCol.COLUMN_NAME.toLowerCase(),
                        colNameLower
                    );
                    const typeSimilarity = col.DATA_TYPE === refCol.DATA_TYPE ? 0.3 : 0;
                    const totalScore = nameSimilarity * 0.7 + typeSimilarity;

                    if (totalScore >= 0.3) {
                        const simCol: any = {
                            table_name: col.TABLE_NAME,
                            column_name: col.COLUMN_NAME,
                            data_type: col.DATA_TYPE,
                            similarity_score: Math.round(totalScore * 100) / 100,
                            similarity_type: this.getSimilarityType(
                                refCol.COLUMN_NAME,
                                col.COLUMN_NAME
                            ),
                        };

                        // Compare data if requested
                        if (
                            include_data_comparison &&
                            col.DATA_TYPE === refCol.DATA_TYPE
                        ) {
                            try {
                                const overlapResult = await this.calculateDataOverlap(
                                    database,
                                    refCol.TABLE_NAME,
                                    refCol.COLUMN_NAME,
                                    col.TABLE_NAME,
                                    col.COLUMN_NAME
                                );
                                simCol.data_overlap_percentage = overlapResult;
                            } catch {
                                // Ignore data comparison errors
                            }
                        }

                        similarColumns.push(simCol);

                        // Add as potential join if high confidence
                        if (totalScore >= 0.6 || (simCol.data_overlap_percentage || 0) > 50) {
                            potentialJoins.push({
                                table1: refCol.TABLE_NAME,
                                column1: refCol.COLUMN_NAME,
                                table2: col.TABLE_NAME,
                                column2: col.COLUMN_NAME,
                                confidence: Math.round(Math.max(totalScore, (simCol.data_overlap_percentage || 0) / 100) * 100) / 100,
                                reason:
                                    (simCol.data_overlap_percentage || 0) > 50
                                        ? "High data overlap"
                                        : "Similar column names",
                            });
                        }
                    }
                }
            } else {
                // Find all potential join candidates based on naming patterns
                const columnGroups = new Map<string, any[]>();

                for (const col of allColumns) {
                    // Group by normalized column name
                    const normalized = this.normalizeColumnName(col.COLUMN_NAME);
                    if (!columnGroups.has(normalized)) {
                        columnGroups.set(normalized, []);
                    }
                    columnGroups.get(normalized)!.push(col);
                }

                // Find groups with multiple columns (potential joins)
                for (const [normalizedName, columns] of columnGroups) {
                    if (columns.length > 1) {
                        // Generate pairs
                        for (let i = 0; i < columns.length; i++) {
                            for (let j = i + 1; j < columns.length; j++) {
                                const col1 = columns[i];
                                const col2 = columns[j];

                                if (
                                    col1.TABLE_NAME !== col2.TABLE_NAME &&
                                    col1.DATA_TYPE === col2.DATA_TYPE
                                ) {
                                    const confidence =
                                        col1.COLUMN_NAME === col2.COLUMN_NAME ? 0.9 : 0.7;

                                    potentialJoins.push({
                                        table1: col1.TABLE_NAME,
                                        column1: col1.COLUMN_NAME,
                                        table2: col2.TABLE_NAME,
                                        column2: col2.COLUMN_NAME,
                                        confidence,
                                        reason:
                                            col1.COLUMN_NAME === col2.COLUMN_NAME
                                                ? "Identical column names"
                                                : `Similar names: ${col1.COLUMN_NAME} ~ ${col2.COLUMN_NAME}`,
                                    });
                                }
                            }
                        }
                    }
                }

                // Also look for id/foreign key patterns
                for (const col of allColumns) {
                    if (col.COLUMN_NAME.toLowerCase().endsWith("_id")) {
                        const potentialTable = col.COLUMN_NAME.slice(0, -3);
                        const matchingTable = allColumns.find(
                            (c) =>
                                c.TABLE_NAME.toLowerCase() === potentialTable.toLowerCase() &&
                                c.COLUMN_KEY === "PRI"
                        );

                        if (matchingTable && matchingTable.TABLE_NAME !== col.TABLE_NAME) {
                            potentialJoins.push({
                                table1: col.TABLE_NAME,
                                column1: col.COLUMN_NAME,
                                table2: matchingTable.TABLE_NAME,
                                column2: matchingTable.COLUMN_NAME,
                                confidence: 0.85,
                                reason: "Foreign key naming convention (_id suffix)",
                            });
                        }
                    }
                }
            }

            // Sort by similarity/confidence
            similarColumns.sort((a, b) => b.similarity_score - a.similarity_score);
            potentialJoins.sort((a, b) => b.confidence - a.confidence);

            return {
                status: "success",
                data: {
                    reference_column: referenceColumn,
                    similar_columns: similarColumns.slice(0, max_results),
                    potential_joins: potentialJoins.slice(0, max_results),
                },
            };
        } catch (error: any) {
            return {
                status: "error",
                error: error.message,
            };
        }
    }

    /**
     * Discover data relationships and patterns
     */
    async discoverDataPatterns(params: {
        table_name: string;
        pattern_types?: Array<"unique" | "null" | "duplicate" | "format" | "range">;
        max_columns?: number;
        database?: string;
    }): Promise<{
        status: string;
        data?: {
            table_name: string;
            patterns: Array<{
                column_name: string;
                pattern_type: string;
                description: string;
                metrics?: Record<string, any>;
                recommendations?: string[];
            }>;
            summary: {
                columns_analyzed: number;
                patterns_found: number;
                data_quality_score: number;
            };
        };
        error?: string;
    }> {
        try {
            const dbValidation = this.validateDatabaseAccess(params?.database);
            if (!dbValidation.valid) {
                return { status: "error", error: dbValidation.error! };
            }

            const {
                table_name,
                pattern_types = ["unique", "null", "duplicate", "format", "range"],
                max_columns = 20,
            } = params;
            const database = dbValidation.database;

            // Validate table name
            if (!this.security.validateIdentifier(table_name).valid) {
                return { status: "error", error: "Invalid table name" };
            }

            // Get columns
            const columns = await this.db.query<any[]>(
                `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
         ORDER BY ORDINAL_POSITION
         LIMIT ?`,
                [database, table_name, max_columns]
            );

            if (columns.length === 0) {
                return {
                    status: "error",
                    error: `Table '${table_name}' not found or has no columns`,
                };
            }

            // Get row count
            const countResult = await this.db.query<any[]>(
                `SELECT COUNT(*) as cnt FROM \`${database}\`.\`${table_name}\``
            );
            const totalRows = countResult[0]?.cnt || 0;

            const patterns: Array<{
                column_name: string;
                pattern_type: string;
                description: string;
                metrics?: Record<string, any>;
                recommendations?: string[];
            }> = [];

            let qualityScore = 100;

            for (const col of columns) {
                const colName = col.COLUMN_NAME;

                // Check for NULL patterns
                if (pattern_types.includes("null")) {
                    const nullResult = await this.db.query<any[]>(
                        `SELECT COUNT(*) as null_count
             FROM \`${database}\`.\`${table_name}\`
             WHERE \`${colName}\` IS NULL`
                    );
                    const nullCount = nullResult[0]?.null_count || 0;
                    const nullPercentage = totalRows > 0 ? (nullCount / totalRows) * 100 : 0;

                    if (nullPercentage > 50) {
                        patterns.push({
                            column_name: colName,
                            pattern_type: "HIGH_NULL_RATE",
                            description: `${nullPercentage.toFixed(1)}% of values are NULL`,
                            metrics: { null_count: nullCount, null_percentage: nullPercentage },
                            recommendations: [
                                "Review if this column is necessary",
                                "Consider setting a default value",
                            ],
                        });
                        qualityScore -= 5;
                    } else if (nullPercentage > 0 && col.IS_NULLABLE === "NO") {
                        patterns.push({
                            column_name: colName,
                            pattern_type: "NULLABLE_MISMATCH",
                            description: "Column is marked NOT NULL but has NULL values",
                            metrics: { null_count: nullCount },
                            recommendations: ["Check data integrity constraints"],
                        });
                        qualityScore -= 10;
                    }
                }

                // Check for uniqueness patterns
                if (pattern_types.includes("unique")) {
                    const uniqueResult = await this.db.query<any[]>(
                        `SELECT COUNT(DISTINCT \`${colName}\`) as distinct_count
             FROM \`${database}\`.\`${table_name}\``
                    );
                    const distinctCount = uniqueResult[0]?.distinct_count || 0;
                    const uniqueRatio = totalRows > 0 ? distinctCount / totalRows : 0;

                    if (uniqueRatio === 1 && col.COLUMN_KEY !== "PRI" && col.COLUMN_KEY !== "UNI") {
                        patterns.push({
                            column_name: colName,
                            pattern_type: "POTENTIALLY_UNIQUE",
                            description: "All values are unique but column is not marked as UNIQUE",
                            metrics: { distinct_count: distinctCount, total_rows: totalRows },
                            recommendations: [
                                "Consider adding a UNIQUE constraint",
                                "Could be a natural key candidate",
                            ],
                        });
                    } else if (uniqueRatio < 0.1 && totalRows > 100) {
                        patterns.push({
                            column_name: colName,
                            pattern_type: "LOW_CARDINALITY",
                            description: `Only ${distinctCount} distinct values across ${totalRows} rows`,
                            metrics: { distinct_count: distinctCount, cardinality_ratio: uniqueRatio },
                            recommendations: [
                                "Consider using ENUM if values are fixed",
                                "May be a good candidate for indexing",
                            ],
                        });
                    }
                }

                // Check for duplicate patterns
                if (pattern_types.includes("duplicate") && totalRows > 10) {
                    const duplicateResult = await this.db.query<any[]>(
                        `SELECT \`${colName}\`, COUNT(*) as cnt
             FROM \`${database}\`.\`${table_name}\`
             WHERE \`${colName}\` IS NOT NULL
             GROUP BY \`${colName}\`
             HAVING cnt > 1
             ORDER BY cnt DESC
             LIMIT 5`
                    );

                    if (duplicateResult.length > 0) {
                        const topDuplicates = duplicateResult.map((r) => ({
                            value: r[colName],
                            count: r.cnt,
                        }));

                        if (col.COLUMN_KEY === "UNI" || col.COLUMN_KEY === "PRI") {
                            patterns.push({
                                column_name: colName,
                                pattern_type: "DUPLICATE_IN_UNIQUE",
                                description: "Duplicates found in supposedly unique column",
                                metrics: { top_duplicates: topDuplicates },
                                recommendations: ["Critical: Fix data integrity issue"],
                            });
                            qualityScore -= 20;
                        } else {
                            patterns.push({
                                column_name: colName,
                                pattern_type: "DUPLICATES_FOUND",
                                description: `Found ${duplicateResult.length} values with duplicates`,
                                metrics: { duplicate_groups: duplicateResult.length, top_duplicates: topDuplicates },
                            });
                        }
                    }
                }

                // Check for format patterns (for string columns)
                if (
                    pattern_types.includes("format") &&
                    ["varchar", "char", "text"].includes(col.DATA_TYPE.toLowerCase())
                ) {
                    // Check for email pattern
                    const emailResult = await this.db.query<any[]>(
                        `SELECT COUNT(*) as cnt
             FROM \`${database}\`.\`${table_name}\`
             WHERE \`${colName}\` REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'`
                    );
                    if (emailResult[0]?.cnt > totalRows * 0.5) {
                        patterns.push({
                            column_name: colName,
                            pattern_type: "EMAIL_FORMAT",
                            description: "Contains email-formatted data",
                            metrics: { email_count: emailResult[0].cnt },
                        });
                    }

                    // Check for phone pattern
                    const phoneResult = await this.db.query<any[]>(
                        `SELECT COUNT(*) as cnt
             FROM \`${database}\`.\`${table_name}\`
             WHERE \`${colName}\` REGEXP '^[+]?[0-9]{10,15}$'`
                    );
                    if (phoneResult[0]?.cnt > totalRows * 0.3) {
                        patterns.push({
                            column_name: colName,
                            pattern_type: "PHONE_FORMAT",
                            description: "Contains phone number-formatted data",
                            metrics: { phone_count: phoneResult[0].cnt },
                        });
                    }
                }

                // Check for range patterns (for numeric columns)
                if (
                    pattern_types.includes("range") &&
                    ["int", "bigint", "decimal", "float", "double"].includes(
                        col.DATA_TYPE.toLowerCase()
                    )
                ) {
                    const rangeResult = await this.db.query<any[]>(
                        `SELECT MIN(\`${colName}\`) as min_val, MAX(\`${colName}\`) as max_val, AVG(\`${colName}\`) as avg_val
             FROM \`${database}\`.\`${table_name}\``
                    );

                    if (rangeResult[0]) {
                        const { min_val, max_val, avg_val } = rangeResult[0];
                        const range = max_val - min_val;

                        patterns.push({
                            column_name: colName,
                            pattern_type: "NUMERIC_RANGE",
                            description: `Values range from ${min_val} to ${max_val}`,
                            metrics: {
                                min: min_val,
                                max: max_val,
                                avg: avg_val,
                                range: range,
                            },
                        });

                        // Check for potential outliers
                        if (range > 0 && (max_val > avg_val * 10 || min_val < avg_val / 10)) {
                            patterns.push({
                                column_name: colName,
                                pattern_type: "POTENTIAL_OUTLIERS",
                                description: "Large variance detected, may contain outliers",
                                recommendations: [
                                    "Review extreme values for data quality",
                                    "Consider outlier detection",
                                ],
                            });
                        }
                    }
                }
            }

            return {
                status: "success",
                data: {
                    table_name,
                    patterns,
                    summary: {
                        columns_analyzed: columns.length,
                        patterns_found: patterns.length,
                        data_quality_score: Math.max(0, qualityScore),
                    },
                },
            };
        } catch (error: any) {
            return {
                status: "error",
                error: error.message,
            };
        }
    }

    // ==================== Helper Methods ====================

    /**
     * Tokenize a string into searchable tokens
     */
    private tokenize(text: string): string[] {
        return text
            .toLowerCase()
            .replace(/[-_]/g, " ")
            .split(/\s+/)
            .filter((t) => t.length > 1);
    }

    /**
     * Calculate relevance score between search tokens and target
     */
    private calculateRelevanceScore(
        tokens: string[],
        target: string,
        originalTerm: string
    ): number {
        const targetLower = target.toLowerCase();

        // Exact match
        if (targetLower === originalTerm) return 1.0;

        // Contains full term
        if (targetLower.includes(originalTerm)) return 0.9;
        if (originalTerm.includes(targetLower)) return 0.85;

        // Token-based scoring
        let matchedTokens = 0;
        for (const token of tokens) {
            if (targetLower.includes(token)) matchedTokens++;
        }

        if (tokens.length > 0) {
            const tokenScore = matchedTokens / tokens.length;
            if (tokenScore > 0) return 0.3 + tokenScore * 0.5;
        }

        // Similarity-based scoring
        const similarity = this.calculateNameSimilarity(originalTerm, targetLower);
        if (similarity > 0.5) return similarity * 0.6;

        return 0;
    }

    /**
     * Get a human-readable match reason
     */
    private getMatchReason(tokens: string[], target: string): string {
        const targetLower = target.toLowerCase();

        for (const token of tokens) {
            if (targetLower === token) return `Exact match: "${token}"`;
            if (targetLower.includes(token)) return `Contains: "${token}"`;
        }

        return "Similar name pattern";
    }

    /**
     * Calculate name similarity using Levenshtein-like approach
     */
    private calculateNameSimilarity(a: string, b: string): number {
        if (a === b) return 1;
        if (a.length === 0 || b.length === 0) return 0;

        // Simple character overlap ratio
        const setA = new Set(a.split(""));
        const setB = new Set(b.split(""));
        const intersection = [...setA].filter((x) => setB.has(x)).length;
        const union = new Set([...setA, ...setB]).size;

        const charSimilarity = union > 0 ? intersection / union : 0;

        // Prefix matching bonus
        let prefixLength = 0;
        const minLen = Math.min(a.length, b.length);
        for (let i = 0; i < minLen; i++) {
            if (a[i] === b[i]) prefixLength++;
            else break;
        }
        const prefixBonus = prefixLength / Math.max(a.length, b.length);

        return charSimilarity * 0.6 + prefixBonus * 0.4;
    }

    /**
     * Normalize column name for comparison
     */
    private normalizeColumnName(name: string): string {
        return name
            .toLowerCase()
            .replace(/^(fk_|pk_|idx_)/, "")
            .replace(/_id$/, "")
            .replace(/[_-]/g, "");
    }

    /**
     * Get similarity type description
     */
    private getSimilarityType(name1: string, name2: string): string {
        if (name1.toLowerCase() === name2.toLowerCase()) return "EXACT_MATCH";

        const n1 = this.normalizeColumnName(name1);
        const n2 = this.normalizeColumnName(name2);

        if (n1 === n2) return "NORMALIZED_MATCH";
        if (n1.includes(n2) || n2.includes(n1)) return "SUBSTRING_MATCH";
        return "SIMILAR_PATTERN";
    }

    /**
     * Calculate data overlap between two columns
     */
    private async calculateDataOverlap(
        database: string,
        table1: string,
        col1: string,
        table2: string,
        col2: string
    ): Promise<number> {
        const overlapQuery = `
      SELECT COUNT(DISTINCT t1.\`${col1}\`) as overlap_count
      FROM \`${database}\`.\`${table1}\` t1
      INNER JOIN \`${database}\`.\`${table2}\` t2 ON t1.\`${col1}\` = t2.\`${col2}\`
      WHERE t1.\`${col1}\` IS NOT NULL
    `;

        const totalQuery = `
      SELECT COUNT(DISTINCT \`${col1}\`) as total
      FROM \`${database}\`.\`${table1}\`
      WHERE \`${col1}\` IS NOT NULL
    `;

        const [overlapResult, totalResult] = await Promise.all([
            this.db.query<any[]>(overlapQuery),
            this.db.query<any[]>(totalQuery),
        ]);

        const overlap = overlapResult[0]?.overlap_count || 0;
        const total = totalResult[0]?.total || 1;

        return Math.round((overlap / total) * 100);
    }

    /**
     * Discover implicit relationships based on naming conventions
     */
    private discoverImplicitRelationships(
        tables: any[],
        columns: any[],
        searchTokens: string[],
        threshold: number
    ): Array<{
        from_table: string;
        from_column: string;
        to_table: string;
        to_column: string;
        relationship_type: string;
        confidence: number;
    }> {
        const relationships: Array<{
            from_table: string;
            from_column: string;
            to_table: string;
            to_column: string;
            relationship_type: string;
            confidence: number;
        }> = [];

        const tableNames = new Set(tables.map((t) => t.TABLE_NAME.toLowerCase()));
        const primaryKeys = new Map<string, string>();

        // Find primary keys
        for (const col of columns) {
            if (col.COLUMN_KEY === "PRI") {
                primaryKeys.set(col.TABLE_NAME.toLowerCase(), col.COLUMN_NAME);
            }
        }

        // Look for _id columns that match table names
        for (const col of columns) {
            const colLower = col.COLUMN_NAME.toLowerCase();
            if (colLower.endsWith("_id")) {
                const potentialTable = colLower.slice(0, -3);

                // Check if the tokens match
                const score = this.calculateRelevanceScore(
                    searchTokens,
                    potentialTable,
                    searchTokens.join(" ")
                );

                if (score >= threshold || searchTokens.length === 0) {
                    if (tableNames.has(potentialTable)) {
                        const pk = primaryKeys.get(potentialTable) || "id";
                        relationships.push({
                            from_table: col.TABLE_NAME,
                            from_column: col.COLUMN_NAME,
                            to_table: potentialTable,
                            to_column: pk,
                            relationship_type: "IMPLICIT_FK",
                            confidence: 0.8,
                        });
                    }
                }
            }
        }

        return relationships;
    }
}
