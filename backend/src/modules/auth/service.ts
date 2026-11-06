import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { hashPassword, verifyPassword } from '../../core/utils/password.js';
import { HttpError } from '../../core/utils/errors.js';
import { LoginInput, RegisterInput, ChangePasswordInput } from './schemas.js';

// In-memory brute-force tracker (per process — sufficient for single-node; use Redis for multi-node)
const loginAttempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function checkBruteForce(key: string): void {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (record) {
    if (record.blockedUntil > now) {
      const remaining = Math.ceil((record.blockedUntil - now) / 1000);
      throw HttpError.tooMany(`Akun sementara diblokir. Coba lagi dalam ${remaining} detik`);
    }
    // Reset if window expired
    if (now - (record.blockedUntil - BLOCK_DURATION_MS) > ATTEMPT_WINDOW_MS) {
      loginAttempts.delete(key);
    }
  }
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const record = loginAttempts.get(key) ?? { count: 0, blockedUntil: 0 };
  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
  }
  loginAttempts.set(key, record);
}

function clearAttempts(key: string): void {
  loginAttempts.delete(key);
}

function sanitizeAlumni(alumni: any) {
  const { passwordHash: _, ...safe } = alumni;
  return {
    ...safe,
    nama: safe.namaLengkap,
    tahun_lulus: safe.tahunLulus,
  };
}

/** Sign an ACCESS token using the access secret */
function signAccessToken(payload: object): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY as any });
}

/** Sign a REFRESH token using a DIFFERENT secret */
function signRefreshToken(payload: object): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY as any });
}

/** Verify a REFRESH token using the refresh secret */
function verifyRefreshToken(token: string): any {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

export async function login(_app: FastifyInstance, input: LoginInput, clientIp: string) {
  const { identifier, password } = input;
  const bruteKey = `${clientIp}:${identifier.toLowerCase()}`;

  // Check brute-force before hitting the database
  checkBruteForce(bruteKey);

  // Find by NISN or email or NIK
  const alumni = await prisma.alumni.findFirst({
    where: {
      OR: [
        { nisn: identifier },
        { email: identifier },
        { nik: identifier },
      ],
    },
  });

  // Use constant-time comparison even when user not found (prevents user enumeration)
  const dummyHash = '$2a$10$dummyhashforenumerationprotectxx';
  const passwordToVerify = alumni?.passwordHash ?? dummyHash;
  const valid = await verifyPassword(password, passwordToVerify);

  if (!alumni || !valid) {
    recordFailedAttempt(bruteKey);
    // Generic message — do not reveal whether NISN/email exists
    throw HttpError.unauthorized('NISN/Email atau password salah');
  }

  // Success — clear attempts
  clearAttempts(bruteKey);

  const payload = {
    id: alumni.id,
    nisn: alumni.nisn,
    email: alumni.email || '',
    role: alumni.role,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return { alumni: sanitizeAlumni(alumni), accessToken, refreshToken };
}

export async function register(_app: FastifyInstance, input: RegisterInput) {
  const exists = await prisma.alumni.findFirst({
    where: {
      OR: [
        { nisn: input.nisn },
        { email: input.email },
        ...(input.nik ? [{ nik: input.nik }] : []),
      ],
    },
  });

  if (exists) {
    throw HttpError.conflict('NISN, NIK, atau Email sudah terdaftar');
  }

  const passwordHash = await hashPassword(input.password);

  const alumni = await prisma.alumni.create({
    data: {
      nisn: input.nisn,
      nik: input.nik || '',
      namaLengkap: input.namaLengkap,
      email: input.email,
      passwordHash,
      jurusan: input.jurusan,
      tahunMasuk: input.tahunMasuk,
      tahunLulus: input.tahunLulus,
      noWhatsApp: input.noWhatsApp,
      jenisKelamin: input.jenisKelamin,
      role: 'ALUMNI',
    },
  });

  const payload = {
    id: alumni.id,
    nisn: alumni.nisn,
    email: alumni.email || '',
    role: alumni.role,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return { alumni: sanitizeAlumni(alumni), accessToken, refreshToken };
}

export async function refreshAccessToken(_app: FastifyInstance, refreshToken: string) {
  try {
    const payload = verifyRefreshToken(refreshToken) as { id: string; nisn: string; email: string; role: string };

    // Verify user still exists and is valid
    const alumni = await prisma.alumni.findUnique({ where: { id: payload.id } });
    if (!alumni) throw HttpError.unauthorized('User tidak ditemukan');

    const newPayload = {
      id: alumni.id,
      nisn: alumni.nisn,
      email: alumni.email || '',
      role: alumni.role,
    };

    const accessToken = signAccessToken(newPayload);
    // Rotate refresh token (issue a new one)
    const newRefreshToken = signRefreshToken(newPayload);

    return { accessToken, refreshToken: newRefreshToken };
  } catch (err: any) {
    if (err instanceof HttpError) throw err;
    throw HttpError.unauthorized('Refresh token tidak valid atau kadaluarsa');
  }
}

export async function getMe(userId: string) {
  const alumni = await prisma.alumni.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nisn: true,
      nik: true,
      namaLengkap: true,
      email: true,
      jurusan: true,
      tahunMasuk: true,
      tahunLulus: true,
      noWhatsApp: true,
      role: true,
      tracerStatus: true,
      submissionId: true,
      submittedAt: true,
      jenisKelamin: true,
      avatarUrl: true,
      pekerjaan: true,
      kota: true,
      kampus: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!alumni) {
    throw HttpError.notFound('User tidak ditemukan');
  }

  return sanitizeAlumni(alumni);
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const alumni = await prisma.alumni.findUnique({ where: { id: userId } });
  if (!alumni) throw HttpError.notFound('User tidak ditemukan');

  const valid = await verifyPassword(input.currentPassword, alumni.passwordHash);
  if (!valid) throw HttpError.unauthorized('Password saat ini salah');

  // Ensure new password is different
  const isSame = await verifyPassword(input.newPassword, alumni.passwordHash);
  if (isSame) throw HttpError.badRequest('Password baru tidak boleh sama dengan password lama');

  const newHash = await hashPassword(input.newPassword);
  await prisma.alumni.update({
    where: { id: alumni.id },
    data: { passwordHash: newHash, updatedAt: new Date() },
  });

  return { success: true };
}
