import { FastifyRequest, FastifyReply } from 'fastify';
import { HttpError } from '../utils/errors.js';
import { Role } from '@prisma/client';

export interface AuthPayload {
  id: string;
  nisn: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  let token: string | undefined;

  // Prefer Authorization header (Bearer scheme)
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    // Fallback to httpOnly cookie
    token = (request as any).cookies?.accessToken;
  }

  if (!token) {
    throw HttpError.unauthorized('Token akses tidak ditemukan');
  }

  try {
    const payload = request.server.jwt.verify<AuthPayload>(token);

    // Extra: check expiry explicitly (belt-and-suspenders)
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      throw HttpError.unauthorized('Token telah kadaluarsa');
    }

    request.user = payload;
  } catch (err: any) {
    if (err instanceof HttpError) throw err;
    if (err?.message === 'jwt expired') {
      throw HttpError.unauthorized('Token telah kadaluarsa, silakan refresh');
    }
    throw HttpError.unauthorized('Token tidak valid');
  }
}

export function authorize(...allowedRoles: Role[]) {
  return async function (request: FastifyRequest, _reply: FastifyReply) {
    if (!request.user) {
      throw HttpError.unauthorized('Tidak terautentikasi');
    }
    if (!allowedRoles.includes(request.user.role)) {
      throw HttpError.forbidden('Anda tidak memiliki izin untuk mengakses resource ini');
    }
  };
}

export async function optionalAuth(request: FastifyRequest, _reply: FastifyReply) {
  let token: string | undefined;
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    token = (request as any).cookies?.accessToken;
  }

  if (!token) return;

  try {
    const payload = request.server.jwt.verify<AuthPayload>(token);
    request.user = payload;
  } catch {
    // Silently ignore for optional auth — do not block request
  }
}
