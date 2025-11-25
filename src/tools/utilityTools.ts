import DatabaseConnection from "../db/connection";
import { dbConfig } from "../config/config";
import { validateGetTableRelationships } from "../validation/schemas";

export class UtilityTools {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  /**
   * Returns the current database connection info
   */
  async describeConnection(): Promise<{
    status: string;
    data?: any;
    error?: string;
  }> {
    try {
      // Return connection info without sensitive data
      const connectionInfo = {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        database: dbConfig.database,
        // Exclude password for security
      };

      return {
        status: "success",
        data: connectionInfo,
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message,
      };
    }
  }

  /**
   * Tests the DB connection and returns latency
   */
  async testConnection(): Promise<{
    status: string;
    data?: any;
    error?: string;
  }> {
    try {
      const result = await this.db.testConnection();

      if (!result.connected) {
        // Provide detailed diagnostics based on error code
        const errorCode = result.errorCode || "UNKNOWN";
        const errorMessage = result.error || "Unknown connection error";

        let diagnosticMessage = "❌ Database Connection Failed\n\n";
        diagnosticMessage += `Error: ${errorMessage}\n`;
        diagnosticMessage += `Error Code: ${errorCode}\n\n`;

        // Provide specific guidance based on error code
        if (
          errorCode === "ECONNREFUSED" ||
          errorCode === "ER_CONNECTION_REFUSED"
        ) {
          diagnosticMessage +=
            "🔍 Diagnosis: MySQL server is not accepting connections\n\n";
          diagnosticMessage += "✅ Troubleshooting Steps:\n";
          diagnosticMessage += "1. Check if MySQL server is running:\n";
          diagnosticMessage +=
            '   • Windows: Open Services and look for "MySQL" service\n';
          diagnosticMessage +=
            "   • Linux/Mac: Run `sudo systemctl status mysql` or `brew services list`\n";
          diagnosticMessage += "2. Start MySQL server if it's stopped:\n";
          diagnosticMessage +=
            "   • Windows: Start the MySQL service from Services panel\n";
          diagnosticMessage += "   • Linux: `sudo systemctl start mysql`\n";
          diagnosticMessage += "   • Mac: `brew services start mysql`\n";
          diagnosticMessage +=
            "3. Verify server is listening on the correct port (default: 3306)\n";
        } else if (errorCode === "ENOTFOUND" || errorCode === "EAI_AGAIN") {
          diagnosticMessage += "🔍 Diagnosis: Cannot resolve database host\n\n";
          diagnosticMessage += "✅ Troubleshooting Steps:\n";
          diagnosticMessage += "1. Check your DB_HOST configuration\n";
          diagnosticMessage += "2. Verify network connectivity\n";
          diagnosticMessage +=
            '3. If using "localhost", try "127.0.0.1" instead\n';
        } else if (errorCode === "ER_ACCESS_DENIED_ERROR") {
          diagnosticMessage += "🔍 Diagnosis: Authentication failed\n\n";
          diagnosticMessage += "✅ Troubleshooting Steps:\n";
          diagnosticMessage +=
            "1. Verify DB_USER and DB_PASSWORD in your configuration\n";
          diagnosticMessage += "2. Check MySQL user permissions\n";
          diagnosticMessage += "3. Ensure user has access from your host\n";
        } else if (errorCode === "ER_BAD_DB_ERROR") {
          diagnosticMessage += "🔍 Diagnosis: Database does not exist\n\n";
          diagnosticMessage += "✅ Troubleshooting Steps:\n";
          diagnosticMessage += "1. Verify DB_NAME in your configuration\n";
          diagnosticMessage += "2. Create the database if it doesn't exist\n";
          diagnosticMessage +=
            "3. Check database name spelling and case sensitivity\n";
        } else if (errorCode === "ETIMEDOUT" || errorCode === "ECONNABORTED") {
          diagnosticMessage += "🔍 Diagnosis: Connection timeout\n\n";
          diagnosticMessage += "✅ Troubleshooting Steps:\n";
          diagnosticMessage +=
            "1. Check if firewall is blocking MySQL port (3306)\n";
          diagnosticMessage +=
            "2. Verify MySQL is configured to accept remote connections\n";
          diagnosticMessage +=
            "3. Check network connectivity to database server\n";
        } else {
          diagnosticMessage += "✅ General Troubleshooting Steps:\n";
          diagnosticMessage += "1. Verify MySQL server is running\n";
          diagnosticMessage +=
            "2. Check connection settings in your .env file:\n";
          diagnosticMessage +=
            "   • DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME\n";
          diagnosticMessage += "3. Review MySQL server logs for details\n";
        }

        diagnosticMessage += "\n📋 Current Configuration:\n";
        diagnosticMessage += `   Host: ${(this.db as any).pool.pool.config.connectionConfig.host}\n`;
        diagnosticMessage += `   Port: ${(this.db as any).pool.pool.config.connectionConfig.port}\n`;
        diagnosticMessage += `   User: ${(this.db as any).pool.pool.config.connectionConfig.user}\n`;
        diagnosticMessage += `   Database: ${(this.db as any).pool.pool.config.connectionConfig.database}\n`;

        return {
          status: "error",
          error: diagnosticMessage,
          data: {
            connected: false,
            latency: -1,
            errorCode: errorCode,
            rawError: errorMessage,
          },
        };
      }

      return {
        status: "success",
        data: {
          connected: result.connected,
          latency: result.latency,
          message: `✅ Successfully connected to database in ${result.latency}ms`,
        },
      };
    } catch (error: any) {
      return {
        status: "error",
        error: `❌ Unexpected error while testing connection: ${error?.message || "Unknown error"}`,
      };
    }
  }

