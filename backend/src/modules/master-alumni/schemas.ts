import { z } from 'zod';

const JURUSAN_OPTIONS = [
  'Teknik Pemesinan',
  'Teknik Instalasi Tenaga Listrik',
  'Teknik Elektronika Industri',
  'Teknik Kendaraan Ringan Otomotif',
  'Teknik dan Bisnis Sepeda Motor',
  'Teknik Komputer dan Jaringan',
] as const;

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const masterAlumniCreateSchema = z.object({
  nisn: z.string().length(10, 'NISN harus 10 digit').regex(/^\d{10}$/),
  nik: z.string().length(16, 'NIK harus 16 digit').regex(/^\d{16}$/).optional(),
  nama: z.string().min(3).max(100),
  jurusan: z.enum(JURUSAN_OPTIONS),
  tahunLulus: z.number().int().min(2003).max(new Date().getFullYear() + 1),
  noWhatsapp: z.string().regex(/^(\+62|62|0)8[0-9]{7,11}$/, 'Format WhatsApp tidak valid').optional(),
  email: z.string().email('Format email tidak valid').optional(),

  // Data Sekolah Asal
  namaSekolah: optionalText(150),
  npsn: optionalText(20),
  statusSekolah: optionalText(20),
  kompKeahlian: optionalText(100),
  progKeahlian: optionalText(100),
  bidKeahlian: optionalText(100),
  lamaProgram: z.coerce.number().int().min(1).max(6).optional(),
  provinsiSmk: optionalText(100),
  kabKotaSmk: optionalText(100),

  // Data Pribadi & Domisili
  jenisKelamin: z.enum(['L', 'P']).optional(),
  usia: z.coerce.number().int().min(15).max(100).optional(),
  statusMenikah: optionalText(30),
  provinsiDomisili: optionalText(100),
  kotaDomisili: optionalText(100),
  noHp: optionalText(20),

  // Status Aktivitas Lulusan
  statusAktivitas: optionalText(50),
  keterangan: optionalText(2000),
  masaTungguKerja: z.coerce.number().int().min(0).max(120).optional(),
  sertifikatKompetensi: optionalText(50),

  // Data Bekerja
  jabatanKerja: optionalText(100),
  namaTempatKerja: optionalText(150),
  provinsiKerja: optionalText(100),
  kotaKerja: optionalText(100),
  negaraKerja: optionalText(100),
  keselarasanKerja: optionalText(50),

  // Data Wirausaha
  provinsiUsaha: optionalText(100),
  kotaUsaha: optionalText(100),
  negaraUsaha: optionalText(100),
  bidangUsaha: optionalText(100),
  jenisUsaha: optionalText(50),
  keselarasanUsaha: optionalText(50),
  namaProdukUsaha: optionalText(150),

  // Data Studi Lanjut
  jenjangPendidikan: optionalText(20),
  namaPerguruanTinggi: optionalText(150),
  namaProdi: optionalText(100),
  keselarasanStudi: optionalText(50),

  // Pendapatan (UMP / UMK)
  pendapatanBekerjaUmp: optionalText(50),
  pendapatanBekerjaUmk: optionalText(50),
  pendapatanWirausahaUmp: optionalText(50),
  pendapatanWirausahaUmk: optionalText(50),
  pendapatanStudiSambilBekerjaUmp: optionalText(50),
  pendapatanStudiSambilBekerjaUmk: optionalText(50),
  pendapatanStudiSambilBerwirausahaUmp: optionalText(50),
  pendapatanStudiSambilBerwirausahaUmk: optionalText(50),
});

export type MasterAlumniCreateInput = z.infer<typeof masterAlumniCreateSchema>;

export const masterAlumniUpdateSchema = masterAlumniCreateSchema.partial();

export type MasterAlumniUpdateInput = z.infer<typeof masterAlumniUpdateSchema>;

// Import CSV: validasi per-record dilakukan di service agar satu baris
// yang tidak valid tidak menggagalkan seluruh batch impor.
export const importCsvSchema = z.object({
  records: z.array(z.unknown()).min(1, 'Minimal 1 record'),
  skipDuplicates: z.boolean().default(true),
});

export type ImportCsvInput = z.infer<typeof importCsvSchema>;

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(2000).default(15),
  search: z.string().optional(),
  jurusan: z.string().optional(),
  statusTracer: z.enum(['SUDAH', 'BELUM']).optional(),
  tahunLulus: z.coerce.number().int().optional(),
  sortBy: z.enum(['nama', 'nisn', 'tahunLulus', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListQueryInput = z.infer<typeof listQuerySchema>;