"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const index_1 = require("./index");
const winston_1 = require("winston");
const inputValidation_1 = require("./validation/inputValidation");
// Initialize the MCP instance
const mcp = new index_1.MySQLMCP();
// Create Winston logger
const logger = (0, winston_1.createLogger)({
    level: 'info',
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
    transports: [
        new winston_1.transports.Console(),
        new winston_1.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston_1.transports.File({ filename: 'logs/combined.log' })
    ]
});
// Initialize Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, helmet_1.default)()); // Security headers
app.use((0, cors_1.default)()); // Enable CORS
app.use(express_1.default.json()); // Parse JSON bodies
app.use((0, morgan_1.default)('combined')); // HTTP request logging
// Rate limiting
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(apiLimiter);
// No authentication middleware needed for MCP server
// Input validation middleware
const validateInput = (validator) => {
    return (req, res, next) => {
        const validation = validator(req.body);
        if (!validation.valid) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Input validation failed',
                    details: validation.errors
                }
            });
        }
        next();
    };
};
// Parameter sanitization middleware
const sanitizeParams = (req, res, next) => {
    // Sanitize route parameters
    if (req.params.tableName) {
        req.params.tableName = (0, inputValidation_1.sanitizeTableName)(req.params.tableName);
    }
    if (req.params.id) {
        req.params.id = (0, inputValidation_1.sanitizeFieldName)(req.params.id);
    }
    // Sanitize query parameters
    if (req.query.id_field) {
        req.query.id_field = (0, inputValidation_1.sanitizeFieldName)(req.query.id_field);
    }
    if (req.query.sort_by) {
        req.query.sort_by = (0, inputValidation_1.sanitizeFieldName)(req.query.sort_by);
    }
    // Sanitize request body
    if (req.body.query) {
        req.body.query = (0, inputValidation_1.sanitizeQuery)(req.body.query);
    }
    next();
};
// Request size limiting middleware
const requestSizeLimit = (maxSize) => {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length'] || '0');
        if (contentLength > maxSize) {
            return res.status(413).json({
                error: {
                    code: 'REQUEST_TOO_LARGE',
                    message: `Request body too large. Maximum size is ${maxSize} bytes`
                }
            });
        }
        next();
    };
};
// Error handling middleware
const errorHandler = (err, req, res, next) => {
    logger.error(`${err.name}: ${err.message}`, {
        path: req.path,
        method: req.method,
        body: req.body,
        stack: err.stack
    });
    res.status(500).json({
        error: {
            code: 'SERVER_ERROR',
            message: 'An unexpected error occurred',
            details: process.env.NODE_ENV === 'production' ? 'See server logs for details' : err.message
        }
    });
};
// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Feature configuration status endpoint
app.get('/features', (req, res) => {
    try {
        const featureStatus = mcp.getFeatureStatus();
        res.status(200).json(featureStatus);
    }
    catch (error) {
        logger.error('Error getting feature status', { error });
        res.status(500).json({
            status: 'error',
            error: 'Failed to retrieve feature configuration status'
        });
    }
});
// API routes - no authentication required for MCP server
const apiRouter = express_1.default.Router();
app.use('/api', sanitizeParams, apiRouter);
// Database Tools Routes
apiRouter.get('/databases', async (req, res, next) => {
    try {
        const result = await mcp.listDatabases();
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
apiRouter.get('/tables', async (req, res, next) => {
    try {
        const result = await mcp.listTables({ database: undefined });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
apiRouter.get('/tables/:tableName/schema', async (req, res, next) => {
    try {
        const { tableName } = req.params;
        const result = await mcp.readTableSchema({ table_name: tableName });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
// CRUD Operations Routes
apiRouter.post('/tables/:tableName/records', requestSizeLimit(inputValidation_1.INPUT_LIMITS.MAX_QUERY_LENGTH), validateInput((req) => (0, inputValidation_1.validateCreateRecord)({ table_name: req.params.tableName, data: req.body.data })), async (req, res, next) => {
    try {
        const { tableName } = req.params;
        const { data } = req.body;
        const result = await mcp.createRecord({
            table_name: tableName,
            data
        });
        res.status(201).json(result);
    }
    catch (error) {
        next(error);
    }
});
apiRouter.get('/tables/:tableName/records', async (req, res, next) => {
    try {
        const { tableName } = req.params;
        const { filters, limit, offset, sort_by, sort_direction } = req.query;
        // Validate and parse filters
        let parsedFilters;
        if (filters) {
            try {
                parsedFilters = JSON.parse(filters);
            }
            catch (e) {
                return res.status(400).json({
                    error: {
                        code: 'INVALID_FILTERS',
                        message: 'Invalid JSON in filters parameter'
                    }
                });
            }
        }
        // Validate the complete request
        const validation = (0, inputValidation_1.validateReadRecords)({
            table_name: tableName,
            filters: parsedFilters,
            pagination: {
                page: offset ? Math.floor(parseInt(offset) / (limit ? parseInt(limit) : 10)) + 1 : 1,
                limit: limit ? parseInt(limit) : 10
            },
            sorting: sort_by ? {
                field: sort_by,
                direction: sort_direction?.toLowerCase() === 'desc' ? 'desc' : 'asc'
            } : undefined
        });
        if (!validation.valid) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Input validation failed',
                    details: validation.errors
                }
            });
        }
        const result = await mcp.readRecords({
            table_name: tableName,
            filters: parsedFilters,
            pagination: {
                page: offset ? Math.floor(parseInt(offset) / (limit ? parseInt(limit) : 10)) + 1 : 1,
                limit: limit ? parseInt(limit) : 10
            },
            sorting: sort_by ? {
                field: sort_by,
                direction: sort_direction?.toLowerCase() === 'desc' ? 'desc' : 'asc'
            } : undefined
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
apiRouter.put('/tables/:tableName/records/:id', requestSizeLimit(inputValidation_1.INPUT_LIMITS.MAX_QUERY_LENGTH), validateInput((req) => (0, inputValidation_1.validateUpdateRecord)({
    table_name: req.params.tableName,
    data: req.body.data,
    conditions: [{ field: req.body.id_field || 'id', operator: '=', value: req.params.id }]
})), async (req, res, next) => {
    try {
        const { tableName, id } = req.params;
        const { data, id_field } = req.body;
        const result = await mcp.updateRecord({
            table_name: tableName,
            data,
            conditions: [{ field: id_field || 'id', operator: '=', value: id }]
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
apiRouter.delete('/tables/:tableName/records/:id', validateInput((req) => (0, inputValidation_1.validateDeleteRecord)({
    table_name: req.params.tableName,
    conditions: [{ field: req.query.id_field || 'id', operator: '=', value: req.params.id }]
})), async (req, res, next) => {
    try {
        const { tableName, id } = req.params;
        const { id_field } = req.query;
        const result = await mcp.deleteRecord({
            table_name: tableName,
            conditions: [{ field: id_field || 'id', operator: '=', value: id }]
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
// Query Tools Routes
apiRouter.post('/query', requestSizeLimit(inputValidation_1.INPUT_LIMITS.MAX_QUERY_LENGTH), validateInput(inputValidation_1.validateQuery), async (req, res, next) => {
    try {
        const { query, params } = req.body;
        const result = await mcp.runSelectQuery({
            query,
            params: params || []
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
apiRouter.post('/execute', requestSizeLimit(inputValidation_1.INPUT_LIMITS.MAX_QUERY_LENGTH), validateInput(inputValidation_1.validateQuery), async (req, res, next) => {
    try {
        const { query, params } = req.body;
        const result = await mcp.executeWriteQuery({
            query,
            params: params || []
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
// Utility Tools Routes
apiRouter.get('/connection', async (req, res, next) => {
    try {
        const result = await mcp.describeConnection();
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
apiRouter.get('/connection/test', async (req, res, next) => {
    try {
        const result = await mcp.testConnection();
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
apiRouter.get('/tables/:tableName/relationships', async (req, res, next) => {
    try {
        const { tableName } = req.params;
        const result = await mcp.getTableRelationships({ table_name: tableName });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
// Apply error handler
app.use(errorHandler);
// Start the server
const server = app.listen(PORT, () => {
    logger.info(`MCP MySQL Server running on port ${PORT}`);
    console.log(`MCP MySQL Server running on port ${PORT}`);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(async () => {
        logger.info('HTTP server closed');
        await mcp.close();
        logger.info('Database connections closed');
        process.exit(0);
    });
});
exports.default = app;
