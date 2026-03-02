import { SecurityLayer } from "../security/securityLayer";
export interface TransactionResult {
    status: "success" | "error";
    transactionId?: string;
    message?: string;
    activeTransactions?: string[];
    error?: string;
}
export declare class TransactionTools {
    private db;
    private security;
    constructor(security: SecurityLayer);
    /**
     * Begin a new transaction
     */
    beginTransaction(params?: {
        transactionId?: string;
    }): Promise<TransactionResult>;
    /**
     * Commit a transaction
     */
    commitTransaction(params: {
        transactionId: string;
    }): Promise<TransactionResult>;
    /**
     * Rollback a transaction
     */
    rollbackTransaction(params: {
        transactionId: string;
    }): Promise<TransactionResult>;
    /**
     * Get status of active transactions
     */
    getTransactionStatus(): Promise<TransactionResult>;
    /**
     * Execute a query within a transaction
     */
    executeInTransaction(params: {
        transactionId: string;
        query: string;
        params?: any[];
    }): Promise<{
        status: "success" | "error";
        data?: any;
        error?: string;
    }>;
}
