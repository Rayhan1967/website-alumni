import React, { useState, useMemo, useEffect } from "react";
import {
  useAdminStore,
  RespondentRecord,
} from "@/store/adminStore";
import { AdminRespondentDetailDrawer } from "./AdminRespondentDetailDrawer";
import {
  Search,
  Clock,
  Eye,
  Building,
  GraduationCap,
  Store,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Pagination } from "@/components/ui/Pagination";
import { Toast } from "@/components/ui/Toast";

const SolidFileCheckIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5 text-[#0d2346]" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-3.3 14.7-3.4-3.4 1.4-1.4 2 2 4.6-4.6 1.4 1.4-6 6zM13 9V3.5L18.5 9H13z" />
  </svg>
);

const JURUSAN_OPTIONS = [
  { value: "ALL", label: "Semua Jurusan" },
  {
    value: "Teknik Komputer dan Jaringan",
    label: "Teknik Komputer dan Jaringan (TKJ)",
  },
  { value: "Teknik Pemesinan", label: "Teknik Pemesinan (TPM)" },
  {
    value: "Teknik Instalasi Tenaga Listrik",
    label: "Teknik Instalasi Tenaga Listrik (TITL)",
  },
  {
    value: "Teknik Elektronika Industri",
    label: "Teknik Elektronika Industri (TEI)",
  },
  {
    value: "Teknik Kendaraan Ringan Otomotif",
    label: "Teknik Kendaraan Ringan Otomotif (TKRO)",
  },
  {
    value: "Teknik dan Bisnis Sepeda Motor",
    label: "Teknik dan Bisnis Sepeda Motor (TBSM)",
  },
];

const STATUS_AKTIVITAS_OPTIONS = [
  { value: "ALL", label: "Semua Aktivitas Lulusan" },
  { value: "KERJA", label: "Bekerja di Instansi / Perusahaan" },
  { value: "KULIAH", label: "Melanjutkan Studi / Kuliah" },
  { value: "WIRAUSAHA", label: "Wirausaha Mandiri" },
  { value: "KERJA_KULIAH", label: "Kuliah & Kerja" },
  { value: "BELUM_KERJA", label: "Sedang Mencari Kerja" },
];

export interface AdminRespondentsTabProps {
  initialSelectedId?: string | null;
  onClearInitialSelectedId?: () => void;
}

type SortField = "nama" | "tanggal" | "none";
type SortOrder = "asc" | "desc";

