import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'NISN atau Email wajib diisi').max(100),
  password: z.string().min(6, 'Password minimal 6 karakter').max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  nisn: z.string().length(10, 'NISN harus 10 digit').regex(/^\d{10}$/, 'NISN harus angka'),
  nik: z
    .string()
    .length(16, 'NIK harus 16 digit')
    .regex(/^\d{16}$/, 'NIK harus angka')
    .optional()
    .or(z.literal('')),
  namaLengkap: z.string().min(3, 'Nama minimal 3 karakter').max(100),
  email: z.string().email('Format email tidak valid').max(150),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .max(128)
    .regex(/[A-Z]/, 'Password harus mengandung huruf kapital')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  jurusan: z.enum([
    'Teknik Pemesinan',
    'Teknik Instalasi Tenaga Listrik',
    'Teknik Elektronika Industri',
    'Teknik Kendaraan Ringan Otomotif',
    'Teknik dan Bisnis Sepeda Motor',
    'Teknik Komputer dan Jaringan',
  ]),
  tahunMasuk: z.number().int().min(2000).max(new Date().getFullYear()),
  tahunLulus: z.number().int().min(2003).max(new Date().getFullYear() + 1),
  noWhatsApp: z
    .string()
    .regex(/^(\+62|62|0)8[0-9]{7,11}$/, 'Format WhatsApp tidak valid'),
  jenisKelamin: z.enum(['L', 'P']).optional(),
}).refine((data) => data.tahunLulus >= data.tahunMasuk, {
  message: 'Tahun lulus tidak boleh lebih awal dari tahun masuk',
  path: ['tahunLulus'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token wajib diisi').optional(),
});

export type RefreshInput = z.infer<typeof refreshSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Password saat ini wajib diisi').max(128),
    newPassword: z
      .string()
      .min(8, 'Password baru minimal 8 karakter')
      .max(128)
      .regex(/[A-Z]/, 'Password harus mengandung huruf kapital')
      .regex(/[0-9]/, 'Password harus mengandung angka'),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Password baru tidak boleh sama dengan password lama',
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
