import React, { useState } from "react";
import { useAdminStore } from "@/store/adminStore";
import {
  Save,
  RotateCcw,
  CheckCircle2,
  Calendar,
  UserCheck,
  Building,
} from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Toast } from "@/components/ui/Toast";

const SolidSettingsIcon: React.FC<{ className?: string }> = ({
  className = "w-5 h-5 text-[#0d2346]",
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </svg>
);

export const AdminSettingsTab: React.FC = () => {
  const { settings, updateSettings, resetToDefaultData } = useAdminStore();

  const [formData, setFormData] = useState({ ...settings });
  const [toastMessage, setToastMessage] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...formData,
      yearlyTargets: {
        ...(settings.yearlyTargets || {}),
        [Number(formData.targetYear)]: Number(formData.targetQuota),
      },
    });
    showToast(
      `Pengaturan dan target Angkatan ${formData.targetYear} berhasil disimpan.`,
    );
  };

  const handleConfirmReset = () => {
    resetToDefaultData();
    setFormData({ ...useAdminStore.getState().settings });
    showToast("Data berhasil dikembalikan ke kondisi awal demo.");
    setShowResetModal(false);
  };

  const handleReset = () => {
    setShowResetModal(true);
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header Title */}
        <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <SolidSettingsIcon className="w-5 h-5 text-[#0d2346] shrink-0" />
              <span>Pengaturan Sistem</span>
            </h1>
          </div>
        </div>

        {/* Single Unified Container Centered */}
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-6"
          >
            {/* Section 1: Target Kuota & Periode */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
                    Target Sasaran & Periode Pengisian
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Konfigurasi jumlah target alumni dan rentang waktu pengisian
                    tracer study.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-900">
                    Target Jumlah Alumni (Siswa)
                  </label>
                  <input
                    type="number"
                    value={formData.targetQuota}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetQuota: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-[#0d2346] focus:ring-2 focus:ring-[#0d2346]/10 focus:outline-none transition bg-slate-50/50 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Dasar perhitungan target partisipasi untuk Angkatan {formData.targetYear}.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-900">
                    Tahun Kelulusan Sasaran
                  </label>
                  <input
                    type="number"
                    value={formData.targetYear}
                    onChange={(e) => {
                      const newYear = Number(e.target.value);
                      const savedTarget = settings.yearlyTargets?.[newYear];
                      setFormData((prev) => ({
                        ...prev,
                        targetYear: newYear,
                        ...(savedTarget ? { targetQuota: savedTarget } : {}),
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-[#0d2346] focus:ring-2 focus:ring-[#0d2346]/10 focus:outline-none transition bg-slate-50/50 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Tahun kelulusan alumni yang menjadi fokus pengumpulan data.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-900">
                    Tanggal Mulai Pengisian
                  </label>
                  <input
                    type="date"
                    value={formData.periodStart}
                    onChange={(e) =>
                      setFormData({ ...formData, periodStart: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-[#0d2346] focus:ring-2 focus:ring-[#0d2346]/10 focus:outline-none transition bg-slate-50/50 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-900">
                    Tanggal Batas Pengisian
                  </label>
                  <input
                    type="date"
                    value={formData.periodEnd}
                    onChange={(e) =>
                      setFormData({ ...formData, periodEnd: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-[#0d2346] focus:ring-2 focus:ring-[#0d2346]/10 focus:outline-none transition bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Penandatangan Laporan Resmi */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
                    Nama Pejabat Penandatangan Laporan Resmi
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Data ini dicantumkan pada bagian pengesahan berkas ekspor
                    laporan PDF.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-900">
                    Nama Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={formData.kepalaSekolah}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kepalaSekolah: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-[#0d2346] focus:ring-2 focus:ring-[#0d2346]/10 focus:outline-none transition bg-slate-50/50 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-900">
                    NIP Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={formData.nipKepalaSekolah}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nipKepalaSekolah: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium font-mono focus:border-[#0d2346] focus:ring-2 focus:ring-[#0d2346]/10 focus:outline-none transition bg-slate-50/50 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-900">
                    Nama Ketua Bursa Kerja Khusus (BKK)
                  </label>
                  <input
                    type="text"
                    value={formData.ketuaBkk}
                    onChange={(e) =>
                      setFormData({ ...formData, ketuaBkk: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-[#0d2346] focus:ring-2 focus:ring-[#0d2346]/10 focus:outline-none transition bg-slate-50/50 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-900">
                    NIP / NUPTK Ketua BKK
                  </label>
                  <input
                    type="text"
                    value={formData.nipKetuaBkk}
                    onChange={(e) =>
                      setFormData({ ...formData, nipKetuaBkk: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:border-[#0d2346] focus:ring-2 focus:ring-[#0d2346]/10 focus:outline-none transition bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Identitas Sekolah & Kontak Layanan */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
                    Identitas Sekolah & Kontak Layanan
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Informasi resmi lembaga untuk kop surat dan layanan alumni.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-900">
                    Nama Sekolah
                  </label>
                  <input
                    disabled
                    type="text"
                    value={formData.namaSekolah}
                    onChange={(e) =>
                      setFormData({ ...formData, namaSekolah: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-300 border border-slate-200 text-xs sm:text-sm focus:border-[#0d2346] focus:ring-2 focus:ring-[#0d2346]/10 focus:outline-none transition bg-slate-50/50 focus:bg-white cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-900">
                    NPSN (Nomor Pokok Sekolah Nasional)
                  </label>
                  <input
                    type="text"
                    value={formData.npsn}
                    onChange={(e) =>
                      setFormData({ ...formData, npsn: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-[#0d2346] focus:ring-2 focus:ring-[#0d2346]/10 focus:outline-none transition bg-slate-50/50 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-900">
                    Alamat Lengkap Sekolah
                  </label>
                  <input
                    disabled
                    type="text"
                    value={formData.alamatSekolah}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        alamatSekolah: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-300 border border-slate-200 text-xs sm:text-sm focus:border-[#0d2346] focus:ring-2 focus:ring-[#0d2346]/10 focus:outline-none transition bg-slate-50/50 focus:bg-white cursor-not-allowed"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-900">
                    Nomor Kontak WhatsApp Layanan Alumni
                  </label>
                  <input
                    type="text"
                    value={formData.kontakBkk}
                    onChange={(e) =>
                      setFormData({ ...formData, kontakBkk: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-[#0d2346] focus:ring-2 focus:ring-[#0d2346]/10 focus:outline-none transition bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-slate-100">
              {/* <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs sm:text-sm font-medium transition flex items-center gap-2 cursor-pointer border border-slate-200"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Kembalikan ke Data Awal Demo</span>
              </button> */}

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#0d2346] hover:bg-[#163868] text-white text-xs sm:text-sm font-semibold shadow-xs transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4 text-slate-300" />
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast Alert */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage("")}
        type="success"
      />

      {/* Custom System Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleConfirmReset}
        title="Kembalikan ke Data Awal Demo?"
        message="Tindakan ini akan mengembalikan seluruh data master alumni dan formulir kuesioner ke pengaturan default simulasi."
        confirmText="Ya, Reset Data"
        cancelText="Batal"
        type="warning"
      />
    </>
  );
};
