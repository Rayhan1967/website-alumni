import { z } from 'zod';

export const identitasSchema = z
  .object({
    nama_lengkap: z.string().min(1).max(150),
    nisn: z.string().min(1).max(30),
    nik: z.string().optional().nullable().or(z.literal('')),
    tahun_masuk: z.coerce.number().int().optional().nullable(),
    tahun_lulus: z.coerce.number().int().optional().nullable(),
    jurusan: z.string().optional().nullable(),
    no_whatsapp: z.string().optional().nullable().or(z.literal('')),
    email: z.string().optional().nullable().or(z.literal('')),
    jenis_kelamin: z.string().optional().nullable(),
    status_menikah: z.string().optional().nullable(),
    usia: z.any().optional().nullable(),
    provinsi_domisili: z.string().optional().nullable(),
    kota_domisili: z.string().optional().nullable(),
  })
  .passthrough();

export const detailKerjaSchema = z
  .object({
    nama_perusahaan: z.string().optional().nullable(),
    jabatan: z.string().optional().nullable(),
    bidang_pekerjaan: z.string().optional().nullable(),
    kota_kabupaten: z.string().optional().nullable(),
    status_pekerjaan: z.string().optional().nullable(),
    kesesuaian_jurusan: z.string().optional().nullable(),
    kisaran_penghasilan: z.string().optional().nullable(),
    alamat_perusahaan: z.string().optional().nullable(),
    nama_atasan: z.string().optional().nullable(),
    kontak_atasan: z.string().optional().nullable(),
    sumber_info_kerja: z.string().optional().nullable(),
    tanggal_mulai_kerja: z.string().optional().nullable(),
    jenis_sertifikat: z.string().optional().nullable(),
    nama_sertifikat: z.string().optional().nullable(),
    lokasi_pekerjaan: z.string().optional().nullable(),
    negara_kerja: z.string().optional().nullable(),
    keterangan_kerja: z.string().optional().nullable(),
    provinsi_kerja: z.string().optional().nullable(),
    kota_kerja: z.string().optional().nullable(),
    pendapatan_ump: z.string().optional().nullable(),
    pendapatan_umk: z.string().optional().nullable(),
  })
  .passthrough();

export const detailKuliahSchema = z
  .object({
    nama_kampus: z.string().optional().nullable(),
    program_studi: z.string().optional().nullable(),
    jenjang: z.string().optional().nullable(),
    status_kuliah: z.string().optional().nullable(),
    alamat_kampus: z.string().optional().nullable(),
    keselarasan_studi: z.string().optional().nullable(),
  })
  .passthrough();

export const detailUsahaSchema = z
  .object({
    nama_usaha: z.string().optional().nullable(),
    bidang_usaha: z.string().optional().nullable(),
    lama_usaha: z.string().optional().nullable(),
    jumlah_karyawan: z.string().optional().nullable(),
    kesesuaian_kompetensi: z.string().optional().nullable(),
    kategori_usaha: z.string().optional().nullable(),
    alamat_usaha: z.string().optional().nullable(),
    tanggal_mulai_usaha: z.string().optional().nullable(),
    provinsi_usaha: z.string().optional().nullable(),
    kota_usaha: z.string().optional().nullable(),
    negara_usaha: z.string().optional().nullable(),
    jenis_usaha: z.string().optional().nullable(),
    nama_produk_usaha: z.string().optional().nullable(),
    pendapatan_ump: z.string().optional().nullable(),
    pendapatan_umk: z.string().optional().nullable(),
  })
  .passthrough();

export const evaluasiSchema = z
  .object({
    skor_relevansi: z.coerce.number().optional().nullable().default(5),
    kompetensi_bermanfaat: z.array(z.string()).optional().nullable().default([]),
    kompetensi_ditingkatkan: z.string().optional().nullable(),
    bantu_dunia_kerja: z.string().optional().nullable(),
    saran_pembelajaran: z.string().optional().nullable(),
    saran_bkk: z.string().optional().nullable(),
    saran_industri: z.string().optional().nullable(),
    kesediaan_dihubungi: z.boolean().optional().nullable().default(true),
  })
  .passthrough();

export const tracerSubmitSchema = z
  .object({
    identitas: identitasSchema.optional().nullable(),
    status_kegiatan: z.string().min(1, 'Status kegiatan wajib dipilih'),
    masa_tunggu: z.string().optional().nullable(),
    detail_kerja: detailKerjaSchema.optional().nullable(),
    detail_kuliah: detailKuliahSchema.optional().nullable(),
    detail_usaha: detailUsahaSchema.optional().nullable(),
    evaluasi: evaluasiSchema.optional().nullable(),
    agreement: z.any().optional(),
  })
  .passthrough();

export type TracerSubmitInput = z.infer<typeof tracerSubmitSchema>;

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(15),
  statusKegiatan: z.string().optional(),
  verificationStatus: z.enum(['PENDING', 'VALID', 'REVISI']).optional(),
  tahunLulus: z.coerce.number().int().optional(),
  jurusan: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['submittedAt', 'submissionId', 'statusKegiatan']).default('submittedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListQueryInput = z.infer<typeof listQuerySchema>;

export const idParamSchema = z.object({ id: z.string() });
export const submissionIdParamSchema = z.object({ submissionId: z.string() });
