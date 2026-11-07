import React, { useState, useMemo } from "react";
import { ArrowRight, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActivityDistributionItem {
  key: string;
  name: string;
  subNote: string;
  count: number;
  percent: number;
  color: string;
}

export interface ActivityDistributionData {
  total: number;
  pilarItems: ActivityDistributionItem[];
  detailItems: ActivityDistributionItem[];
}

interface OverviewActivityChartProps {
  activityDistribution: ActivityDistributionData;
  isAllYears: boolean;
  selectedYear: string;
  onNavigateTab: (tabId: string) => void;
}

export const OverviewActivityChart: React.FC<OverviewActivityChartProps> = ({
  activityDistribution,
  isAllYears,
  selectedYear,
  onNavigateTab,
}) => {
  const [activityChartMode, setActivityChartMode] = useState<
    "pilar" | "detail"
  >("pilar");
  const [hoveredActivityKey, setHoveredActivityKey] = useState<string | null>(
    null,
  );

  const currentChartItems =
    activityChartMode === "pilar"
      ? activityDistribution.pilarItems
      : activityDistribution.detailItems;

  const chartSegments = useMemo(() => {
    const circumference = 251.327;
    let accPercent = 0;
    return currentChartItems.map((item) => {
      const arcLength = (item.percent / 100) * circumference;
      const strokeDasharray = `${arcLength} ${circumference}`;
      const rotation = accPercent * 3.6 - 90;
      accPercent += item.percent;
      return {
        ...item,
        arcLength,
        strokeDasharray,
        rotation,
      };
    });
  }, [currentChartItems]);

  const activeHoveredItem = useMemo(() => {
    if (!hoveredActivityKey) return null;
    return currentChartItems.find((i) => i.key === hoveredActivityKey) || null;
  }, [hoveredActivityKey, currentChartItems]);

  return (
    <div className="lg:col-span-8 bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header with Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#0d2346]" />
              <span>Distribusi Aktivitas Lulusan</span>
            </h3>
          </div>

          {/* View Mode Toggle Pill */}
          <div className="inline-flex rounded-lg border border-slate-200 text-xs self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setActivityChartMode("pilar");
                setHoveredActivityKey(null);
              }}
              className={cn(
                "px-2.5 py-1 rounded-l-md text-xs font-medium transition-all cursor-pointer",
                activityChartMode === "pilar"
                  ? "bg-slate-200 text-slate-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              Ringkasan
            </button>
            <button
              type="button"
              onClick={() => {
                setActivityChartMode("detail");
                setHoveredActivityKey(null);
              }}
              className={cn(
                "px-2.5 py-1 rounded-r-md text-xs font-medium transition-all cursor-pointer",
                activityChartMode === "detail"
                  ? "bg-slate-200 text-slate-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              Detail
            </button>
          </div>
        </div>

        {/* Donut Chart & Legend Body */}
        {activityDistribution.total === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Belum ada data kuesioner masuk untuk periode ini.
          </div>
        ) : (
          <div className="pt-3 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
            {/* SVG Donut Chart (5 cols) */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-36 h-36 sm:w-40 sm:h-40">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full transform"
                  onMouseLeave={() => setHoveredActivityKey(null)}
                >
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#f1f5f9"
                    strokeWidth="11"
                    fill="none"
                  />
                  {/* Slices */}
                  {chartSegments.map((segment) => {
                    const isHovered = hoveredActivityKey === segment.key;
                    return (
                      <circle
                        key={segment.key}
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={segment.color}
                        strokeWidth={isHovered ? 14 : 11}
                        fill="none"
                        strokeDasharray={segment.strokeDasharray}
                        strokeDashoffset={0}
                        style={{
                          transformOrigin: "center",
                          transform: `rotate(${segment.rotation}deg)`,
                          pointerEvents: "stroke",
                        }}
                        strokeLinecap="butt"
                        className="transition-[stroke-width,opacity] duration-100 ease-out cursor-pointer"
                        onMouseEnter={() => setHoveredActivityKey(segment.key)}
                        onMouseLeave={() => setHoveredActivityKey(null)}
                      />
                    );
                  })}
                </svg>

                {/* Dynamic Central Readout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2 font-poppins">
                  <span className="text-lg sm:text-xl font-bold text-slate-800 leading-none transition-all duration-100">
                    {activeHoveredItem
                      ? `${activeHoveredItem.percent}%`
                      : activityDistribution.total}
                  </span>
                  <span className="text-[11px] font-medium text-slate-600 mt-1 truncate max-w-[100px]">
                    {activeHoveredItem ? activeHoveredItem.name : "Responden"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {activeHoveredItem
                      ? `${activeHoveredItem.count} Siswa`
                      : isAllYears
                        ? "Semua Angkatan"
                        : `Angkatan ${selectedYear}`}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-2 text-center">
                Arahkan kursor pada grafik untuk melihat rincian
              </span>
            </div>

            {/* Interactive Legend List (7 cols) */}
            <div className="sm:col-span-7 space-y-1.5">
              {currentChartItems.map((item) => {
                const isHovered = hoveredActivityKey === item.key;
                return (
                  <div
                    key={item.key}
                    onMouseEnter={() => setHoveredActivityKey(item.key)}
                    onMouseLeave={() => setHoveredActivityKey(null)}
                    className={cn(
                      "p-2 rounded-lg transition-colors duration-100 cursor-pointer border",
                      isHovered
                        ? "bg-slate-50 border-slate-300 shadow-2xs"
                        : "bg-transparent border-transparent hover:bg-slate-50/70 hover:border-slate-200",
                    )}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="min-w-0">
                          <span className="font-medium text-slate-800 truncate block">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block">
                            {item.subNote}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="font-semibold text-slate-800 block text-xs">
                          {item.count} Siswa
                        </span>
                        <span className="text-[10px] font-normal text-slate-500">
                          {item.percent}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <button
          onClick={() => onNavigateTab("verifikasi")}
          className="text-[#0d2346] font-semibold hover:underline flex items-center gap-1"
        >
          <span>Lihat Detail Isian Responden</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
