import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserSession } from '@/types/tracer';
import { detectGenderFromName } from '@/components/ui/UserAvatar';

export const SESSION_INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 Jam (7.200.000 ms)
export const DASHBOARD_SESSION_TIMEOUT_MS = SESSION_INACTIVITY_TIMEOUT_MS;
export const DEMO_INACTIVITY_TIMEOUT_MS = SESSION_INACTIVITY_TIMEOUT_MS;
export const USER_ACTIVITY_STORAGE_KEY = 'alumni_session_last_activity';

export function recordActivityTimestamp(time = Date.now()) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(USER_ACTIVITY_STORAGE_KEY, String(time));
      localStorage.removeItem('alumni_demo_last_activity');
    } catch {
      // ignore
    }
  }
}

export function getStoredActivityTimestamp(fallback = Date.now()) {
  if (typeof window !== 'undefined') {
    try {
      const stored =
        localStorage.getItem(USER_ACTIVITY_STORAGE_KEY) ||
        localStorage.getItem('alumni_demo_last_activity');
      if (stored) {
        const parsed = Number(stored);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // ignore
    }
  }
  return fallback;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserSession | null;
  accessToken: string | null;
  refreshToken: string | null;
  lastDashboardActivity: number | null;
  login: (identifier: string, password?: string, roleHint?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  recordDashboardActivity: () => void;
  checkSessionExpiry: (currentPathname: string) => Promise<boolean>;
  updateUserTracerStatus: (status: 'SUDAH' | 'BELUM' | 'DRAFT', submissionId?: string) => void;
  refreshAccessToken: () => Promise<boolean>;
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

function normalizeRole(role: string): 'alumni' | 'admin_bkk' {
  const lower = (role || '').toLowerCase();
  return lower.includes('admin') ? 'admin_bkk' : 'alumni';
}

function normalizeUser(rawUser: any): UserSession {
  return {
    id: rawUser.id || `usr-${Date.now()}`,
    nisn: rawUser.nisn || '',
    nik: rawUser.nik || '',
    nama: rawUser.nama || rawUser.namaLengkap || 'Alumni Sasmita',
    email: rawUser.email || '',
    noWhatsapp: rawUser.noWhatsapp || rawUser.noWhatsApp || '',
    role: normalizeRole(rawUser.role),
    jurusan: rawUser.jurusan || 'Teknik Komputer dan Jaringan',
    tahun_lulus: Number(rawUser.tahun_lulus || rawUser.tahunLulus || 2024),
    tracerStatus: (rawUser.tracerStatus || 'BELUM') as 'SUDAH' | 'BELUM' | 'DRAFT',
    submissionId: rawUser.submissionId || undefined,
    submittedAt: rawUser.submittedAt || undefined,
    jenisKelamin: detectGenderFromName(
      rawUser.nama || rawUser.namaLengkap,
      rawUser.jenisKelamin || rawUser.gender
    ),
    avatarUrl: rawUser.avatarUrl || undefined,
  };
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = API_BASE || '';
  const res = await fetch(`${base}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  const json = await res.json();
  return (json && typeof json === 'object' && 'data' in json ? json.data : json) as T;
}

async function syncWithTracerStore(user: UserSession) {
  try {
    const { useTracerStore } = await import('./tracerStore');
    const tracerStore = useTracerStore.getState();
    const isFemale = user.jenisKelamin === 'P' || user.jenisKelamin === 'Perempuan';

    if (user.tracerStatus === 'SUDAH') {
      useTracerStore.setState({
        isSubmitted: true,
        lastSubmissionId: user.submissionId || '2026102498',
        lastSubmittedAt: user.submittedAt || new Date().toISOString(),
        identitas: {
          ...tracerStore.identitas,
          nama_lengkap: user.nama,
          nisn: user.nisn,
          nik: user.nik || '',
          tahun_lulus: user.tahun_lulus,
          jurusan: user.jurusan as any,
          email: user.email,
          no_whatsapp: user.noWhatsapp,
          tahun_masuk: user.tahun_lulus - 3,
          jenis_kelamin: isFemale ? 'Perempuan' : 'Laki-laki',
        },
      });
    } else {
      useTracerStore.setState({
        isSubmitted: false,
        lastSubmissionId: undefined,
        lastSubmittedAt: undefined,
        identitas: {
          ...tracerStore.identitas,
          nama_lengkap: user.nama,
          nisn: user.nisn,
          nik: user.nik || '',
          tahun_lulus: user.tahun_lulus,
          jurusan: user.jurusan as any,
          email: user.email,
          no_whatsapp: user.noWhatsapp,
          tahun_masuk: user.tahun_lulus - 3,
          jenis_kelamin: isFemale ? 'Perempuan' : 'Laki-laki',
        },
      });
    }
  } catch {
    // ignore sync if tracerStore is not yet initialized
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      lastDashboardActivity: null,

      login: async (identifier: string, password?: string, roleHint?: string) => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('admin_mobile_device_notice_dismissed');
        }
        const cleanIdent = identifier.trim();
        const pwd = password?.trim() || cleanIdent;

        try {
          let data: any = null;
          try {
            data = await apiFetch<{
              user: any;
              accessToken: string;
              refreshToken: string;
            }>('/api/v1/auth/login', {
              method: 'POST',
              body: JSON.stringify({ identifier: cleanIdent, password: pwd }),
            });
          } catch (err: any) {
            // Jika login pertama gagal dan identifier berupa 10-digit NISN, coba password = NISN
            if (cleanIdent.match(/^\d{10}$/) && pwd !== cleanIdent) {
              try {
                data = await apiFetch<{
                  user: any;
                  accessToken: string;
                  refreshToken: string;
                }>('/api/v1/auth/login', {
                  method: 'POST',
                  body: JSON.stringify({ identifier: cleanIdent, password: cleanIdent }),
                });
              } catch {
                throw err;
              }
            } else {
              throw err;
            }
          }

          if (data && data.user) {
            const user = normalizeUser(data.user);
            const now = Date.now();
            recordActivityTimestamp(now);
            set({
              isAuthenticated: true,
              user,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              lastDashboardActivity: now,
            });
            await syncWithTracerStore(user);
            return true;
          }
        } catch (err: any) {
          console.warn('[AuthStore] Backend login unfulfilled, attempting local fallback:', err);
        }

        // Local / Mock fallback when backend is unreachable or user is mock alumni/admin
        try {
          const lowerIdent = cleanIdent.toLowerCase();
          const isAdmin =
            lowerIdent === 'admin@smksasmitajaya2.sch.id' ||
            lowerIdent.includes('admin') ||
            roleHint === 'admin_bkk';

          if (isAdmin) {
            if (pwd === 'Admin#12345' || pwd === 'admin123' || pwd === 'admin') {
              const adminUser: UserSession = {
                id: 'adm-001',
                nisn: '0000000000',
                nama: 'Admin BKK Sasmita',
                email: 'admin@smksasmitajaya2.sch.id',
                role: 'admin_bkk',
                jurusan: 'Pengelola BKK & Tracer Study',
                tahun_lulus: 2020,
                tracerStatus: 'SUDAH',
                jenisKelamin: 'L',
              };
              const now = Date.now();
              recordActivityTimestamp(now);
              set({
                isAuthenticated: true,
                user: adminUser,
                accessToken: 'mock-access-token-admin',
                refreshToken: 'mock-refresh-token-admin',
                lastDashboardActivity: now,
              });
              await syncWithTracerStore(adminUser);
              return true;
            }
          }

          // Check alumni in masterAlumni
          const { useAdminStore } = await import('./adminStore');
          const adminState = useAdminStore.getState();
          const masterList = adminState.masterAlumni || [];
          const found = masterList.find(
            (a) => a.nisn === cleanIdent || (a.email && a.email.toLowerCase() === lowerIdent)
          );

          if (found) {
            const last3 = found.nisn.slice(-3);
            const validPasswords = [
              `alumni#${last3}`,
              `alumni${last3}`,
              found.nisn,
            ];

            if (validPasswords.includes(pwd)) {
              const alumniUser: UserSession = {
                id: found.id || `usr-${found.nisn}`,
                nisn: found.nisn,
                nik: found.nik,
                nama: found.nama,
                email: found.email,
                noWhatsapp: found.noWhatsapp,
                role: 'alumni',
                jurusan: found.jurusan,
                tahun_lulus: found.tahunLulus,
                tracerStatus: found.statusTracer || 'BELUM',
                submissionId: found.submissionId,
                submittedAt: found.submittedAt,
                jenisKelamin: detectGenderFromName(found.nama, (found as any).jenisKelamin),
              };
              const now = Date.now();
              recordActivityTimestamp(now);
              set({
                isAuthenticated: true,
                user: alumniUser,
                accessToken: `mock-access-token-${found.nisn}`,
                refreshToken: `mock-refresh-token-${found.nisn}`,
                lastDashboardActivity: now,
              });
              await syncWithTracerStore(alumniUser);
              return true;
            }
          }
        } catch (fallbackErr) {
          console.warn('[AuthStore] Fallback login error:', fallbackErr);
        }

        return false;
      },

      logout: async () => {
        const { accessToken } = get();
        try {
          if (accessToken && !accessToken.startsWith('mock-')) {
            await apiFetch('/api/v1/auth/logout', {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}` },
            });
          }
        } catch {
          // ignore logout errors
        }

        try {
          const { useTracerStore } = await import('./tracerStore');
          useTracerStore.setState({
            isSubmitted: false,
            lastSubmissionId: undefined,
            lastSubmittedAt: undefined,
          });
        } catch {
          // ignore
        }

        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(USER_ACTIVITY_STORAGE_KEY);
            localStorage.removeItem('alumni_demo_last_activity');
            sessionStorage.removeItem('admin_mobile_device_notice_dismissed');
          } catch {
            // ignore
          }
        }

        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          lastDashboardActivity: null,
        });
      },

      recordDashboardActivity: () => {
        const now = Date.now();
        recordActivityTimestamp(now);
        set({ lastDashboardActivity: now });
      },

      checkSessionExpiry: async (_currentPathname: string) => {
        const state = get();
        if (!state.isAuthenticated) return false;

        const now = Date.now();
        const lastActivity = getStoredActivityTimestamp(state.lastDashboardActivity || now);
        const elapsed = now - lastActivity;

        // Jika tidak ada aktivitas selama >= 2 jam (7.200.000 ms), batalkan sesi secara mutlak
        if (elapsed >= SESSION_INACTIVITY_TIMEOUT_MS) {
          console.info(
            `[AuthStore] Sesi otomatis kedaluwarsa setelah inaktivitas ${Math.round(
              elapsed / 60000
            )} menit (>= 2 jam).`
          );
          await get().logout();
          return true;
        }

        if (state.lastDashboardActivity !== lastActivity) {
          set({ lastDashboardActivity: lastActivity });
        }

        return false;
      },

      updateUserTracerStatus: (status, submissionId) => {
        set((state) => {
          if (!state.user) return state;
          return {
            user: {
              ...state.user,
              tracerStatus: status,
              submissionId: submissionId || state.user.submissionId,
              submittedAt: new Date().toISOString(),
            },
          };
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        // Mock / local session tidak memerlukan refresh JWT dari backend
        if (refreshToken.startsWith('mock-')) {
          return true;
        }

        try {
          const data = await apiFetch<{
            accessToken: string;
            refreshToken: string;
            user?: any;
          }>('/api/v1/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
          });

          set((state) => ({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: data.user ? normalizeUser(data.user) : state.user,
          }));
          return true;
        } catch {
          set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
            lastDashboardActivity: null,
          });
          return false;
        }
      },
    }),
    {
      name: 'alumni_auth_session',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          return {
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
            lastDashboardActivity: null,
          };
        }
        return persistedState;
      },
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        lastDashboardActivity: state.lastDashboardActivity,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.isAuthenticated) {
          const now = Date.now();
          const lastActivity = getStoredActivityTimestamp(state.lastDashboardActivity || 0);

          // Cek instan saat browser/tab dibuka: jika inaktivitas >= 2 jam, langsung hanguskan sesi
          if (lastActivity > 0 && now - lastActivity >= SESSION_INACTIVITY_TIMEOUT_MS) {
            console.info('[AuthStore] Sesi terdeteksi kedaluwarsa (>= 2 jam) saat rehidrasi storage.');
            state.isAuthenticated = false;
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.lastDashboardActivity = null;
            if (typeof window !== 'undefined') {
              try {
                localStorage.removeItem(USER_ACTIVITY_STORAGE_KEY);
                localStorage.removeItem('alumni_demo_last_activity');
              } catch {
                // ignore
              }
            }
            return;
          }

          if (state.user) {
            state.user.jenisKelamin = detectGenderFromName(state.user.nama, state.user.jenisKelamin);
          }
        }
      },
    }
  )
);