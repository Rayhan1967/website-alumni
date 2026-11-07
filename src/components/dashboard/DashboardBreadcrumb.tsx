import React from 'react';
import { Home, ChevronRight } from 'lucide-react';
import { DashboardTab } from './DashboardSidebar';

interface DashboardBreadcrumbProps {
  activeTab: DashboardTab;
  isAdmin: boolean;
  onNavigateHome: () => void;
  subPageTitle?: string;
  onNavigateParent?: () => void;
}

export const getTabBreadcrumbLabel = (
  tab: DashboardTab,
  isAdmin: boolean
): string => {
  if (isAdmin) {
    switch (tab) {
      case 'master_alumni':
        return 'Data Alumni';
      case 'verifikasi':
        return 'Data Responden';
      case 'pesan':
        return 'Pesan Masuk';
      case 'kelola_berita':
        return 'Kelola Berita';
      case 'kelola_loker':
        return 'Kelola Loker';
      case 'laporan':
        return 'Laporan Rekapitulasi';
      case 'pengaturan':
        return 'Pengaturan Sistem';
      default:
        return 'Dashboard';
    }
  }

  switch (tab) {
    case 'tracer_study':
      return 'Kuesioner Tracer Study';
    case 'loker':
      return 'Info Loker & Magang';
    case 'alumni':
      return 'Direktori Alumni';
    case 'helpdesk':
      return 'Pusat Bantuan Helpdesk';
    default:
      return 'Beranda';
  }
};

export const DashboardBreadcrumb: React.FC<DashboardBreadcrumbProps> = ({
  activeTab,
  isAdmin,
  onNavigateHome,
  subPageTitle,
  onNavigateParent,
}) => {
  if (activeTab === 'beranda') return null;

  const currentLabel = getTabBreadcrumbLabel(activeTab, isAdmin);

  return (
    <div className="px-3.5 sm:px-6 lg:px-8 pt-3 pb-0 max-w-7xl w-full mx-auto">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1. 5 text-xs text-slate-500 font-medium py-1 px-1 overflow-x-auto scrollbar-none"
      >
        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0d2346] hover:underline transition cursor-pointer font-medium shrink-0"
        >
          <Home className="w-3.5 h-3.5 text-slate-400" />
          <span>{isAdmin ? 'Dashboard' : 'Beranda'}</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

        {subPageTitle ? (
          <>
            <button
              type="button"
              onClick={onNavigateParent}
              className="text-slate-600 hover:text-[#0d2346] hover:underline transition cursor-pointer font-medium shrink-0"
            >
              {currentLabel}
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-[#0d2346] truncate">
              {subPageTitle}
            </span>
          </>
        ) : (
          <span className="font-semibold text-[#0d2346] truncate">
            {currentLabel}
          </span>
        )}
      </nav>
    </div>
  );
};
