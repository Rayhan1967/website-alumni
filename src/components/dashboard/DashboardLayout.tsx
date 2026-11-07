import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardSidebar, DashboardTab } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { OverviewTab } from './OverviewTab';
import { LokerTab } from './LokerTab';
import { AlumniTab } from './AlumniTab';
import { HelpdeskTab } from './HelpdeskTab';
import { DashboardBreadcrumb } from './DashboardBreadcrumb';
import { TracerWizard } from '@/components/tracer/TracerWizard';
import { generateTracerReceiptPdf } from '@/lib/pdfGenerator';
import { useTracerStore } from '@/store/tracerStore';
import { useAuthStore } from '@/store/authStore';
import { useAdminStore } from '@/store/adminStore';
import { useContentStore } from '@/store/contentStore';
import { useMailStore } from '@/store/mailStore';
import { JobVacancy } from '@/types/tracer';

// Admin Tabs
import { AdminOverviewTab } from './admin/AdminOverviewTab';
import { AdminMasterAlumniTab } from './admin/AdminMasterAlumniTab';
import { AdminRespondentsTab } from './admin/AdminRespondentsTab';
import { AdminNewsTab } from './admin/AdminNewsTab';
import { AdminJobsTab } from './admin/AdminJobsTab';
import { AdminMessagesTab } from './admin/AdminMessagesTab';
import { AdminExportReportTab } from './admin/AdminExportReportTab';
import { AdminSettingsTab } from './admin/AdminSettingsTab';
import { AdminMobileNoticeModal } from './admin/AdminMobileNoticeModal';

import {
  OverviewTabSkeleton,
  LokerTabSkeleton,
  AlumniTabSkeleton,
  HelpdeskTabSkeleton,
  AdminOverviewTabSkeleton,
  AdminMasterAlumniTabSkeleton,
  AdminRespondentsTabSkeleton,
  AdminMessagesTabSkeleton,
  AdminNewsTabSkeleton,
  AdminJobsTabSkeleton,
  AdminExportReportTabSkeleton,
  AdminSettingsTabSkeleton,
} from './skeletons';

const VALID_TABS: DashboardTab[] = [
  'beranda',
  'tracer_study',
  'loker',
  'alumni',
  'helpdesk',
  'master_alumni',
  'verifikasi',
  'pesan',
  'kelola_berita',
  'kelola_loker',
  'laporan',
  'pengaturan',
];

