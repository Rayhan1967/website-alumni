import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  EMPTY_KETERSERAPAN,
  KeterserapanData,
  availableJurusan,
  buildChartStats,
  jurusanCode,
  jurusanShortName,
  getFallbackKeterserapan,
} from "@/lib/reportStats";

const YEAR_OPTIONS = [
  { value: "ALL", label: "Semua Tahun" },
  { value: "2025", label: "Tahun Lulus 2025" },
  { value: "2024", label: "Tahun Lulus 2024" },
  { value: "2023", label: "Tahun Lulus 2023" },
  { value: "2022", label: "Tahun Lulus 2022" },
];

const ALL_JURUSAN_OPTION = {
  value: "ALL",
  label: "Semua Jurusan",
};

export const ReportSection: React.FC = () => {
  const navigate = useNavigate();

  // 1. Filter States (2 Dropdown)
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedJurusan, setSelectedJurusan] = useState<string>("ALL");

  // 2. Statistik (mengutamakan basis data, fallback ke data mock jika API belum ada isian)
  const [stats, setStats] = useState<KeterserapanData>(() =>
    getFallbackKeterserapan(),
  );
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
          jurusan: selectedJurusan === "ALL" ? undefined : selectedJurusan,
          tahunLulus: selectedYear === "ALL" ? undefined : Number(selectedYear),
        });
        if (!isActive) return;
        if (res?.data && res.data.totalResponden > 0) {
          setStats(res.data);
        } else {
          setStats(
            getFallbackKeterserapan(
              selectedYear === "ALL" ? undefined : Number(selectedYear),
              selectedJurusan,
            ),
          );
        }
      } catch (err: any) {
        if (!isActive) return;
        setStats(
          getFallbackKeterserapan(
            selectedYear === "ALL" ? undefined : Number(selectedYear),
            selectedJurusan,
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
  }, [selectedJurusan, selectedYear]);

  // Pilihan jurusan & tahun mengikuti data yang benar-benar ada di basis data
  const jurusanOptions = useMemo(() => {
    const list = availableJurusan(stats.byJurusan).map((j) => ({
      value: j,
      label: `${jurusanCode(j)} - ${jurusanShortName(j)}`,
    }));
    return [ALL_JURUSAN_OPTION, ...list];
  }, [stats.byJurusan]);

  const yearOptions = useMemo(() => {
    const years = Array.from(
      new Set(stats.byJurusan.map((row) => row.tahunLulus)),
    )
      .sort((a, b) => b - a)
      .map((y) => ({ value: String(y), label: `Tahun Lulus ${y}` }));
    if (years.length === 0) return YEAR_OPTIONS;
    return [{ value: "ALL", label: "Semua Tahun" }, ...years];
  }, [stats.byJurusan]);

  // Data chart (persentase dihitung dari jumlah responden basis data)
  const chartStats = useMemo(() => buildChartStats(stats), [stats]);

  const formattedUpdated = useMemo(() => {
    if (!stats.perbaruPada) return "";
    const date = new Date(stats.perbaruPada);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [stats.perbaruPada]);

  const activeYearLabel =
    yearOptions.find((y) => y.value === selectedYear)?.label || selectedYear;

  return (
    <section id="laporan" className="relative pt-16 sm:pt-20 lg:pt-24 pb-12 sm:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#182a4a] tracking-tight">
            Statistik Keterserapan Lulusan
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Data ketercapaian alumni SMK Sasmita Jaya 2 dalam dunia kerja,
            pendidikan tinggi, dan wirausaha mandiri yang diperbarui secara
            berkala.
          </p>

          {/* Filter Jurusan & Tahun */}
          <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <div className="w-full sm:w-72">
              <CustomSelect
                options={jurusanOptions}
                value={selectedJurusan}
                onChange={(v) => setSelectedJurusan(v)}
                triggerSize="sm"
              />
            </div>
            <div className="w-full sm:w-56">
              <CustomSelect
                options={yearOptions}
                value={selectedYear}
                onChange={(v) => setSelectedYear(v)}
                triggerSize="sm"
              />
            </div>
          </div>
        </div>

        {/* 2. Tiga Chart Inti (Baku Standar Tracer Yayasan) */}
        <div className="bg-white border border-slate-200 shadow-xs grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
          {/* Chart 1: Laju Serap Donut Chart */}
          <div className="p-5 sm:p-6  flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-sm sm:text-base font-medium text-slate-900">
                  Laju Serap & Aktivitas
                </h3>
              </div>

              {/* Donut Graphic */}
              <div className="relative flex items-center justify-center my-4">
                <svg
                  className="w-40 h-40 transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="text-slate-100 stroke-current"
                    strokeWidth="14"
                    fill="transparent"
                  />
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

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-2xl font-bold text-slate-900 leading-none">
                    {chartStats.aktivitas.bekerja.percent}%
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 mt-1 tracking-wider">
                    Bekerja
                  </span>
                </div>
              </div>

              {/* Legends */}
              <div className="space-y-2 mt-4 text-xs">
                <div className="flex items-center justify-between p-2 ">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#182a4a]" />
                    <span className="font-medium text-slate-800">
                      Bekerja
                    </span>
                  </div>
                  <span className="font-bold text-[#182a4a]">
                    {chartStats.aktivitas.bekerja.percent}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 ">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                    <span className="font-medium text-slate-800">Kuliah</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {chartStats.aktivitas.kuliah.percent}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 ">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#64748b]" />
                    <span className="font-medium text-slate-800">
                      Wirausaha
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {chartStats.aktivitas.wirausaha.percent}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 ">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span className="font-medium text-slate-800">
                      Belum Kerja
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {chartStats.aktivitas.belumKerja.percent}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 2: Linieritas / Kesesuaian Bidang Kerja */}
          <div className="p-5 sm:p-6  flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Kesesuaian Bidang Kerja
                </h3>
              </div>

              <div className="p-4 text-center my-2">
                <div className="text-3xl font-bold text-[#182a4a] mt-1">
                  {chartStats.kesesuaian.totalLinear}%
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Bekerja relevan dengan kompetensi keahlian kejuruan
                </p>
              </div>

              <div className="space-y-3 mt-4 text-xs">
                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span className="text-slate-800">Sangat Sesuai</span>
                    <span className="text-slate-900 font-bold">
                      {chartStats.kesesuaian.sangatSesuai.percent}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#182a4a] rounded-full"
                      style={{
                        width: `${chartStats.kesesuaian.sangatSesuai.percent}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span className="text-slate-800">Sesuai</span>
                    <span className="text-slate-900 font-bold">
                      {chartStats.kesesuaian.sesuai.percent}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{
                        width: `${chartStats.kesesuaian.sesuai.percent}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span className="text-slate-800">Kurang Sesuai</span>
                    <span className="text-slate-900 font-bold">
                      {chartStats.kesesuaian.kurangSesuai.percent}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-500 rounded-full"
                      style={{
                        width: `${chartStats.kesesuaian.kurangSesuai.percent}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span className="text-slate-800">Tidak Sesuai</span>
                    <span className="text-slate-900 font-bold">
                      {chartStats.kesesuaian.tidakSesuai.percent}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-300 rounded-full"
                      style={{
                        width: `${chartStats.kesesuaian.tidakSesuai.percent}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 3: Skala & Sektor Tempat Kerja */}
          <div className="p-5 sm:p-6  flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Sektor & Skala Kerja
                </h3>
              </div>

              <div className="space-y-3 mt-2">
                <div className="p-2.5 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800">
                      Nasional / BUMN
                    </span>
                    <span className="font-extrabold text-[#182a4a]">
                      {chartStats.skalaKerja.nasional.percent}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#182a4a] rounded-full"
                      style={{
                        width: `${chartStats.skalaKerja.nasional.percent}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="p-2.5 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800">
                      Lokal / Wilayah
                    </span>
                    <span className="font-extrabold text-slate-900">
                      {chartStats.skalaKerja.lokal.percent}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{
                        width: `${chartStats.skalaKerja.lokal.percent}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="p-2.5 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800">
                      Multinasional / Global
                    </span>
                    <span className="font-extrabold text-slate-900">
                      {chartStats.skalaKerja.multinasional.percent}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-600 rounded-full"
                      style={{
                        width: `${chartStats.skalaKerja.multinasional.percent}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="p-2.5 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800">
                      Wirausaha / Mandiri
                    </span>
                    <span className="font-extrabold text-slate-900">
                      {chartStats.skalaKerja.wirausaha.percent}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-400 rounded-full"
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
        <div className="flex justify-center">
          <button
            onClick={() => navigate("/laporan")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#182a4a] hover:bg-[#122038] text-white font-medium text-xs shadow-md transition active:scale-95 cursor-pointer self-start sm:self-auto hover:scale-105"
          >
            <span>Buka Halaman Laporan Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
