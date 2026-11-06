import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
import staticFiles from '@fastify/static';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './core/middleware/errorHandler.js';
import { routes } from './modules/routes.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: {
      level: env.isProd ? 'warn' : 'debug',
      transport: !env.isProd ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
      // Redact sensitive fields from logs
      redact: [
        'req.headers.authorization',
        'req.body.password',
        'req.body.currentPassword',
        'req.body.newPassword',
      ],
    },
    ajv: {
      customOptions: { removeAdditional: 'all' },
    },
    // Limit request body to 10MB
    bodyLimit: 10 * 1024 * 1024,
  });

  // CORS — restrict to known origins in production
  await app.register(cors, {
    origin: env.isProd ? env.corsOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });

  // Helmet — security headers
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  });

  // Global rate limiting
  await app.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: (_req, context) => ({
      success: false,
      message: `Terlalu banyak permintaan, coba lagi setelah ${Math.ceil(context.ttl / 1000)} detik`,
    }),
  });

  // JWT (access token)
  await app.register(jwt, {
    secret: env.JWT_ACCESS_SECRET,
    sign: { expiresIn: env.JWT_ACCESS_EXPIRY },
    cookie: {
      cookieName: 'accessToken',
      signed: false,
    },
  });

  // Cookies
  await app.register(cookie, {
    secret: env.COOKIE_SECRET,
  });

  // Static files (uploads)
  await app.register(staticFiles, {
    root: path.join(__dirname, '..', 'uploads'),
    prefix: '/uploads/',
    decorateReply: false,
  });

  // Health check
  app.get('/health', {
    config: { rateLimit: false },
  }, async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // API routes
  await app.register(routes, { prefix: env.API_PREFIX });

  // Error handlers
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  return app;
}
