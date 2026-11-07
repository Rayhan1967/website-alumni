import { useAuthStore } from '@/store/authStore';
import { MasterAlumniRecord, RespondentRecord, VerificationStatus, AdminSettings } from '@/store/adminStore';
import { NewsItem, JobVacancy } from '@/types/tracer';
import { MailItem } from '@/store/mailStore';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

// Access token hanya berlaku 15 menit. Jika kedaluwarsa saat admin sedang
// membuka dashboard, request akan ditolak 401 dan data tidak termuat.
// Helper di bawah memastikan token selalu disegarkan sebelum dipakai.

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string | null, bufferMs = 60000): boolean {
  if (!token) return false;
  const exp = getTokenExpiry(token);
  if (!exp) return false;
  return Date.now() + bufferMs >= exp;
}

let refreshPromise: Promise<boolean> | null = null;

async function ensureFreshAccessToken(): Promise<string | null> {
  const { accessToken, refreshAccessToken } = useAuthStore.getState();
  if (accessToken && accessToken.startsWith('mock-')) return accessToken;
  if (!isTokenExpired(accessToken)) return accessToken;

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  const refreshed = await refreshPromise;
  return refreshed ? useAuthStore.getState().accessToken : accessToken;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  errors?: Record<string, string[]>;
}

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const freshToken = await ensureFreshAccessToken();
  const base = API_BASE || '';

  const isDeleteNoBody = options.method === 'DELETE' && (!options.body || options.body === '');

  const headers: Record<string, string> = {
    ...(isDeleteNoBody ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  if (freshToken && !freshToken.startsWith('mock-')) {
    headers['Authorization'] = `Bearer ${freshToken}`;
  }

  const res = await fetch(`${base}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Token ditolak (mis. kedaluwarsa tepat sebelum request dikirim):
  // segarkan sekali lalu ulangi request.
  if (res.status === 401 && !isRetry && !endpoint.includes('/auth/')) {
    const refreshed = await useAuthStore.getState().refreshAccessToken();
    if (refreshed) {
      return fetchWithAuth<T>(endpoint, options, true);
    }
    console.warn('[AdminService] Sesi kedaluwarsa dan gagal diperbarui, silakan login ulang.');
  }

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({ message: `HTTP ${res.status}: ${res.statusText}` }));
    console.error('[AdminService] fetchWithAuth error:', res.status, errorJson);
    throw new Error(errorJson.message || `Request failed with status ${res.status}`);
  }

  // Handle 204 No Content
  if (res.status === 204) return { success: true } as T;

  return await res.json();
}

// ----------------------------------------------------
// 1. Master Alumni API
// ----------------------------------------------------
export const adminMasterAlumniApi = {
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    jurusan?: string;
    statusTracer?: 'SUDAH' | 'BELUM';
    tahunLulus?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.jurusan && params.jurusan !== 'ALL') query.append('jurusan', params.jurusan);
    if (params?.statusTracer && params.statusTracer !== 'ALL' as any) query.append('statusTracer', params.statusTracer);
    if (params?.tahunLulus) query.append('tahunLulus', params.tahunLulus.toString());
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchWithAuth<ApiResponse<any[]>>(`/api/v1/master-alumni${queryString}`);
  },

  async listPublic(params?: {
    page?: number;
    limit?: number;
    search?: string;
    jurusan?: string;
    statusTracer?: 'SUDAH' | 'BELUM';
    tahunLulus?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.jurusan && params.jurusan !== 'ALL') query.append('jurusan', params.jurusan);
    if (params?.statusTracer && params.statusTracer !== 'ALL' as any) query.append('statusTracer', params.statusTracer);
    if (params?.tahunLulus) query.append('tahunLulus', params.tahunLulus.toString());
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const base = API_BASE || '';
    const res = await fetch(`${base}/api/v1/public/alumni${queryString}`);
    return await res.json();
  },

  async getById(id: string) {
    return fetchWithAuth<ApiResponse<any>>(`/api/v1/master-alumni/${id}`);
  },

  async create(data: {
    nisn: string;
    nik?: string;
    nama: string;
    jurusan: string;
    tahunLulus: number;
    noWhatsapp?: string;
    email?: string;
    [key: string]: any;
  }) {
    try {
      return await fetchWithAuth<ApiResponse<any>>('/api/v1/master-alumni', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const base = API_BASE || '';
      const res = await fetch(`${base}/api/v1/public/alumni`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    }
  },

  async update(id: string, updates: Partial<{
    nisn: string;
    nik: string;
    nama: string;
    jurusan: string;
    tahunLulus: number;
    noWhatsapp: string;
    email: string;
    namaSekolah: string;
    npsn: string;
    statusSekolah: string;
    kompKeahlian: string;
    progKeahlian: string;
    bidKeahlian: string;
    lamaProgram: number;
    provinsiSmk: string;
    kabKotaSmk: string;
    usia: number;
    statusMenikah: string;
    provinsiDomisili: string;
    kotaDomisili: string;
    noHp: string;
    statusAktivitas: string;
    keterangan: string;
    masaTungguKerja: number;
    sertifikatKompetensi: string;
    jabatanKerja: string;
    namaTempatKerja: string;
    provinsiKerja: string;
    kotaKerja: string;
    negaraKerja: string;
    keselarasanKerja: string;
    provinsiUsaha: string;
    kotaUsaha: string;
    negaraUsaha: string;
    bidangUsaha: string;
    jenisUsaha: string;
    keselarasanUsaha: string;
    namaProdukUsaha: string;
    jenjangPendidikan: string;
    namaPerguruanTinggi: string;
    namaProdi: string;
    keselarasanStudi: string;
    pendapatanBekerjaUmp: string;
    pendapatanBekerjaUmk: string;
    pendapatanWirausahaUmp: string;
    pendapatanWirausahaUmk: string;
    pendapatanStudiSambilBekerjaUmp: string;
    pendapatanStudiSambilBekerjaUmk: string;
    pendapatanStudiSambilBerwirausahaUmp: string;
    pendapatanStudiSambilBerwirausahaUmk: string;
  }>) {
    return fetchWithAuth<ApiResponse<any>>(`/api/v1/master-alumni/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async delete(id: string) {
    try {
      return await fetchWithAuth<ApiResponse<null>>(`/api/v1/master-alumni/${id}`, {
        method: 'DELETE',
      });
    } catch {
      const base = API_BASE || '';
      const res = await fetch(`${base}/api/v1/public/alumni/${id}`, {
        method: 'DELETE',
      });
      return await res.json();
    }
  },

  async importCsv(records: any[], skipDuplicates = true) {
    try {
      return await fetchWithAuth<ApiResponse<{
        importedCount: number;
        duplicateCount: number;
        invalidCount: number;
        errors: Array<{ nisn: string; messages: string[] }>;
      }>>('/api/v1/master-alumni/import', {
        method: 'POST',
        body: JSON.stringify({ records, skipDuplicates }),
      });
    } catch {
      const base = API_BASE || '';
      const res = await fetch(`${base}/api/v1/public/alumni/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records, skipDuplicates }),
      });
      return await res.json();
    }
  },

  async getStats() {
    return fetchWithAuth<ApiResponse<{
      total: number;
      sudah: number;
      belum: number;
      responseRate: number;
      byJurusan: Record<string, { total: number; sudah: number; belum: number }>;
    }>>('/api/v1/master-alumni/stats');
  },
};

// ----------------------------------------------------
// 2. Verification API
// ----------------------------------------------------
export const adminVerificationApi = {
  async list(params?: {
    page?: number;
    limit?: number;
    verificationStatus?: VerificationStatus;
    statusKegiatan?: string;
    search?: string;
    sortBy?: 'submittedAt' | 'submissionId';
    sortOrder?: 'asc' | 'desc';
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.verificationStatus && params.verificationStatus !== 'ALL' as any) query.append('verificationStatus', params.verificationStatus);
    if (params?.statusKegiatan && params.statusKegiatan !== 'ALL') query.append('statusKegiatan', params.statusKegiatan);
    if (params?.search) query.append('search', params.search);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchWithAuth<ApiResponse<any[]>>(`/api/v1/verification${queryString}`);
  },

  async listPublic(params?: {
    page?: number;
    limit?: number;
    verificationStatus?: VerificationStatus;
    statusKegiatan?: string;
    search?: string;
    sortBy?: 'submittedAt' | 'submissionId';
    sortOrder?: 'asc' | 'desc';
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.verificationStatus && params.verificationStatus !== 'ALL' as any) query.append('verificationStatus', params.verificationStatus);
    if (params?.statusKegiatan && params.statusKegiatan !== 'ALL') query.append('statusKegiatan', params.statusKegiatan);
    if (params?.search) query.append('search', params.search);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const base = API_BASE || '';
    const res = await fetch(`${base}/api/v1/public/verification${queryString}`);
    return await res.json();
  },

  async updateStatus(submissionIdOrId: string, status: VerificationStatus, note?: string) {
    return fetchWithAuth<ApiResponse<any>>(`/api/v1/verification/${submissionIdOrId}`, {
      method: 'PUT',
      body: JSON.stringify({
        verificationStatus: status,
        verificationNote: note || '',
      }),
    });
  },

  async getStats() {
    return fetchWithAuth<ApiResponse<{
      total: number;
      pending: number;
      valid: number;
      revisi: number;
      byStatus: Array<{ status: string; count: number }>;
    }>>('/api/v1/verification/stats');
  },
};

// ----------------------------------------------------
// 3. News Management API
// ----------------------------------------------------
export const adminNewsApi = {
  async list(params?: {
    page?: number;
    limit?: number;
    category?: string;
    isPublished?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.category && params.category !== 'Semua') query.append('category', params.category);
    if (params?.isPublished !== undefined) query.append('isPublished', String(params.isPublished));
    if (params?.search) query.append('search', params.search);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchWithAuth<ApiResponse<any[]>>(`/api/v1/news${queryString}`);
  },

  async listPublic(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.category && params.category !== 'Semua') query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const base = API_BASE || '';
    const res = await fetch(`${base}/api/v1/public/news${queryString}`);
    return await res.json();
  },

  async getById(id: string) {
    return fetchWithAuth<ApiResponse<any>>(`/api/v1/news/${id}`);
  },

  /** Detail berita untuk publik (tidak perlu login). */
  async getPublic(id: string) {
    const base = API_BASE || '';
    const res = await fetch(`${base}/api/v1/public/news/${id}`);
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.message || `Gagal memuat berita (HTTP ${res.status})`);
    }
    return await res.json();
  },

  async create(data: {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    date?: string;
    readTime: string;
    imageUrl?: string;
    author: string;
    isPublished?: boolean;
  }) {
    return fetchWithAuth<ApiResponse<any>>('/api/v1/news', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, updates: Partial<{
    title: string;
    excerpt: string;
    content: string;
    category: string;
    date: string;
    readTime: string;
    imageUrl: string;
    author: string;
    isPublished: boolean;
  }>) {
    return fetchWithAuth<ApiResponse<any>>(`/api/v1/news/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async delete(id: string) {
    return fetchWithAuth<ApiResponse<null>>(`/api/v1/news/${id}`, {
      method: 'DELETE',
    });
  },
};

// ----------------------------------------------------
// 4. Jobs Management API
// ----------------------------------------------------
export const adminJobsApi = {
  async list(params?: {
    page?: number;
    limit?: number;
    type?: string;
    location?: string;
    targetMajor?: string;
    isActive?: boolean;
    isBkkPartner?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.type && params.type !== 'Semua') query.append('type', params.type);
    if (params?.location) query.append('location', params.location);
    if (params?.targetMajor && params.targetMajor !== 'Semua') query.append('targetMajor', params.targetMajor);
    if (params?.isActive !== undefined) query.append('isActive', String(params.isActive));
    if (params?.isBkkPartner !== undefined) query.append('isBkkPartner', String(params.isBkkPartner));
    if (params?.search) query.append('search', params.search);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchWithAuth<ApiResponse<any[]>>(`/api/v1/jobs${queryString}`);
  },

  async listPublic(params?: {
    page?: number;
    limit?: number;
    type?: string;
    location?: string;
    targetMajor?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.type && params.type !== 'Semua') query.append('type', params.type);
    if (params?.location) query.append('location', params.location);
    if (params?.targetMajor && params.targetMajor !== 'Semua') query.append('targetMajor', params.targetMajor);
    if (params?.search) query.append('search', params.search);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const base = API_BASE || '';
    const res = await fetch(`${base}/api/v1/public/jobs${queryString}`);
    return await res.json();
  },

  async getById(id: string) {
    return fetchWithAuth<ApiResponse<any>>(`/api/v1/jobs/${id}`);
  },

  async create(data: {
    title: string;
    company: string;
    companyLogo?: string;
    location: string;
    type: string;
    salary: string;
    targetMajors: string[];
    deadline: string;
    description: string;
    requirements: string[];
    contactPerson: string;
    isBkkPartner?: boolean;
  }) {
    return fetchWithAuth<ApiResponse<any>>('/api/v1/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, updates: Partial<{
    title: string;
    company: string;
    companyLogo: string;
    location: string;
    type: string;
    salary: string;
    targetMajors: string[];
    deadline: string;
    description: string;
    requirements: string[];
    contactPerson: string;
    isBkkPartner: boolean;
    isActive: boolean;
  }>) {
    return fetchWithAuth<ApiResponse<any>>(`/api/v1/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async delete(id: string) {
    return fetchWithAuth<ApiResponse<null>>(`/api/v1/jobs/${id}`, {
      method: 'DELETE',
    });
  },
};

// ----------------------------------------------------
// 5. Messages / Inbox API
// ----------------------------------------------------
export const adminMessagesApi = {
  async list(params?: {
    page?: number;
    limit?: number;
    status?: 'UNREAD' | 'FOLLOW_UP' | 'RESOLVED';
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchWithAuth<ApiResponse<any[]>>(`/api/v1/messages${queryString}`);
  },

  async getById(id: string) {
    return fetchWithAuth<ApiResponse<any>>(`/api/v1/messages/${id}`);
  },

  async updateStatus(id: string, status: 'UNREAD' | 'FOLLOW_UP' | 'RESOLVED', resolvedBy?: string) {
    return fetchWithAuth<ApiResponse<any>>(`/api/v1/messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, resolvedBy }),
    });
  },

  async delete(id: string) {
    return fetchWithAuth<ApiResponse<null>>(`/api/v1/messages/${id}`, {
      method: 'DELETE',
    });
  },

  /** Tandai semua pesan sebagai telah dibaca (admin). */
  async markAllAsRead() {
    return fetchWithAuth<ApiResponse<any>>('/api/v1/messages/read-all', {
      method: 'PUT',
    });
  },

  async getStats() {
    return fetchWithAuth<ApiResponse<{
      total: number;
      unread: number;
      followUp: number;
      resolved: number;
    }>>('/api/v1/messages/stats');
  },
};

// ----------------------------------------------------
// 6. Settings API
// ----------------------------------------------------
export const adminSettingsApi = {
  async get() {
    return fetchWithAuth<ApiResponse<AdminSettings>>('/api/v1/settings');
  },

  async update(settings: Partial<AdminSettings>) {
    return fetchWithAuth<ApiResponse<AdminSettings>>('/api/v1/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async reset() {
    return fetchWithAuth<ApiResponse<AdminSettings>>('/api/v1/settings/reset', {
      method: 'POST',
    });
  },
};

// ----------------------------------------------------
// 7. Reports & Overview Dashboard API
// ----------------------------------------------------
export const adminReportsApi = {  async getDashboardStats() {
    return fetchWithAuth<ApiResponse<{
      totalAlumni: number;
      totalSubmissions: number;
      responseRate: number;
      verification: { pending: number; valid: number; revisi: number };
      bmw: Record<string, number>;
      byJurusan: Record<string, { total: number; kerja: number; kuliah: number; wirausaha: number }>;
    }>>('/api/v1/reports/dashboard');
  },

  async getTracerStudyReport(params?: {
    tahunLulus?: number;
    jurusan?: string;
    statusKegiatan?: string;
    verificationStatus?: VerificationStatus;
  }) {
    const query = new URLSearchParams();
    if (params?.tahunLulus) query.append('tahunLulus', params.tahunLulus.toString());
    if (params?.jurusan && params.jurusan !== 'ALL') query.append('jurusan', params.jurusan);
    if (params?.statusKegiatan && params.statusKegiatan !== 'ALL') query.append('statusKegiatan', params.statusKegiatan);
    if (params?.verificationStatus && params.verificationStatus !== 'ALL' as any) query.append('verificationStatus', params.verificationStatus);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchWithAuth<ApiResponse<any>>(`/api/v1/reports/tracer-study${queryString}`);
  },

  async exportCsvUrl(params?: {
    tahunLulus?: number;
    jurusan?: string;
    statusKegiatan?: string;
    verificationStatus?: VerificationStatus;
  }) {
    const query = new URLSearchParams();
    if (params?.tahunLulus) query.append('tahunLulus', params.tahunLulus.toString());
    if (params?.jurusan && params.jurusan !== 'ALL') query.append('jurusan', params.jurusan);
    if (params?.statusKegiatan && params.statusKegiatan !== 'ALL') query.append('statusKegiatan', params.statusKegiatan);
    if (params?.verificationStatus && params.verificationStatus !== 'ALL' as any) query.append('verificationStatus', params.verificationStatus);

    const base = API_BASE || '';
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return `${base}/api/v1/reports/tracer-study/export${queryString}`;
  },
};

// ----------------------------------------------------
// 8. Public Report API (halaman laporan & landing, tanpa perlu login)
// ----------------------------------------------------
export const publicReportApi = {
  /** Statistik keterserapan lulusan langsung dari basis data. */
  async getKeterserapan(params?: { jurusan?: string; tahunLulus?: number }) {
    const query = new URLSearchParams();
    if (params?.jurusan && params.jurusan !== 'ALL') query.append('jurusan', params.jurusan);
    if (params?.tahunLulus) query.append('tahunLulus', params.tahunLulus.toString());
    const queryString = query.toString() ? `?${query.toString()}` : '';

    const res = await fetch(`${API_BASE}/api/v1/public/reports/keterserapan${queryString}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.message || `Gagal mengambil statistik (HTTP ${res.status})`);
    }

    return await res.json();
  },
};

// ----------------------------------------------------
// 9. Dashboard Sync & Base URL Utilities
// ----------------------------------------------------
export interface DashboardSyncResult {
  source: 'DATABASE_API' | 'LOCAL_STORE';
  isDbConnected: boolean;
  totalMaster: number;
  totalSubmitted: number;
  targetQuota: number;
  responseRate: string;
  countKerja: number;
  countKuliah: number;
  countWirausaha: number;
  countBelumKerja: number;
  lastSyncAt: string;
}

export function getApiBaseUrl(): string | null {
  const envUrl =
    (import.meta as any).env?.VITE_API_URL ||
    (import.meta as any).env?.VITE_API_BASE_URL ||
    (import.meta as any).env?.VITE_BACKEND_URL;
  return envUrl ? String(envUrl).replace(/\/+$/, '') : null;
}

export async function syncDashboardData(): Promise<DashboardSyncResult> {
  const { useAdminStore } = await import('@/store/adminStore');
  const adminState = useAdminStore.getState();

  try {
    await adminState.syncAllFromBackend?.();
  } catch (err) {
    console.warn('[Sync] syncAllFromBackend failed:', err);
  }

  try {
    const statsRes = await adminReportsApi.getDashboardStats();
    if (statsRes?.data) {
      const d = statsRes.data;
      return {
        source: 'DATABASE_API',
        isDbConnected: true,
        totalMaster: d.totalAlumni || 0,
        totalSubmitted: d.totalSubmissions || 0,
        targetQuota: adminState.settings.targetQuota || 250,
        responseRate: `${(d.responseRate || 0).toFixed(1)}%`,
        countKerja: (d.bmw?.KERJA || 0) + (d.bmw?.KERJA_KULIAH || 0) + (d.bmw?.kerja || 0),
        countKuliah: (d.bmw?.KULIAH || 0) + (d.bmw?.kuliah || 0),
        countWirausaha: (d.bmw?.WIRAUSAHA || 0) + (d.bmw?.wirausaha || 0),
        countBelumKerja: (d.bmw?.BELUM_KERJA || 0) + (d.bmw?.belumKerja || 0),
        lastSyncAt: new Date().toLocaleTimeString('id-ID'),
      };
    }
  } catch {
    // fallback to local store if DB stats fail
  }

  // fallback to store
  const master = adminState.masterAlumni || [];
  const respondents = adminState.respondents || [];
  const countKerja = respondents.filter((r) => r.statusKegiatan === 'KERJA').length;
  const countKuliah = respondents.filter((r) => r.statusKegiatan === 'KULIAH').length;
  const countWirausaha = respondents.filter((r) => r.statusKegiatan === 'WIRAUSAHA').length;
  const countBelumKerja = respondents.filter((r) => r.statusKegiatan === 'BELUM_KERJA').length;

  return {
    source: 'LOCAL_STORE',
    isDbConnected: false,
    totalMaster: master.length,
    totalSubmitted: respondents.length,
    targetQuota: adminState.settings.targetQuota || 250,
    responseRate: master.length > 0 ? `${((respondents.length / master.length) * 100).toFixed(1)}%` : '0%',
    countKerja,
    countKuliah,
    countWirausaha,
    countBelumKerja,
    lastSyncAt: new Date().toLocaleTimeString('id-ID'),
  };
}
