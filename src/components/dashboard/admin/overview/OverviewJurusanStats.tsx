import React from "react";
import { ArrowRight } from "lucide-react";

export interface JurusanStatItem {
  code: string;
  name: string;
  total: number;
  filled: number;
  percent: number;
}

interface OverviewJurusanStatsProps {
  jurusanStats: JurusanStatItem[];
  isAllYears: boolean;
  selectedYear: string;
  onNavigateTab: (tabId: string) => void;
}

export const OverviewJurusanStats: React.FC<OverviewJurusanStatsProps> = ({
  jurusanStats,
  isAllYears,
  selectedYear,
  onNavigateTab,
}) => {
  return (
    <div className="lg:col-span-7 bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
      <div>
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

        <div className="space-y-4 pt-3">
          {jurusanStats.map((item) => (
            <div key={item.code} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">
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
  );
};

