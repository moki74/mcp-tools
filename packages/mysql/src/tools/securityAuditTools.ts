import DatabaseConnection from "../db/connection";
import { dbConfig } from "../config/config";

type Severity = "info" | "low" | "medium" | "high" | "critical";

export class SecurityAuditTools {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

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
      return { valid: true, database: connectedDatabase };
    }

    if (requestedDatabase !== connectedDatabase) {
      return {
        valid: false,
        database: "",
        error: `Access denied. You can only access the connected database '${connectedDatabase}'. Requested database '${requestedDatabase}' is not allowed.`,
      };
    }

    return { valid: true, database: connectedDatabase };
  }

  async auditDatabaseSecurity(params?: {
    database?: string;
    include_user_account_checks?: boolean;
    include_privilege_checks?: boolean;
  }): Promise<{
    status: string;
    data?: {
      database: string;
      findings: Array<{
        severity: Severity;
        title: string;
        evidence?: string;
        recommendation: string;
      }>;
      summary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        info: number;
      };
      notes: string[];
    };
    error?: string;
  }> {
    try {
      const dbValidation = this.validateDatabaseAccess(params?.database);
      if (!dbValidation.valid) {
        return { status: "error", error: dbValidation.error! };
      }

      const includeUsers = params?.include_user_account_checks ?? true;
      const includePrivileges = params?.include_privilege_checks ?? true;

      const findings: Array<{
        severity: Severity;
        title: string;
        evidence?: string;
        recommendation: string;
      }> = [];

      const notes: string[] = [
        "This audit is best-effort and depends on the MySQL account's privileges.",
        "The tool only runs hardcoded read-only inspection queries.",
      ];

      // ===== Server variables / configuration checks (generally accessible) =====
      const vars = await this.readVariables([
        "require_secure_transport",
        "have_ssl",
        "tls_version",
        "validate_password.policy",
        "validate_password.length",
        "default_password_lifetime",
        "local_infile",
        "secure_file_priv",
        "skip_name_resolve",
        "bind_address",
        "log_error_verbosity",
        "slow_query_log",
      ]);

      const requireSecureTransport = this.asOnOff(vars["require_secure_transport"]);
      const haveSsl = (vars["have_ssl"] || "").toString().toUpperCase();

      if (requireSecureTransport === "OFF") {
        findings.push({
          severity: "high",
          title: "TLS not enforced (require_secure_transport=OFF)",
          evidence: `require_secure_transport=${vars["require_secure_transport"] ?? "<unknown>"}`,
          recommendation:
            "Set require_secure_transport=ON and require clients to connect over TLS.",
        });
      } else if (requireSecureTransport === "ON") {
        findings.push({
          severity: "info",
          title: "TLS enforced (require_secure_transport=ON)",
          evidence: `require_secure_transport=${vars["require_secure_transport"]}`,
          recommendation: "Keep TLS enforcement enabled.",
        });
      }

      if (haveSsl && haveSsl !== "YES") {
        findings.push({
          severity: "high",
          title: "Server SSL support not available (have_ssl != YES)",
          evidence: `have_ssl=${vars["have_ssl"]}`,
          recommendation:
            "Enable SSL/TLS support on the server (configure certificates) and verify client TLS connections.",
        });
      }

      const localInfile = this.asOnOff(vars["local_infile"]);
      if (localInfile === "ON") {
        findings.push({
          severity: "medium",
          title: "LOCAL INFILE is enabled (local_infile=ON)",
          evidence: `local_infile=${vars["local_infile"]}`,
          recommendation:
            "Disable local_infile unless required, as it can expand attack surface for data exfiltration.",
        });
      }

      const secureFilePriv = (vars["secure_file_priv"] ?? "").toString();
      if (secureFilePriv === "") {
        findings.push({
          severity: "medium",
          title: "secure_file_priv is empty (no restriction)",
          evidence: "secure_file_priv=<empty>",
          recommendation:
            "Set secure_file_priv to a dedicated directory (or NULL) to restrict file import/export paths.",
        });
      }

      const passwordLifetime = this.asInt(vars["default_password_lifetime"]);
      if (passwordLifetime === 0) {
        findings.push({
          severity: "low",
          title: "Password expiration disabled (default_password_lifetime=0)",
          evidence: `default_password_lifetime=${vars["default_password_lifetime"]}`,
          recommendation:
            "Consider setting a password expiration policy aligned with your org's security requirements.",
        });
      }

      const vPolicy = vars["validate_password.policy"];
      const vLen = this.asInt(vars["validate_password.length"]);
      if (vPolicy === undefined && vLen === undefined) {
        findings.push({
          severity: "low",
          title: "Password validation plugin settings not detected",
          evidence: "validate_password.* variables not present",
          recommendation:
            "Consider enabling validate_password component/plugin (MySQL version dependent) for stronger password policies.",
        });
      } else {
        if (vLen !== undefined && vLen < 12) {
          findings.push({
            severity: "medium",
            title: "Password minimum length may be weak",
            evidence: `validate_password.length=${vars["validate_password.length"]}`,
            recommendation: "Increase password length (e.g. 12+).",
          });
        }
      }

      // ===== User/account checks (requires mysql.user privileges) =====
      if (includeUsers) {
        const userCheck = await this.tryReadUserAccounts();
        if (userCheck.status === "skipped") {
          notes.push(userCheck.note);
        } else if (userCheck.status === "ok") {
          findings.push(...userCheck.findings);
        }
      }

      // ===== Privilege checks (information_schema schema/table privileges) =====
      if (includePrivileges) {
        const privCheck = await this.tryReadPrivilegeSummaries();
        if (privCheck.status === "skipped") {
          notes.push(privCheck.note);
        } else if (privCheck.status === "ok") {
          findings.push(...privCheck.findings);
        }
      }

      const summary = this.summarizeFindings(findings);
      return {
        status: "success",
        data: {
          database: dbValidation.database,
          findings: findings.sort((a, b) => this.severityRank(b.severity) - this.severityRank(a.severity)),
          summary,
          notes,
        },
      };
    } catch (error: any) {
      return { status: "error", error: error.message };
    }
  }

  private severityRank(s: Severity): number {
    switch (s) {
      case "critical":
        return 5;
      case "high":
        return 4;
      case "medium":
        return 3;
      case "low":
        return 2;
      case "info":
      default:
        return 1;
    }
  }

  private summarizeFindings(findings: Array<{ severity: Severity }>) {
    const summary = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const f of findings) {
      summary[f.severity]++;
    }
    return summary;
  }

  private asOnOff(value: any): "ON" | "OFF" | "UNKNOWN" {
    if (value === undefined || value === null) return "UNKNOWN";
    const v = value.toString().trim().toUpperCase();
    if (v === "ON" || v === "1" || v === "YES") return "ON";
    if (v === "OFF" || v === "0" || v === "NO") return "OFF";
    return "UNKNOWN";
  }

  private asInt(value: any): number | undefined {
    if (value === undefined || value === null) return undefined;
    const n = parseInt(value.toString(), 10);
    return Number.isFinite(n) ? n : undefined;
  }

  private async readVariables(keys: string[]): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    const query = "SHOW VARIABLES WHERE Variable_name IN (" + keys.map(() => "?").join(",") + ")";
    const rows = await this.db.query<any[]>(query, keys);
    for (const row of rows) {
      results[row.Variable_name] = row.Value;
    }
    return results;
  }

  private async tryReadUserAccounts(): Promise<
    | { status: "ok"; findings: Array<any> }
    | { status: "skipped"; note: string }
  > {
    try {
      // We intentionally do NOT return authentication_string or password hashes.
      const rows = await this.db.query<any[]>(
        `
        SELECT
          User as user,
          Host as host,
          account_locked,
          password_expired,
          plugin
        FROM mysql.user
        WHERE User NOT IN ('mysql.sys', 'mysql.session', 'mysql.infoschema')
      `,
      );

      const findings: any[] = [];
      const anonymous = rows.filter((r) => !r.user);
      if (anonymous.length > 0) {
        findings.push({
          severity: "critical",
          title: "Anonymous MySQL user accounts detected",
          evidence: `Found ${anonymous.length} anonymous account(s) in mysql.user`,
          recommendation: "Remove anonymous users or lock them; restrict Host to localhost if required.",
        });
      }

      const rootRemote = rows.filter(
        (r) => (r.user || "").toLowerCase() === "root" && (r.host || "") !== "localhost",
      );
      if (rootRemote.length > 0) {
        findings.push({
          severity: "high",
          title: "Remote root accounts detected",
          evidence: `root accounts with non-localhost Host found: ${rootRemote
            .slice(0, 5)
            .map((r) => `${r.user}@${r.host}`)
            .join(", ")}${rootRemote.length > 5 ? ", ..." : ""}`,
          recommendation:
            "Restrict root access to localhost or a tightly controlled admin network; use named admin accounts instead.",
        });
      }

      const wildcardHosts = rows.filter((r) => (r.host || "") === "%");
      if (wildcardHosts.length > 0) {
        findings.push({
          severity: "medium",
          title: "User accounts with wildcard host (%) detected",
          evidence: `Accounts with Host='%': ${wildcardHosts
            .slice(0, 8)
            .map((r) => `${r.user}@${r.host}`)
            .join(", ")}${wildcardHosts.length > 8 ? ", ..." : ""}`,
          recommendation:
            "Prefer explicit Host values (specific IPs/subnets) instead of '%' where possible.",
        });
      }

      const unlocked = rows.filter((r) => ("" + r.account_locked).toUpperCase() === "N");
      if (unlocked.length > 0) {
        findings.push({
          severity: "info",
          title: "Unlocked user accounts present",
          evidence: `Unlocked accounts count: ${unlocked.length}`,
          recommendation:
            "Ensure unused accounts are locked or removed, and use strong authentication plugins.",
        });
      }

      return { status: "ok", findings };
    } catch (e: any) {
      return {
        status: "skipped",
        note: `User/account checks skipped: insufficient privileges to read mysql.user (${e.message}).`,
      };
    }
  }

  private async tryReadPrivilegeSummaries(): Promise<
    | { status: "ok"; findings: Array<any> }
    | { status: "skipped"; note: string }
  > {
    try {
      // These INFORMATION_SCHEMA views are generally less sensitive than mysql.user.
      const schemaPriv = await this.db.query<any[]>(
        `
        SELECT GRANTEE as grantee, TABLE_SCHEMA as schema_name, PRIVILEGE_TYPE as privilege_type
        FROM INFORMATION_SCHEMA.SCHEMA_PRIVILEGES
        WHERE TABLE_SCHEMA NOT IN ('mysql','performance_schema','information_schema','sys')
      `,
      );

      const findings: any[] = [];
      const anyAll = schemaPriv.filter(
        (r) => (r.privilege_type || "").toUpperCase() === "ALL PRIVILEGES",
      );
      if (anyAll.length > 0) {
        findings.push({
          severity: "medium",
          title: "Broad schema privileges detected (ALL PRIVILEGES)",
          evidence: `Found ${anyAll.length} schema privilege rows with ALL PRIVILEGES`,
          recommendation:
            "Review and apply least privilege for schema-level grants; prefer role-based access.",
        });
      }

      const grantOption = schemaPriv.filter(
        (r) => (r.privilege_type || "").toUpperCase() === "GRANT OPTION",
      );
      if (grantOption.length > 0) {
        findings.push({
          severity: "high",
          title: "GRANT OPTION detected in schema privileges",
          evidence: `Found ${grantOption.length} schema privilege rows with GRANT OPTION`,
          recommendation:
            "Minimize GRANT OPTION; it can allow privilege escalation if misassigned.",
        });
      }

      return { status: "ok", findings };
    } catch (e: any) {
      return {
        status: "skipped",
        note: `Privilege checks skipped: unable to read INFORMATION_SCHEMA privilege views (${e.message}).`,
      };
    }
  }
}
