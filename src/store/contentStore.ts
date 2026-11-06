import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NewsItem, JobVacancy } from '@/types/tracer';
import { MOCK_NEWS, MOCK_JOBS } from '@/lib/mockData';
import {
  FieldErrors,
  errorList,
  parseIndonesianDate,
  validateJobInput,
  validateNewsInput,
} from '@/utils/contentValidation';

interface ContentState {
  newsList: NewsItem[];
  jobList: JobVacancy[];
  newsFetchError: string | null;

  // News Actions — mengembalikan true bila tersimpan di server
  addNews: (news: Omit<NewsItem, 'id'>) => Promise<boolean>;
  updateNews: (id: string, updates: Partial<NewsItem>) => Promise<boolean>;
  deleteNews: (id: string) => Promise<boolean>;
  resetNewsToDefault: () => void;
  fetchNewsFromBackend: () => Promise<boolean>;

  // Job Vacancy Actions — mengembalikan true bila tersimpan di server
  addJob: (job: Omit<JobVacancy, 'id'>) => Promise<boolean>;
  updateJob: (id: string, updates: Partial<JobVacancy>) => Promise<boolean>;
  deleteJob: (id: string) => Promise<boolean>;
  resetJobsToDefault: () => void;
  fetchJobsFromBackend: () => Promise<boolean>;
  trackJobClick: (id: string) => void;

  syncAllContentFromBackend: () => Promise<void>;
}

/** Buat error lengkap dengan daftar pesan (untuk toast/warning). */
function validationError(
  title: string,
  errors: FieldErrors,
): Error & { fieldErrors: string[] } {
  const messages = errorList(errors);
  const err = new Error(
    messages.length > 1
      ? `${title}: ${messages.length} bagian belum memenuhi syarat. ${messages.join(' ')}`
      : `${title} ${messages[0]}`,
  ) as Error & { fieldErrors: string[] };
  err.fieldErrors = messages;
  return err;
}

