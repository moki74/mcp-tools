import DatabaseConnection from "../db/connection";
import SecurityLayer from "../security/securityLayer";
import { validateRunQuery } from "../validation/schemas";
import {
  QueryOptimizer,
  QueryHints,
  QueryAnalysis,
} from "../optimization/queryOptimizer";

export class QueryTools {
  private db: DatabaseConnection;
  private security: SecurityLayer;
  private optimizer: QueryOptimizer;

  constructor(security: SecurityLayer) {
    this.db = DatabaseConnection.getInstance();
    this.security = security;
    this.optimizer = QueryOptimizer.getInstance();
  }

  /**
   * Execute a safe read-only SELECT query with optional optimizer hints
   */
  async runQuery(queryParams: {
    query: string;
    params?: any[];
    hints?: QueryHints;
    useCache?: boolean;
  }): Promise<{
    status: string;
    data?: any[];
    error?: string;
    optimizedQuery?: string;
  }> {
    // Validate input schema
    if (!validateRunQuery(queryParams)) {
      return {
        status: "error",
        error: "Invalid parameters: " + JSON.stringify(validateRunQuery.errors),
      };
    }

    try {
      const { query, params = [], hints, useCache = true } = queryParams;

      // Check if user has execute permission to bypass dangerous keyword checks
      const hasExecutePermission = this.security.hasExecutePermission();

      // Validate query using security layer
      // If user has execute permission, allow advanced SQL features
      const queryValidation = this.security.validateQuery(
        query,
        hasExecutePermission,
      );
      if (!queryValidation.valid) {
        return {
          status: "error",
          error: `Query validation failed: ${queryValidation.error}`,
        };
      }

      // Ensure it's a SELECT query
      if (queryValidation.queryType !== "SELECT") {
        return {
          status: "error",
          error:
            "Only SELECT queries are allowed with runQuery. Use executeSql for other operations.",
        };
      }

      // Validate parameters
      const paramValidation = this.security.validateParameters(params);
      if (!paramValidation.valid) {
        return {
          status: "error",
          error: `Parameter validation failed: ${paramValidation.error}`,
        };
      }

      // Apply optimizer hints if provided
      let finalQuery = query;
      let optimizedQuery: string | undefined;
      if (hints) {
        finalQuery = this.optimizer.applyHints(query, hints);
        if (finalQuery !== query) {
          optimizedQuery = finalQuery;
        }
      }

      // Execute the query with sanitized parameters
      const results = await this.db.query<any[]>(
        finalQuery,
        paramValidation.sanitizedParams!,
        useCache,
      );

      return {
        status: "success",
        data: results,
        optimizedQuery,
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message,
      };
    }
  }

  /**
   * Analyze a query and get optimization suggestions
   */
  analyzeQuery(query: string): QueryAnalysis {
    return this.optimizer.analyzeQuery(query);
  }

  /**
   * Get suggested hints for a specific optimization goal
   */
  getSuggestedHints(goal: "SPEED" | "MEMORY" | "STABILITY"): QueryHints {
    return this.optimizer.getSuggestedHints(goal);
  }

  /**
   * Execute write operations (INSERT, UPDATE, DELETE) with validation
   * Note: DDL operations are blocked by the security layer for safety
   */
  async executeSql(queryParams: { query: string; params?: any[] }): Promise<{
    status: string;
    data?: any;
    error?: string;
  }> {
    // Validate input schema
    if (!validateRunQuery(queryParams)) {
      return {
        status: "error",
        error: "Invalid parameters: " + JSON.stringify(validateRunQuery.errors),
      };
    }

    try {
      const { query, params = [] } = queryParams;

      // Validate query using security layer
      // Pass true for bypassDangerousCheck since this is executeSql (requires 'execute' permission)
      const queryValidation = this.security.validateQuery(query, true);
      if (!queryValidation.valid) {
        return {
          status: "error",
          error: `Query validation failed: ${queryValidation.error}`,
        };
      }

      // Ensure it's not a SELECT query (use runQuery for that)
      if (queryValidation.queryType === "SELECT") {
        return {
          status: "error",
          error:
            "SELECT queries should use runQuery method instead of executeSql.",
        };
      }

      // Validate parameters
      const paramValidation = this.security.validateParameters(params);
      if (!paramValidation.valid) {
        return {
          status: "error",
          error: `Parameter validation failed: ${paramValidation.error}`,
        };
      }

      // Execute the query with sanitized parameters
      const result = await this.db.query<any>(
        query,
        paramValidation.sanitizedParams!,
      );

      return {
        status: "success",
        data: {
          affectedRows: result.affectedRows || 0,
          insertId: result.insertId || null,
        },
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message,
      };
    }
  }
}
