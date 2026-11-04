import React from "react";
import { RespondentRecord } from "@/store/adminStore";

interface OverviewRecentSubmissionsProps {
  recentSubmissions: RespondentRecord[];
  onNavigateTab: (tabId: string) => void;
  onOpenRespondentDetail?: (submissionId: string) => void;
}

export const OverviewRecentSubmissions: React.FC<
  OverviewRecentSubmissionsProps
> = ({ recentSubmissions, onNavigateTab, onOpenRespondentDetail }) => {
  return (
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
  );
};

