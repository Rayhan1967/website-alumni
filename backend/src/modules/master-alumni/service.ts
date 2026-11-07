import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../core/utils/errors.js';
import { MasterAlumniCreateInput, MasterAlumniUpdateInput, ImportCsvInput, ListQueryInput, masterAlumniCreateSchema } from './schemas.js';
import { TracerStatus } from '@prisma/client';
import { hashPassword } from '../../core/utils/password.js';

// Field tambahan format Dapodik yang boleh diisi admin (string)
const DAPODIK_TEXT_FIELDS = [
  'jenisKelamin',
  'namaSekolah',
  'npsn',
  'statusSekolah',
  'kompKeahlian',
  'progKeahlian',
  'bidKeahlian',
  'provinsiSmk',
  'kabKotaSmk',
  'statusMenikah',
  'provinsiDomisili',
  'kotaDomisili',
  'noHp',
  'statusAktivitas',
  'keterangan',
  'sertifikatKompetensi',
  'jabatanKerja',
  'namaTempatKerja',
  'provinsiKerja',
  'kotaKerja',
  'negaraKerja',
  'keselarasanKerja',
  'provinsiUsaha',
  'kotaUsaha',
  'negaraUsaha',
  'bidangUsaha',
  'jenisUsaha',
  'keselarasanUsaha',
  'namaProdukUsaha',
  'jenjangPendidikan',
  'namaPerguruanTinggi',
  'namaProdi',
  'keselarasanStudi',
  'pendapatanBekerjaUmp',
  'pendapatanBekerjaUmk',
  'pendapatanWirausahaUmp',
  'pendapatanWirausahaUmk',
  'pendapatanStudiSambilBekerjaUmp',
  'pendapatanStudiSambilBekerjaUmk',
  'pendapatanStudiSambilBerwirausahaUmp',
  'pendapatanStudiSambilBerwirausahaUmk',
] as const;

const DAPODIK_NUMBER_FIELDS = ['lamaProgram', 'usia', 'masaTungguKerja'] as const;

function mapDapodikFields(input: Record<string, any>, data: Record<string, any>) {
  for (const field of DAPODIK_TEXT_FIELDS) {
    const value = input[field];
    if (typeof value === 'string' && value.trim() !== '') data[field] = value.trim();
  }
  for (const field of DAPODIK_NUMBER_FIELDS) {
    const value = input[field];
    if (value !== undefined && value !== null && !Number.isNaN(Number(value))) data[field] = Number(value);
  }
}

function cleanStringOrNull(val: unknown): string | null {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed || trimmed === '-' || trimmed === '3674000000000000' || trimmed === '081200000000') return null;
  return trimmed;
}

async function mapCreateInput(input: MasterAlumniCreateInput) {
  const defaultPassword = input.nisn || 'alumni123';
  const passwordHash = await hashPassword(defaultPassword);

  const cleanNik = cleanStringOrNull(input.nik);
  const cleanEmail = cleanStringOrNull(input.email);
  const cleanWa = cleanStringOrNull(input.noWhatsapp || input.no_wa || input.no_whatsapp);
  const tahunLulus = input.tahunLulus || input.tahun_lulus || 2024;

  const data: Record<string, any> = {
    nisn: input.nisn.trim(),
    nik: cleanNik,
    namaLengkap: input.nama.trim(),
    jurusan: input.jurusan.trim(),
    tahunMasuk: tahunLulus - 3,
    tahunLulus,
    email: cleanEmail,
    noWhatsApp: cleanWa,
    passwordHash,
    role: 'ALUMNI' as const,
    tracerStatus: 'BELUM' as TracerStatus,
  };

  mapDapodikFields(input as unknown as Record<string, any>, data);

  return data;
}

function mapUpdateInput(input: MasterAlumniUpdateInput) {
  const data: Record<string, unknown> = {};
  if (input.nisn) data.nisn = input.nisn.trim();
  if (input.nik !== undefined) data.nik = cleanStringOrNull(input.nik);
  if (input.nama) data.namaLengkap = input.nama.trim();
  if (input.email !== undefined) data.email = cleanStringOrNull(input.email);
  if (input.jurusan) data.jurusan = input.jurusan.trim();
  if (input.tahunLulus) data.tahunLulus = input.tahunLulus;
  if (input.noWhatsapp !== undefined) data.noWhatsApp = cleanStringOrNull(input.noWhatsapp);
  mapDapodikFields(input as unknown as Record<string, any>, data);
  return data;
}

