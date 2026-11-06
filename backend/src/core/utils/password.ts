import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import crypto from 'node:crypto';

// Use 12 rounds in production, 10 in development (faster tests)
const SALT_ROUNDS = env.isProd ? 12 : 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Cryptographically secure random password */
export function generateRandomPassword(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
}
