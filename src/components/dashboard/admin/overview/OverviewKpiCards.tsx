import React from "react";
import { SolidUsersIcon, SolidTrendingUpIcon } from "./overviewIcons";

interface OverviewKpiCardsProps {
  targetQuota: number;
  totalMaster: number;
  isAllYears: boolean;
  responseRate: string;
  totalSubmitted: number;
  totalRespondents: number;
}

export const OverviewKpiCards: React.FC<OverviewKpiCardsProps> = ({
  targetQuota,
  totalMaster,
  isAllYears,
  responseRate,
  totalSubmitted,
  totalRespondents,
}) => {
  return (
    <div className="lg:col-span-4 flex flex-col gap-4 justify-between">
      {/* Card 1: Target Kuota */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Target Jumlah Lulusan
            </span>
            <SolidUsersIcon className="w-6 h-6 text-[#0d2346]/40 shrink-0" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {targetQuota}
            </span>
            <span className="text-xs text-slate-500">Siswa</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
          {isAllYears
            ? `${totalMaster} siswa terdaftar di seluruh data pokok`
            : `${totalMaster} siswa terdaftar di data pokok`}
        </p>
      </div>

      {/* Card 2: Tingkat Pengisian */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Tingkat Pengisian
            </span>
            <SolidTrendingUpIcon className="w-6 h-6 text-[#0d2346]/40 shrink-0" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {responseRate}%
            </span>
            <span className="text-xs text-slate-500">
              ({totalSubmitted} dari {targetQuota})
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-2.5 overflow-hidden">
            <div
              className="h-full bg-[#0d2346] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(Number(responseRate), 100)}%` }}
            />
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="text-emerald-700 font-semibold">
            {totalSubmitted} Tamatan Terdata
          </span>
          <span>{totalRespondents} Kuesioner Masuk</span>
        </div>
      </div>
    </div>
  );
};

