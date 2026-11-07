import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ChevronRight, HelpCircle } from "lucide-react";
import {
  EMPTY_KETERSERAPAN,
  KeterserapanData,
  aggregateRows,
  buildChartStats,
  buildJurusanTableRows,
  filterByJurusanCode,
  jurusanCode,
  getFallbackKeterserapan,
} from "@/lib/reportStats";

const JURUSAN_OPTIONS_MAP: { id: string; name: string; code: string }[] = [
  { id: "ALL", name: "Semua Jurusan", code: "Semua" },
  { id: "tpm", name: "Teknik Pemesinan (TPM)", code: "TPM" },
  { id: "titl", name: "Teknik Instalasi Tenaga Listrik (TITL)", code: "TITL" },
  { id: "el", name: "Teknik Elektronika Industri (EL)", code: "EL" },
  { id: "tkro", name: "Teknik Kendaraan Ringan Otomotif (TKRO)", code: "TKRO" },
  { id: "tbsm", name: "Teknik dan Bisnis Sepeda Motor (TBSM)", code: "TBSM" },
  { id: "tkj", name: "Teknik Komputer dan Jaringan (TKJ)", code: "TKJ" },
];

const JURUSAN_BY_CODE: Record<string, string> = {
  TPM: "Teknik Pemesinan",
  TITL: "Teknik Instalasi Tenaga Listrik",
  EL: "Teknik Elektronika Industri",
  TKRO: "Teknik Kendaraan Ringan Otomotif",
  TBSM: "Teknik dan Bisnis Sepeda Motor",
  TKJ: "Teknik Komputer dan Jaringan",
};

const YEAR_OPTIONS = [
  { value: "ALL", label: "Semua Tahun (2022 - 2025)" },
  { value: "2025", label: "Tahun Lulus 2025" },
  { value: "2024", label: "Tahun Lulus 2024" },
  { value: "2023", label: "Tahun Lulus 2023" },
  { value: "2022", label: "Tahun Lulus 2022" },
];

