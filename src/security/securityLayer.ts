import Ajv from 'ajv';

export class SecurityLayer {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv();
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
        errors: validate.errors
      };
    }
    
    return { valid: true };
  }

  /**
   * Sanitize SQL query parameters
   */
  sanitizeParams(params: any[]): any[] {
    if (!params) return [];
    
    return params.map(param => {
      // Handle different types of parameters
      if (typeof param === 'string') {
        // Remove any potentially dangerous SQL characters
        return param.replace(/[\\'";\-\-]/g, '');
      }
      return param;
    });
  }

  /**
   * Check if a query is a read-only SELECT query
   */
  isReadOnlyQuery(query: string): boolean {
    const trimmedQuery = query.trim().toUpperCase();
    return trimmedQuery.startsWith('SELECT') && 
           !trimmedQuery.includes('INSERT') && 
           !trimmedQuery.includes('UPDATE') && 
           !trimmedQuery.includes('DELETE') && 
           !trimmedQuery.includes('DROP') && 
           !trimmedQuery.includes('TRUNCATE') && 
           !trimmedQuery.includes('ALTER') && 
           !trimmedQuery.includes('CREATE');
  }

  /**
   * Check if a query contains dangerous operations
   */
  hasDangerousOperations(query: string): boolean {
    const trimmedQuery = query.trim().toUpperCase();
    return trimmedQuery.includes('DROP') || 
           trimmedQuery.includes('TRUNCATE') || 
           trimmedQuery.includes('ALTER') || 
           trimmedQuery.includes('CREATE');
  }
}

export default SecurityLayer;