import Ajv from "ajv";
import { FeatureConfig, ToolCategory } from "../config/featureConfig.js";
import { MaskingLayer } from "./maskingLayer.js";

export class SecurityLayer {
  private ajv: InstanceType<typeof Ajv>;
  private readonly dangerousKeywords: string[];
  private readonly allowedOperations: string[];
  private readonly ddlOperations: string[];
  private featureConfig: FeatureConfig;
  public masking: MaskingLayer;

  constructor(featureConfig?: FeatureConfig) {
    this.ajv = new Ajv();
    this.featureConfig = featureConfig || new FeatureConfig();

    // Masking is intentionally not configurable via environment variables.
    this.masking = new MaskingLayer("none");

    // Define dangerous SQL keywords that should ALWAYS be blocked (critical security threats)
    // These are blocked even with 'execute' permission
    // Note: Avoid blocking common table/column names like "user" or "password"
    this.dangerousKeywords = [
      "GRANT",
      "REVOKE",
      "INTO OUTFILE",
      "INTO DUMPFILE",
      "LOAD DATA",
      "LOAD_FILE",
      "INFORMATION_SCHEMA.USER_PRIVILEGES",
      "MYSQL.USER",
      "MYSQL.DB",
      "PERFORMANCE_SCHEMA",
      "CREATE USER",
      "DROP USER",
      "ALTER USER",
      "SET PASSWORD",
    ];

    // Define basic allowed SQL operations
    this.allowedOperations = ["SELECT", "INSERT", "UPDATE", "DELETE"];

    // Define DDL operations that require special permission
    this.ddlOperations = ["CREATE", "ALTER", "DROP", "TRUNCATE", "RENAME"];
  }

  /**
   * Check if a specific tool is enabled in the feature configuration
   */
  public isToolEnabled(toolName: string): boolean {
    return this.featureConfig.isToolEnabled(toolName);
  }

  /**
   * Check if a query is a read-only information query (SHOW, DESCRIBE, EXPLAIN, etc.)
   */
  private isInformationQuery(query: string): boolean {
    const trimmedQuery = query.trim().toUpperCase();
    const readOnlyCommands = ["SHOW", "DESCRIBE", "DESC", "EXPLAIN", "HELP"];

    return readOnlyCommands.some((cmd) => trimmedQuery.startsWith(cmd));
  }

  /**
   * Validate input against a JSON schema
   */
  validateInput(schema: object, data: any): { valid: boolean; errors?: any } {
    const validate = this.ajv.compile(schema);
    const valid = validate(data);

    if (!valid) {
      return {
        valid: false,
        errors: validate.errors,
      };
    }

    return { valid: true };
  }

  /**
   * Validate and sanitize table/column names to prevent SQL injection
   */
  validateIdentifier(identifier: string): { valid: boolean; error?: string } {
    if (!identifier || typeof identifier !== "string") {
      return { valid: false, error: "Identifier must be a non-empty string" };
    }

    // Check length
    if (identifier.length > 64) {
      return { valid: false, error: "Identifier too long (max 64 characters)" };
    }

    // MySQL identifier rules: alphanumeric, underscore, dollar sign
    // Must start with letter, underscore, or dollar sign
    const identifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
    if (!identifierRegex.test(identifier)) {
      return { valid: false, error: "Invalid identifier format" };
    }

    // Check against MySQL reserved words (basic list)
    const reservedWords = [
      "SELECT",
      "INSERT",
      "UPDATE",
      "DELETE",
      "FROM",
      "WHERE",
      "JOIN",
      "INNER",
      "LEFT",
      "RIGHT",
      "OUTER",
      "ON",
      "AS",
      "AND",
      "OR",
      "NOT",
      "NULL",
      "TRUE",
      "FALSE",
      "ORDER",
      "BY",
      "GROUP",
      "HAVING",
      "LIMIT",
      "OFFSET",
      "DISTINCT",
      "ALL",
      "EXISTS",
      "IN",
      "BETWEEN",
      "LIKE",
      "REGEXP",
      "CASE",
      "WHEN",
      "THEN",
      "ELSE",
      "END",
      "IF",
      "IFNULL",
    ];

    if (reservedWords.includes(identifier.toUpperCase())) {
      return { valid: false, error: "Identifier cannot be a reserved word" };
    }

    return { valid: true };
  }

