import React, { useState, useEffect, useMemo } from "react";
import { useAdminStore } from "@/store/adminStore";
import { syncDashboardData } from "@/services/adminService";
import {
  OverviewBanner,
  OverviewKpiCards,
  OverviewActivityChart,
  OverviewJurusanStats,
  OverviewRecentSubmissions,
  ActivityDistributionData,
  JurusanStatItem,
} from "./overview";

const JURUSAN_LIST = [
  { code: "TKJ", name: "Teknik Komputer dan Jaringan" },
  { code: "TPM", name: "Teknik Pemesinan" },
  { code: "TITL", name: "Teknik Instalasi Tenaga Listrik" },
  { code: "EL", name: "Teknik Elektronika Industri" },
  { code: "TKRO", name: "Teknik Kendaraan Ringan Otomotif" },
  { code: "TBSM", name: "Teknik dan Bisnis Sepeda Motor" },
];

export interface AdminOverviewTabProps {
  onNavigateTab: (tabId: string) => void;
  onOpenRespondentDetail?: (submissionId: string) => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  onNavigateTab,
  onOpenRespondentDetail,
}) => {
  const { masterAlumni, respondents, settings } = useAdminStore();
  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  // Jalankan sinkronisasi awal saat mount
  useEffect(() => {
    let isMounted = true;
    syncDashboardData().catch(() => {
      // Background sync fallback
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Kumpulan tahun kelulusan yang tersedia dari data riil dan target settings
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();

    masterAlumni.forEach((a) => {
      const yr = Number(a.tahunLulus);
      if (!isNaN(yr) && yr > 2000) yearsSet.add(yr);
    });

    respondents.forEach((r) => {
      const yr = Number(r.tahunLulus);
      if (!isNaN(yr) && yr > 2000) yearsSet.add(yr);
    });

    if (settings.targetYear && !isNaN(Number(settings.targetYear))) {
      yearsSet.add(Number(settings.targetYear));
    }

    yearsSet.add(2025);
    const currentYr = new Date().getFullYear();
    if (currentYr > 2000) {
      yearsSet.add(currentYr);
    }

    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [masterAlumni, respondents, settings.targetYear]);

  // State pilihan periode tahun (default: "ALL" / Semua Angkatan, persisten via localStorage)
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("admin_overview_selected_year");
      if (saved) return saved;
    } catch {
      // fallback jika localStorage dibatasi browser
    }
    return "ALL";
  });

  const handleSelectYear = (year: string) => {
    setSelectedYear(year);
    try {
      localStorage.setItem("admin_overview_selected_year", year);
    } catch {
      // ignore
    }
  };

  const isAllYears = selectedYear === "ALL";

  // Data terfilter berdasarkan periode tahun
  const filteredMaster = useMemo(() => {
    if (isAllYears) return masterAlumni;
    return masterAlumni.filter((a) => String(a.tahunLulus) === selectedYear);
  }, [masterAlumni, isAllYears, selectedYear]);

  const filteredRespondents = useMemo(() => {
    if (isAllYears) return respondents;
    return respondents.filter((r) => String(r.tahunLulus) === selectedYear);
  }, [respondents, isAllYears, selectedYear]);

  const totalMaster = filteredMaster.length;
  const totalSubmitted = filteredMaster.filter(
    (a) => a.statusTracer === "SUDAH",
  ).length;

  const targetQuota = useMemo(() => {
    if (isAllYears) {
      return masterAlumni.length > 0
        ? masterAlumni.length
        : settings.targetQuota || 250;
    }

    const yr = Number(selectedYear);
    // 1. Ambil target spesifik tahun tersebut dari yearlyTargets di pengaturan
    if (settings.yearlyTargets && settings.yearlyTargets[yr]) {
      return settings.yearlyTargets[yr];
    }

    // 2. Jika sama dengan tahun sasaran aktif di settings
    if (yr === settings.targetYear && settings.targetQuota) {
      return settings.targetQuota;
    }

    // 3. Jika ada data master pokok alumni tahun tersebut, gunakan totalMaster
    if (totalMaster > 0) {
      return totalMaster;
    }

    // 4. Default fallback
    return settings.targetQuota || 250;
  }, [
    isAllYears,
    selectedYear,
    settings.yearlyTargets,
    settings.targetYear,
    settings.targetQuota,
    totalMaster,
    masterAlumni.length,
  ]);

  const responseRate = useMemo(() => {
    if (targetQuota <= 0) {
      return totalSubmitted > 0 ? "100.0" : "0.0";
    }
    const rate = (totalSubmitted / targetQuota) * 100;
    return rate > 100 ? "100.0" : rate.toFixed(1);
  }, [totalSubmitted, targetQuota]);

  // Jurusan distribution
  const jurusanStats: JurusanStatItem[] = useMemo(() => {
    return JURUSAN_LIST.map((j) => {
      const totalInJurusan = filteredMaster.filter((a) =>
        a.jurusan.includes(j.name),
      ).length;
      const filledInJurusan = filteredMaster.filter(
        (a) => a.jurusan.includes(j.name) && a.statusTracer === "SUDAH",
      ).length;
      const percent =
        totalInJurusan > 0
          ? Math.round((filledInJurusan / totalInJurusan) * 100)
          : 0;
      return {
        ...j,
        total: totalInJurusan,
        filled: filledInJurusan,
        percent,
      };
    });
  }, [filteredMaster]);

  // Perhitungan Distribusi Aktivitas Lulusan (Eksklusif & Dinamis)
  const activityDistribution: ActivityDistributionData = useMemo(() => {
    const total = filteredRespondents.length;

    // 1. Pilar Utama (BKK)
    const kerjaCount = filteredRespondents.filter(
      (r) =>
        r.statusKegiatan === "KERJA" || r.statusKegiatan === "KERJA_KULIAH",
    ).length;
    const usahaCount = filteredRespondents.filter(
      (r) =>
        r.statusKegiatan === "WIRAUSAHA" ||
        r.statusKegiatan === "WIRAUSAHA_KULIAH",
    ).length;
    const kuliahCount = filteredRespondents.filter(
      (r) => r.statusKegiatan === "KULIAH",
    ).length;
    const belumCount = filteredRespondents.filter(
      (r) =>
        r.statusKegiatan === "BELUM_KERJA" || r.statusKegiatan === "LAINNYA",
    ).length;

    const pilarItems = [
      {
        key: "KERJA",
        name: "Bekerja",
        subNote: "Termasuk kerja sambil kuliah",
        count: kerjaCount,
        percent:
          total > 0 ? parseFloat(((kerjaCount / total) * 100).toFixed(1)) : 0,
        color: "#0d2346",
      },
      {
        key: "WIRAUSAHA",
        name: "Wirausaha",
        subNote: "Wirausaha mandiri & kemitraan",
        count: usahaCount,
        percent:
          total > 0 ? parseFloat(((usahaCount / total) * 100).toFixed(1)) : 0,
        color: "#F4EB6C",
      },
      {
        key: "KULIAH",
        name: "Melanjutkan Kuliah",
        subNote: "Pendidikan tinggi vokasi/akademik",
        count: kuliahCount,
        percent:
          total > 0 ? parseFloat(((kuliahCount / total) * 100).toFixed(1)) : 0,
        color: "#2563eb",
      },
      {
        key: "BELUM_KERJA",
        name: "Mencari Kerja",
        subNote: "Masa tunggu / pencarian aktif",
        count: belumCount,
        percent:
          total > 0 ? parseFloat(((belumCount / total) * 100).toFixed(1)) : 0,
        color: "#94a3b8",
      },
    ].filter((item) => item.count > 0 || total === 0);

    // 2. Detail Granular Sub-Kategori
    const countKerjaKuliah = filteredRespondents.filter(
      (r) => r.statusKegiatan === "KERJA_KULIAH",
    ).length;
    const countKerjaMurni = filteredRespondents.filter(
      (r) => r.statusKegiatan === "KERJA",
    ).length;
    const countUsahaMurni = filteredRespondents.filter(
      (r) => r.statusKegiatan === "WIRAUSAHA",
    ).length;
    const countUsahaKuliah = filteredRespondents.filter(
      (r) => r.statusKegiatan === "WIRAUSAHA_KULIAH",
    ).length;
    const countKuliahOnly = filteredRespondents.filter(
      (r) => r.statusKegiatan === "KULIAH",
    ).length;
    const countMencari = filteredRespondents.filter(
      (r) =>
        r.statusKegiatan === "BELUM_KERJA" || r.statusKegiatan === "LAINNYA",
    ).length;

    const detailItems = [
      {
        key: "KERJA_KULIAH",
        name: "Kerja & Kuliah",
        subNote: "Bekerja sekaligus studi",
        count: countKerjaKuliah,
        percent:
          total > 0
            ? parseFloat(((countKerjaKuliah / total) * 100).toFixed(1))
            : 0,
        color: "#1e40af",
      },
      {
        key: "KERJA",
        name: "Bekerja",
        subNote: "Karyawan / teknisi industri",
        count: countKerjaMurni,
        percent:
          total > 0
            ? parseFloat(((countKerjaMurni / total) * 100).toFixed(1))
            : 0,
        color: "#0d2346",
      },
      {
        key: "WIRAUSAHA",
        name: "Wirausaha Mandiri",
        subNote: "Usaha sendiri / freelance",
        count: countUsahaMurni,
        percent:
          total > 0
            ? parseFloat(((countUsahaMurni / total) * 100).toFixed(1))
            : 0,
        color: "#F4EB6C",
      },
      {
        key: "WIRAUSAHA_KULIAH",
        name: "Wirausaha & Kuliah",
        subNote: "Wirausaha sambil kuliah",
        count: countUsahaKuliah,
        percent:
          total > 0
            ? parseFloat(((countUsahaKuliah / total) * 100).toFixed(1))
            : 0,
        color: "#0d9488",
      },
      {
        key: "KULIAH",
        name: "Kuliah",
        subNote: "Fokus studi perguruan tinggi",
        count: countKuliahOnly,
        percent:
          total > 0
            ? parseFloat(((countKuliahOnly / total) * 100).toFixed(1))
            : 0,
        color: "#3b82f6",
      },
      {
        key: "BELUM_KERJA",
        name: "Mencari Kerja",
        subNote: "Sedang proses melamar",
        count: countMencari,
        percent:
          total > 0 ? parseFloat(((countMencari / total) * 100).toFixed(1)) : 0,
        color: "#94a3b8",
      },
    ].filter((item) => item.count > 0 || total === 0);

    return {
      total,
      pilarItems,
      detailItems,
    };
  }, [filteredRespondents]);

  const recentSubmissions = useMemo(() => {
    return filteredRespondents.slice(0, 5);
  }, [filteredRespondents]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Year Selection */}
      <OverviewBanner
        selectedYear={selectedYear}
        isAllYears={isAllYears}
        onSelectYear={handleSelectYear}
        availableYears={availableYears}
        totalMaster={totalMaster}
        totalRespondents={filteredRespondents.length}
        syncNotification={syncNotification}
        onNavigateTab={onNavigateTab}
      />

      {/* Top Overview Section: KPI Cards & Activity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <OverviewKpiCards
          targetQuota={targetQuota}
          totalMaster={totalMaster}
          isAllYears={isAllYears}
          responseRate={responseRate}
          totalSubmitted={totalSubmitted}
          totalRespondents={filteredRespondents.length}
        />

        <OverviewActivityChart
          activityDistribution={activityDistribution}
          isAllYears={isAllYears}
          selectedYear={selectedYear}
          onNavigateTab={onNavigateTab}
        />
      </div>

      {/* Program Keahlian Breakdown & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <OverviewJurusanStats
          jurusanStats={jurusanStats}
          isAllYears={isAllYears}
          selectedYear={selectedYear}
          onNavigateTab={onNavigateTab}
        />

        <OverviewRecentSubmissions
          recentSubmissions={recentSubmissions}
          onNavigateTab={onNavigateTab}
          onOpenRespondentDetail={onOpenRespondentDetail}
        />
      </div>
    </div>
  );
};