export const DashboardLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // History Trap: Cegah tombol Back browser keluar dari Dashboard saat sesi aktif
  useEffect(() => {
    if (!isAuthenticated) return;

    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isAuthenticated]);

  const isAdmin = user?.role === 'admin_bkk';

  // Muat data master alumni, responden, loker, berita & pesan langsung dari basis data backend VPS
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        useAdminStore.getState().syncAllFromBackend?.();
        useContentStore.getState().syncAllContentFromBackend?.();
        useMailStore.getState().fetchMailsFromBackend?.();
      } else {
        useContentStore.getState().syncAllContentFromBackend?.();
      }
    }
  }, [isAuthenticated, isAdmin]);

  const tabParam = (searchParams.get('tab') as DashboardTab) || 'beranda';
  const activeTab: DashboardTab = VALID_TABS.includes(tabParam) ? tabParam : 'beranda';

  // Purposeful tab-level loading state to avoid layout shifts during transitions
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [selectedRespondentId, setSelectedRespondentId] = useState<string | null>(null);

  const setActiveTab = (tab: DashboardTab) => {
    setSelectedRespondentId(null);
    setSearchParams((prev) => {
      const nextParams = new URLSearchParams(prev);
      if (tab === 'beranda') {
        nextParams.delete('tab');
        nextParams.delete('step');
      } else {
        nextParams.set('tab', tab);
        if (tab !== 'tracer_study') {
          nextParams.delete('step');
        }
      }
      return nextParams;
    });
  };

  // Brief initial/tab-switch simulated data load for perceptual performance
  useEffect(() => {
    setIsTabLoading(true);
    const timer = setTimeout(() => {
      setIsTabLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [activeTab]);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [selectedJob, setSelectedJob] = useState<JobVacancy | null>(null);

  // Direct PDF Download tanpa preview modal
  const handleDirectDownloadReceipt = () => {
    const tracerState = useTracerStore.getState();
    const currentUser = useAuthStore.getState().user;
    const adminState = useAdminStore.getState();

    // Guard: hanya bisa unduh jika memang sudah mengisi tracer study
    const isTracerDone =
      tracerState.isSubmitted ||
      currentUser?.tracerStatus === 'SUDAH' ||
      (currentUser as any)?.statusTracer === 'SUDAH';

    if (!isTracerDone) {
      return;
    }

    // Cari data responden di admin store jika cocok dengan user yang sedang login
    const matchedRespondent = adminState.respondents?.find(
      (r) =>
        (currentUser?.nisn && r.nisn.trim() === currentUser.nisn.trim()) ||
        (currentUser?.nik && r.nik.trim() === currentUser.nik.trim()) ||
        (currentUser?.nama && r.nama.toLowerCase() === currentUser.nama.toLowerCase())
    );

    const regId =
      currentUser?.submissionId ||
      matchedRespondent?.submissionId ||
      tracerState.lastSubmissionId ||
      '2026102498';

    // Prioritaskan 100% data akun profil user yang sedang login agar tidak tertukar dengan dummy/stale data
    const activeIdent = {
      nama_lengkap: currentUser?.nama || matchedRespondent?.nama || tracerState.identitas?.nama_lengkap || 'Alumni Sasmita',
      nisn: currentUser?.nisn || matchedRespondent?.nisn || tracerState.identitas?.nisn || '-',
      nik: currentUser?.nik || matchedRespondent?.nik || tracerState.identitas?.nik || '-',
      jurusan: (currentUser?.jurusan || matchedRespondent?.jurusan || tracerState.identitas?.jurusan || 'Teknik Komputer dan Jaringan') as any,
      tahun_lulus: currentUser?.tahun_lulus || matchedRespondent?.tahunLulus || tracerState.identitas?.tahun_lulus || 2025,
      tahun_masuk: (currentUser?.tahun_lulus ? currentUser.tahun_lulus - 3 : matchedRespondent?.tahunLulus ? matchedRespondent.tahunLulus - 3 : tracerState.identitas?.tahun_masuk) || 2022,
      no_whatsapp: (currentUser as any)?.noWhatsapp || (currentUser as any)?.no_whatsapp || matchedRespondent?.noWhatsapp || tracerState.identitas?.no_whatsapp || '-',
      email: currentUser?.email || matchedRespondent?.email || tracerState.identitas?.email || '-',
    };

    const statusKegiatan =
      matchedRespondent?.statusKegiatan ||
      tracerState.status_kegiatan ||
      'KERJA';

    const submittedAt =
      currentUser?.submittedAt ||
      matchedRespondent?.submittedAt ||
      tracerState.lastSubmittedAt ||
      new Date().toISOString();

    generateTracerReceiptPdf({
      submissionId: regId,
      identitas: activeIdent,
      statusKegiatan,
      submittedAt,
    });
  };

  // Lock body & html scroll when mobile sidebar drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isMobileOpen]);

  const handleToggleCollapse = (val: boolean | ((prev: boolean) => boolean)) => {
    setIsCollapsed((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const { lastSubmissionId } = useTracerStore();

  const handleSelectJobFromOverview = (job: JobVacancy) => {
    setSelectedJob(job);
    setActiveTab('loker');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar with Blue 900 scheme & Collapse Support */}
      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={handleToggleCollapse}
      />

      {/* Mobile Backdrop Overlay - Fully blocks touches, scrolls, & interactions outside sidebar */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300 touch-none select-none overscroll-none"
          onClick={() => setIsMobileOpen(false)}
          onTouchMove={(e) => e.preventDefault()}
          onWheel={(e) => e.preventDefault()}
          aria-hidden="true"
        />
      )}

      {/* Main Content Area - Smooth dynamic padding without layout shift */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Header */}
        <DashboardHeader
          onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)}
          onOpenReceipt={handleDirectDownloadReceipt}
          onNavigateTab={(tab, respondentId) => {
            if (respondentId) {
              setSelectedRespondentId(respondentId);
            }
            setActiveTab(tab as DashboardTab);
          }}
        />

        {/* Dynamic Breadcrumb Navigation for all pages except Dashboard */}
        <DashboardBreadcrumb
          activeTab={activeTab}
          isAdmin={isAdmin}
          onNavigateHome={() => {
            setSelectedRespondentId(null);
            setActiveTab('beranda');
          }}
        />

        {/* Dynamic Tab Body */}
        <main className="p-3.5 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
          {/* ADMIN VIEW */}
          {isAdmin ? (
            <>
              {activeTab === 'beranda' && (
                isTabLoading ? (
                  <AdminOverviewTabSkeleton />
                ) : (
                  <AdminOverviewTab
                    onNavigateTab={(tab) => setActiveTab(tab as DashboardTab)}
                    onOpenRespondentDetail={(subId) => {
                      setSelectedRespondentId(subId);
                      setSearchParams((prev) => {
                        const nextParams = new URLSearchParams(prev);
                        nextParams.set('tab', 'verifikasi');
                        return nextParams;
                      });
                    }}
                  />
                )
              )}

              {activeTab === 'master_alumni' && (
                isTabLoading ? <AdminMasterAlumniTabSkeleton /> : <AdminMasterAlumniTab />
              )}

              {activeTab === 'verifikasi' && (
                isTabLoading ? (
                  <AdminRespondentsTabSkeleton />
                ) : (
                  <AdminRespondentsTab
                    initialSelectedId={selectedRespondentId}
                    onClearInitialSelectedId={() => setSelectedRespondentId(null)}
                  />
                )
              )}

              {activeTab === 'pesan' && (
                isTabLoading ? (
                  <AdminMessagesTabSkeleton />
                ) : (
                  <AdminMessagesTab
                    onNavigateTab={(tab, respondentId) => {
                      if (respondentId) {
                        setSelectedRespondentId(respondentId);
                      }
                      setActiveTab(tab as DashboardTab);
                    }}
                  />
                )
              )}

              {activeTab === 'kelola_berita' && (
                isTabLoading ? <AdminNewsTabSkeleton /> : <AdminNewsTab />
              )}

              {activeTab === 'kelola_loker' && (
                isTabLoading ? <AdminJobsTabSkeleton /> : <AdminJobsTab />
              )}

              {activeTab === 'laporan' && (
                isTabLoading ? <AdminExportReportTabSkeleton /> : <AdminExportReportTab />
              )}

              {activeTab === 'pengaturan' && (
                isTabLoading ? <AdminSettingsTabSkeleton /> : <AdminSettingsTab />
              )}
            </>
          ) : (
            /* ALUMNI VIEW */
            <>
              {activeTab === 'beranda' && (
                isTabLoading ? (
                  <OverviewTabSkeleton />
                ) : (
                  <OverviewTab
                    onNavigateTab={(tab) => setActiveTab(tab)}
                    onOpenReceipt={handleDirectDownloadReceipt}
                    onSelectJob={handleSelectJobFromOverview}
                  />
                )
              )}

              {activeTab === 'tracer_study' && (
                <div className="-mx-4 -my-4 sm:-mx-8 sm:-my-8">
                  <TracerWizard onBackToOverview={() => setActiveTab('beranda')} />
                </div>
              )}

              {activeTab === 'loker' && (
                isTabLoading ? (
                  <LokerTabSkeleton />
                ) : (
                  <LokerTab
                    selectedJobFromOverview={selectedJob}
                    onClearSelectedJob={() => setSelectedJob(null)}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                  />
                )
              )}

              {activeTab === 'alumni' && (
                isTabLoading ? <AlumniTabSkeleton /> : <AlumniTab />
              )}

              {activeTab === 'helpdesk' && (
                isTabLoading ? <HelpdeskTabSkeleton /> : <HelpdeskTab />
              )}
            </>
          )}
        </main>
      </div>

      {/* Admin Mobile/Tablet Device Recommendation Notice */}
      <AdminMobileNoticeModal isAdmin={isAdmin} />
    </div>
  );
};
