import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../core/utils/errors.js';
import { hashPassword } from '../../core/utils/password.js';
import { TracerSubmitInput, ListQueryInput } from './schemas.js';
import { StatusKegiatan, Prisma } from '@prisma/client';

function generateSubmissionCode(): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000).toString();
  return `${year}${month}${random}`;
}

function normalizeStatusKegiatan(status: string): StatusKegiatan {
  const map: Record<string, StatusKegiatan> = {
    KERJA: 'KERJA',
    KULIAH: 'KULIAH',
    WIRAUSAHA: 'WIRAUSAHA',
    KERJA_KULIAH: 'KERJA_KULIAH',
    WIRAUSAHA_KULIAH: 'WIRAUSAHA_KULIAH',
    BELUM_KERJA: 'BELUM_KERJA',
  };
  return map[status] || 'BELUM_KERJA';
}

export async function submitTracer(userIdOrNull: string | undefined, input: TracerSubmitInput) {
  let alumniId = userIdOrNull;

  // Jika userId tidak ada (misal token tidak terkirim), cari alumni dari NISN atau email
  if (!alumniId && input.identitas?.nisn) {
    const existingAlumni = await prisma.alumni.findFirst({
      where: {
        OR: [
          { nisn: input.identitas.nisn },
          ...(input.identitas.email ? [{ email: input.identitas.email }] : []),
        ],
      },
    });

    if (existingAlumni) {
      alumniId = existingAlumni.id;
    } else {
      // Auto-create record alumni baru agar tracer tetap tersimpan di database
      const defaultPassword = await hashPassword('Alumni#12345');
      const newAlumni = await prisma.alumni.create({
        data: {
          nisn: input.identitas.nisn,
          namaLengkap: input.identitas.nama_lengkap || 'Alumni Sasmita',
          email: input.identitas.email || null,
          passwordHash: defaultPassword,
          jurusan: input.identitas.jurusan || 'Teknik Komputer dan Jaringan',
          tahunMasuk: input.identitas.tahun_masuk || 2021,
          tahunLulus: input.identitas.tahun_lulus || 2024,
          noWhatsApp: input.identitas.no_whatsapp || null,
          nik: input.identitas.nik || null,
          role: 'ALUMNI',
        },
      });
      alumniId = newAlumni.id;
    }
  }

  if (!alumniId) {
    throw HttpError.badRequest('Identitas alumni (NISN) wajib disertakan');
  }

  const alumni = await prisma.alumni.findUnique({ where: { id: alumniId } });
  if (!alumni) throw HttpError.notFound('Data alumni tidak ditemukan');

  const existing = await prisma.tracerSubmission.findFirst({
    where: { alumniId },
    orderBy: { submittedAt: 'desc' },
  });

  if (existing && existing.verificationStatus === 'VALID') {
    throw HttpError.conflict('Kuesioner tracer study Anda sudah divalidasi oleh admin dan tidak dapat diubah kembali.');
  }

  const normalizedStatus = normalizeStatusKegiatan(input.status_kegiatan);

  const submission = await prisma.$transaction(async (tx) => {
    // Jika sudah ada dan masih PENDING / REVISI, update submission tersebut
    if (existing) {
      const sub = await tx.tracerSubmission.update({
        where: { id: existing.id },
        data: {
          statusKegiatan: normalizedStatus,
          masaTunggu: input.masa_tunggu ?? null,
          detailKerja: input.detail_kerja ? (input.detail_kerja as Prisma.InputJsonValue) : Prisma.JsonNull,
          detailKuliah: input.detail_kuliah ? (input.detail_kuliah as Prisma.InputJsonValue) : Prisma.JsonNull,
          detailUsaha: input.detail_usaha ? (input.detail_usaha as Prisma.InputJsonValue) : Prisma.JsonNull,
          evaluasi: (input.evaluasi ?? {}) as Prisma.InputJsonValue,
          verificationStatus: 'PENDING',
          verificationNote: null,
          verifiedAt: null,
          verifiedBy: null,
          submittedAt: new Date(),
        },
      });

      await tx.alumni.update({
        where: { id: alumniId },
        data: {
          tracerStatus: 'SUDAH',
          submissionId: sub.submissionId,
          submittedAt: sub.submittedAt,
          ...(input.detail_kerja?.nama_perusahaan ? { pekerjaan: input.detail_kerja.nama_perusahaan } : {}),
          ...(input.detail_kuliah?.nama_kampus ? { kampus: input.detail_kuliah.nama_kampus } : {}),
          ...(input.detail_usaha?.nama_usaha ? { pekerjaan: input.detail_usaha.nama_usaha } : {}),
        },
      });

      return sub;
    }

    // Submission baru
    const submissionId = generateSubmissionCode();
    const sub = await tx.tracerSubmission.create({
      data: {
        alumniId,
        statusKegiatan: normalizedStatus,
        masaTunggu: input.masa_tunggu ?? null,
        detailKerja: input.detail_kerja ? (input.detail_kerja as Prisma.InputJsonValue) : Prisma.JsonNull,
        detailKuliah: input.detail_kuliah ? (input.detail_kuliah as Prisma.InputJsonValue) : Prisma.JsonNull,
        detailUsaha: input.detail_usaha ? (input.detail_usaha as Prisma.InputJsonValue) : Prisma.JsonNull,
        evaluasi: (input.evaluasi ?? {}) as Prisma.InputJsonValue,
        submissionId,
      },
    });

    await tx.alumni.update({
      where: { id: alumniId },
      data: {
        tracerStatus: 'SUDAH',
        submissionId,
        submittedAt: new Date(),
        ...(input.detail_kerja?.nama_perusahaan ? { pekerjaan: input.detail_kerja.nama_perusahaan } : {}),
        ...(input.detail_kuliah?.nama_kampus ? { kampus: input.detail_kuliah.nama_kampus } : {}),
        ...(input.detail_usaha?.nama_usaha ? { pekerjaan: input.detail_usaha.nama_usaha } : {}),
      },
    });

    return sub;
  });

  return {
    submissionId: submission.submissionId,
    submittedAt: submission.submittedAt,
    submission_id: submission.submissionId,
    submitted_at: submission.submittedAt,
  };
}

