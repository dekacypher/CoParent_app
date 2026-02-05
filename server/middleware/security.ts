import { Request, Response, NextFunction } from 'express';

// Content Security Policy configuration
export const contentSecurityPolicy = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Define CSP headers
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com https://picsum.photos",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://accounts.google.com https://oauth2.googleapis.com",
    "frame-src 'self' https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
    "block-all-mixed-content",
  ].join('; ');

  res.setHeader('Content-Security-Policy', cspHeader);
  next();
};

// HTTP Security Headers
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (formerly Feature-Policy)
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(self), microphone=(), camera=(), payment=()'
  );

  // HSTS (HTTP Strict Transport Security) - only in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

// Rate limiting store (in-memory for development)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

export const rateLimiter = (options: RateLimitOptions) => {
  const { windowMs, maxRequests, message = 'Too many requests, please try again later.' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting in development if needed
    if (process.env.NODE_ENV === 'development' && process.env.RATE_LIMIT_DISABLED === 'true') {
      return next();
    }

    const identifier = req.ip || 'unknown';
    const currentTime = Date.now();

    // Clean up expired entries
    Array.from(rateLimitStore.entries()).forEach(([key, value]) => {
      if (currentTime > value.resetTime) {
        rateLimitStore.delete(key);
      }
    });

    // Get or create rate limit data for this identifier
    const record = rateLimitStore.get(identifier);

    if (!record) {
      // First request in window
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: currentTime + windowMs,
      });
      return next();
    }

    if (currentTime > record.resetTime) {
      // Window has expired, reset
      record.count = 1;
      record.resetTime = currentTime + windowMs;
      return next();
    }

    if (record.count >= maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((record.resetTime - currentTime) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      return res.status(429).json({
        error: message,
        retryAfter,
      });
    }

    // Increment counter
    record.count++;
    next();
  };
};

// Stricter rate limiter for authentication endpoints
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later.',
});

// Standard rate limiter for API endpoints
export const apiRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
});

// More lenient rate limiter for general requests
export const generalRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200, // 200 requests per window
});

// Request size limiter
export const requestSizeLimiter = (maxSize: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);

    if (contentLength > maxSize) {
      return res.status(413).json({
        error: 'Request entity too large',
        maxSize: `${maxSize / 1024 / 1024}MB`,
      });
    }

    next();
  };
};

// Sanitize input to prevent XSS
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous HTML/JS characters
      return obj
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }

    return obj;
  };

  // Sanitize body, query, and params
  if (req.body) {
    req.body = sanitize(req.body);
  }

  if (req.query) {
    req.query = sanitize(req.query);
  }

  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

// Validate request origin
export const validateOrigin = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;

  // Allow requests with no origin (mobile apps, curl, etc.)
  if (!origin) {
    return next();
  }

  // Get allowed origins from environment
  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS ||
    (process.env.NODE_ENV === 'production'
      ? 'https://your-domain.netlify.app'
      : 'http://localhost:5173')
  ).split(',');

  // Check if origin is allowed
  const isAllowed = allowedOrigins.some((allowed) => {
    return origin === allowed.trim() || allowed.trim() === '*';
  });

  if (!isAllowed) {
    return res.status(403).json({
      error: 'Origin not allowed',
    });
  }

  next();
};

// Remove sensitive information from error responses
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error for debugging (in production, use proper logging service)
  console.error('Error:', err);

  // Don't leak stack traces in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(res.statusCode !== 200 ? res.statusCode : 500).json({
    error: {
      message: err.message,
      ...(isDevelopment && { stack: err.stack }),
    },
  });
};

// Apply all security middleware
export const applySecurityMiddleware = (app: any) => {
  // Apply headers to all responses
  app.use(securityHeaders);

  // Apply CSP to all responses
  app.use(contentSecurityPolicy);

  // Validate origin
  app.use(validateOrigin);

  // General rate limiting
  app.use(generalRateLimiter);

  // Request size limiting
  app.use(requestSizeLimiter());

  // Input sanitization (optional, can be enabled per route)
  // app.use(sanitizeInput);
};