  /**
   * Validate SQL query for security issues
   * @param query - The SQL query to validate
   * @param bypassDangerousCheck - If true, skips dangerous keyword check (for users with 'execute' permission)
   */
  validateQuery(
    query: string,
    bypassDangerousCheck: boolean = false,
  ): {
    valid: boolean;
    error?: string;
    queryType?: string;
  } {
    if (!query || typeof query !== "string") {
      return { valid: false, error: "Query must be a non-empty string" };
    }

    const trimmedQuery = query.trim().toUpperCase();

    // Check for empty query
    if (trimmedQuery.length === 0) {
      return { valid: false, error: "Query cannot be empty" };
    }

    // Check for multiple statements (basic check)
    if (query.includes(";") && !query.trim().endsWith(";")) {
      return { valid: false, error: "Multiple statements not allowed" };
    }

    // Remove trailing semicolon for analysis
    const cleanQuery = trimmedQuery.replace(/;$/, "");

    // Check if it's an information query (SHOW, DESCRIBE, EXPLAIN, etc.) - these are always allowed
    if (this.isInformationQuery(trimmedQuery)) {
      return { valid: true, queryType: "INFORMATION" };
    }

    // Determine query type - check basic operations first
    let queryType = "";
    for (const operation of this.allowedOperations) {
      if (cleanQuery.startsWith(operation)) {
        queryType = operation;
        break;
      }
    }

    // If not a basic operation, check if it's a DDL operation
    if (!queryType) {
      for (const ddlOp of this.ddlOperations) {
        if (cleanQuery.startsWith(ddlOp)) {
          // Check if DDL permission is enabled
          if (this.featureConfig.isCategoryEnabled(ToolCategory.DDL)) {
            queryType = ddlOp;
            break;
          } else {
            return {
              valid: false,
              error: `DDL operation '${ddlOp}' requires 'ddl' permission. Add 'ddl' to your permissions configuration.`,
            };
          }
        }
      }
    }

    if (!queryType) {
      return { valid: false, error: "Query type not allowed" };
    }

    // Check for dangerous keywords (blocked unless user has 'execute' permission)
    // When bypassDangerousCheck is true (user has 'execute' permission), skip this check
    if (!bypassDangerousCheck) {
      for (const keyword of this.dangerousKeywords) {
        // Use word boundary regex to avoid false positives (e.g., "USER" matching "USERS")
        const keywordRegex = new RegExp(`\\b${keyword}\\b`, "i");
        if (keywordRegex.test(cleanQuery)) {
          return {
            valid: false,
            error: `Dangerous keyword detected: ${keyword}. This requires 'execute' permission.`,
          };
        }
      }
    }

    // Additional checks for specific query types
    // Only enforce these restrictions when user doesn't have 'execute' permission
    if (queryType === "SELECT" && !bypassDangerousCheck) {
      // Check for UNION attacks
      if (cleanQuery.includes("UNION")) {
        return {
          valid: false,
          error: "UNION operations not allowed without 'execute' permission",
        };
      }

      // Check for subqueries in FROM clause (basic check)
      if (cleanQuery.includes("FROM (")) {
        return {
          valid: false,
          error:
            "Subqueries in FROM clause not allowed without 'execute' permission",
        };
      }
    }

    // Check for comment-based injection attempts
    if (
      cleanQuery.includes("/*") ||
      cleanQuery.includes("--") ||
      cleanQuery.includes("#")
    ) {
      return { valid: false, error: "Comments not allowed in queries" };
    }

    return { valid: true, queryType };
  }

  /**
   * Validate parameter values to prevent injection
   */
  validateParameters(params: any[]): {
    valid: boolean;
    error?: string;
    sanitizedParams?: any[];
  } {
    if (!params) {
      return { valid: true, sanitizedParams: [] };
    }

    if (!Array.isArray(params)) {
      return { valid: false, error: "Parameters must be an array" };
    }

    const sanitizedParams: any[] = [];

    for (let i = 0; i < params.length; i++) {
      const param = params[i];

      // Check for null/undefined
      if (param === null || param === undefined) {
        sanitizedParams.push(null);
        continue;
      }

      // Validate based on type
      if (typeof param === "string") {
        // Check string length
        if (param.length > 65535) {
          return {
            valid: false,
            error: `Parameter ${i} too long (max 65535 characters)`,
          };
        }

        // Don't modify strings - let MySQL handle escaping through prepared statements
        sanitizedParams.push(param);
      } else if (typeof param === "number") {
        // Validate number
        if (!Number.isFinite(param)) {
          return {
            valid: false,
            error: `Parameter ${i} must be a finite number`,
          };
        }
        sanitizedParams.push(param);
      } else if (typeof param === "boolean") {
        sanitizedParams.push(param);
      } else if (param instanceof Date) {
        sanitizedParams.push(param);
      } else {
        return {
          valid: false,
          error: `Parameter ${i} has unsupported type: ${typeof param}`,
        };
      }
    }

    return { valid: true, sanitizedParams };
  }

  /**
   * Check if a query is a read-only SELECT query or information query (SHOW, DESCRIBE, etc.)
   */
  isReadOnlyQuery(query: string): boolean {
    // Check if it's an information query first (SHOW, DESCRIBE, EXPLAIN, etc.)
    if (this.isInformationQuery(query)) {
      return true;
    }

    // Check if it's a SELECT query
    const validation = this.validateQuery(query);
    return validation.valid && validation.queryType === "SELECT";
  }

  /**
   * Check if a query contains dangerous operations
   */
  hasDangerousOperations(query: string): boolean {
    const validation = this.validateQuery(query);
    return !validation.valid;
  }

  /**
   * Check if execute permission is enabled
   */
  hasExecutePermission(): boolean {
    return this.featureConfig.isCategoryEnabled(ToolCategory.EXECUTE);
  }

  /**
   * Escape identifier for safe use in SQL queries
   */
  escapeIdentifier(identifier: string): string {
    const validation = this.validateIdentifier(identifier);
    if (!validation.valid) {
      throw new Error(`Invalid identifier: ${validation.error}`);
    }
    // Use backticks to escape MySQL identifiers
    return `\`${identifier}\``;
  }
}

export default SecurityLayer;
