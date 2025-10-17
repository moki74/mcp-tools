import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { dbConfig } from './config/config';
import { MySQLMCP } from './index';
import { createLogger, format, transports } from 'winston';

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
app.use('/api', apiRouter);

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
apiRouter.post('/tables/:tableName/records', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tableName } = req.params;
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Missing data field in request body',
          details: 'The request body must contain a data object with the record fields'
        }
      });
    }
    
    const result = await mcp.createRecord({
      table_name: tableName,
      data
    });
    
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

apiRouter.get('/tables/:tableName/records', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tableName } = req.params;
    const { filters, limit, offset, sort_by, sort_direction } = req.query;
    
    const result = await mcp.readRecords({
      table_name: tableName,
      filters: filters ? JSON.parse(filters as string) : undefined,
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

apiRouter.put('/tables/:tableName/records/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tableName, id } = req.params;
    const { data, id_field } = req.body;
    
    if (!data) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Missing data field in request body',
          details: 'The request body must contain a data object with the fields to update'
        }
      });
    }
    
    const result = await mcp.updateRecord({
      table_name: tableName,
      data,
      conditions: [{ field: id_field || 'id', operator: '=', value: id }]
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

apiRouter.delete('/tables/:tableName/records/:id', async (req: Request, res: Response, next: NextFunction) => {
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
});

// Query Tools Routes
apiRouter.post('/query', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, params } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Missing query field in request body',
          details: 'The request body must contain a query string'
        }
      });
    }
    
    const result = await mcp.runQuery({
      query,
      params: params || []
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, params } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Missing query field in request body',
          details: 'The request body must contain a query string'
        }
      });
    }
    
    const result = await mcp.executeSql({
      query,
      params: params || []
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

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