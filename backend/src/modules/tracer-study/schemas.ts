import { z } from 'zod';

const STATUS_KEGIATAN = [
  'KERJA', 'KULIAH', 'WIRAUSAHA', 'KERJA_KULIAH', 'WIRAUSAHA_KULIAH', 'BELUM_KERJA'
] as const;

const JURUSAN = [
  'Teknik Pemesinan',
  'Teknik Instalasi Tenaga Listrik',
  'Teknik Elektronika Industri',
  'Teknik Kendaraan Ringan Otomotif',
  'Teknik dan Bisnis Sepeda Motor',
  'Teknik Komputer dan Jaringan',
] as const;

export const identitasSchema = z.object({
  nama_lengkap: z.string().min(3).max(100),
  nisn: z.string().length(10).regex(/^\d{10}$/),
  nik: z.string().length(16).regex(/^\d{16}$/).optional(),
  tahun_masuk: z.number().int().min(2000).max(new Date().getFullYear()),
  tahun_lulus: z.number().int().min(2003).max(new Date().getFullYear() + 1),
  jurusan: z.enum(JURUSAN),
  no_whatsapp: z.string().regex(/^(\+62|62|0)8[0-9]{7,11}$/),
  email: z.string().email(),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan']).optional(),
});

export const detailKerjaSchema = z.object({
  nama_perusahaan: z.string().min(2),
  jabatan: z.string().min(2),
  bidang_pekerjaan: z.string().optional(),
  kota_kabupaten: z.string().optional(),
  status_pekerjaan: z.string().optional(),
  kesesuaian_jurusan: z.string(),
  kisaran_penghasilan: z.string().optional(),
  alamat_perusahaan: z.string().optional(),
  nama_atasan: z.string().optional(),
  kontak_atasan: z.string().optional(),
  sumber_info_kerja: z.string().optional(),
  tanggal_mulai_kerja: z.string().optional(),
  jenis_sertifikat: z.string().optional(),
  nama_sertifikat: z.string().optional(),
});

export const detailKuliahSchema = z.object({
  nama_kampus: z.string().min(2),
  program_studi: z.string().min(2),
  jenjang: z.string(),
  status_kuliah: z.string().optional(),
  alamat_kampus: z.string().optional(),
});

export const detailUsahaSchema = z.object({
  nama_usaha: z.string().min(2),
  bidang_usaha: z.string().optional(),
  lama_usaha: z.string().optional(),
  jumlah_karyawan: z.string().optional(),
  kesesuaian_kompetensi: z.string().optional(),
  kategori_usaha: z.string().optional(),
  alamat_usaha: z.string().optional(),
  tanggal_mulai_usaha: z.string().optional(),
});

export const evaluasiSchema = z.object({
  skor_relevansi: z.number().int().min(1).max(5),
  kompetensi_bermanfaat: z.array(z.string()).min(1),
  kompetensi_ditingkatkan: z.string().optional(),
  bantu_dunia_kerja: z.string().optional(),
  saran_pembelajaran: z.string().optional(),
  saran_bkk: z.string().optional(),
  saran_industri: z.string().optional(),
  kesediaan_dihubungi: z.boolean().default(true),
});

export const tracerSubmitSchema = z.object({
  identitas: identitasSchema,
  status_kegiatan: z.enum(STATUS_KEGIATAN),
  masa_tunggu: z.string().optional(),
  detail_kerja: detailKerjaSchema.nullable().optional(),
  detail_kuliah: detailKuliahSchema.nullable().optional(),
  detail_usaha: detailUsahaSchema.nullable().optional(),
  evaluasi: evaluasiSchema,
  agreement: z.literal(true, { error: 'Harus menyetujui pernyataan' }),
});

export type TracerSubmitInput = z.infer<typeof tracerSubmitSchema>;

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(15),
  statusKegiatan: z.string().optional(),
  verificationStatus: z.enum(['PENDING', 'VALID', 'REVISI']).optional(),
  tahunLulus: z.coerce.number().int().optional(),
  jurusan: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['submittedAt', 'submissionId', 'statusKegiatan']).default('submittedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListQueryInput = z.infer<typeof listQuerySchema>;

export const idParamSchema = z.object({ id: z.string().cuid() });
export const submissionIdParamSchema = z.object({ submissionId: z.string() });