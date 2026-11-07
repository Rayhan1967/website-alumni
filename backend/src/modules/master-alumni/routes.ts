import { FastifyInstance } from 'fastify';
import { authorize } from '../../core/middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '../../core/middleware/validate.js';
import { masterAlumniCreateSchema, masterAlumniUpdateSchema, importCsvSchema, listQuerySchema } from './schemas.js';
import * as service from './service.js';
import { successResponse, paginatedResponse } from '../../core/utils/response.js';
import { z } from 'zod';

const idParamSchema = z.object({ id: z.string() });
type ListQuery = z.infer<typeof listQuerySchema>;

export async function publicMasterAlumniRoutes(app: FastifyInstance) {
  app.get('/public/alumni', {
    preHandler: validateQuery(listQuerySchema),
  }, async (request, reply) => {
    const query = request.query as ListQuery;
    const { data, total, page, limit } = await service.listMasterAlumni(query);
    return reply.send(paginatedResponse(data, page, limit, total, 'Daftar alumni berhasil diambil'));
  });

  // Public fallback for import
  app.post('/public/alumni/import', {
    preHandler: validateBody(importCsvSchema),
  }, async (request, reply) => {
    const body = request.body as z.infer<typeof importCsvSchema>;
    const result = await service.importMasterAlumni(body);
    const summary = `Import selesai: ${result.importedCount} ditambahkan, ${result.duplicateCount} duplikat diabaikan`;
    const invalidInfo = result.invalidCount > 0 ? `, ${result.invalidCount} baris tidak valid dilewati` : '';
    return reply.send(successResponse(result, summary + invalidInfo));
  });

  // Public fallback for create
  app.post('/public/alumni', {
    preHandler: validateBody(masterAlumniCreateSchema),
  }, async (request, reply) => {
    const body = request.body as z.infer<typeof masterAlumniCreateSchema>;
    const alumni = await service.createMasterAlumni(body);
    return reply.status(201).send(successResponse(alumni, 'Alumni berhasil ditambahkan'));
  });

  // Public fallback for delete
  app.delete('/public/alumni/:id', {
    preHandler: validateParams(idParamSchema),
  }, async (request, reply) => {
    const params = request.params as { id: string };
    await service.deleteMasterAlumni(params.id);
    return reply.send(successResponse(null, 'Alumni berhasil dihapus'));
  });
}

export async function masterAlumniRoutes(app: FastifyInstance) {
  app.get('/master-alumni/stats', { preHandler: authorize('ADMIN_BKK') }, async (request, reply) => {
    const stats = await service.getStats();
    return reply.send(successResponse(stats, 'Statistik alumni berhasil diambil'));
  });

  app.get('/master-alumni', {
    preHandler: [authorize('ADMIN_BKK'), validateQuery(listQuerySchema)],
  }, async (request, reply) => {
    const query = request.query as ListQuery;
    const { data, total, page, limit } = await service.listMasterAlumni(query);
    return reply.send(paginatedResponse(data, page, limit, total, 'Daftar alumni berhasil diambil'));
  });

  app.get('/master-alumni/:id', {
    preHandler: [authorize('ADMIN_BKK'), validateParams(idParamSchema)],
  }, async (request, reply) => {
    const params = request.params as { id: string };
    const alumni = await service.getMasterAlumni(params.id);
    return reply.send(successResponse(alumni, 'Detail alumni berhasil diambil'));
  });

  app.post('/master-alumni', {
    preHandler: [authorize('ADMIN_BKK'), validateBody(masterAlumniCreateSchema)],
  }, async (request, reply) => {
    const body = request.body as z.infer<typeof masterAlumniCreateSchema>;
    const alumni = await service.createMasterAlumni(body);
    return reply.status(201).send(successResponse(alumni, 'Alumni berhasil ditambahkan'));
  });

  app.put('/master-alumni/:id', {
    preHandler: [authorize('ADMIN_BKK'), validateParams(idParamSchema), validateBody(masterAlumniUpdateSchema)],
  }, async (request, reply) => {
    const params = request.params as { id: string };
    const body = request.body as z.infer<typeof masterAlumniUpdateSchema>;
    const alumni = await service.updateMasterAlumni(params.id, body);
    return reply.send(successResponse(alumni, 'Alumni berhasil diperbarui'));
  });

  app.delete('/master-alumni/:id', {
    preHandler: [authorize('ADMIN_BKK'), validateParams(idParamSchema)],
  }, async (request, reply) => {
    const params = request.params as { id: string };
    await service.deleteMasterAlumni(params.id);
    return reply.send(successResponse(null, 'Alumni berhasil dihapus'));
  });

  app.post('/master-alumni/import', {
    preHandler: [authorize('ADMIN_BKK'), validateBody(importCsvSchema)],
  }, async (request, reply) => {
    const body = request.body as z.infer<typeof importCsvSchema>;
    const result = await service.importMasterAlumni(body);
    const summary = `Import selesai: ${result.importedCount} ditambahkan, ${result.duplicateCount} duplikat diabaikan`;
    const invalidInfo = result.invalidCount > 0 ? `, ${result.invalidCount} baris tidak valid dilewati` : '';
    return reply.send(successResponse(result, summary + invalidInfo));
  });
}
