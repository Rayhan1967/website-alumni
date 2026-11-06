import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth/routes.js';
import { masterAlumniRoutes, publicMasterAlumniRoutes } from './master-alumni/routes.js';
import { tracerStudyRoutes } from './tracer-study/routes.js';
import { publicVerificationRoutes, verificationRoutes } from './verification/routes.js';
import { jobsRoutes, publicJobsRoutes } from './jobs/routes.js';
import { newsRoutes, publicNewsRoutes } from './news/routes.js';
import { messagesRoutes, publicMessagesRoutes } from './messages/routes.js';
import { ijazahRoutes, publicIjazahRoutes } from './ijazah/routes.js';
import { settingsRoutes } from './settings/routes.js';
import { publicReportsRoutes, reportsRoutes } from './reports/routes.js';
import { demoRoutes } from './demo/routes.js';
import { AuthPayload } from '../core/middleware/auth.js';

export async function routes(app: FastifyInstance) {
  // Auth (public)
  await app.register(authRoutes);

  // Demo session locks (public)
  await app.register(demoRoutes);

  // Public routes (no auth required)
  await app.register(publicMasterAlumniRoutes);
  await app.register(publicVerificationRoutes);
  await app.register(publicJobsRoutes);
  await app.register(publicNewsRoutes);
  await app.register(publicMessagesRoutes);
  await app.register(publicIjazahRoutes);
  await app.register(publicReportsRoutes);

  // Protected routes (require authentication)
  await app.register(async function (protectedApp) {
    protectedApp.addHook('preHandler', async (request) => {
      // Check Authorization header first
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
          const payload = protectedApp.jwt.verify<AuthPayload>(token);
          request.user = payload;
          return;
        } catch {
          // Fall through to cookie check
        }
      }
      // Fallback to cookie
      await request.jwtVerify();
    });

    protectedApp.register(masterAlumniRoutes);
    protectedApp.register(tracerStudyRoutes);
    protectedApp.register(verificationRoutes);
    protectedApp.register(jobsRoutes);
    protectedApp.register(newsRoutes);
    protectedApp.register(messagesRoutes);
    protectedApp.register(ijazahRoutes);
    protectedApp.register(settingsRoutes);
    protectedApp.register(reportsRoutes);
  });
}