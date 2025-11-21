export interface QueryLog {
  sql: string;
  params?: any[];
  duration: number;
  timestamp: string;
  status: 'success' | 'error';
  error?: string;
}

export class QueryLogger {
  private static logs: QueryLog[] = [];
  private static readonly MAX_LOGS = 100;
  private static readonly MAX_SQL_LENGTH = 500; // Truncate SQL beyond this
  private static readonly MAX_PARAM_LENGTH = 200; // Truncate params beyond this
  private static readonly MAX_PARAM_ITEMS = 5; // Only log first N params

  /**
   * Safely stringify a value with truncation and error handling
   */
  private static safeStringify(value: any, maxLength: number = 100): string {
    try {
      if (value === null) return 'null';
      if (value === undefined) return 'undefined';
      if (typeof value === 'string') {
        return value.length > maxLength ? value.substring(0, maxLength) + '...' : value;
      }
      if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
      if (typeof value === 'bigint') {
        return value.toString() + 'n';
      }
      if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        const items = value.slice(0, 3).map(v => this.safeStringify(v, 30));
        return value.length > 3 
          ? `[${items.join(', ')}, ... +${value.length - 3} more]`
          : `[${items.join(', ')}]`;
      }
      if (typeof value === 'object') {
        const str = JSON.stringify(value);
        return str.length > maxLength ? str.substring(0, maxLength) + '...}' : str;
      }
      return String(value);
    } catch (error) {
      return '[Unstringifiable]';
    }
  }

  /**
   * Truncate SQL string to prevent memory issues
   */
  private static truncateSQL(sql: string): string {
    if (sql.length <= this.MAX_SQL_LENGTH) return sql;
    return sql.substring(0, this.MAX_SQL_LENGTH) + `... [truncated ${sql.length - this.MAX_SQL_LENGTH} chars]`;
  }

  /**
   * Create a memory-safe copy of parameters
   */
  private static sanitizeParams(params: any[] | undefined): any[] | undefined {
    if (!params || params.length === 0) return undefined;
    
    // Only keep first N params to prevent memory issues
    const limitedParams = params.slice(0, this.MAX_PARAM_ITEMS);
    
    // Create deep copy to prevent reference issues
    try {
      return JSON.parse(JSON.stringify(limitedParams));
    } catch (error) {
      // If JSON serialization fails, create safe string representations
      return limitedParams.map(p => this.safeStringify(p, 50));
    }
  }

  /**
   * Log a query execution
   */
  static log(sql: string, params: any[] | undefined, duration: number, status: 'success' | 'error', error?: string): void {
    const log: QueryLog = {
      sql: this.truncateSQL(sql),
      params: this.sanitizeParams(params),
      duration,
      timestamp: new Date().toISOString(),
      status,
      error: error ? (error.length > 200 ? error.substring(0, 200) + '...' : error) : undefined
    };

    this.logs.push(log);

    // Keep only the last MAX_LOGS entries
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }
  }

  /**
   * Get all logged queries (returns shallow copy of array)
   */
  static getLogs(): QueryLog[] {
    return [...this.logs];
  }

  /**
   * Get the last N logged queries
   */
  static getLastLogs(count: number = 10): QueryLog[] {
    // Ensure count doesn't exceed array length to prevent issues
    const safeCount = Math.min(Math.max(1, count), this.logs.length);
    return this.logs.slice(-safeCount);
  }

  /**
   * Get logs for the current session (last query execution)
   */
  static getLastLog(): QueryLog | undefined {
    return this.logs[this.logs.length - 1];
  }

  /**
   * Clear all logs
   */
  static clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get logs as formatted string for output
   */
  static formatLogs(logs: QueryLog[]): string {
    if (logs.length === 0) return '';
    
    return logs.map((log, index) => {
      let paramStr = '';
      if (log.params && log.params.length > 0) {
        try {
          const paramsJson = JSON.stringify(log.params);
          paramStr = paramsJson.length > this.MAX_PARAM_LENGTH 
            ? ` | Params: ${paramsJson.substring(0, this.MAX_PARAM_LENGTH)}...`
            : ` | Params: ${paramsJson}`;
        } catch (error) {
          paramStr = ' | Params: [Error serializing]';
        }
      }
      const errorStr = log.error ? ` | Error: ${log.error}` : '';
      return `[${index + 1}] ${log.timestamp} | ${log.sql}${paramStr} | Duration: ${log.duration}ms | Status: ${log.status}${errorStr}`;
    }).join('\n');
  }
}
