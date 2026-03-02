"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaDesignTools = void 0;
class SchemaDesignTools {
    constructor(security) {
        this.security = security;
    }
    async designSchemaFromRequirements(params) {
        try {
            const requirementsText = params?.requirements_text?.trim();
            if (!requirementsText) {
                return { status: "error", error: "requirements_text is required" };
            }
            const naming = params.naming_convention ?? "snake_case";
            const includeAudit = params.include_audit_columns ?? true;
            const idType = params.id_type ?? "BIGINT";
            const engine = params.engine ?? "InnoDB";
            const charset = params.charset ?? "utf8mb4";
            const collation = params.collation ?? "utf8mb4_unicode_ci";
            const notes = [
                "This tool uses deterministic heuristics (no external LLM) and may require manual refinement.",
                "Review data types, nullability, and indexes before applying DDL in production.",
            ];
            const extracted = this.extractEntitiesAndRelations(requirementsText);
            const explicitEntities = (params.entities || [])
                .map((e) => ({
                name: e.name,
                fields: e.fields || [],
            }))
                .filter((e) => !!e.name?.trim());
            const entityNames = new Set();
            for (const e of explicitEntities)
                entityNames.add(e.name.trim());
            for (const e of extracted.entities)
                entityNames.add(e);
            if (entityNames.size === 0) {
                // Fallback: create a single generic table
                entityNames.add("items");
                notes.push("No entities could be inferred from the text; generated a single fallback table 'items'.");
            }
            // Build initial table specs
            const tablesSpec = Array.from(entityNames).map((rawName, idx) => {
                const tableName = this.normalizeIdentifier(rawName, naming, `entity_${idx + 1}`);
                const idColumn = idType === "UUID"
                    ? { name: "id", type: "CHAR(36)", nullable: false, primary_key: true }
                    : {
                        name: "id",
                        type: "BIGINT UNSIGNED",
                        nullable: false,
                        primary_key: true,
                    };
                const baseColumns = [
                    idType === "UUID"
                        ? idColumn
                        : { ...idColumn, type: "BIGINT UNSIGNED AUTO_INCREMENT" },
                ];
                if (includeAudit) {
                    baseColumns.push({ name: "created_at", type: "DATETIME", nullable: false }, { name: "updated_at", type: "DATETIME", nullable: false });
                }
                return {
                    table_name: tableName,
                    columns: baseColumns,
                    indexes: [],
                    _raw_name: rawName,
                };
            });
            const rawNameToTable = new Map();
            for (const t of tablesSpec) {
                rawNameToTable.set(t._raw_name, t.table_name);
            }
            // Apply field hints from explicit entities and text patterns
            for (const t of tablesSpec) {
                const explicit = explicitEntities.find((e) => this.normalizeLoose(e.name) === this.normalizeLoose(t._raw_name));
                const fieldsFromText = extracted.fieldsByEntity.get(t._raw_name) || [];
                const hintedFields = [
                    ...(explicit?.fields || []),
                    ...fieldsFromText,
                ].map((f) => f.trim());
                for (const field of hintedFields) {
                    const colName = this.normalizeIdentifier(field, naming, undefined);
                    if (!colName || colName === "id" || colName === "created_at" || colName === "updated_at") {
                        continue;
                    }
                    if (t.columns.some((c) => c.name === colName))
                        continue;
                    const inferred = this.inferColumnType(colName);
                    t.columns.push(inferred.column);
                    if (inferred.uniqueIndex) {
                        t.indexes.push({
                            name: this.makeIndexName(t.table_name, [colName], true),
                            columns: [colName],
                            unique: true,
                        });
                    }
                }
            }
            // Apply inferred relationships
            const relationships = [];
            for (const rel of extracted.relationships) {
                const fromTableRaw = rel.from;
                const toTableRaw = rel.to;
                const fromTable = this.findTableNameForRaw(fromTableRaw, tablesSpec) ?? this.normalizeIdentifier(fromTableRaw, naming, undefined);
                const toTable = this.findTableNameForRaw(toTableRaw, tablesSpec) ?? this.normalizeIdentifier(toTableRaw, naming, undefined);
                if (!fromTable || !toTable)
                    continue;
                const parentTable = rel.type === "many_to_one" ? toTable : fromTable;
                const childTable = rel.type === "many_to_one" ? fromTable : toTable;
                const child = tablesSpec.find((t) => t.table_name === childTable);
                const parent = tablesSpec.find((t) => t.table_name === parentTable);
                if (!child || !parent)
                    continue;
                const fkColumn = this.normalizeIdentifier(`${parentTable}_id`, naming, `${parentTable}_id`);
                if (!child.columns.some((c) => c.name === fkColumn)) {
                    child.columns.push({
                        name: fkColumn,
                        type: idType === "UUID" ? "CHAR(36)" : "BIGINT UNSIGNED",
                        nullable: false,
                        references: { table: parentTable, column: "id" },
                    });
                    child.indexes.push({
                        name: this.makeIndexName(childTable, [fkColumn], false),
                        columns: [fkColumn],
                    });
                }
                relationships.push({
                    from_table: childTable,
                    from_column: fkColumn,
                    to_table: parentTable,
                    to_column: "id",
                    type: "many_to_one",
                });
            }
            // Generate DDL
            const ddlStatements = [];
            for (const t of tablesSpec) {
                ddlStatements.push(this.generateCreateTableDDL(t, engine, charset, collation));
                for (const idx of t.indexes) {
                    ddlStatements.push(this.generateCreateIndexDDL(t.table_name, idx));
                }
            }
            // Basic sanity: validate generated identifiers
            for (const t of tablesSpec) {
                if (!this.security.validateIdentifier(t.table_name).valid) {
                    notes.push(`Generated table name '${t.table_name}' may be invalid. Consider renaming.`);
                }
                for (const c of t.columns) {
                    if (!this.security.validateIdentifier(c.name).valid) {
                        notes.push(`Generated column name '${t.table_name}.${c.name}' may be invalid. Consider renaming.`);
                    }
                }
            }
            return {
                status: "success",
                data: {
                    input: {
                        requirements_text: requirementsText,
                        inferred_entities_count: tablesSpec.length,
                    },
                    tables: tablesSpec.map(({ _raw_name, ...t }) => t),
                    relationships,
                    ddl_statements: ddlStatements,
                    notes,
                },
            };
        }
        catch (error) {
            return { status: "error", error: error.message };
        }
    }
    normalizeLoose(value) {
        return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    }
    toSnakeCase(value) {
        return value
            .trim()
            .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
            .replace(/[^a-zA-Z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "")
            .replace(/_+/g, "_")
            .toLowerCase();
    }
    toCamelCase(value) {
        const parts = value
            .trim()
            .replace(/[^a-zA-Z0-9]+/g, " ")
            .split(/\s+/)
            .filter(Boolean);
        if (parts.length === 0)
            return "";
        return (parts[0].toLowerCase() +
            parts
                .slice(1)
                .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
                .join(""));
    }
    normalizeIdentifier(raw, naming, fallback) {
        const base = naming === "camelCase" ? this.toCamelCase(raw) : this.toSnakeCase(raw);
        let ident = base;
        if (!ident)
            ident = fallback || "";
        if (!ident)
            return "";
        // Ensure valid start char
        if (!/^[a-zA-Z_$]/.test(ident)) {
            ident = `_${ident}`;
        }
        // Strip invalid chars (safety)
        ident = ident.replace(/[^a-zA-Z0-9_$]/g, "_");
        ident = ident.slice(0, 64);
        // If still invalid, fallback
        if (!this.security.validateIdentifier(ident).valid) {
            const fb = fallback ? this.toSnakeCase(fallback) : "entity";
            const safe = fb && this.security.validateIdentifier(fb).valid ? fb : "entity";
            return safe;
        }
        return ident;
    }
    inferColumnType(colName) {
        const name = colName.toLowerCase();
        if (name === "email") {
            return {
                column: { name: colName, type: "VARCHAR(255)", nullable: false, unique: true },
                uniqueIndex: true,
            };
        }
        if (name.endsWith("_id")) {
            return { column: { name: colName, type: "BIGINT UNSIGNED", nullable: false } };
        }
        if (name.includes("amount") ||
            name.includes("price") ||
            name.includes("total") ||
            name.includes("cost")) {
            return { column: { name: colName, type: "DECIMAL(10,2)", nullable: false } };
        }
        if (name.startsWith("is_") || name.startsWith("has_") || name.includes("enabled") || name.includes("active")) {
            return { column: { name: colName, type: "BOOLEAN", nullable: false } };
        }
        if (name.endsWith("_at") || name.includes("date") || name.includes("time")) {
            return { column: { name: colName, type: "DATETIME", nullable: true } };
        }
        if (name.includes("count") || name.includes("qty") || name.includes("quantity") || name.includes("number")) {
            return { column: { name: colName, type: "INT", nullable: false } };
        }
        if (name.includes("description") || name.includes("notes") || name.includes("comment")) {
            return { column: { name: colName, type: "TEXT", nullable: true } };
        }
        if (name.includes("name") || name.includes("title") || name.includes("status")) {
            return { column: { name: colName, type: "VARCHAR(255)", nullable: false } };
        }
        return { column: { name: colName, type: "VARCHAR(255)", nullable: true } };
    }
    extractEntitiesAndRelations(text) {
        const entities = new Set();
        const relationships = [];
        const fieldsByEntity = new Map();
        const raw = text;
        // Entity hints: "table for X", "entity X", "model X"
        for (const match of raw.matchAll(/\b(?:table|entity|model)\s+(?:for\s+)?([a-zA-Z][a-zA-Z0-9 _-]{1,40})/gi)) {
            const name = match[1].trim();
            if (name)
                entities.add(name);
        }
        // Relationship patterns: "A has many B" / "A belongs to B"
        for (const match of raw.matchAll(/\b([a-zA-Z][a-zA-Z0-9_-]{1,40})\s+has\s+many\s+([a-zA-Z][a-zA-Z0-9_-]{1,40})\b/gi)) {
            const from = match[1].trim();
            const to = match[2].trim();
            if (from && to) {
                entities.add(from);
                entities.add(to);
                relationships.push({ from, to, type: "one_to_many" });
            }
        }
        for (const match of raw.matchAll(/\b([a-zA-Z][a-zA-Z0-9_-]{1,40})\s+belongs\s+to\s+([a-zA-Z][a-zA-Z0-9_-]{1,40})\b/gi)) {
            const from = match[1].trim();
            const to = match[2].trim();
            if (from && to) {
                entities.add(from);
                entities.add(to);
                relationships.push({ from, to, type: "many_to_one" });
            }
        }
        // Field list patterns: "X fields: a, b, c" or "X columns: ..."
        for (const match of raw.matchAll(/\b([a-zA-Z][a-zA-Z0-9_-]{1,40})\s+(?:fields|columns|attributes)\s*:\s*([^\n\.]+)(?:\.|\n|$)/gi)) {
            const entity = match[1].trim();
            const list = match[2].trim();
            if (!entity || !list)
                continue;
            entities.add(entity);
            const fields = list
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s) => s.replace(/[^a-zA-Z0-9 _-]/g, "").trim())
                .filter(Boolean);
            if (fields.length > 0) {
                fieldsByEntity.set(entity, fields);
            }
        }
        return {
            entities: Array.from(entities.values()),
            relationships,
            fieldsByEntity,
        };
    }
    findTableNameForRaw(raw, tablesSpec) {
        const target = this.normalizeLoose(raw);
        const match = tablesSpec.find((t) => this.normalizeLoose(t._raw_name) === target);
        return match?.table_name;
    }
    makeIndexName(table, columns, unique) {
        const base = `${unique ? "uidx" : "idx"}_${table}_${columns.join("_")}`;
        const name = base.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 64);
        return name;
    }
    generateCreateTableDDL(table, engine, charset, collation) {
        const colLines = [];
        const pk = [];
        const fkLines = [];
        for (const c of table.columns) {
            const nullSql = c.nullable ? "NULL" : "NOT NULL";
            colLines.push("  `" + c.name + "` " + c.type + " " + nullSql);
            if (c.primary_key)
                pk.push(c.name);
            if (c.references) {
                const fkName = `fk_${table.table_name}_${c.name}`.slice(0, 64);
                fkLines.push("  CONSTRAINT `" +
                    fkName +
                    "` FOREIGN KEY (`" +
                    c.name +
                    "`) REFERENCES `" +
                    c.references.table +
                    "`(`" +
                    c.references.column +
                    "`)");
            }
        }
        if (pk.length > 0) {
            colLines.push("  PRIMARY KEY (" + pk.map((c) => "`" + c + "`").join(", ") + ")");
        }
        const allLines = [...colLines, ...fkLines];
        return ("CREATE TABLE `" +
            table.table_name +
            "` (\n" +
            allLines.join(",\n") +
            "\n) ENGINE=" +
            engine +
            " DEFAULT CHARSET=" +
            charset +
            " COLLATE=" +
            collation +
            ";");
    }
    generateCreateIndexDDL(tableName, idx) {
        const uniq = idx.unique ? "UNIQUE " : "";
        const cols = idx.columns.map((c) => "`" + c + "`").join(", ");
        return "CREATE " + uniq + "INDEX `" + idx.name + "` ON `" + tableName + "` (" + cols + ");";
    }
}
exports.SchemaDesignTools = SchemaDesignTools;
