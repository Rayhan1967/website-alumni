import React, { useState } from "react";
import { Plus } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { JurusanSMK } from "@/types/tracer";

interface MasterAlumniAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    nisn: string;
    nik: string;
    nama: string;
    jurusan: JurusanSMK;
    tahunLulus: number;
    noWhatsapp: string;
    email: string;
  }) => boolean | Promise<boolean>;
  jurusanOptions: { value: string; label: string }[];
}

export const MasterAlumniAddModal: React.FC<MasterAlumniAddModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  jurusanOptions,
}) => {
  const [newNisn, setNewNisn] = useState("");
  const [newNik, setNewNik] = useState("");
  const [newNama, setNewNama] = useState("");
  const [newJurusan, setNewJurusan] = useState<JurusanSMK>(
    "Teknik Komputer dan Jaringan"
  );
  const [newTahun, setNewTahun] = useState(2024);
  const [newNoWa, setNewNoWa] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [addError, setAddError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");

    if (!newNisn.trim() || !newNama.trim()) {
      setAddError("NISN dan Nama Lengkap wajib diisi.");
      return;
    }

    const cleanNik =
      newNik.trim() &&
      newNik.trim() !== "-" &&
      newNik.trim() !== "3674000000000000"
        ? newNik.trim()
        : "";
    const cleanWa =
      newNoWa.trim() &&
      newNoWa.trim() !== "-" &&
      newNoWa.trim() !== "081200000000"
        ? newNoWa.trim()
        : "";
    const cleanEmail =
      newEmail.trim() &&
      newEmail.trim() !== "-" &&
      !newEmail.trim().toLowerCase().endsWith("@example.com")
        ? newEmail.trim()
        : "";

    const success = await onSubmit({
      nisn: newNisn.trim(),
      nik: cleanNik,
      nama: newNama.trim(),
      jurusan: newJurusan,
      tahunLulus: Number(newTahun) || 2024,
      noWhatsapp: cleanWa,
      email: cleanEmail,
    });

    if (success) {
      onClose();
      setNewNisn("");
      setNewNik("");
      setNewNama("");
      setNewNoWa("");
      setNewEmail("");
    } else {
      setAddError("NISN ini sudah terdaftar di basis data.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] shadow-xl border-t sm:border border-slate-200 overflow-hidden flex flex-col">
        {/* Pull bar indicator halus di mobile */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-2.5 -mb-1 sm:hidden shrink-0" />
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-slate-700" />
            <span>Tambah Data Siswa Lulusan</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {addError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-semibold">
              {addError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nomor Induk Siswa Nasional (NISN)*
              </label>
              <input
                required
                maxLength={10}
                placeholder="Contoh: 0051234567"
                value={newNisn}
                onChange={(e) => setNewNisn(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-[#0d2346] focus:border-[#0d2346]"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nomor Induk Kependudukan (NIK)
              </label>
              <input
                maxLength={16}
                placeholder="Contoh: 3674012345670001"
                value={newNik}
                onChange={(e) => setNewNik(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-[#0d2346] focus:border-[#0d2346]"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Nama Lengkap Siswa*
            </label>
            <input
              required
              placeholder="Contoh: Muhammad Rizki"
              value={newNama}
              onChange={(e) => setNewNama(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0d2346] focus:border-[#0d2346]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1 text-xs">
                Program Keahlian
              </label>
              <CustomSelect
                options={jurusanOptions.filter((j) => j.value !== "ALL")}
                value={newJurusan}
                onChange={(val) => setNewJurusan(val as JurusanSMK)}
                triggerSize="sm"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Tahun Kelulusan
              </label>
              <input
                type="number"
                value={newTahun}
                onChange={(e) => setNewTahun(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0d2346] focus:border-[#0d2346]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nomor WhatsApp
              </label>
              <input
                placeholder="Contoh: 081298765432"
                value={newNoWa}
                onChange={(e) => setNewNoWa(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-[#0d2346] focus:border-[#0d2346]"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Alamat Email
              </label>
              <input
                placeholder="Contoh: alumni@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0d2346] focus:border-[#0d2346]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold cursor-pointer hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#0d2346] hover:bg-[#163868] text-white font-semibold shadow-xs cursor-pointer"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

