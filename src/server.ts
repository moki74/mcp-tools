import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { dbConfig } from './config/config';
import { MySQLMCP } from './index';
import { createLogger, format, transports } from 'winston';
import {
  validateCreateRecord,
  validateReadRecords,
  validateUpdateRecord,
  validateDeleteRecord,
  validateQuery,
  validateBulkInsert,
  sanitizeTableName,
  sanitizeFieldName,
  sanitizeQuery,
  INPUT_LIMITS
} from './validation/inputValidation';

// Initialize the MCP instance
const mcp = new MySQLMCP();

// Create Winston logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(morgan('combined')); // HTTP request logging

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(apiLimiter);

// No authentication middleware needed for MCP server

// Input validation middleware
const validateInput = (validator: (data: any) => { valid: boolean; errors?: string[] }) => {
  return (req: Request, res: Response, next: NextFunction) => {
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
const sanitizeParams = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize route parameters
  if (req.params.tableName) {
    req.params.tableName = sanitizeTableName(req.params.tableName);
  }
  if (req.params.id) {
    req.params.id = sanitizeFieldName(req.params.id);
  }
  
  // Sanitize query parameters
  if (req.query.id_field) {
    req.query.id_field = sanitizeFieldName(req.query.id_field as string);
  }
  if (req.query.sort_by) {
    req.query.sort_by = sanitizeFieldName(req.query.sort_by as string);
  }
  
  // Sanitize request body
  if (req.body.query) {
    req.body.query = sanitizeQuery(req.body.query);
  }
  
  next();
};

// Request size limiting middleware
const requestSizeLimit = (maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
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
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
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
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Feature configuration status endpoint
app.get('/features', (req: Request, res: Response) => {
  try {
    const featureStatus = mcp.getFeatureStatus();
    res.status(200).json(featureStatus);
  } catch (error) {
    logger.error('Error getting feature status', { error });
    res.status(500).json({ 
      status: 'error', 
      error: 'Failed to retrieve feature configuration status' 
    });
  }
});

// API routes - no authentication required for MCP server
const apiRouter = express.Router();
app.use('/api', sanitizeParams, apiRouter);

// Database Tools Routes
apiRouter.get('/databases', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await mcp.listDatabases();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

apiRouter.get('/tables', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await mcp.listTables({ database: undefined });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

apiRouter.get('/tables/:tableName/schema', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tableName } = req.params;
    const result = await mcp.readTableSchema({ table_name: tableName });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// CRUD Operations Routes
apiRouter.post(
  '/tables/:tableName/records',
  requestSizeLimit(INPUT_LIMITS.MAX_QUERY_LENGTH),
  validateInput((req) => validateCreateRecord({ table_name: req.params.tableName, data: req.body.data })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tableName } = req.params;
      const { data } = req.body;
      
      const result = await mcp.createRecord({
        table_name: tableName,
        data
      });
      
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

apiRouter.get('/tables/:tableName/records', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tableName } = req.params;
    const { filters, limit, offset, sort_by, sort_direction } = req.query;
    
    // Validate and parse filters
    let parsedFilters;
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters as string);
      } catch (e) {
        return res.status(400).json({
          error: {
            code: 'INVALID_FILTERS',
            message: 'Invalid JSON in filters parameter'
          }
        });
      }
    }
    
    // Validate the complete request
    const validation = validateReadRecords({
      table_name: tableName,
      filters: parsedFilters,
      pagination: {
        page: offset ? Math.floor(parseInt(offset as string) / (limit ? parseInt(limit as string) : 10)) + 1 : 1,
        limit: limit ? parseInt(limit as string) : 10
      },
      sorting: sort_by ? {
        field: sort_by as string,
        direction: (sort_direction as string)?.toLowerCase() === 'desc' ? 'desc' : 'asc'
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
        page: offset ? Math.floor(parseInt(offset as string) / (limit ? parseInt(limit as string) : 10)) + 1 : 1,
        limit: limit ? parseInt(limit as string) : 10
      },
      sorting: sort_by ? {
        field: sort_by as string,
        direction: (sort_direction as string)?.toLowerCase() === 'desc' ? 'desc' : 'asc'
      } : undefined
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

apiRouter.put(
  '/tables/:tableName/records/:id',
  requestSizeLimit(INPUT_LIMITS.MAX_QUERY_LENGTH),
  validateInput((req) => validateUpdateRecord({
    table_name: req.params.tableName,
    data: req.body.data,
    conditions: [{ field: req.body.id_field || 'id', operator: '=', value: req.params.id }]
  })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tableName, id } = req.params;
      const { data, id_field } = req.body;
      
      const result = await mcp.updateRecord({
        table_name: tableName,
        data,
        conditions: [{ field: id_field || 'id', operator: '=', value: id }]
      });
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

apiRouter.delete(
  '/tables/:tableName/records/:id',
  validateInput((req) => validateDeleteRecord({
    table_name: req.params.tableName,
    conditions: [{ field: (req.query.id_field as string) || 'id', operator: '=', value: req.params.id }]
  })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tableName, id } = req.params;
      const { id_field } = req.query;
      
      const result = await mcp.deleteRecord({
        table_name: tableName,
        conditions: [{ field: id_field as string || 'id', operator: '=', value: id }]
      });
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Query Tools Routes
apiRouter.post(
  '/query',
  requestSizeLimit(INPUT_LIMITS.MAX_QUERY_LENGTH),
  validateInput(validateQuery),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query, params } = req.body;
      
      const result = await mcp.runQuery({
        query,
        params: params || []
      });
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

apiRouter.post(
  '/execute',
  requestSizeLimit(INPUT_LIMITS.MAX_QUERY_LENGTH),
  validateInput(validateQuery),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query, params } = req.body;
      
      const result = await mcp.executeSql({
        query,
        params: params || []
      });
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Utility Tools Routes
apiRouter.get('/connection', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await mcp.describeConnection();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

apiRouter.get('/connection/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await mcp.testConnection();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

apiRouter.get('/tables/:tableName/relationships', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tableName } = req.params;
    const result = await mcp.getTableRelationships({ table_name: tableName });
    res.json(result);
  } catch (error) {
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

export default app;