export const ReportDetailPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // 1. Filter States
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedJurusan, setSelectedJurusan] = useState<string>("ALL");

  // 2. Statistik (mengutamakan basis data, fallback ke data mock jika API belum ada isian)
  const [stats, setStats] = useState<KeterserapanData>(() => getFallbackKeterserapan());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>("");

  useEffect(() => {
    let isActive = true;

    const fetchStats = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const { publicReportApi } = await import("@/services/adminService");
        const res = await publicReportApi.getKeterserapan({
          tahunLulus: selectedYear === "ALL" ? undefined : Number(selectedYear),
        });
        if (!isActive) return;
        if (res?.data && res.data.totalResponden > 0) {
          setStats(res.data);
        } else {
          setStats(
            getFallbackKeterserapan(
              selectedYear === "ALL" ? undefined : Number(selectedYear),
            ),
          );
        }
      } catch (err: any) {
        if (!isActive) return;
        setStats(
          getFallbackKeterserapan(
            selectedYear === "ALL" ? undefined : Number(selectedYear),
          ),
        );
        setLoadError(err.message || "Gagal memuat statistik dari basis data.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    fetchStats();
    return () => {
      isActive = false;
    };
  }, [selectedYear]);

  // 3. Rekap per jurusan (tabel bisa diklik untuk memfilter chart)
  const tableRows = useMemo(
    () =>
      buildJurusanTableRows(stats.byJurusan).map((row) => ({
        ...row,
        id: jurusanCode(row.jurusan).toLowerCase(),
      })),
    [stats.byJurusan],
  );

  const totalSummary = useMemo(() => {
    const totalAlumni = tableRows.reduce(
      (acc, curr) => acc + curr.totalAlumni,
      0,
    );
    const mengisiTracer = tableRows.reduce(
      (acc, curr) => acc + curr.mengisiTracer,
      0,
    );
    const bekerja = tableRows.reduce((acc, curr) => acc + curr.bekerja, 0);
    const kuliah = tableRows.reduce((acc, curr) => acc + curr.kuliah, 0);
    const wirausaha = tableRows.reduce((acc, curr) => acc + curr.wirausaha, 0);
    const belumKerja = tableRows.reduce(
      (acc, curr) => acc + curr.belumKerja,
      0,
    );

    return {
      totalAlumni,
      mengisiTracer,
      bekerja,
      kuliah,
      wirausaha,
      belumKerja,
      tracerPercent:
        totalAlumni > 0
          ? ((mengisiTracer / totalAlumni) * 100).toFixed(1)
          : "0",
    };
  }, [tableRows]);

  // 4. Chart mengikuti filter jurusan (klik baris tabel)
  const chartStats = useMemo(
    () =>
      buildChartStats(
        aggregateRows(filterByJurusanCode(stats.byJurusan, selectedJurusan)),
      ),
    [stats.byJurusan, selectedJurusan],
  );

  // 5. Label filter aktif
  const activeJurusanObj =
    JURUSAN_OPTIONS_MAP.find((j) => j.id === selectedJurusan) ||
    JURUSAN_OPTIONS_MAP[0];
  const activeYearLabel =
    YEAR_OPTIONS.find((y) => y.value === selectedYear)?.label || selectedYear;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800 w-full overflow-x-hidden">
      {/* Top Header / Sticky Navbar */}
      <Navbar />

      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200/60 py-2.5 sm:py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto whitespace-nowrap scrollbar-none">
            <Link to="/" className="hover:text-blue-600 transition-colors">
              Beranda
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-800">
              Hasil & Laporan Tracer Study
            </span>
          </nav>
        </div>
      </div>

      {/* Hero Banner Header */}
      <section className="bg-gradient-to-r from-[#0d223f] via-[#163863] to-[#0f2747] text-white py-8 sm:py-12 lg:py-16 relative overflow-hidden">
        {/* Background Decorative Motif & Ambient Lighting */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
          {/* Ambient Glows */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 right-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-20 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl" />

          {/* Subtle Technical Grid Overlay */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.09]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="report-banner-grid"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 32 0 L 0 0 0 32"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="0.8"
                />
                <circle cx="32" cy="0" r="1.5" fill="#93c5fd" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#report-banner-grid)" />
          </svg>

          {/* Analytical Data Curve & Telemetry Chart Motif (Right Side) */}
          <svg
            className="absolute right-0 top-0 bottom-0 h-full w-[450px] sm:w-[700px] lg:w-[860px] max-w-none opacity-20 sm:opacity-40"
            viewBox="0 0 900 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient
                id="report-chart-fill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#1e40af" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient
                id="report-line-grad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
                <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="80%" stopColor="#818cf8" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="report-bar-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Subtle Background Histogram / Data Bars */}
            <g opacity="0.4">
              <rect
                x="520"
                y="160"
                width="18"
                height="90"
                rx="3"
                fill="url(#report-bar-grad)"
                stroke="#60a5fa"
                strokeWidth="0.8"
              />
              <rect
                x="555"
                y="130"
                width="18"
                height="120"
                rx="3"
                fill="url(#report-bar-grad)"
                stroke="#60a5fa"
                strokeWidth="0.8"
              />
              <rect
                x="590"
                y="100"
                width="18"
                height="150"
                rx="3"
                fill="url(#report-bar-grad)"
                stroke="#60a5fa"
                strokeWidth="0.8"
              />
              <rect
                x="625"
                y="145"
                width="18"
                height="105"
                rx="3"
                fill="url(#report-bar-grad)"
                stroke="#60a5fa"
                strokeWidth="0.8"
              />
              <rect
                x="660"
                y="75"
                width="18"
                height="175"
                rx="3"
                fill="url(#report-bar-grad)"
                stroke="#60a5fa"
                strokeWidth="0.8"
              />
              <rect
                x="695"
                y="115"
                width="18"
                height="135"
                rx="3"
                fill="url(#report-bar-grad)"
                stroke="#60a5fa"
                strokeWidth="0.8"
              />
              <rect
                x="730"
                y="60"
                width="18"
                height="190"
                rx="3"
                fill="url(#report-bar-grad)"
                stroke="#60a5fa"
                strokeWidth="0.8"
              />
            </g>

            {/* Area Curve Fill */}
            <path
              d="M120 260 Q 280 250 420 180 T 660 75 T 900 40 L 900 280 L 120 280 Z"
              fill="url(#report-chart-fill)"
            />

            {/* Primary Growth Trend Spline Curve */}
            <path
              d="M120 260 Q 280 250 420 180 T 660 75 T 900 40"
              stroke="url(#report-line-grad)"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Secondary Target / Projection Curve */}
            <path
              d="M180 280 C 340 260, 480 140, 680 130 C 780 125, 840 70, 900 80"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              strokeOpacity="0.6"
            />

            {/* Glowing Data Marker Nodes on Primary Trendline */}
            <g>
              <circle cx="350" cy="225" r="4" fill="#38bdf8" />
              <circle
                cx="350"
                cy="225"
                r="8"
                stroke="#38bdf8"
                strokeWidth="1"
                opacity="0.4"
              />

              <circle cx="500" cy="140" r="4.5" fill="#60a5fa" />
              <circle
                cx="500"
                cy="140"
                r="10"
                stroke="#60a5fa"
                strokeWidth="1"
                opacity="0.4"
              />
              <line
                x1="500"
                y1="140"
                x2="500"
                y2="250"
                stroke="#60a5fa"
                strokeWidth="1"
                strokeDasharray="2 3"
                opacity="0.3"
              />

              <circle cx="660" cy="75" r="6" fill="#38bdf8" />
              <circle
                cx="660"
                cy="75"
                r="14"
                stroke="#38bdf8"
                strokeWidth="1.5"
                opacity="0.5"
              />
              <line
                x1="660"
                y1="75"
                x2="660"
                y2="250"
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="2 3"
                opacity="0.4"
              />

              <circle cx="780" cy="55" r="4" fill="#a78bfa" />
              <circle
                cx="780"
                cy="55"
                r="9"
                stroke="#a78bfa"
                strokeWidth="1"
                opacity="0.4"
              />
            </g>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-2 sm:space-y-3.5">
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">
              Laporan Statistik Lulusan
            </h1>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 w-full min-w-0">
        {/* 1. Filter Bar Sederhana (Bagian Atas: 2 Dropdown Sejajar) */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5 sm:gap-4 pb-3.5 sm:pb-4 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                Filter Data Evaluasi
              </h3>

              {/* Tooltip Question Mark Icon */}
              <div className="relative group/tooltip inline-flex items-center">
                <button
                  type="button"
                  aria-label="Informasi filter data evaluasi"
                  className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-help p-0.5 rounded-full hover:bg-slate-100"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>

                {/* Tooltip Card on Hover */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover/tooltip:block group-focus-within/tooltip:block z-30 w-56 sm:w-64 p-2.5 bg-white text-slate-600 text-[11px] leading-relaxed rounded-lg border border-slate-200 shadow-lg pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95 font-normal">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-t border-l border-slate-200 rotate-45" />
                  Pilih tahun kelulusan dan program keahlian untuk memperbarui
                  grafik secara otomatis
                </div>
              </div>
            </div>
          </div>

          {/* The 2 Side-by-Side Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3.5 sm:pt-4">
            {/* Dropdown 1: Tahun Lulus / Periode */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Tahun Lulus
              </label>
              <CustomSelect
                value={selectedYear}
                options={YEAR_OPTIONS}
                onChange={(val) => setSelectedYear(val)}
              />
            </div>

            {/* Dropdown 2: Jurusan / Program Keahlian */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Jurusan / Program Keahlian
              </label>
              <CustomSelect
                value={selectedJurusan}
                options={JURUSAN_OPTIONS_MAP.map((j) => ({
                  value: j.id,
                  label: j.name,
                }))}
                onChange={(val) => setSelectedJurusan(val)}
              />
            </div>
          </div>

          {/* Active Filter Info Strip */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="truncate">
                Menampilkan{" "}
                <strong className="text-slate-900">
                  {activeJurusanObj.name}
                </strong>{" "}
                ({activeYearLabel})
              </span>
            </div>
            <span className="font-bold text-[#182a4a] self-start sm:self-auto shrink-0 text-[11px] sm:text-xs">
              Total Responden:{" "}
              {chartStats.totalResponden.toLocaleString("id-ID")} Orang
            </span>
          </div>
        </div>

        {/* 2. Tabel Rekapitulasi Data (Di Bawah Chart) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base sm:text-xl font-extrabold text-[#182a4a]">
                Rekapitulasi Data Tracer Study per Program Keahlian
              </h3>

              {/* Tooltip Question Mark Icon */}
              <div className="relative group/tooltip inline-flex items-center">
                <button
                  type="button"
                  aria-label="Petunjuk interaksi tabel rekapitulasi"
                  className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-help p-0.5 rounded-full hover:bg-slate-100"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>

                {/* Tooltip Card on Hover */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover/tooltip:block group-focus-within/tooltip:block z-30 w-56 sm:w-64 p-2.5 bg-white text-slate-600 text-[11px] leading-relaxed rounded-lg border border-slate-200 shadow-lg pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95 font-normal">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-t border-l border-slate-200 rotate-45" />
                  Klik pada salah satu baris jurusan di tabel untuk memfilter
                  chart di bawah secara langsung.
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-slate-200 self-start sm:self-auto shrink-0">
              Periode:{" "}
              <strong className="text-slate-900">
                {selectedYear === "ALL"
                  ? "Seluruh Tahun Kelulusan"
                  : `Tahun ${selectedYear}`}
              </strong>
            </div>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="min-w-[700px] w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm">
                  <th className="py-3 px-3.5 sm:px-4 rounded-l-xl min-w-[210px] sm:min-w-[250px]">
                    Program Keahlian (Jurusan)
                  </th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">
                    Total Alumni
                  </th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">
                    Mengisi Tracer
                  </th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">
                    Bekerja
                  </th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">
                    Kuliah
                  </th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">
                    Wirausaha
                  </th>
                  <th className="py-3 px-3 text-center rounded-r-xl whitespace-nowrap">
                    Belum Kerja
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tableRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-8 px-4 text-center text-xs text-slate-500"
                    >
                      Belum ada data kuesioner pada periode ini. Statistik akan
                      terisi otomatis setelah alumni mengisi tracer study.
                    </td>
                  </tr>
                )}
                {tableRows.map((row) => {
                  const isSelected = selectedJurusan === row.id;
                  return (
                    <tr
                      key={row.id}
                      onClick={() =>
                        setSelectedJurusan(isSelected ? "ALL" : row.id)
                      }
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-blue-50/80 font-medium"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <td className="py-3 px-3.5 sm:px-4 font-bold text-slate-900 text-[11px] sm:text-xs md:text-sm flex items-center gap-2 sm:gap-2.5">
                        <span
                          className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 ${
                            isSelected
                              ? "bg-[#182a4a] ring-2 ring-blue-200"
                              : "bg-slate-300"
                          }`}
                        />
                        <span className="leading-tight">
                          {row.name} ({row.code})
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-800 text-xs sm:text-sm">
                        {row.totalAlumni}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-[#182a4a] text-xs sm:text-sm">
                        {row.mengisiTracer}{" "}
                        <span className="text-[10px] sm:text-[11px] font-normal text-slate-500">
                          ({row.tracerPercent}%)
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-800 text-xs sm:text-sm">
                        {row.bekerja}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-800 text-xs sm:text-sm">
                        {row.kuliah}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-800 text-xs sm:text-sm">
                        {row.wirausaha}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-800 text-xs sm:text-sm">
                        {row.belumKerja}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Summary Row */}
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-100 font-extrabold text-slate-900 text-xs sm:text-sm">
                  <td className="py-3.5 px-3.5 sm:px-4 rounded-l-xl text-slate-900 whitespace-nowrap">
                    Total Keseluruhan
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-900">
                    {totalSummary.totalAlumni}
                  </td>
                  <td className="py-3.5 px-3 text-center text-[#182a4a]">
                    {totalSummary.mengisiTracer}{" "}
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-600">
                      ({totalSummary.tracerPercent}%)
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-900">
                    {totalSummary.bekerja}
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-900">
                    {totalSummary.kuliah}
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-900">
                    {totalSummary.wirausaha}
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-900 rounded-r-xl">
                    {totalSummary.belumKerja}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {selectedJurusan !== "ALL" && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end text-xs">
              <button
                onClick={() => setSelectedJurusan("ALL")}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Reset Filter ke Semua Jurusan
              </button>
            </div>
          )}
        </div>

        {/* 3. Chart Inti (Baku Standar Tracer Yayasan) */}
        <div>
          <div className="flex items-center justify-between mb-3.5 sm:mb-4">
            <div>
              <h2 className="text-base sm:text-xl font-extrabold text-[#182a4a]">
                Indikator Utama Evaluasi Lulusan
              </h2>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-hidden">
            {/* Chart Card 1: Diagram Laju Serap / Status Aktivitas Lulusan */}
            <div className="p-4 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-slate-100 mb-4">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Laju Serap & Aktivitas
                  </h3>
                </div>

                {/* Donut Chart Visual */}
                <div className="relative flex items-center justify-center my-4">
                  <svg
                    className="w-36 h-36 sm:w-44 sm:h-44 transform -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    {/* Background track */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-slate-100 stroke-current"
                      strokeWidth="14"
                      fill="transparent"
                    />
                    {/* Slices */}
                    {/* Bekerja: Primary Navy */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#182a4a"
                      strokeWidth="14"
                      fill="transparent"
                      strokeDasharray="251.2"
                      strokeDashoffset={
                        251.2 -
                        (251.2 * chartStats.aktivitas.bekerja.percent) / 100
                      }
                      strokeLinecap="butt"
                      className="transition-all duration-700"
                    />
                    {/* Kuliah: Blue Accent */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#3b82f6"
                      strokeWidth="14"
                      fill="transparent"
                      strokeDasharray="251.2"
                      strokeDashoffset={
                        251.2 -
                        (251.2 *
                          (chartStats.aktivitas.bekerja.percent +
                            chartStats.aktivitas.kuliah.percent)) /
                          100
                      }
                      style={{
                        transformOrigin: "center",
                        transform: `rotate(${(chartStats.aktivitas.bekerja.percent / 100) * 360}deg)`,
                      }}
                      strokeLinecap="butt"
                      className="transition-all duration-700"
                    />
                    {/* Wirausaha: Slate */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#64748b"
                      strokeWidth="14"
                      fill="transparent"
                      strokeDasharray="251.2"
                      strokeDashoffset={
                        251.2 -
                        (251.2 *
                          (chartStats.aktivitas.bekerja.percent +
                            chartStats.aktivitas.kuliah.percent +
                            chartStats.aktivitas.wirausaha.percent)) /
                          100
                      }
                      style={{
                        transformOrigin: "center",
                        transform: `rotate(${
                          ((chartStats.aktivitas.bekerja.percent +
                            chartStats.aktivitas.kuliah.percent) /
                            100) *
                          360
                        }deg)`,
                      }}
                      strokeLinecap="butt"
                      className="transition-all duration-700"
                    />
                  </svg>

                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-xl sm:text-3xl font-bold text-slate-900 leading-none">
                      {chartStats.aktivitas.bekerja.percent}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 mt-1">
                      Bekerja
                    </span>
                  </div>
                </div>

                {/* Legends & Breakdown */}
                <div className="space-y-2 mt-4">
                  {/* Bekerja */}
                  <div className="flex items-center justify-between p-2 sm:p-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-[#182a4a] shrink-0" />
                      <span className="font-medium text-slate-800">
                        Bekerja
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 font-bold">
                      <span className="text-slate-500 font-normal">
                        ({chartStats.aktivitas.bekerja.count})
                      </span>
                      <span className="text-[#182a4a]">
                        {chartStats.aktivitas.bekerja.percent}%
                      </span>
                    </div>
                  </div>

                  {/* Kuliah */}
                  <div className="flex items-center justify-between p-2 sm:p-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-[#3b82f6] shrink-0" />
                      <span className="font-medium text-slate-800">
                        Melanjutkan Pendidikan
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 font-bold">
                      <span className="text-slate-500 font-normal">
                        ({chartStats.aktivitas.kuliah.count})
                      </span>
                      <span className="text-slate-900">
                        {chartStats.aktivitas.kuliah.percent}%
                      </span>
                    </div>
                  </div>

                  {/* Wirausaha */}
                  <div className="flex items-center justify-between p-2 sm:p-2.5  text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-[#64748b] shrink-0" />
                      <span className="font-medium text-slate-800">
                        Wirausaha Mandiri
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 font-bold">
                      <span className="text-slate-500 font-normal">
                        ({chartStats.aktivitas.wirausaha.count})
                      </span>
                      <span className="text-slate-900">
                        {chartStats.aktivitas.wirausaha.percent}%
                      </span>
                    </div>
                  </div>

                  {/* Belum Bekerja */}
                  <div className="flex items-center justify-between p-2 sm:p-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-slate-300 shrink-0" />
                      <span className="font-medium text-slate-800">
                        Belum Kerja / Cari Kerja
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 font-bold">
                      <span className="text-slate-500 font-normal">
                        ({chartStats.aktivitas.belumKerja.count})
                      </span>
                      <span className="text-slate-900">
                        {chartStats.aktivitas.belumKerja.percent}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 text-center">
                Total Lulusan Terserap (Bekerja, Kuliah, Wirausaha):{" "}
                <strong className="text-slate-900">
                  {(
                    chartStats.aktivitas.bekerja.percent +
                    chartStats.aktivitas.kuliah.percent +
                    chartStats.aktivitas.wirausaha.percent
                  ).toFixed(1)}
                  %
                </strong>
              </div>
            </div>

            {/* Chart Card 2: Diagram Kesesuaian Bidang Kerja / Linieritas */}
            <div className="p-4 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-slate-100 mb-4">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Kesesuaian Bidang Kerja
                  </h3>
                </div>

                {/* Big Linear Badge */}
                <div className="text-center my-2">
                  <div className="text-2xl sm:text-4xl font-bold text-[#182a4a] mt-1">
                    {chartStats.kesesuaian.totalLinear}%
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Alumni bekerja sesuai dengan kompetensi keahlian kejuruannya
                  </p>
                </div>

                {/* Progress Bars for 4 Levels */}
                <div className="space-y-3 mt-4 sm:mt-5">
                  {/* Sangat Sesuai */}
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#182a4a]" />
                        <span>Sangat Sesuai</span>
                      </span>
                      <span className="text-slate-900 font-bold">
                        {chartStats.kesesuaian.sangatSesuai.percent}% (
                        {chartStats.kesesuaian.sangatSesuai.count})
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#182a4a] rounded-full transition-all duration-700"
                        style={{
                          width: `${chartStats.kesesuaian.sangatSesuai.percent}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Sesuai */}
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <span>Sesuai</span>
                      </span>
                      <span className="text-slate-900 font-bold">
                        {chartStats.kesesuaian.sesuai.percent}% (
                        {chartStats.kesesuaian.sesuai.count})
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-700"
                        style={{
                          width: `${chartStats.kesesuaian.sesuai.percent}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Kurang Sesuai */}
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-500" />
                        <span>Kurang Sesuai</span>
                      </span>
                      <span className="text-slate-900 font-bold">
                        {chartStats.kesesuaian.kurangSesuai.percent}% (
                        {chartStats.kesesuaian.kurangSesuai.count})
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-500 rounded-full transition-all duration-700"
                        style={{
                          width: `${chartStats.kesesuaian.kurangSesuai.percent}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Tidak Sesuai */}
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                        <span>Tidak Sesuai</span>
                      </span>
                      <span className="text-slate-900 font-bold">
                        {chartStats.kesesuaian.tidakSesuai.percent}% (
                        {chartStats.kesesuaian.tidakSesuai.count})
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-300 rounded-full transition-all duration-700"
                        style={{
                          width: `${chartStats.kesesuaian.tidakSesuai.percent}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Card 3: Diagram Sektor / Skala Tempat Kerja */}
            <div className="p-4 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-slate-100 mb-4">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Sektor & Skala Tempat Kerja
                  </h3>
                </div>

                <p className="text-xs text-slate-500 mb-4">
                  Distribusi penyerapan alumni berdasarkan jangkauan dan skala
                  tempat bekerja:
                </p>

                {/* Visual Comparative Bars */}
                <div className="space-y-3">
                  {/* Nasional */}
                  <div className="p-2.5 sm:p-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-800">
                        Nasional / BUMN
                      </span>
                      <span className="font-extrabold text-[#182a4a]">
                        {chartStats.skalaKerja.nasional.percent}% (
                        {chartStats.skalaKerja.nasional.count})
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#182a4a] rounded-full transition-all duration-700"
                        style={{
                          width: `${chartStats.skalaKerja.nasional.percent}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Lokal / Wilayah */}
                  <div className="p-2.5 sm:p-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-800">
                        Lokal / Wilayah (Jabodetabek)
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {chartStats.skalaKerja.lokal.percent}% (
                        {chartStats.skalaKerja.lokal.count})
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-700"
                        style={{
                          width: `${chartStats.skalaKerja.lokal.percent}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Multinasional / Internasional */}
                  <div className="p-2.5 sm:p-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-800">
                        Multinasional / Global
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {chartStats.skalaKerja.multinasional.percent}% (
                        {chartStats.skalaKerja.multinasional.count})
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-600 rounded-full transition-all duration-700"
                        style={{
                          width: `${chartStats.skalaKerja.multinasional.percent}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Wirausaha / Mandiri */}
                  <div className="p-2.5 sm:p-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-800">
                        Wirausaha / Mandiri
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {chartStats.skalaKerja.wirausaha.percent}% (
                        {chartStats.skalaKerja.wirausaha.count})
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-400 rounded-full transition-all duration-700"
                        style={{
                          width: `${chartStats.skalaKerja.wirausaha.percent}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
