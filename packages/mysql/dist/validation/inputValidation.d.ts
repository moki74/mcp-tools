export declare function validateCreateRecord(data: any): {
    valid: boolean;
    errors?: string[];
};
export declare function validateReadRecords(data: any): {
    valid: boolean;
    errors?: string[];
};
export declare function validateUpdateRecord(data: any): {
    valid: boolean;
    errors?: string[];
};
export declare function validateDeleteRecord(data: any): {
    valid: boolean;
    errors?: string[];
};
export declare function validateQuery(data: any): {
    valid: boolean;
    errors?: string[];
};
export declare function validateBulkInsert(data: any): {
    valid: boolean;
    errors?: string[];
};
export declare function sanitizeTableName(tableName: string): string;
export declare function sanitizeFieldName(fieldName: string): string;
export declare function sanitizeQuery(query: string): string;
export declare function validateTableName(tableName: string): {
    valid: boolean;
    error?: string;
};
export declare function validateFieldName(fieldName: string): {
    valid: boolean;
    error?: string;
};
export declare function validateValue(value: any): {
    valid: boolean;
    error?: string;
};
export declare const INPUT_LIMITS: {
    MAX_QUERY_LENGTH: number;
    MAX_BATCH_SIZE: number;
    MAX_FILTERS: number;
    MAX_PARAMETERS: number;
    MAX_STRING_LENGTH: number;
    MAX_TABLE_NAME_LENGTH: number;
    MAX_FIELD_NAME_LENGTH: number;
};
export declare function validateImportFromJSON(data: any): {
    valid: boolean;
    errors?: string[];
};