export async function createMasterAlumni(input: MasterAlumniCreateInput) {
  const cleanNisn = input.nisn.trim();
  const cleanNik = cleanStringOrNull(input.nik);
  const cleanEmail = cleanStringOrNull(input.email);

  const orConditions: Array<Record<string, string>> = [
    { nisn: cleanNisn },
  ];

  if (cleanNik) {
    orConditions.push({ nik: cleanNik });
  }

  if (cleanEmail && !cleanEmail.toLowerCase().endsWith('@example.com')) {
    orConditions.push({ email: cleanEmail });
  }

  const exists = await prisma.alumni.findFirst({
    where: { OR: orConditions },
  });

  if (exists) {
    const conflictingFields = [];
    if (exists.nisn === cleanNisn) conflictingFields.push('NISN');
    if (cleanNik && exists.nik === cleanNik) conflictingFields.push('NIK');
    if (cleanEmail && exists.email === cleanEmail) conflictingFields.push('Email');
    
    throw HttpError.conflict(`${conflictingFields.join(', ')} sudah terdaftar`);
  }

  return prisma.alumni.create({
    data: (await mapCreateInput(input)) as any,
    select: selectFields(),
  });
}

export async function getMasterAlumni(id: string) {
  const alumni = await prisma.alumni.findUnique({
    where: { id },
    select: selectFields(),
  });

  if (!alumni) throw HttpError.notFound('Data alumni tidak ditemukan');
  return alumni;
}

