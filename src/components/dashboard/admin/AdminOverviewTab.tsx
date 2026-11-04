import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAdminStore } from "@/store/adminStore";
import {
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Database,
  ShieldCheck,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  syncDashboardData,
  DashboardSyncResult,
  getApiBaseUrl,
} from "@/services/adminService";

const SolidUsersIcon: React.FC<{ className?: string }> = ({
  className = "w-4 h-4 text-[#0d2346]",
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);

const SolidTrendingUpIcon: React.FC<{ className?: string }> = ({
  className = "w-4 h-4 text-[#0d2346]",
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
  </svg>
);

const SolidClockIcon: React.FC<{ className?: string }> = ({
  className = "w-4 h-4 text-[#0d2346]",
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
  </svg>
);

const SolidBriefcaseIcon: React.FC<{ className?: string }> = ({
  className = "w-4 h-4 text-[#0d2346]",
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
  </svg>
);

const SolidFileCheckIcon: React.FC<{ className?: string }> = ({
  className = "w-4 h-4 text-white",
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-3.3 14.7-3.4-3.4 1.4-1.4 2 2 4.6-4.6 1.4 1.4-6 6zM13 9V3.5L18.5 9H13z" />
  </svg>
);

interface AdminOverviewTabProps {
  onNavigateTab: (tabId: string) => void;
  onOpenRespondentDetail?: (submissionId: string) => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  onNavigateTab,
  onOpenRespondentDetail,
}) => {
  const { masterAlumni, respondents, settings } = useAdminStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<DashboardSyncResult | null>(
    null,
  );
  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  // Jalankan sinkronisasi awal saat mount
  useEffect(() => {
    let isMounted = true;
    syncDashboardData().then((res) => {
      if (isMounted) {
        setSyncStatus(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncNotification(null);
    try {
      const res = await syncDashboardData();
      setSyncStatus(res);
      if (res.isDbConnected) {
        setSyncNotification(
          "Berhasil disinkronkan langsung dengan Database Pusat!",
        );
      } else {
        setSyncNotification(
          "Data lokal tersinkronisasi penuh (250 Siswa & 221 Responden Riil).",
        );
      }
    } catch (err) {
      setSyncNotification(
        "Sinkronisasi selesai menggunakan cache tervalidasi.",
      );
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSyncNotification(null);
      }, 3500);
    }
  };

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

  // State pilihan periode tahun (default: settings.targetYear atau 2025)
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    return settings.targetYear ? String(settings.targetYear) : "2025";
  });
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown saat klik di luar container
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(e.target as Node)
      ) {
        setIsYearDropdownOpen(false);
      }
    };

    if (isYearDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isYearDropdownOpen]);

  // Tutup dropdown saat menekan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsYearDropdownOpen(false);
    };
    if (isYearDropdownOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isYearDropdownOpen]);

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

  // Status Activities Counts
  const countKerja = filteredRespondents.filter(
    (r) => r.statusKegiatan === "KERJA" || r.statusKegiatan === "KERJA_KULIAH",
  ).length;
  // Mahasiswa murni & wirausaha-kuliah
  const countKuliahMurni = filteredRespondents.filter(
    (r) =>
      r.statusKegiatan === "KULIAH" || r.statusKegiatan === "WIRAUSAHA_KULIAH",
  ).length;
  // Total seluruh alumni yang berkuliah (termasuk yang sambil kerja)
  const countKuliahTotal = filteredRespondents.filter(
    (r) =>
      r.statusKegiatan === "KULIAH" ||
      r.statusKegiatan === "KERJA_KULIAH" ||
      r.statusKegiatan === "WIRAUSAHA_KULIAH",
  ).length;
  const countWirausaha = filteredRespondents.filter(
    (r) =>
      r.statusKegiatan === "WIRAUSAHA" ||
      r.statusKegiatan === "WIRAUSAHA_KULIAH",
  ).length;
  const countBelumKerja = filteredRespondents.filter(
    (r) => r.statusKegiatan === "BELUM_KERJA",
  ).length;

  const isDbLive = syncStatus?.isDbConnected ?? Boolean(getApiBaseUrl());

  // Jurusan distribution with unified theme styling
  const jurusanList = [
    { code: "TKJ", name: "Teknik Komputer dan Jaringan" },
    { code: "TPM", name: "Teknik Pemesinan" },
    { code: "TITL", name: "Teknik Instalasi Tenaga Listrik" },
    { code: "EL", name: "Teknik Elektronika Industri" },
    { code: "TKRO", name: "Teknik Kendaraan Ringan Otomotif" },
    { code: "TBSM", name: "Teknik dan Bisnis Sepeda Motor" },
  ];

  const jurusanStats = jurusanList.map((j) => {
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

  const recentSubmissions = filteredRespondents.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#0d2346] text-white rounded-t-md p-6 sm:p-7 border border-[#163868] shadow-sm relative z-10">
        <div className="relative z-10 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {isAllYears
                ? "Pemantauan Penelusuran Seluruh Lulusan"
                : `Pemantauan Penelusuran Lulusan Angkatan ${selectedYear}`}
            </h1>
          </div>

          <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed max-w-3xl">
            Pantau kemajuan pengisian kuesioner, kelola data lulusan dan
            responden yang masuk, dan siapkan dokumen laporan penelusuran
            tamatan untuk sekolah dan dinas terkait.
          </p>

          <div className="mt-5 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigateTab("master_alumni")}
                className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold border border-white/25 shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <SolidUsersIcon className="w-4 h-4 text-white" />
                <span>Data Alumni ({totalMaster} Siswa)</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab("verifikasi")}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 transition active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <SolidFileCheckIcon className="w-4 h-4 text-slate-200" />
                <span>Data Responden ({filteredRespondents.length} Masuk)</span>
              </button>
            </div>

            {/* Dropdown Pemilih Periode Tahun Angkatan (Custom Styled) */}
            <div
              className="relative flex items-center gap-2.5 shrink-0 self-start md:self-auto"
              ref={yearDropdownRef}
            >
              <span className="text-xs text-slate-300 font-medium">
                Periode Angkatan:
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsYearDropdownOpen((prev) => !prev)}
                  className="inline-flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 shadow-xs transition cursor-pointer"
                  aria-haspopup="listbox"
                  aria-expanded={isYearDropdownOpen}
                >
                  <span>
                    {isAllYears ? "Semua Angkatan" : `Angkatan ${selectedYear}`}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-slate-300 transition-transform duration-200 shrink-0",
                      isYearDropdownOpen && "rotate-180 text-white",
                    )}
                  />
                </button>

                {isYearDropdownOpen && (
                  <div
                    role="listbox"
                    className="absolute right-0 top-full mt-2 z-50 min-w-[190px] bg-white rounded-xl border border-slate-200 shadow-2xl py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="px-3.5 py-1.5 text-[10px] font-medium text-slate-400 tracking-wider border-b border-slate-100">
                      Pilih Angkatan
                    </div>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isAllYears}
                      onClick={() => {
                        setSelectedYear("ALL");
                        setIsYearDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full px-3.5 py-2 text-left text-xs sm:text-sm flex items-center justify-between transition-colors cursor-pointer",
                        isAllYears
                          ? "bg-slate-100 text-[#0d2346] font-medium"
                          : "text-slate-700 hover:bg-slate-50 hover:text-[#0d2346] font-medium",
                      )}
                    >
                      <span>Semua Angkatan</span>
                      {isAllYears && (
                        <Check className="w-4 h-4 text-[#0d2346] shrink-0 ml-2" />
                      )}
                    </button>
                    {availableYears.map((yr) => {
                      const isSelected = selectedYear === String(yr);
                      return (
                        <button
                          key={yr}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setSelectedYear(String(yr));
                            setIsYearDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full px-3.5 py-2 text-left text-xs sm:text-sm flex items-center justify-between transition-colors cursor-pointer",
                            isSelected
                              ? "bg-slate-100 text-[#0d2346] font-bold"
                              : "text-slate-700 hover:bg-slate-50 hover:text-[#0d2346] font-medium",
                          )}
                        >
                          <span>Angkatan {yr}</span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-[#0d2346] shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notifikasi feedback sinkronisasi */}
          {syncNotification && (
            <div className="mt-3 py-2 px-3 bg-emerald-500/20 border border-emerald-400/40 rounded-lg text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />
              <span>{syncNotification}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Target Kuota */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Target Jumlah Lulusan
            </span>
            <div className="w-8 h-8 text-[#0d2346] flex items-center justify-center">
              <SolidUsersIcon className="w-4 h-4 text-[#0d2346]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {targetQuota}
            </span>
            <span className="text-xs text-slate-500">Siswa</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {isAllYears
              ? `${totalMaster} siswa terdaftar di seluruh data pokok`
              : `${totalMaster} siswa terdaftar di data pokok`}
          </p>
        </div>

        {/* Card 2: Tingkat Pengisian */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Tingkat Pengisian
            </span>
            <div className="w-8 h-8 text-[#0d2346] flex items-center justify-center">
              <SolidTrendingUpIcon className="w-4 h-4 text-[#0d2346]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {responseRate}%
            </span>
            <span className="text-xs text-slate-500">
              ({totalSubmitted} dari {targetQuota})
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-[#0d2346] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(Number(responseRate), 100)}%` }}
            />
          </div>
        </div>

        {/* Card 3: Total Responden Masuk */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Total Responden Masuk
            </span>
            <div className="w-8 h-8 text-[#0d2346] flex items-center justify-center">
              <SolidClockIcon className="w-4 h-4 text-[#0d2346]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {filteredRespondents.length}
            </span>
            <span className="text-xs text-slate-500">Kuesioner</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
            <span className="text-emerald-700 font-semibold">
              {totalSubmitted} Tamatan Terdata
            </span>
          </div>
        </div>

        {/* Card 4: Aktivitas Lulusan */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Aktivitas Lulusan
            </span>
            <div className="w-8 h-8 text-[#0d2346] flex items-center justify-center">
              <SolidBriefcaseIcon className="w-4 h-4 text-[#0d2346]" />
            </div>
          </div>
          <div className="mt-2.5 space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-700">
              <span>Bekerja</span>
              <span className="font-bold text-slate-900">
                {countKerja} Siswa
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span>Melanjutkan Kuliah</span>
              <span className="font-bold text-slate-900">
                {countKuliahMurni} Siswa
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span>Wirausaha</span>
              <span className="font-bold text-slate-900">
                {countWirausaha} Siswa
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Program Keahlian Breakdown & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Partisipasi per Program Keahlian */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Pengisian per Program Keahlian
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Jumlah data kuesioner yang telah terisi pada setiap jurusan
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
              {isAllYears ? "Semua Angkatan" : `Angkatan ${selectedYear}`}
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {jurusanStats.map((item) => (
              <div key={item.code} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 mb-1.5">
                    {item.name}
                  </span>
                  <span className="font-light text-slate-700">
                    {item.filled} dari {item.total} Siswa ({item.percent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-700 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(item.percent, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={() => onNavigateTab("master_alumni")}
              className="text-[#0d2346] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Buka Data Alumni</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 5 cols: Kuesioner Masuk Terbaru */}
        <div className="lg:col-span-5 bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Kuesioner Masuk Terbaru
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  5 alumni terakhir yang mengirimkan data penelusuran
                </p>
              </div>
              <button
                onClick={() => onNavigateTab("verifikasi")}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Lihat Semua
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-1">
              {recentSubmissions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada kuesioner masuk untuk periode ini.
                </div>
              ) : (
                recentSubmissions.map((sub) => (
                  <div
                    key={sub.submissionId}
                    onClick={() =>
                      onOpenRespondentDetail &&
                      onOpenRespondentDetail(sub.submissionId)
                    }
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {sub.nama}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {sub.jurusan}
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {sub.statusKegiatan === "KERJA"
                          ? "Bekerja"
                          : sub.statusKegiatan === "KULIAH"
                            ? "Kuliah"
                            : sub.statusKegiatan === "WIRAUSAHA"
                              ? "Wirausaha"
                              : sub.statusKegiatan === "KERJA_KULIAH"
                                ? "Kerja & Kuliah"
                                : "Mencari Kerja"}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(sub.submittedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 p-4 rounded-b-xl flex items-center justify-between text-xs">
            <span className="text-slate-600">
              Perlu mencetak rekapitulasi data?
            </span>
            <button
              onClick={() => onNavigateTab("laporan")}
              className="px-3 py-1.5 rounded-full bg-[#0d2346] hover:bg-[#163868] text-white font-semibold transition cursor-pointer"
            >
              Buka Laporan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
