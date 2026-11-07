import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SolidUsersIcon, SolidFileCheckIcon } from "./overviewIcons";

interface OverviewBannerProps {
  selectedYear: string;
  isAllYears: boolean;
  onSelectYear: (year: string) => void;
  availableYears: number[];
  totalMaster: number;
  totalRespondents: number;
  syncNotification: string | null;
  onNavigateTab: (tabId: string) => void;
}

export const OverviewBanner: React.FC<OverviewBannerProps> = ({
  selectedYear,
  isAllYears,
  onSelectYear,
  availableYears,
  totalMaster,
  totalRespondents,
  syncNotification,
  onNavigateTab,
}) => {
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

  return (
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
              <span>Data Responden ({totalRespondents} Masuk)</span>
            </button>
          </div>

          {/* Dropdown Pemilih Periode Tahun Angkatan (Custom Styled) */}
          <div
            className="relative flex items-center gap-2.5 shrink-0 self-start md:self-auto"
            ref={yearDropdownRef}
          >
            <span className="text-xs text-slate-300 font-medium">
              Periode:
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
                      onSelectYear("ALL");
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
                          onSelectYear(String(yr));
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
  );
};

