import { FastifyInstance } from 'fastify';
import { authenticate, authorize, optionalAuth } from '../../core/middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '../../core/middleware/validate.js';
import { tracerSubmitSchema, listQuerySchema, idParamSchema, submissionIdParamSchema } from './schemas.js';
import * as service from './service.js';
import { successResponse, paginatedResponse } from '../../core/utils/response.js';
import { z } from 'zod';

type ListQuery = z.infer<typeof listQuerySchema>;
type SubmitBody = z.infer<typeof tracerSubmitSchema>;

export async function publicTracerStudyRoutes(app: FastifyInstance) {
  // POST /tracer-study bisa diakses baik dengan token (alumni login) maupun public dengan identitas NISN
  app.post('/tracer-study', {
    preHandler: [optionalAuth, validateBody(tracerSubmitSchema)],
  }, async (request, reply) => {
    const body = request.body as SubmitBody;
    const userId = request.user?.id;
    const result = await service.submitTracer(userId, body);
    return reply.status(201).send(successResponse(result, 'Tracer study berhasil dikirim'));
  });
}

export async function tracerStudyRoutes(app: FastifyInstance) {
  // Fallback handler jika masuk ke protected scope
  app.post('/tracer-study', {
    preHandler: [validateBody(tracerSubmitSchema)],
  }, async (request, reply) => {
    const body = request.body as SubmitBody;
    const result = await service.submitTracer(request.user?.id, body);
    return reply.status(201).send(successResponse(result, 'Tracer study berhasil dikirim'));
  });

  app.get('/tracer-study/me', { preHandler: authenticate }, async (request, reply) => {
    const submission = await service.getMySubmission(request.user!.id);
    return reply.send(successResponse(submission, 'Riwayat tracer study berhasil diambil'));
  });

  app.get('/tracer-study/stats', { preHandler: authorize('ADMIN_BKK') }, async (request, reply) => {
    const stats = await service.getStats();
    return reply.send(successResponse(stats, 'Statistik tracer study berhasil diambil'));
  });

  app.get('/tracer-study', {
    preHandler: [authorize('ADMIN_BKK'), validateQuery(listQuerySchema)],
  }, async (request, reply) => {
    const query = request.query as ListQuery;
    const { data, total, page, limit } = await service.listSubmissions(query);
    return reply.send(paginatedResponse(data, page, limit, total, 'Daftar submission berhasil diambil'));
  });

  app.get('/tracer-study/:id', {
    preHandler: [authorize('ADMIN_BKK'), validateParams(idParamSchema)],
  }, async (request, reply) => {
    const params = request.params as { id: string };
    const submission = await service.getSubmissionById(params.id);
    return reply.send(successResponse(submission, 'Detail submission berhasil diambil'));
  });

  app.get('/tracer-study/code/:submissionId', {
    preHandler: [authorize('ADMIN_BKK'), validateParams(submissionIdParamSchema)],
  }, async (request, reply) => {
    const params = request.params as { submissionId: string };
    const submission = await service.getSubmissionByCode(params.submissionId);
    return reply.send(successResponse(submission, 'Detail submission berhasil diambil'));
  });
}