export const useContentStore = create<ContentState>()(
  (set, get) => ({
    newsList: MOCK_NEWS,
    jobList: MOCK_JOBS,
    newsFetchError: null,

      // News Actions
      addNews: async (newsData) => {
        // 1. Validasi DULU — kalau ada bagian yang tidak memenuhi syarat,
        //    jangan tambah ke local state DAN jangan kirim ke server.
        const errors = validateNewsInput({
          title: newsData.title,
          excerpt: newsData.excerpt,
          content: newsData.content,
          category: newsData.category,
          author: newsData.author,
          readTime: newsData.readTime,
        });
        if (Object.keys(errors).length > 0) {
          throw validationError('Berita belum bisa dipublikasikan.', errors);
        }

        const newNews: NewsItem = {
          ...newsData,
          id: `news-${Date.now()}`,
        };
        set((state) => ({
          newsList: [newNews, ...state.newsList],
        }));

        // 2. Sinkron ke server; kalau gagal, ROLLBACK (hapus dari local state)
        try {
          const { adminNewsApi } = await import('@/services/adminService');
          await adminNewsApi.create({
            title: newNews.title,
            excerpt: newNews.excerpt,
            content: newNews.content,
            category: newNews.category,
            date: parseIndonesianDate(newsData.date).toISOString(),
            readTime: newNews.readTime || '3 min read',
            imageUrl: newNews.imageUrl,
            author: newNews.author || 'Admin BKK',
            isPublished: true,
          });
        } catch (err) {
          console.warn('[ContentStore] Backend news create sync fallback:', err);
          set((state) => ({
            newsList: state.newsList.filter((item) => item.id !== newNews.id),
          }));
          throw err;
        }
        return true;
      },

      updateNews: async (id, updates) => {
        // Simpan snapshot untuk kemungkinan rollback kalau server menolak
        const previous = get().newsList;
        set((state) => ({
          newsList: state.newsList.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));

        // Sinkron ke server; kalau gagal, ROLLBACK perubahan lokal
        try {
          if (!id.startsWith('news-mock-') && !id.startsWith('news-0')) {
            const { adminNewsApi } = await import('@/services/adminService');
            const payload: Record<string, unknown> = { ...updates };
            if (typeof payload.date === 'string') {
              payload.date = parseIndonesianDate(payload.date as string).toISOString();
            }
            await adminNewsApi.update(id, payload as any);
          }
        } catch (err) {
          console.warn('[ContentStore] Backend news update sync fallback:', err);
          set({ newsList: previous });
          throw err;
        }
        return true;
      },

      deleteNews: async (id) => {
        // Simpan item lama dulu untuk kemungkinan rollback
        const previous = get().newsList;
        set((state) => ({
          newsList: state.newsList.filter((item) => item.id !== id),
        }));

        try {
          if (!id.startsWith('news-mock-') && !id.startsWith('news-0')) {
            const { adminNewsApi } = await import('@/services/adminService');
            await adminNewsApi.delete(id);
          }
        } catch (err) {
          console.warn('[ContentStore] Backend news delete sync fallback:', err);
          set({ newsList: previous });
          throw err;
        }
        return true;
      },

      resetNewsToDefault: () => {
        set({ newsList: MOCK_NEWS });
      },

      fetchNewsFromBackend: async () => {
        set({ newsFetchError: null });
        try {
          const { adminNewsApi } = await import('@/services/adminService');
          let res: any = null;
          try {
            res = await adminNewsApi.list({ limit: 100 });
          } catch {
            res = await adminNewsApi.listPublic({ limit: 100 });
          }
          if ((!res || !res.data || !Array.isArray(res.data) || res.data.length === 0) && adminNewsApi.listPublic) {
            res = await adminNewsApi.listPublic({ limit: 100 });
          }
          if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
            const mapped: NewsItem[] = res.data.map((item: any) => {
              let displayDate = '2026-10-01';
              if (item.date) {
                try {
                  const d = new Date(item.date);
                  displayDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                } catch {
                  displayDate = String(item.date).split('T')[0];
                }
              }
              return {
                id: item.id,
                title: item.title,
                excerpt: item.excerpt,
                content: item.content,
                category: item.category,
                date: displayDate,
                readTime: item.readTime || '3 min baca',
                imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
                author: item.author || 'Tim BKK Sasmita',
                slug: item.slug || item.id,
              };
            });
            set({ newsList: mapped });
            return true;
          }
        } catch (err) {
          console.warn('[ContentStore] Fetch news from backend fallback:', err);
          set({
            newsFetchError:
              err instanceof Error
                ? err.message
                : 'Gagal memuat berita dari server.',
          });
        }
        return false;
      },

      // Job Vacancy Actions
      addJob: async (jobData) => {
        // 1. Validasi DULU — kalau ada bagian yang tidak memenuhi syarat,
        //    jangan tambah ke local state DAN jangan kirim ke server.
        const errors = validateJobInput({
          title: jobData.title,
          company: jobData.company,
          location: jobData.location,
          salary: jobData.salary,
          type: jobData.type,
          targetMajors: jobData.targetMajors,
          deadline: jobData.deadline,
          contactPerson: jobData.contactPerson,
          description: jobData.description,
          requirements: jobData.requirements,
        });
        if (Object.keys(errors).length > 0) {
          throw validationError('Loker belum bisa dipublikasikan.', errors);
        }

        const newJob: JobVacancy = {
          ...jobData,
          id: `job-${Date.now()}`,
        };
        set((state) => ({
          jobList: [newJob, ...state.jobList],
        }));

        // 2. Sinkron ke server; kalau gagal, ROLLBACK (hapus dari local state)
        try {
          const { adminJobsApi } = await import('@/services/adminService');
          await adminJobsApi.create({
            title: newJob.title,
            company: newJob.company,
            companyLogo: jobData.companyLogo,
            location: newJob.location,
            type: newJob.type,
            salary: newJob.salary,
            targetMajors: jobData.targetMajors as any,
            deadline: parseIndonesianDate(jobData.deadline).toISOString(),
            description: newJob.description,
            requirements: newJob.requirements,
            contactPerson: newJob.contactPerson,
            isBkkPartner: newJob.isBkkPartner,
          });
        } catch (err) {
          console.warn('[ContentStore] Backend job create sync fallback:', err);
          set((state) => ({
            jobList: state.jobList.filter((job) => job.id !== newJob.id),
          }));
          throw err;
        }
        return true;
      },

      updateJob: async (id, updates) => {
        set((state) => ({
          jobList: state.jobList.map((job) =>
            job.id === id ? { ...job, ...updates } : job
          ),
        }));

        // Sinkron ke server; kalau gagal, lempar error (tab tangani toast)
        try {
          if (!id.startsWith('job-mock-') && !id.startsWith('job-0')) {
            const { adminJobsApi } = await import('@/services/adminService');
            const payload: Record<string, unknown> = { ...updates };
            if (typeof payload.deadline === 'string') {
              payload.deadline = parseIndonesianDate(payload.deadline as string).toISOString();
            }
            await adminJobsApi.update(id, payload as any);
          }
        } catch (err) {
          console.warn('[ContentStore] Backend job update sync fallback:', err);
          throw err;
        }
        return true;
      },

      deleteJob: async (id) => {
        // Simpan daftar lama dulu untuk kemungkinan rollback
        const previous = get().jobList;
        set((state) => ({
          jobList: state.jobList.filter((job) => job.id !== id),
        }));

        try {
          if (!id.startsWith('job-mock-') && !id.startsWith('job-0')) {
            const { adminJobsApi } = await import('@/services/adminService');
            await adminJobsApi.delete(id);
          }
        } catch (err) {
          console.warn('[ContentStore] Backend job delete sync fallback:', err);
          set({ jobList: previous });
          throw err;
        }
        return true;
      },

      resetJobsToDefault: () => {
        set({ jobList: MOCK_JOBS });
      },

      fetchJobsFromBackend: async () => {
        try {
          const { adminJobsApi } = await import('@/services/adminService');
          const res = await adminJobsApi.listPublic({ limit: 50 });
          if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
            const mapped: JobVacancy[] = res.data.map((item: any, idx: number) => {
              let applyType: JobVacancy['applyType'] = item.applyType;
              let whatsappNumber = item.whatsappNumber;
              let whatsappTemplate = item.whatsappTemplate;
              let locationAddress = item.locationAddress;
              let walkInSchedule = item.walkInSchedule;
              let mapsUrl = item.mapsUrl;
              let externalUrl = item.externalUrl;
              let emailAddress = item.emailAddress;
              let emailSubject = item.emailSubject;

              if (!applyType) {
                const channelTypes: JobVacancy['applyType'][] = ['whatsapp', 'walk_in', 'external_url', 'email'];
                applyType = channelTypes[idx % channelTypes.length];

                if (applyType === 'whatsapp') {
                  whatsappNumber = '6281298765432';
                  whatsappTemplate = `Halo Tim HRD ${item.company}, saya alumni SMK Sasmita Jaya 2 berminat mendaftar untuk posisi ${item.title}. Berikut portofolio keahlian saya.`;
                } else if (applyType === 'walk_in') {
                  locationAddress = `${item.company}, ${item.location}`;
                  walkInSchedule = 'Senin s/d Kamis, Pukul 08.30 - 11.30 WIB (Pakaian kemeja putih rapi, membawa CV cetak)';
                  mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(item.company + ' ' + item.location)}`;
                } else if (applyType === 'external_url') {
                  externalUrl = 'https://bkk.smksasmitajaya2.sch.id/karir';
                } else {
                  emailAddress = item.contactPerson?.includes('@') ? item.contactPerson : 'recruitment@partner.id';
                  emailSubject = `Lamaran Pekerjaan - ${item.title} - [Nama Alumni]`;
                }
              }

              return {
                id: item.id,
                title: item.title,
                company: item.company,
                companyLogo: item.companyLogo || '',
                location: item.location,
                type: item.type,
                salary: item.salary,
                targetMajors: Array.isArray(item.targetMajors) ? item.targetMajors : [],
                postedAt: typeof item.postedAt === 'string' ? item.postedAt.split('T')[0] : '2026-10-01',
                deadline: typeof item.deadline === 'string' ? item.deadline.split('T')[0] : '2026-11-30',
                description: item.description,
                requirements: Array.isArray(item.requirements) ? item.requirements : [],
                contactPerson: item.contactPerson,
                isBkkPartner: Boolean(item.isBkkPartner),
                applyType,
                whatsappNumber,
                whatsappTemplate,
                locationAddress,
                walkInSchedule,
                mapsUrl,
                externalUrl,
                emailAddress,
                emailSubject,
              };
            });

            // Gabungkan lowongan backend VPS dengan lowongan mock lengkap
            const combined = [
              ...mapped,
              ...MOCK_JOBS.filter((mock) => !mapped.some((m) => m.id === mock.id || m.title.toLowerCase() === mock.title.toLowerCase())),
            ];
            set({ jobList: combined });
            return true;
          } else {
            set({ jobList: MOCK_JOBS });
            return true;
          }
        } catch (err) {
          console.warn('[ContentStore] Fetch jobs from backend fallback:', err);
          if (get().jobList.length === 0) {
            set({ jobList: MOCK_JOBS });
          }
        }
        return false;
      },

      trackJobClick: (id: string) => {
        set((state) => ({
          jobList: state.jobList.map((job) =>
            job.id === id ? { ...job, clickCount: ((job as any).clickCount || 0) + 1 } : job
          ),
        }));
      },

      syncAllContentFromBackend: async () => {
        await Promise.allSettled([
          get().fetchNewsFromBackend(),
          get().fetchJobsFromBackend(),
        ]);
      },
    })
);
