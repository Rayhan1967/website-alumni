import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();

export const masterAlumniCreateSchema = z
  .object({
    nisn: z.string().min(1, 'NISN wajib diisi').max(30),
    nik: z.string().optional().nullable().or(z.literal('')),
    nama: z.string().min(1, 'Nama wajib diisi').max(150),
    jurusan: z.string().min(1, 'Jurusan wajib diisi'),
    tahunLulus: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 5),
    noWhatsapp: z.string().optional().nullable().or(z.literal('')),
    email: z.string().optional().nullable().or(z.literal('')),

    // Alternatif penamaan dari form/csv
    tahun_lulus: z.coerce.number().int().optional().nullable(),
    no_wa: z.string().optional().nullable(),
    no_whatsapp: z.string().optional().nullable(),

    // Data Sekolah Asal
    namaSekolah: optionalText(150),
    npsn: optionalText(20),
    statusSekolah: optionalText(20),
    kompKeahlian: optionalText(100),
    progKeahlian: optionalText(100),
    bidKeahlian: optionalText(100),
    lamaProgram: z.coerce.number().int().min(1).max(6).optional().nullable(),
    provinsiSmk: optionalText(100),
    kabKotaSmk: optionalText(100),

    // Data Pribadi & Domisili
    jenisKelamin: z.string().optional().nullable(),
    usia: z.coerce.number().int().min(15).max(100).optional().nullable(),
    statusMenikah: optionalText(30),
    provinsiDomisili: optionalText(100),
    kotaDomisili: optionalText(100),
    noHp: optionalText(20),

    // Status Aktivitas Lulusan
    statusAktivitas: optionalText(50),
    keterangan: optionalText(2000),
    masaTungguKerja: z.coerce.number().int().min(0).max(120).optional().nullable(),
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
  })
  .passthrough();

export type MasterAlumniCreateInput = z.infer<typeof masterAlumniCreateSchema>;

export const masterAlumniUpdateSchema = masterAlumniCreateSchema.partial();

export type MasterAlumniUpdateInput = z.infer<typeof masterAlumniUpdateSchema>;

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
