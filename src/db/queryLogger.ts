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

  /**
   * Log a query execution
   */
  static log(sql: string, params: any[] | undefined, duration: number, status: 'success' | 'error', error?: string): void {
    const log: QueryLog = {
      sql,
      params,
      duration,
      timestamp: new Date().toISOString(),
      status,
      error
    };

    this.logs.push(log);

    // Keep only the last MAX_LOGS entries
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }
  }

  /**
   * Get all logged queries
   */
  static getLogs(): QueryLog[] {
    return [...this.logs];
  }

  /**
   * Get the last N logged queries
   */
  static getLastLogs(count: number = 10): QueryLog[] {
    return this.logs.slice(-count);
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
      const paramStr = log.params && log.params.length > 0 
        ? ` | Params: ${JSON.stringify(log.params)}`
        : '';
      const errorStr = log.error ? ` | Error: ${log.error}` : '';
      return `[${index + 1}] ${log.timestamp} | ${log.sql}${paramStr} | Duration: ${log.duration}ms | Status: ${log.status}${errorStr}`;
    }).join('\n');
  }
}