export async function listMasterAlumni(query: ListQueryInput) {
  const { page, limit, search, jurusan, statusTracer, tahunLulus, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    role: 'ALUMNI',
  };

  if (search) {
    where.OR = [
      { namaLengkap: { contains: search } },
      { nisn: { contains: search } },
      { nik: { contains: search } },
    ];
  }

  if (jurusan && jurusan !== 'ALL') where.jurusan = jurusan;
  if (statusTracer && statusTracer !== 'ALL' as any) where.tracerStatus = statusTracer;
  if (tahunLulus) where.tahunLulus = tahunLulus;

  const [data, total] = await Promise.all([
    prisma.alumni.findMany({
      where,
      select: selectFields(),
      skip,
      take: limit,
      orderBy: { [sortBy === 'nama' ? 'namaLengkap' : sortBy]: sortOrder },
    }),
    prisma.alumni.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function updateMasterAlumni(id: string, input: MasterAlumniUpdateInput) {
  const exists = await prisma.alumni.findUnique({ where: { id } });
  if (!exists) throw HttpError.notFound('Data alumni tidak ditemukan');

  if (input.nisn && input.nisn.trim() !== exists.nisn) {
    const duplicate = await prisma.alumni.findUnique({ where: { nisn: input.nisn.trim() } });
    if (duplicate) throw HttpError.conflict('NISN sudah digunakan oleh alumni lain');
  }

  const cleanNik = cleanStringOrNull(input.nik);
  if (cleanNik && cleanNik !== exists.nik) {
    const duplicate = await prisma.alumni.findUnique({ where: { nik: cleanNik } });
    if (duplicate) throw HttpError.conflict('NIK sudah digunakan oleh alumni lain');
  }

  const cleanEmail = cleanStringOrNull(input.email);
  if (cleanEmail && cleanEmail !== exists.email) {
    const duplicate = await prisma.alumni.findUnique({ where: { email: cleanEmail } });
    if (duplicate) throw HttpError.conflict('Email sudah digunakan oleh alumni lain');
  }

  return prisma.alumni.update({
    where: { id },
    data: mapUpdateInput(input) as any,
    select: selectFields(),
  });
}

export async function deleteMasterAlumni(id: string) {
  // Dukung penghapusan via id cuid maupun via NISN
  const exists = await prisma.alumni.findFirst({
    where: {
      OR: [{ id }, { nisn: id }],
    },
  });
  if (!exists) throw HttpError.notFound('Data alumni tidak ditemukan');

  await prisma.alumni.delete({ where: { id: exists.id } });
  return { success: true };
}

export async function importMasterAlumni(input: ImportCsvInput) {
  const { records, skipDuplicates } = input;
  let imported = 0;
  let duplicates = 0;
  let invalid = 0;
  const errors: Array<{ nisn: string; messages: string[] }> = [];

  for (const rawRecord of records) {
    const raw = (rawRecord || {}) as Record<string, any>;
    // Normalisasi field jika menggunakan penamaan snake_case dari excel
    const normalizedRecord = {
      ...raw,
      nisn: String(raw.nisn ?? '').trim(),
      nama: String(raw.nama ?? raw.namaLengkap ?? raw.nama_lengkap ?? '').trim(),
      jurusan: String(raw.jurusan ?? '').trim(),
      tahunLulus: raw.tahunLulus ?? raw.tahun_lulus ?? 2024,
      noWhatsapp: raw.noWhatsapp ?? raw.no_wa ?? raw.no_whatsapp ?? '',
      nik: raw.nik ? String(raw.nik).trim() : '',
      email: raw.email ? String(raw.email).trim() : '',
    };

    const parsed = masterAlumniCreateSchema.safeParse(normalizedRecord);
    if (!parsed.success) {
      invalid++;
      const messages = parsed.error.issues.map((issue) => {
        const path = issue.path.join('.');
        return path ? `${path}: ${issue.message}` : issue.message;
      });
      errors.push({
        nisn: normalizedRecord.nisn || '-',
        messages,
      });
      continue;
    }

    const record = parsed.data;
    try {
      await createMasterAlumni(record);
      imported++;
    } catch (err) {
      if (err instanceof HttpError && err.code === 'CONFLICT') {
        duplicates++;
        if (!skipDuplicates) throw err;
      } else {
        invalid++;
        errors.push({
          nisn: record.nisn,
          messages: [err instanceof Error ? err.message : 'Gagal menyimpan data'],
        });
      }
    }
  }

  return { importedCount: imported, duplicateCount: duplicates, invalidCount: invalid, errors: errors.slice(0, 25) };
}

export async function getStats() {
  const [total, sudah, belum, byJurusan, byTahun] = await Promise.all([
    prisma.alumni.count({ where: { role: 'ALUMNI' } }),
    prisma.alumni.count({ where: { role: 'ALUMNI', tracerStatus: 'SUDAH' } }),
    prisma.alumni.count({ where: { role: 'ALUMNI', tracerStatus: 'BELUM' } }),
    prisma.alumni.groupBy({
      by: ['jurusan'],
      where: { role: 'ALUMNI' },
      _count: true,
    }),
    prisma.alumni.groupBy({
      by: ['tahunLulus'],
      where: { role: 'ALUMNI' },
      _count: true,
    }),
  ]);

  return {
    total,
    sudahMengisi: sudah,
    belumMengisi: belum,
    responseRate: total > 0 ? Math.round((sudah / total) * 100) : 0,
    byJurusan: byJurusan.map((j) => ({ jurusan: j.jurusan, count: j._count })),
    byTahun: byTahun.map((t) => ({ tahun: t.tahunLulus, count: t._count })),
  };
}

function selectFields() {
  return {
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
    createdAt: true,
    namaSekolah: true,
    npsn: true,
    statusSekolah: true,
    kompKeahlian: true,
    progKeahlian: true,
    bidKeahlian: true,
    lamaProgram: true,
    provinsiSmk: true,
    kabKotaSmk: true,
    jenisKelamin: true,
    usia: true,
    statusMenikah: true,
    provinsiDomisili: true,
    kotaDomisili: true,
    noHp: true,
    statusAktivitas: true,
    keterangan: true,
    masaTungguKerja: true,
    sertifikatKompetensi: true,
    jabatanKerja: true,
    namaTempatKerja: true,
    provinsiKerja: true,
    kotaKerja: true,
    negaraKerja: true,
    keselarasanKerja: true,
    provinsiUsaha: true,
    kotaUsaha: true,
    negaraUsaha: true,
    bidangUsaha: true,
    jenisUsaha: true,
    keselarasanUsaha: true,
    namaProdukUsaha: true,
    jenjangPendidikan: true,
    namaPerguruanTinggi: true,
    namaProdi: true,
    keselarasanStudi: true,
    pendapatanBekerjaUmp: true,
    pendapatanBekerjaUmk: true,
    pendapatanWirausahaUmp: true,
    pendapatanWirausahaUmk: true,
    pendapatanStudiSambilBekerjaUmp: true,
    pendapatanStudiSambilBekerjaUmk: true,
    pendapatanStudiSambilBerwirausahaUmp: true,
    pendapatanStudiSambilBerwirausahaUmk: true,
  };
}