export const AdminRespondentsTab: React.FC<AdminRespondentsTabProps> = ({
  initialSelectedId,
  onClearInitialSelectedId,
}) => {
  const { respondents, fetchRespondentsFromBackend } = useAdminStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  useEffect(() => {
    fetchRespondentsFromBackend?.();
  }, []);

  const handleSyncFromDatabase = async () => {
    setIsSyncing(true);
    try {
      const ok = await fetchRespondentsFromBackend();
      if (ok) {
        showToast("Data responden kuesioner berhasil disinkronkan dari database pusat.");
      } else {
        showToast("Sinkronisasi selesai (data telah mutakhir).");
      }
    } catch {
      showToast("Gagal menyinkronkan data responden dari database.");
    } finally {
      setIsSyncing(false);
    }
  };

  const [search, setSearch] = useState("");
  const [jurusanFilter, setJurusanFilter] = useState("ALL");
  const [aktivitasFilter, setAktivitasFilter] = useState("ALL");
  const [selectedRespondent, setSelectedRespondent] =
    useState<RespondentRecord | null>(null);
  const [sortField, setSortField] = useState<SortField>("tanggal");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Handle initial auto-open if explicitly requested from overview, then clear it immediately
  React.useEffect(() => {
    if (initialSelectedId) {
      const found = respondents.find(
        (r) => r.submissionId === initialSelectedId,
      );
      if (found) {
        setSelectedRespondent(found);
      }
      onClearInitialSelectedId?.();
    }
  }, [initialSelectedId, respondents, onClearInitialSelectedId]);

  const filteredRespondents = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    return respondents.filter((r) => {
      const matchSearch =
        !searchLower ||
        r.nama.toLowerCase().includes(searchLower) ||
        r.nisn.includes(searchLower) ||
        r.instansiKampusUsaha.toLowerCase().includes(searchLower);

      const matchJurusan =
        jurusanFilter === "ALL" || r.jurusan === jurusanFilter;

      const matchAktivitas =
        aktivitasFilter === "ALL" ||
        r.statusKegiatan === aktivitasFilter ||
        (aktivitasFilter === "KERJA" &&
          (r.statusKegiatan === "KERJA" ||
            r.statusKegiatan === "KERJA_KULIAH")) ||
        (aktivitasFilter === "KULIAH" &&
          (r.statusKegiatan === "KULIAH" ||
            r.statusKegiatan === "KERJA_KULIAH" ||
            r.statusKegiatan === "WIRAUSAHA_KULIAH")) ||
        (aktivitasFilter === "WIRAUSAHA" &&
          (r.statusKegiatan === "WIRAUSAHA" ||
            r.statusKegiatan === "WIRAUSAHA_KULIAH")) ||
        (aktivitasFilter === "BELUM_KERJA" &&
          r.statusKegiatan === "BELUM_KERJA");

      return matchSearch && matchJurusan && matchAktivitas;
    });
  }, [respondents, search, jurusanFilter, aktivitasFilter]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, jurusanFilter, aktivitasFilter]);

  const sortedRespondents = useMemo(() => {
    return [...filteredRespondents].sort((a, b) => {
      if (sortField === "nama") {
        const cmp = a.nama.localeCompare(b.nama, "id-ID");
        return sortOrder === "asc" ? cmp : -cmp;
      }
      if (sortField === "tanggal") {
        const timeA = new Date(a.submittedAt).getTime();
        const timeB = new Date(b.submittedAt).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      }
      return 0;
    });
  }, [filteredRespondents, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedRespondents.length / itemsPerPage);
  const paginatedRespondents = useMemo(() => {
    return sortedRespondents.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  }, [sortedRespondents, currentPage, itemsPerPage]);

  const { countKerja, countKuliah, countWirausaha, countBelumKerja } =
    useMemo(() => {
      let kerja = 0;
      let kuliah = 0;
      let wirausaha = 0;
      let belumKerja = 0;
      for (const r of respondents) {
        if (
          r.statusKegiatan === "KERJA" ||
          r.statusKegiatan === "KERJA_KULIAH"
        ) {
          kerja++;
        }
        if (
          r.statusKegiatan === "KULIAH" ||
          r.statusKegiatan === "KERJA_KULIAH" ||
          r.statusKegiatan === "WIRAUSAHA_KULIAH"
        ) {
          kuliah++;
        }
        if (
          r.statusKegiatan === "WIRAUSAHA" ||
          r.statusKegiatan === "WIRAUSAHA_KULIAH"
        ) {
          wirausaha++;
        }
        if (r.statusKegiatan === "BELUM_KERJA") {
          belumKerja++;
        }
      }
      return {
        countKerja: kerja,
        countKuliah: kuliah,
        countWirausaha: wirausaha,
        countBelumKerja: belumKerja,
      };
    }, [respondents]);

  const renderAktivitasBadge = (status: string) => {
    switch (status) {
      case "KERJA":
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
            <Building className="w-3.5 h-3.5 text-slate-600" />
            <span>Bekerja</span>
          </span>
        );
      case "KERJA_KULIAH":
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
            <Building className="w-3.5 h-3.5 text-slate-600" />
            <span>Kuliah & Kerja</span>
          </span>
        );
      case "KULIAH":
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
            <GraduationCap className="w-3.5 h-3.5 text-slate-600" />
            <span>Kuliah</span>
          </span>
        );
      case "WIRAUSAHA":
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
            <Store className="w-3.5 h-3.5 text-slate-600" />
            <span>Wirausaha</span>
          </span>
        );
      case "WIRAUSAHA_KULIAH":
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
            <Store className="w-3.5 h-3.5 text-slate-600" />
            <span>Kuliah & Wirausaha</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            <span>Mencari Kerja</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <SolidFileCheckIcon className="w-5 h-5 text-[#0d2346]" />
            <span>
              Data Responden Tracer Study
            </span>
          </h2>
         
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSyncFromDatabase}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-60 transition cursor-pointer shadow-xs"
            title="Ambil data responden terbaru dari database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-blue-600" : "text-slate-500"}`} />
            <span>{isSyncing ? "Menyinkronkan..." : "Refresh"}</span>
          </button>
          <div className="text-xs text-slate-600 font-medium bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200 shrink-0">
            Total Masuk: <span className="font-bold text-slate-900">{respondents.length} Responden</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
        {/* Quick Activity Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100 text-xs">
          <button
            onClick={() => setAktivitasFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              aktivitasFilter === "ALL"
                ? "bg-[#0d2346] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua Responden ({respondents.length})
          </button>
          <button
            onClick={() => setAktivitasFilter("KERJA")}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              aktivitasFilter === "KERJA"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60"
            }`}
          >
            <Building className="w-3.5 h-3.5 text-white" />
            <span>Bekerja ({countKerja})</span>
          </button>
          <button
            onClick={() => setAktivitasFilter("KULIAH")}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              aktivitasFilter === "KULIAH"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-white" />
            <span>Kuliah ({countKuliah})</span>
          </button>
          <button
            onClick={() => setAktivitasFilter("WIRAUSAHA")}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              aktivitasFilter === "WIRAUSAHA"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60"
            }`}
          >
            <Store className="w-3.5 h-3.5 text-white" />
            <span>Wirausaha ({countWirausaha})</span>
          </button>
          <button
            onClick={() => setAktivitasFilter("BELUM_KERJA")}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              aktivitasFilter === "BELUM_KERJA"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-white" />
            <span>Mencari Kerja ({countBelumKerja})</span>
          </button>
        </div>

        {/* Search & Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <Input
              placeholder="Cari berdasarkan nama, NISN, atau instansi tempat beraktivitas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <div className="sm:col-span-3">
            <CustomSelect
              value={jurusanFilter}
              onChange={(v) => setJurusanFilter(v)}
              options={JURUSAN_OPTIONS}
            />
          </div>
          <div className="sm:col-span-3">
            <CustomSelect
              value={aktivitasFilter}
              onChange={(v) => setAktivitasFilter(v)}
              options={STATUS_AKTIVITAS_OPTIONS}
            />
          </div>
        </div>
      </div>

      {/* Respondents Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-[#0d2346] text-white text-[11px]">
              <tr>
                <th className="py-2.5 px-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      if (sortField !== "nama") {
                        setSortField("nama");
                        setSortOrder("asc");
                      } else {
                        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                      }
                    }}
                    className="inline-flex items-center gap-1 hover:text-white transition cursor-pointer select-none group text-left"
                    title={
                      sortField === "nama"
                        ? sortOrder === "asc"
                          ? "Urutan Nama: A - Z (Klik untuk Z - A)"
                          : "Urutan Nama: Z - A (Klik untuk A - Z)"
                        : "Klik untuk mengurutkan Nama (A - Z)"
                    }
                  >
                    <span>Nama</span>
                    {sortField === "nama" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-slate-200" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-slate-200" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-white" />
                    )}
                  </button>
                </th>
                <th className="py-2.5 px-3 font-semibold">Jurusan & Angkatan</th>
                <th className="py-2.5 px-3 font-semibold">Aktivitas Lulusan</th>
                <th className="py-2.5 px-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      if (sortField !== "tanggal") {
                        setSortField("tanggal");
                        setSortOrder("desc");
                      } else {
                        setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
                      }
                    }}
                    className="inline-flex items-center gap-1 hover:text-white transition cursor-pointer select-none group text-left"
                    title={
                      sortField === "tanggal"
                        ? sortOrder === "desc"
                          ? "Urutan Tanggal: Terbaru (Klik untuk Terlama)"
                          : "Urutan Tanggal: Terlama (Klik untuk Terbaru)"
                        : "Klik untuk mengurutkan Tanggal Kirim"
                    }
                  >
                    <span>Tgl Kirim</span>
                    {sortField === "tanggal" ? (
                      sortOrder === "desc" ? (
                        <ArrowDown className="w-3 h-3 text-slate-200" />
                      ) : (
                        <ArrowUp className="w-3 h-3 text-slate-200" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-white" />
                    )}
                  </button>
                </th>
                <th className="py-2.5 px-3 font-semibold text-center">Detil Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {paginatedRespondents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 text-xs">
                    Tidak ditemukan data responden kuesioner yang sesuai dengan kriteria
                    pencarian.
                  </td>
                </tr>
              ) : (
                paginatedRespondents.map((rsp) => (
                  <tr
                    key={rsp.submissionId}
                    className="hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => setSelectedRespondent(rsp)}
                  >
                    {/* 1. Nama */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 text-xs">
                        {rsp.nama}
                      </div>
                    </td>

                    {/* 2. Jurusan dan Angkatan */}
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800 text-xs">
                        {rsp.jurusan}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Angkatan {rsp.tahunLulus}
                      </div>
                    </td>

                    {/* 3. Aktivitas Lulusan */}
                    <td className="py-2.5 px-3">
                      {renderAktivitasBadge(rsp.statusKegiatan)}
                    </td>

                    {/* 4. Tgl Kirim */}
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                      {new Date(rsp.submittedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* 5. Detil Data */}
                    <td
                      className="py-2.5 px-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedRespondent(rsp)}
                        className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 text-slate-700 font-semibold transition text-[11px] cursor-pointer "
                        title="Lihat detil data kuesioner"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-700" />
                        <span>Detil Data</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info & Pagination */}
        <div className="border-t border-slate-100">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sortedRespondents.length}
            itemsPerPage={itemsPerPage}
            itemName="responden"
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>

      {/* Detail Questionnaire Drawer */}
      <AdminRespondentDetailDrawer
        respondent={selectedRespondent}
        onClose={() => {
          setSelectedRespondent(null);
          onClearInitialSelectedId?.();
        }}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

