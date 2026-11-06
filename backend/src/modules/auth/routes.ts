import { FastifyInstance } from 'fastify';
import { authenticate } from '../../core/middleware/auth.js';
import { validateBody } from '../../core/middleware/validate.js';
import { loginSchema, registerSchema, refreshSchema, changePasswordSchema } from './schemas.js';
import { login, register, refreshAccessToken, getMe, changePassword } from './service.js';
import { successResponse } from '../../core/utils/response.js';
import { env } from '../../config/env.js';
import { z } from 'zod';

type RegisterBody = z.infer<typeof registerSchema>;
type LoginBody = z.infer<typeof loginSchema>;
type RefreshBody = z.infer<typeof refreshSchema>;
type ChangePasswordBody = z.infer<typeof changePasswordSchema>;

/** Cookie options for access token (short-lived) */
const accessCookieOpts = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'strict' as const,
  maxAge: 15 * 60, // seconds
  path: '/',
};

/** Cookie options for refresh token (long-lived, restricted path) */
const refreshCookieOpts = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60, // seconds
  path: '/api/v1/auth/refresh',
};

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/login — strict rate-limit for brute-force protection
  app.post('/auth/login', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
        keyGenerator: (req: any) => `login:${req.ip}`,
      },
    },
    preHandler: validateBody(loginSchema),
  }, async (request, reply) => {
    const body = request.body as LoginBody;
    const clientIp = request.ip;
    const { alumni, accessToken, refreshToken } = await login(app, body, clientIp);

    reply.setCookie('accessToken', accessToken, accessCookieOpts);
    reply.setCookie('refreshToken', refreshToken, refreshCookieOpts);

    // Also return tokens in body for SPA convenience (frontend stores in memory, not localStorage)
    return reply.send(successResponse({
      user: alumni,
      accessToken,
      // Do NOT return refreshToken in body — only via httpOnly cookie
    }, 'Login berhasil'));
  });

  // POST /auth/register — moderate rate-limit
  app.post('/auth/register', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
        keyGenerator: (req: any) => `register:${req.ip}`,
      },
    },
    preHandler: validateBody(registerSchema),
  }, async (request, reply) => {
    const body = request.body as RegisterBody;
    const { alumni, accessToken, refreshToken } = await register(app, body);

    reply.setCookie('accessToken', accessToken, accessCookieOpts);
    reply.setCookie('refreshToken', refreshToken, refreshCookieOpts);

    return reply.status(201).send(successResponse({
      user: alumni,
      accessToken,
    }, 'Registrasi berhasil'));
  });

  // POST /auth/refresh — only accepts httpOnly cookie (not body token from browser)
  app.post('/auth/refresh', {
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
        keyGenerator: (req: any) => `refresh:${req.ip}`,
      },
    },
  }, async (request, reply) => {
    // Prefer cookie, fallback to body for API clients
    const cookieToken = (request as any).cookies?.refreshToken;
    const bodyToken = (request.body as any)?.refreshToken;
    const tokenToUse = cookieToken || bodyToken;

    if (!tokenToUse) {
      return reply.status(401).send({ success: false, message: 'Refresh token tidak ditemukan' });
    }

    const { accessToken, refreshToken: newRefreshToken } = await refreshAccessToken(app, tokenToUse);

    reply.setCookie('accessToken', accessToken, accessCookieOpts);
    reply.setCookie('refreshToken', newRefreshToken, refreshCookieOpts);

    return reply.send(successResponse({ accessToken }, 'Token diperbarui'));
  });

  // POST /auth/logout — clear cookies
  app.post('/auth/logout', async (request, reply) => {
    reply.clearCookie('accessToken', { path: '/' });
    reply.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
    return reply.send(successResponse(null, 'Logout berhasil'));
  });

  // GET /auth/me (protected)
  app.get('/auth/me', { preHandler: authenticate }, async (request, reply) => {
    const user = await getMe(request.user!.id);
    return reply.send(successResponse(user, 'Profil berhasil diambil'));
  });

  // PUT /auth/me/password (protected)
  app.put('/auth/me/password', {
    preHandler: [authenticate, validateBody(changePasswordSchema)],
  }, async (request, reply) => {
    const body = request.body as ChangePasswordBody;
    await changePassword(request.user!.id, body);
    return reply.send(successResponse(null, 'Password berhasil diubah'));
  });
}