export async function getMySubmission(userId: string) {
  const submission = await prisma.tracerSubmission.findFirst({
    where: { alumniId: userId },
    orderBy: { submittedAt: 'desc' },
  });

  if (!submission) return null;

  return {
    ...submission,
    detailKerja: submission.detailKerja as Record<string, unknown> | null,
    detailKuliah: submission.detailKuliah as Record<string, unknown> | null,
    detailUsaha: submission.detailUsaha as Record<string, unknown> | null,
    evaluasi: submission.evaluasi as Record<string, unknown>,
  };
}

export async function listSubmissions(query: ListQueryInput) {
  const { page, limit, statusKegiatan, verificationStatus, tahunLulus, jurusan, search, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (statusKegiatan) where.statusKegiatan = statusKegiatan;
  if (verificationStatus) where.verificationStatus = verificationStatus;
  if (tahunLulus) where.alumni = { tahunLulus };
  if (jurusan) where.alumni = { ...(where.alumni as object), jurusan };
  if (search) {
    where.OR = [
      { alumni: { namaLengkap: { contains: search } } },
      { alumni: { nisn: { contains: search } } },
      { submissionId: { contains: search } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.tracerSubmission.findMany({
      where,
      include: {
        alumni: {
          select: { id: true, nisn: true, namaLengkap: true, jurusan: true, tahunLulus: true, email: true, noWhatsApp: true },
        },
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.tracerSubmission.count({ where }),
  ]);

  return {
    data: data.map((s) => ({
      ...s,
      detailKerja: s.detailKerja as Record<string, unknown> | null,
      detailKuliah: s.detailKuliah as Record<string, unknown> | null,
      detailUsaha: s.detailUsaha as Record<string, unknown> | null,
      evaluasi: s.evaluasi as Record<string, unknown>,
    })),
    total,
    page,
    limit,
  };
}

export async function getSubmissionById(id: string) {
  const submission = await prisma.tracerSubmission.findUnique({
    where: { id },
    include: {
      alumni: {
        select: { id: true, nisn: true, nik: true, namaLengkap: true, email: true, jurusan: true, tahunMasuk: true, tahunLulus: true, noWhatsApp: true, jenisKelamin: true },
      },
    },
  });

  if (!submission) throw HttpError.notFound('Submission tidak ditemukan');

  return {
    ...submission,
    detailKerja: submission.detailKerja as Record<string, unknown> | null,
    detailKuliah: submission.detailKuliah as Record<string, unknown> | null,
    detailUsaha: submission.detailUsaha as Record<string, unknown> | null,
    evaluasi: submission.evaluasi as Record<string, unknown>,
  };
}

export async function getSubmissionByCode(submissionId: string) {
  const submission = await prisma.tracerSubmission.findUnique({
    where: { submissionId },
    include: {
      alumni: {
        select: { id: true, nisn: true, nik: true, namaLengkap: true, email: true, jurusan: true, tahunMasuk: true, tahunLulus: true, noWhatsApp: true, jenisKelamin: true },
      },
    },
  });

  if (!submission) throw HttpError.notFound('Submission tidak ditemukan');

  return {
    ...submission,
    detailKerja: submission.detailKerja as Record<string, unknown> | null,
    detailKuliah: submission.detailKuliah as Record<string, unknown> | null,
    detailUsaha: submission.detailUsaha as Record<string, unknown> | null,
    evaluasi: submission.evaluasi as Record<string, unknown>,
  };
}

export async function getStats() {
  const [total, byStatus, byVerification, byJurusan] = await Promise.all([
    prisma.tracerSubmission.count(),
    prisma.tracerSubmission.groupBy({ by: ['statusKegiatan'], _count: true }),
    prisma.tracerSubmission.groupBy({ by: ['verificationStatus'], _count: true }),
    prisma.tracerSubmission.findMany({ include: { alumni: { select: { jurusan: true } } } }),
  ]);

  const jurusanCount: Record<string, number> = {};
  for (const s of byJurusan) {
    jurusanCount[s.alumni.jurusan] = (jurusanCount[s.alumni.jurusan] || 0) + 1;
  }

  return {
    total,
    byStatus: byStatus.map((s) => ({ status: s.statusKegiatan, count: s._count })),
    byVerification: byVerification.map((v) => ({ status: v.verificationStatus, count: v._count })),
    byJurusan: Object.entries(jurusanCount).map(([jurusan, count]) => ({ jurusan, count })),
  };
}
