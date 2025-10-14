import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const API_KEY = process.env.API_KEY;

export interface User {
  id: string;
  username: string;
  role: string;
}

export class AuthService {
  /**
   * Generate a JWT token for a user
   */
  generateToken(user: User): string {
    // Cast to any to bypass TypeScript's strict type checking for JWT
    return jwt.sign(user, JWT_SECRET as any, { expiresIn: JWT_EXPIRES_IN as any });
  }

  /**
   * Verify a JWT token
   */
  verifyToken(token: string): User {
    // Cast to any to bypass TypeScript's strict type checking for JWT
    return jwt.verify(token, JWT_SECRET as any) as User;
  }

  /**
   * Middleware to authenticate using JWT
   */
  authenticateJWT(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        error: {
          code: 'AUTH_TOKEN_MISSING',
          message: 'Authentication token is required',
          details: 'Please provide a valid JWT token in the Authorization header'
        }
      });
      return;
    }

    try {
      const user = this.verifyToken(token);
      (req as any).user = user;
      next();
    } catch (error) {
      res.status(403).json({
        error: {
          code: 'AUTH_TOKEN_INVALID',
          message: 'Invalid or expired token',
          details: 'Please provide a valid JWT token'
        }
      });
    }
  }

  /**
   * Middleware to authenticate using API key
   */
  authenticateApiKey(req: Request, res: Response, next: NextFunction): void {
    const providedApiKey = req.headers['x-api-key'];

    if (!API_KEY) {
      console.warn('API_KEY environment variable is not set');
      res.status(500).json({
        error: {
          code: 'SERVER_CONFIG_ERROR',
          message: 'Server configuration error',
          details: 'API key authentication is not properly configured'
        }
      });
      return;
    }

    if (!providedApiKey || providedApiKey !== API_KEY) {
      res.status(401).json({
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key',
          details: 'Please provide a valid API key in the X-API-Key header'
        }
      });
      return;
    }

    next();
  }

  /**
   * Login endpoint handler
   */
  login(req: Request, res: Response): void {
    const { username, password } = req.body;

    // In a real application, you would validate credentials against a database
    // This is a simplified example for demonstration purposes
    if (username === 'admin' && password === 'password') {
      const user: User = {
        id: '1',
        username: 'admin',
        role: 'admin'
      };

      const token = this.generateToken(user);
      res.json({ token });
    } else {
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password',
          details: 'Please check your credentials and try again'
        }
      });
    }
  }
}

export const authService = new AuthService();