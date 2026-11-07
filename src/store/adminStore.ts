// Auto-purge stale demo localStorage
if (typeof window !== "undefined") {
  try {
    [
      "tracer_study_admin_sasmita2",
      "tracer_study_admin_store",
      "tracer_study_content_store",
    ].forEach((k) => {
      if (localStorage.getItem(k)) localStorage.removeItem(k);
    });
  } catch (e) {}
}

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  TracerSubmissionPayload,
  JurusanSMK,
  StatusKegiatan,
} from "@/types/tracer";
import {
  INITIAL_MASTER_ALUMNI,
  INITIAL_RESPONDENTS,
} from "@/data/initialAlumniData";

export interface MasterAlumniRecord {
  id: string;
  nisn: string;
  nik: string;
  nama: string;
  jurusan: JurusanSMK;
  tahunLulus: number;
  noWhatsapp: string;
  email: string;
  statusTracer: "SUDAH" | "BELUM";
  submissionId?: string;
  submittedAt?: string;
  jenisKelamin?: "L" | "P";
  createdAt: string;
}

export type VerificationStatus = "PENDING" | "VALID" | "REVISI";

export interface RespondentRecord {
  id: string;
  submissionId: string;
  nisn: string;
  nik: string;
  nama: string;
  jurusan: JurusanSMK;
  tahunLulus: number;
  noWhatsapp: string;
  email: string;
  statusKegiatan: StatusKegiatan;
  instansiKampusUsaha: string;
  jabatanProdiUsaha: string;
  submittedAt: string;
  verificationStatus: VerificationStatus;
  verificationNote?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  jenisKelamin?: "L" | "P";
  fullPayload: TracerSubmissionPayload;
}

export interface AdminSettings {
  targetQuota: number;
  targetYear: number;
  periodStart: string;
  periodEnd: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  ketuaBkk: string;
  nipKetuaBkk: string;
  namaSekolah: string;
  npsn: string;
  alamatSekolah: string;
  kontakBkk: string;
  yearlyTargets?: Record<number, number>;
}

interface AdminState {
  masterAlumni: MasterAlumniRecord[];
  respondents: RespondentRecord[];
  settings: AdminSettings;

  // Actions
  importMasterAlumni: (
    records: Omit<MasterAlumniRecord, "id" | "createdAt" | "statusTracer">[],
  ) => {
    importedCount: number;
    duplicateCount: number;
  };
  addSingleMasterAlumni: (
    record: Omit<MasterAlumniRecord, "id" | "createdAt" | "statusTracer">,
  ) => boolean;
  deleteMasterAlumni: (id: string) => void;
  updateMasterAlumni: (
    id: string,
    updates: Partial<MasterAlumniRecord>,
  ) => void;

  updateVerificationStatus: (
    submissionId: string,
    status: VerificationStatus,
    note?: string,
    verifiedBy?: string,
  ) => void;

  addOrUpdateRespondent: (
    payload: TracerSubmissionPayload,
    submissionId: string,
  ) => void;
  updateSettings: (updates: Partial<AdminSettings>) => void;
  resetToDefaultData: () => void;

  // Backend Sync Actions
  fetchMasterAlumniFromBackend: () => Promise<boolean>;
  fetchRespondentsFromBackend: () => Promise<boolean>;
  fetchSettingsFromBackend: () => Promise<boolean>;
  syncAllFromBackend: () => Promise<void>;
}

const DEFAULT_SETTINGS: AdminSettings = {
  targetQuota: 250,
  targetYear: 2025,
  periodStart: "2026-08-01",
  periodEnd: "2026-11-30",
  kepalaSekolah: "Siti Zubaidah, S.E., S.Pd., M.Pd.I",
  nipKepalaSekolah: "19680514 199303 1 004",
  ketuaBkk: "",
  nipKetuaBkk: "",
  namaSekolah: "SMKS Sasmita Jaya 2",
  npsn: "20603287",
  alamatSekolah:
    "Jl. Surya Kencana No. 1, Pamulang Barat, Kec. Pamulang, Kota Tangerang Selatan, Banten 15417",
  kontakBkk: "0812-8889-7762",
  yearlyTargets: {
    2025: 250,
  },
};

export const SYNCED_MASTER_KEY = "alumni_synced_master_cache";
export const SYNCED_RESPONDENTS_KEY = "alumni_synced_respondents_cache";
export const SYNCED_SETTINGS_KEY = "alumni_synced_settings_cache";

function getInitialMasterAlumni(): MasterAlumniRecord[] {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(SYNCED_MASTER_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
  }
  return INITIAL_MASTER_ALUMNI;
}

