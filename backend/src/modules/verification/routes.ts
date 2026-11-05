import { FastifyInstance } from 'fastify';
import { authorize } from '../../core/middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '../../core/middleware/validate.js';
import { updateVerificationSchema, listQuerySchema, idParamSchema } from './schemas.js';
import * as service from './service.js';
import { successResponse, paginatedResponse } from '../../core/utils/response.js';
import { z } from 'zod';

type ListQuery = z.infer<typeof listQuerySchema>;

export async function verificationRoutes(app: FastifyInstance) {
  app.get('/verification/stats', { preHandler: authorize('ADMIN_BKK') }, async (request, reply) => {
    const stats = await service.getVerificationStats();
    return reply.send(successResponse(stats, 'Statistik verifikasi berhasil diambil'));
  });

  app.get('/verification', {
    preHandler: [authorize('ADMIN_BKK'), validateQuery(listQuerySchema)],
  }, async (request, reply) => {
    const query = request.query as ListQuery;
    const { data, total, page, limit } = await service.listPendingVerifications(query);
    return reply.send(paginatedResponse(data, page, limit, total, 'Daftar verifikasi berhasil diambil'));
  });

  app.get('/verification/submissions', {
    preHandler: [authorize('ADMIN_BKK'), validateQuery(listQuerySchema)],
  }, async (request, reply) => {
    const query = request.query as ListQuery;
    const { data, total, page, limit } = await service.listPendingVerifications(query);
    return reply.send(paginatedResponse(data, page, limit, total, 'Daftar verifikasi berhasil diambil'));
  });

  app.put('/verification/:id', {
    preHandler: [authorize('ADMIN_BKK'), validateParams(idParamSchema), validateBody(updateVerificationSchema)],
  }, async (request, reply) => {
    const params = request.params as { id: string };
    const body = request.body as z.infer<typeof updateVerificationSchema>;
    const submission = await service.updateVerification(params.id, body, request.user!.id);
    return reply.send(successResponse(submission, 'Status verifikasi berhasil diperbarui'));
  });
}