  /**
   * Detects and describes foreign key relationships between tables
   */
  async getTableRelationships(params: { table_name: string }): Promise<{
    status: string;
    data?: any;
    error?: string;
    queryLog?: string;
  }> {
    // Validate input
    if (!validateGetTableRelationships(params)) {
      return {
        status: "error",
        error:
          "Invalid parameters: " +
          JSON.stringify(validateGetTableRelationships.errors),
      };
    }

    try {
      const { table_name } = params;

      // Query to get foreign keys where this table is the parent
      const parentQuery = `
        SELECT
          TABLE_NAME as child_table,
          COLUMN_NAME as child_column,
          REFERENCED_TABLE_NAME as parent_table,
          REFERENCED_COLUMN_NAME as parent_column,
          CONSTRAINT_NAME as constraint_name
        FROM
          INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE
          REFERENCED_TABLE_NAME = ?
          AND REFERENCED_TABLE_SCHEMA = DATABASE()
      `;

      // Query to get foreign keys where this table is the child
      const childQuery = `
        SELECT
          TABLE_NAME as child_table,
          COLUMN_NAME as child_column,
          REFERENCED_TABLE_NAME as parent_table,
          REFERENCED_COLUMN_NAME as parent_column,
          CONSTRAINT_NAME as constraint_name
        FROM
          INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE
          TABLE_NAME = ?
          AND REFERENCED_TABLE_NAME IS NOT NULL
          AND TABLE_SCHEMA = DATABASE()
      `;

      // Execute both queries
      const parentRelationships = await this.db.query<any[]>(parentQuery, [
        table_name,
      ]);
      const childRelationships = await this.db.query<any[]>(childQuery, [
        table_name,
      ]);

      return {
        status: "success",
        data: {
          as_parent: parentRelationships,
          as_child: childRelationships,
        },
        queryLog: this.db.getFormattedQueryLogs(2),
      };
    } catch (error: any) {
      return {
        status: "error",
        error: error.message,
        queryLog: this.db.getFormattedQueryLogs(2),
      };
    }
  }
}
