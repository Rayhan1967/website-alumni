import React, { useState, useMemo } from "react";
import { useAdminStore } from "@/store/adminStore";
import { exportJsonToExcel } from "@/lib/excelExport";
import { downloadBlob } from "@/lib/fileDownload";
import { Toast } from "@/components/ui/Toast";
import { FileSpreadsheet, Download, CheckCircle2 } from "lucide-react";
import {
  buildVokasiExcelRows,
  buildMasterAlumniExcelRows,
  buildRekapKejuruanExcelRows,
  buildVokasiCsvContent,
  buildMasterAlumniCsvContent,
  buildRekapKejuruanCsvContent,
  calculateReportStats,
} from "./export/exportBuilders";
import { OfficialReportPrintDoc } from "./export/OfficialReportPrintDoc";

const SolidFileSpreadsheetIcon: React.FC<{ className?: string }> = ({
  className = "w-5 h-5 text-[#0d2346]",
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-5 4h3v2H8v-2zm5 0h3v2h-3v-2zm-5 4h3v2H8v-2zm5 0h3v2h-3v-2z" />
  </svg>
);

export const AdminExportReportTab: React.FC = () => {
  const { masterAlumni, respondents, settings } = useAdminStore();
  const [selectedFormat, setSelectedFormat] = useState<
    "ditjen_vokasi" | "master_lengkap" | "rekap_bmw"
  >("ditjen_vokasi");
  const [downloadSuccess, setDownloadSuccess] = useState("");

  const showDownloadToast = (msg: string) => {
    setDownloadSuccess(msg);
    setTimeout(() => setDownloadSuccess(""), 4000);
  };

  // 1. Export Direct to Native Excel (.xlsx)
  const handleExportExcel = () => {
    let filename = "";
    let sheetName = "";
    let dataRows: Record<string, any>[] = [];

    if (selectedFormat === "ditjen_vokasi") {
      filename = `export_tracer_vokasi_smk_sasmita2_${settings.targetYear}.xlsx`;
      sheetName = "Tracer Study Vokasi";
      dataRows = buildVokasiExcelRows(respondents, settings);
    } else if (selectedFormat === "master_lengkap") {
      filename = `export_master_alumni_smk_sasmita2_${settings.targetYear}.xlsx`;
      sheetName = "Data Master Alumni";
      dataRows = buildMasterAlumniExcelRows(masterAlumni);
    } else {
      filename = `rekap_aktivitas_lulusan_smk_sasmita2_${settings.targetYear}.xlsx`;
      sheetName = "Rekapitulasi Kejuruan";
      dataRows = buildRekapKejuruanExcelRows(masterAlumni, respondents);
    }

    exportJsonToExcel(dataRows, filename, { sheetName });
    showDownloadToast(`Berkas Excel (${filename}) berhasil diunduh.`);
  };

  // 2. Export Direct to CSV
  const handleExportCsv = () => {
    let csvContent = "";
    let filename = "";

    if (selectedFormat === "ditjen_vokasi") {
      filename = `export_tracer_vokasi_smk_sasmita2_${settings.targetYear}.csv`;
      csvContent = buildVokasiCsvContent(respondents);
    } else if (selectedFormat === "master_lengkap") {
      filename = `export_master_alumni_smk_sasmita2_${settings.targetYear}.csv`;
      csvContent = buildMasterAlumniCsvContent(masterAlumni);
    } else {
      filename = `rekap_aktivitas_lulusan_smk_sasmita2_${settings.targetYear}.csv`;
      csvContent = buildRekapKejuruanCsvContent(masterAlumni, respondents);
    }

    downloadBlob(csvContent, filename);
    showDownloadToast(`Berkas CSV (${filename}) berhasil diunduh.`);
  };

  // 3. Direct Download Official Summary Sheet (Opens Print / Save as PDF immediately)
  const handleDirectDownloadOfficialReport = () => {
    window.print();
    showDownloadToast(
      "Membuka dialog cetak / simpan dokumen Lembar Rekapitulasi Resmi.",
    );
  };

  // Memoized report statistics calculation
  const stats = useMemo(
    () => calculateReportStats(masterAlumni, respondents),
    [masterAlumni, respondents],
  );

  const currentDateFormatted = useMemo(
    () =>
      new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [],
  );

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-200 print:hidden">
        {/* Header Banner */}
        <div className="p-5">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <SolidFileSpreadsheetIcon className="w-5 h-5 text-[#0d2346]" />
            <span>Laporan dan Ekspor Data Lulusan</span>
          </h2>
        </div>

        {/* 2 Main Action Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Card: Export Engine (.xlsx / .csv) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-sm transition flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Ekspor ke Format Excel (.xlsx) atau CSV
                </h3>
              </div>

              {/* Format Selection */}
              <div className="space-y-2 text-xs">
                <label className="font-semibold text-slate-700 block">
                  Pilih Format Berkas:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 p-3 hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="radio"
                      name="export_format"
                      checked={selectedFormat === "ditjen_vokasi"}
                      onChange={() => setSelectedFormat("ditjen_vokasi")}
                      className="accent-[#0d2346] text-[#0d2346] focus:ring-[#0d2346]"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        Format Standar Penelusuran Vokasi (Rekomendasi)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Memuat 18 kolom data lengkap termasuk kontak atasan
                        tempat bekerja
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="radio"
                      name="export_format"
                      checked={selectedFormat === "master_lengkap"}
                      onChange={() => setSelectedFormat("master_lengkap")}
                      className="accent-[#0d2346] text-[#0d2346] focus:ring-[#0d2346]"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        Data Lengkap Seluruh Alumni ({masterAlumni.length}{" "}
                        Siswa)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Daftar seluruh alumni terdaftar beserta status pengisian
                        kuesionernya
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="radio"
                      name="export_format"
                      checked={selectedFormat === "rekap_bmw"}
                      onChange={() => setSelectedFormat("rekap_bmw")}
                      className="accent-[#0d2346] text-[#0d2346] focus:ring-[#0d2346]"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        Rekapitulasi Aktivitas per Program Keahlian
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Ringkasan jumlah alumni yang bekerja, kuliah, wirausaha,
                        atau mencari kerja
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons: Excel (.xlsx) & CSV in 2 Columns */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleExportExcel}
                className="w-full py-3 px-3 rounded-full bg-[#0d2346] hover:bg-[#163868] text-white text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4 text-white shrink-0" />
                <span className="truncate">Unduh Excel (.xlsx)</span>
              </button>

              <button
                onClick={handleExportCsv}
                className="w-full py-3 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
              >
                <Download className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="truncate">Unduh CSV (.csv)</span>
              </button>
            </div>
          </div>

          {/* Right Card: Direct Download Official Letterhead Summary */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-sm transition flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Unduh Lembar Rekapitulasi Resmi
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Format Berkop Surat Resmi SMK Sasmita Jaya 2
                </p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Hasilkan lembar ringkasan formal yang memuat tabel tingkat
                keterserapan tiap program keahlian, distribusi aktivitas
                lulusan, serta lembar pengesahan Kepala Sekolah dan Ketua Bursa
                Kerja Khusus.
              </p>

              {/* Summary Points */}
              <div className="p-4 space-y-2 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0d2346] shrink-0" />
                  <span>Kop Surat Resmi Yayasan dan SMK Sasmita Jaya 2</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0d2346] shrink-0" />
                  <span>
                    Tabel Keterserapan 6 Jurusan dan Tingkat Partisipasi
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0d2346] shrink-0" />
                  <span>
                    Kolom Pengesahan: {settings.kepalaSekolah} &{" "}
                    {settings.ketuaBkk}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0d2346] shrink-0" />
                  <span>
                    Tata letak terformat presisi untuk dokumen cetak ukuran
                    kertas A4
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Download Button */}
            <div className="pt-2">
              <button
                onClick={handleDirectDownloadOfficialReport}
                className="w-full py-3 rounded-full bg-[#0d2346] hover:bg-[#163868] text-white text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-white" />
                <span>Unduh Lembar Rekapitulasi Resmi (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Document Container (Only visible during window.print()) */}
      <OfficialReportPrintDoc
        settings={settings}
        totalMaster={stats.totalMaster}
        totalResponden={stats.totalResponden}
        countKerja={stats.countKerja}
        countKuliah={stats.countKuliah}
        countWirausaha={stats.countWirausaha}
        countBelumKerja={stats.countBelumKerja}
        percentKerja={stats.percentKerja}
        percentKuliah={stats.percentKuliah}
        percentWirausaha={stats.percentWirausaha}
        percentBelumKerja={stats.percentBelumKerja}
        jurusanBreakdown={stats.jurusanBreakdown}
        currentDateFormatted={currentDateFormatted}
      />

      {/* Toast Alert */}
      <Toast
        message={downloadSuccess}
        onClose={() => setDownloadSuccess("")}
        type="success"
      />
    </>
  );
};
