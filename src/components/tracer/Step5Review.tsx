import React, { useState } from "react";
import { useTracerStore } from "@/store/tracerStore";
import { useAuthStore } from "@/store/authStore";
import { TracerSubmissionPayload } from "@/types/tracer";
import { submitTracerStudy } from "@/services/tracerService";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

interface Step5Props {
  onPrev: () => void;
  onSuccess: (submissionId: string) => void;
}

export const Step5Review: React.FC<Step5Props> = ({ onPrev, onSuccess }) => {
  const {
    identitas,
    status_kegiatan,
    masa_tunggu,
    detail_kerja,
    detail_kuliah,
    detail_usaha,
    evaluasi,
    updateEvaluasi,
    agreement,
    setAgreement,
    submitTracer,
  } = useTracerStore();

  const { updateUserTracerStatus } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Construct official payload
  const payload: TracerSubmissionPayload = {
    identitas: {
      nama_lengkap: identitas.nama_lengkap || "",
      nisn: identitas.nisn || "",
      nik: identitas.nik || "",
      tahun_masuk: identitas.tahun_masuk || 2021,
      tahun_lulus: identitas.tahun_lulus || 2024,
      jurusan: (identitas.jurusan || "Teknik Komputer dan Jaringan") as any,
      no_whatsapp: identitas.no_whatsapp || "",
      email: identitas.email || "",
      jenis_kelamin: identitas.jenis_kelamin,
      status_menikah: identitas.status_menikah,
      usia: identitas.usia,
      provinsi_domisili: identitas.provinsi_domisili,
      kota_domisili: identitas.kota_domisili,
    },
    status_kegiatan: (status_kegiatan || "KERJA") as any,
    masa_tunggu: masa_tunggu,
    detail_kerja:
      status_kegiatan === "KERJA" || status_kegiatan === "KERJA_KULIAH"
        ? (detail_kerja as any)
        : null,
    detail_kuliah:
      status_kegiatan === "KULIAH" ||
      status_kegiatan === "KERJA_KULIAH" ||
      status_kegiatan === "WIRAUSAHA_KULIAH"
        ? (detail_kuliah as any)
        : null,
    detail_usaha:
      status_kegiatan === "WIRAUSAHA" || status_kegiatan === "WIRAUSAHA_KULIAH"
        ? (detail_usaha as any)
        : null,
    evaluasi: {
      skor_relevansi: evaluasi.skor_relevansi || 5,
      kompetensi_bermanfaat: evaluasi.kompetensi_bermanfaat || [],
      kompetensi_ditingkatkan: evaluasi.kompetensi_ditingkatkan || "",
      bantu_dunia_kerja: evaluasi.bantu_dunia_kerja || "Sangat membantu",
      saran_pembelajaran: evaluasi.saran_pembelajaran || "",
      saran_bkk: evaluasi.saran_bkk || "",
      saran_industri: evaluasi.saran_industri || "",
      kesediaan_dihubungi: evaluasi.kesediaan_dihubungi ?? true,
    },
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!agreement) {
      setSubmitError(
        "Anda harus mencentang persetujuan pernyataan kebenaran data.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitTracerStudy({ ...payload, agreement: true });

      if (response.success && response.data) {
        await submitTracer(payload);
        updateUserTracerStatus("SUDAH", response.data.submission_id);

        onSuccess(response.data.submission_id);
      } else {
        let msg = response.message || "Terjadi kesalahan saat memproses data. Silakan periksa kembali formulir Anda.";
        if (response.errors && typeof response.errors === 'object') {
          const detail = Object.entries(response.errors)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join(' • ');
          if (detail) {
            msg = `${msg} (${detail})`;
          }
        }
        setSubmitError(msg);
      }
    } catch (err: any) {
      setSubmitError(
        "Gagal mengirim data. Silakan periksa koneksi internet Anda.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleFinalSubmit} className="space-y-6 sm:space-y-8">
      {/* Blue Section Header Bar matching Dapodik screenshot */}
      <div className="bg-[#1d4ed8] text-white px-4 py-2.5 font-medium text-xs sm:text-sm rounded-t-sm">
        Masukan Alumni & Konfirmasi
      </div>

      <div className="space-y-6 px-1">
        {/* Saran untuk meningkatkan pembelajaran di SMK */}
        <div className="space-y-2.5">
          <label className="block text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
            Saran untuk meningkatkan pembelajaran di SMK
          </label>
          <textarea
            rows={3}
            value={evaluasi.saran_pembelajaran || ""}
            onChange={(e) =>
              updateEvaluasi({ saran_pembelajaran: e.target.value })
            }
            placeholder="Contoh : Perbanyak jam praktik dan pembaruan alat lab..."
            className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 leading-relaxed transition-all"
          />
        </div>

        {/* Saran untuk meningkatkan layanan BKK/alumni */}
        <div className="space-y-2.5">
          <label className="block text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
            Saran untuk meningkatkan layanan BKK/alumni
          </label>
          <textarea
            rows={3}
            value={evaluasi.saran_bkk || ""}
            onChange={(e) => updateEvaluasi({ saran_bkk: e.target.value })}
            placeholder="Contoh : Update lowongan kerja secara berkala..."
            className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 leading-relaxed transition-all"
          />
        </div>

        {/* Saran untuk meningkatkan kerja sama sekolah dengan industri */}
        <div className="space-y-2.5">
          <label className="block text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
            Saran untuk meningkatkan kerja sama sekolah dengan industri
          </label>
          <textarea
            rows={3}
            value={evaluasi.saran_industri || ""}
            onChange={(e) => updateEvaluasi({ saran_industri: e.target.value })}
            placeholder="Contoh : Perbanyak kunjungan industri dan guru tamu..."
            className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 leading-relaxed transition-all"
          />
        </div>

        {/* Kesediaan dihubungi kembali */}
        <div className="space-y-3 pt-4 border-t border-slate-200/80">
          <label className="block text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
            Kesediaan dihubungi kembali untuk survei berkala:
          </label>
          <div className="flex items-center gap-8 pl-1">
            <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-800 hover:text-blue-600 transition-colors leading-relaxed">
              <input
                type="radio"
                name="kesediaan_dihubungi"
                value="true"
                checked={evaluasi.kesediaan_dihubungi !== false}
                onChange={() => updateEvaluasi({ kesediaan_dihubungi: true })}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer shrink-0"
              />
              <span>Ya, bersedia</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-800 hover:text-blue-600 transition-colors leading-relaxed">
              <input
                type="radio"
                name="kesediaan_dihubungi"
                value="false"
                checked={evaluasi.kesediaan_dihubungi === false}
                onChange={() => updateEvaluasi({ kesediaan_dihubungi: false })}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer shrink-0"
              />
              <span>Tidak</span>
            </label>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 leading-relaxed">
          {submitError}
        </div>
      )}

      {/* Ringkasan Singkat Data */}
      <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg text-sm space-y-3">
        <p className="font-semibold text-slate-900 border-b border-slate-200 pb-2">
          Ringkasan Isian Alumni
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-slate-700 leading-relaxed">
          <p>
            <span className="text-slate-500 font-medium">Nama:</span>{" "}
            {identitas.nama_lengkap || "-"}
          </p>
          <p>
            <span className="text-slate-500 font-medium">NIS/NISN:</span>{" "}
            {identitas.nisn || "-"}
          </p>
          <p>
            <span className="text-slate-500 font-medium">Jurusan:</span>{" "}
            {identitas.jurusan || "-"}
          </p>
          <p>
            <span className="text-slate-500 font-medium">Status:</span>{" "}
            <span className="font-semibold text-blue-700">
              {status_kegiatan === "BELUM_KERJA"
                ? "Belum Bekerja"
                : status_kegiatan === "KERJA_KULIAH"
                  ? "Kuliah & Kerja"
                  : status_kegiatan === "WIRAUSAHA_KULIAH"
                    ? "Kuliah & Wirausaha"
                    : status_kegiatan === "KERJA"
                      ? "Bekerja"
                      : status_kegiatan === "KULIAH"
                        ? "Kuliah"
                        : status_kegiatan === "WIRAUSAHA"
                          ? "Wirausaha"
                          : status_kegiatan === "LAINNYA"
                            ? "Lainnya"
                            : "-"}
            </span>
          </p>
        </div>
      </div>

      {/* Checkbox Pernyataan */}
      <div className="flex items-start gap-3 pt-2">
        <input
          id="agreement"
          type="checkbox"
          checked={agreement}
          onChange={(e) => setAgreement(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer shrink-0"
          required
        />
        <label
          htmlFor="agreement"
          className="text-sm text-slate-700 cursor-pointer leading-relaxed"
        >
          Saya menyatakan dengan sesungguhnya bahwa seluruh data yang saya isikan adalah
          benar dan sesuai dengan kondisi yang sebenarnya.
        </label>
      </div>

      {/* Bottom Bar with 'Simpan dan lanjut' style matching screenshot */}
      <div className="pt-6 mt-8 border-t border-slate-200 flex items-center justify-between">
        <Button
          type="button"
          onClick={onPrev}
          variant="ghost"
          size="md"
          className="text-xs sm:text-sm"
          disabled={isSubmitting}
        >
          <ArrowLeft size={16} className="mr-1" />
          Kembali
        </Button>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 font-medium text-xs sm:text-sm px-6 py-2.5 rounded-lg shadow-none transition"
        >
          Simpan dan kirim survey
        </Button>
      </div>
    </form>
  );
};