function getInitialRespondents(): RespondentRecord[] {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(SYNCED_RESPONDENTS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
  }
  // Kosongkan initial state jika belum ada cache agar tidak menampilkan flash dummy 222 data
  return [];
}

function getInitialSettings(): AdminSettings {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(SYNCED_SETTINGS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") {
          return { ...DEFAULT_SETTINGS, ...parsed };
        }
      }
    } catch {}
  }
  return DEFAULT_SETTINGS;
}

export const useAdminStore = create<AdminState>()((set, get) => ({
  masterAlumni: getInitialMasterAlumni(),
  respondents: getInitialRespondents(),
  settings: getInitialSettings(),

  importMasterAlumni: (records) => {
    const currentList = get().masterAlumni;
    const currentNisns = new Set(currentList.map((a) => a.nisn.trim()));
    let importedCount = 0;
    let duplicateCount = 0;

    const newEntries: MasterAlumniRecord[] = [];

    records.forEach((rec, idx) => {
      const cleanNisn = (rec.nisn || "").trim();
      if (!cleanNisn) return;

      if (currentNisns.has(cleanNisn)) {
        duplicateCount++;
      } else {
        currentNisns.add(cleanNisn);
        importedCount++;
        const cleanNik =
          rec.nik && rec.nik !== "-" && rec.nik !== "3674000000000000"
            ? rec.nik
            : "";
        const cleanWa =
          rec.noWhatsapp &&
          rec.noWhatsapp !== "-" &&
          rec.noWhatsapp !== "081200000000"
            ? rec.noWhatsapp
            : "";
        const cleanEmail =
          rec.email &&
          rec.email !== "-" &&
          !rec.email.toLowerCase().endsWith("@example.com")
            ? rec.email
            : "";

        newEntries.push({
          ...rec,
          nik: cleanNik,
          noWhatsapp: cleanWa,
          email: cleanEmail,
          id: `mst-imp-${Date.now()}-${idx}`,
          statusTracer: "BELUM",
          createdAt: new Date().toISOString(),
        });
      }
    });

    if (newEntries.length > 0) {
      set({ masterAlumni: [...newEntries, ...currentList] });
    }

    return { importedCount, duplicateCount };
  },

  addSingleMasterAlumni: (record) => {
    const currentList = get().masterAlumni;
    const cleanNisn = (record.nisn || "").trim();
    if (currentList.some((a) => a.nisn === cleanNisn)) {
      return false;
    }

    const cleanNik =
      record.nik && record.nik !== "-" && record.nik !== "3674000000000000"
        ? record.nik
        : "";
    const cleanWa =
      record.noWhatsapp &&
      record.noWhatsapp !== "-" &&
      record.noWhatsapp !== "081200000000"
        ? record.noWhatsapp
        : "";
    const cleanEmail =
      record.email &&
      record.email !== "-" &&
      !record.email.toLowerCase().endsWith("@example.com")
        ? record.email
        : "";

    const newRecord: MasterAlumniRecord = {
      ...record,
      nik: cleanNik,
      noWhatsapp: cleanWa,
      email: cleanEmail,
      id: `mst-single-${Date.now()}`,
      statusTracer: "BELUM",
      createdAt: new Date().toISOString(),
    };

    set({ masterAlumni: [newRecord, ...currentList] });
    return true;
  },

  deleteMasterAlumni: (id) => {
    set((state) => ({
      masterAlumni: state.masterAlumni.filter((a) => a.id !== id),
    }));
  },

  updateMasterAlumni: (id, updates) => {
    set((state) => ({
      masterAlumni: state.masterAlumni.map((a) =>
        a.id === id ? { ...a, ...updates } : a,
      ),
    }));
  },

  updateVerificationStatus: (
    submissionId,
    status,
    note,
    verifiedBy = "Admin BKK Sasmita",
  ) => {
    set((state) => {
      const updatedRespondents = state.respondents.map((rsp) => {
        if (rsp.submissionId === submissionId) {
          return {
            ...rsp,
            verificationStatus: status,
            verificationNote: note,
            verifiedAt: new Date().toISOString(),
            verifiedBy,
          };
        }
        return rsp;
      });

      return { respondents: updatedRespondents };
    });
  },

  addOrUpdateRespondent: (payload, submissionId) => {
    set((state) => {
      const existingIdx = state.respondents.findIndex(
        (r) => r.submissionId === submissionId,
      );
      const instansi =
        payload.detail_kerja?.nama_perusahaan ||
        payload.detail_kuliah?.nama_kampus ||
        payload.detail_usaha?.nama_usaha ||
        (payload.status_kegiatan === "BELUM_KERJA"
          ? "Pencari Kerja Aktif"
          : "-");

      const jabatan =
        payload.detail_kerja?.jabatan ||
        payload.detail_kuliah?.program_studi ||
        payload.detail_usaha?.bidang_usaha ||
        (payload.status_kegiatan === "BELUM_KERJA" ? "Pencari Kerja" : "-");

      const newRespondent: RespondentRecord = {
        id: `rsp-${Date.now()}`,
        submissionId,
        nisn: payload.identitas.nisn,
        nik: payload.identitas.nik || "",
        nama: payload.identitas.nama_lengkap,
        jurusan: payload.identitas.jurusan,
        tahunLulus: payload.identitas.tahun_lulus,
        noWhatsapp: payload.identitas.no_whatsapp,
        email: payload.identitas.email,
        statusKegiatan: payload.status_kegiatan,
        instansiKampusUsaha: instansi,
        jabatanProdiUsaha: jabatan,
        submittedAt: new Date().toISOString(),
        verificationStatus: "VALID",
        fullPayload: payload,
      };

      let updatedRespondents = [...state.respondents];
      if (existingIdx >= 0) {
        updatedRespondents[existingIdx] = {
          ...updatedRespondents[existingIdx],
          ...newRespondent,
        };
      } else {
        updatedRespondents = [newRespondent, ...updatedRespondents];
      }

      // Also update masterAlumni statusTracer to SUDAH and populate real details
      const updatedMaster = state.masterAlumni.map((m) => {
        if (m.nisn === payload.identitas.nisn) {
          return {
            ...m,
            nik:
              payload.identitas.nik && payload.identitas.nik !== "-"
                ? payload.identitas.nik
                : m.nik || "",
            noWhatsapp:
              payload.identitas.no_whatsapp &&
              payload.identitas.no_whatsapp !== "-"
                ? payload.identitas.no_whatsapp
                : m.noWhatsapp || "",
            email:
              payload.identitas.email && payload.identitas.email !== "-"
                ? payload.identitas.email
                : m.email || "",
            statusTracer: "SUDAH" as const,
            submissionId,
            submittedAt: new Date().toISOString(),
          };
        }
        return m;
      });

      return {
        respondents: updatedRespondents,
        masterAlumni: updatedMaster,
      };
    });
  },

  updateSettings: (updates) => {
    set((state) => {
      const newSettings = { ...state.settings, ...updates };
      const yr = newSettings.targetYear;
      const quota = newSettings.targetQuota;
      const updatedYearly: Record<number, number> = {
        ...(state.settings.yearlyTargets || {}),
        ...(updates.yearlyTargets || {}),
        ...(yr && quota ? { [Number(yr)]: Number(quota) } : {}),
      };
      newSettings.yearlyTargets = updatedYearly;
      return { settings: newSettings };
    });
  },

  resetToDefaultData: () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(SYNCED_MASTER_KEY);
        localStorage.removeItem(SYNCED_RESPONDENTS_KEY);
        localStorage.removeItem(SYNCED_SETTINGS_KEY);
      } catch {}
    }
    set({
      masterAlumni: INITIAL_MASTER_ALUMNI,
      respondents: INITIAL_RESPONDENTS,
      settings: DEFAULT_SETTINGS,
    });
  },

  fetchMasterAlumniFromBackend: async () => {
    try {
      const { adminMasterAlumniApi } = await import("@/services/adminService");
      let res: any = null;
      try {
        res = await adminMasterAlumniApi.list({ limit: 1000 });
      } catch {
        res = await adminMasterAlumniApi.listPublic({ limit: 1000 });
      }
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: MasterAlumniRecord[] = res.data.map((item: any) => ({
          id: item.id || `mst-${item.nisn}`,
          nisn: item.nisn,
          nik: item.nik || "",
          nama: item.namaLengkap || item.nama,
          jurusan: item.jurusan,
          tahunLulus: Number(item.tahunLulus),
          noWhatsapp: item.noWhatsApp || item.noWhatsapp || "",
          email: item.email || "",
          statusTracer: item.tracerStatus === "SUDAH" ? "SUDAH" : "BELUM",
          submissionId: item.submissionId || undefined,
          submittedAt: item.submittedAt || undefined,
          createdAt: item.createdAt || new Date().toISOString(),
        }));
        set({ masterAlumni: mapped });
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(SYNCED_MASTER_KEY, JSON.stringify(mapped));
          } catch {}
        }
        return true;
      }
    } catch (err) {
      console.warn(
        "[AdminStore] Fetch master alumni from backend fallback:",
        err,
      );
    }
    return false;
  },

  fetchRespondentsFromBackend: async () => {
    try {
      const { adminVerificationApi } = await import("@/services/adminService");
      let res: any = null;
      try {
        res = await adminVerificationApi.list({ limit: 1000 });
      } catch {
        res = await adminVerificationApi.listPublic({ limit: 1000 });
      }
      if (
        (!res || !res.data || !Array.isArray(res.data) || res.data.length === 0) &&
        adminVerificationApi.listPublic
      ) {
        res = await adminVerificationApi.listPublic({ limit: 1000 });
      }
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: RespondentRecord[] = res.data.map((item: any) => {
          const alumni = item.alumni || {};
          const detailKerja = item.detailKerja || {};
          const detailKuliah = item.detailKuliah || {};
          const detailUsaha = item.detailUsaha || {};

          const instansi =
            detailKerja.nama_perusahaan ||
            detailKuliah.nama_kampus ||
            detailUsaha.nama_usaha ||
            (item.statusKegiatan === "BELUM_KERJA"
              ? "Pencari Kerja Aktif"
              : "-");

          const jabatan =
            detailKerja.jabatan ||
            detailKuliah.program_studi ||
            detailUsaha.bidang_usaha ||
            (item.statusKegiatan === "BELUM_KERJA" ? "Pencari Kerja" : "-");

          return {
            id: item.id || `rsp-${item.submissionId}`,
            submissionId: item.submissionId,
            nisn: alumni.nisn || "",
            nik: alumni.nik || "",
            nama: alumni.namaLengkap || alumni.nama || "",
            jurusan: alumni.jurusan || "Teknik Komputer dan Jaringan",
            tahunLulus: Number(alumni.tahunLulus) || 2024,
            noWhatsapp: alumni.noWhatsApp || alumni.noWhatsapp || "",
            email: alumni.email || "",
            statusKegiatan: item.statusKegiatan,
            instansiKampusUsaha: instansi,
            jabatanProdiUsaha: jabatan,
            submittedAt: item.submittedAt || new Date().toISOString(),
            verificationStatus: item.verificationStatus || "PENDING",
            verificationNote: item.verificationNote || undefined,
            verifiedAt: item.verifiedAt || undefined,
            verifiedBy: item.verifiedBy || undefined,
            fullPayload: {
              identitas: {
                nama_lengkap: alumni.namaLengkap || "",
                nisn: alumni.nisn || "",
                nik: alumni.nik || "",
                tahun_lulus: Number(alumni.tahunLulus) || 2024,
                jurusan: alumni.jurusan,
                tahun_masuk: (Number(alumni.tahunLulus) || 2024) - 3,
                no_whatsapp: alumni.noWhatsApp || "",
                email: alumni.email || "",
                jenis_kelamin: "Laki-laki",
              },
              status_kegiatan: item.statusKegiatan,
              masa_tunggu: item.masaTunggu || "< 3 bulan",
              detail_kerja: item.detailKerja || null,
              detail_kuliah: item.detailKuliah || null,
              detail_usaha: item.detailUsaha || null,
              evaluasi: item.evaluasi || {},
            },
          };
        });
        set({ respondents: mapped });
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(SYNCED_RESPONDENTS_KEY, JSON.stringify(mapped));
          } catch {}
        }
        return true;
      }
    } catch (err) {
      console.warn(
        "[AdminStore] Fetch respondents from backend fallback:",
        err,
      );
    }
    return false;
  },

  fetchSettingsFromBackend: async () => {
    try {
      const { adminSettingsApi } = await import("@/services/adminService");
      const res = await adminSettingsApi.get();
      const settingsData = res?.data;
      if (settingsData) {
        set((state) => ({
          settings: {
            ...state.settings,
            ...settingsData,
            periodStart:
              typeof settingsData.periodStart === "string"
                ? settingsData.periodStart.split("T")[0]
                : state.settings.periodStart,
            periodEnd:
              typeof settingsData.periodEnd === "string"
                ? settingsData.periodEnd.split("T")[0]
                : state.settings.periodEnd,
          },
        }));
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(SYNCED_SETTINGS_KEY, JSON.stringify(settingsData));
          } catch {}
        }
        return true;
      }
    } catch (err) {
      console.warn("[AdminStore] Fetch settings from backend fallback:", err);
    }
    return false;
  },

  syncAllFromBackend: async () => {
    await Promise.allSettled([
      get().fetchMasterAlumniFromBackend(),
      get().fetchRespondentsFromBackend(),
      get().fetchSettingsFromBackend(),
    ]);
  },
}));
