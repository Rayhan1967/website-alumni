import React, { useState, useEffect } from "react";
import { useContentStore } from "@/store/contentStore";
import { NewsItem } from "@/types/tracer";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Pagination } from "@/components/ui/Pagination";
import { Toast } from "@/components/ui/Toast";
import { AdminNewsEditor, CATEGORIES } from "./AdminNewsEditor";

const SolidNewspaperIcon: React.FC<{ className?: string }> = ({
  className = "w-5 h-5 text-[#0d2346]",
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM5 8h5v5H5V8zm14 9H5v-2h14v2zm0-4h-7v-2h7v2zm0-4h-7V7h7v2z" />
  </svg>
);

export const AdminNewsTab: React.FC = () => {
  const { newsList, addNews, updateNews, deleteNews, fetchNewsFromBackend } =
    useContentStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "editor">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Editor & Delete State
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  useEffect(() => {
    fetchNewsFromBackend?.();
  }, []);

  const handleSyncFromDatabase = async () => {
    setIsSyncing(true);
    try {
      const ok = await fetchNewsFromBackend();
      if (ok) {
        showToast("Daftar berita berhasil disinkronkan dari database pusat.");
      } else {
        showToast("Sinkronisasi selesai (data berita telah mutakhir).");
      }
    } catch {
      showToast("Gagal menyinkronkan berita dari database.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenEditor = (news: NewsItem | null) => {
    setEditingNews(news);
    setViewMode("editor");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveNews = (data: {
    title: string;
    category: NewsItem["category"];
    author: string;
    readTime: string;
    imageUrl: string;
    excerpt: string;
    content: string;
  }) => {
    const todayStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    if (editingNews) {
      updateNews(editingNews.id, {
        ...data,
      });
      showToast("Berita berhasil diperbarui dan dipublikasikan!");
    } else {
      addNews({
        ...data,
        date: todayStr,
      });
      showToast("Berita baru berhasil ditambahkan dan dipublikasikan!");
    }

    setViewMode("list");
  };

  const handleDelete = (id: string) => {
    deleteNews(id);
    setDeleteConfirmId(null);
    showToast("Berita berhasil dihapus dari sistem.");
  };

  // Reset pagination when search query or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Filtered List
  const filteredNews = newsList.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory =
      selectedCategory === "Semua" || item.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage("")}
        type="success"
      />

      {/* VIEW 1: DEDICATED EDITOR PAGE */}
      {viewMode === "editor" ? (
        <AdminNewsEditor
          editingNews={editingNews}
          onSave={handleSaveNews}
          onCancel={() => setViewMode("list")}
          showToast={showToast}
        />
      ) : (
        /* VIEW 2: NEWS LIST VIEW */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <SolidNewspaperIcon className="w-5 h-5 text-[#0d2346] shrink-0" />
                <span>Kelola Berita & Informasi</span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenEditor(null)}
                className="px-4 py-2 rounded-full bg-[#0d2346] hover:bg-[#163868] text-white text-xs font-semibold shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Berita Baru</span>
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Total Berita Publish
                </p>
                <p className="text-2xl font-bold text-[#0d2346] mt-1">
                  {newsList.length}
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Tampil di portal publik & alumni
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Agenda & Kegiatan
                </p>
                <p className="text-2xl font-bold text-[#0d2346] mt-1">
                  {newsList.filter((n) => n.category === "Agenda").length}
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Jadwal rekrutmen & event
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Kategori Aktif
                </p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {CATEGORIES.length} Kategori
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari judul berita, penulis..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0d2346]/10 focus:border-[#0d2346] transition"
                />
              </div>

              <div className="w-full sm:w-48">
                <CustomSelect
                  options={[
                    { value: "Semua", label: "Semua Kategori" },
                    ...CATEGORIES.map((c) => ({
                      value: c,
                      label: c,
                    })),
                  ]}
                  value={selectedCategory}
                  onChange={(val) => setSelectedCategory(val)}
                />
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
              Menampilkan{" "}
              <strong className="text-slate-800">{filteredNews.length}</strong>{" "}
              berita
            </div>
          </div>

          {/* News Card Grid */}
          {filteredNews.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Tidak ada berita ditemukan
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Coba sesuaikan kata kunci pencarian atau pilih kategori lain.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 content-start min-h-[520px]">
              {paginatedNews.map((news) => (
                <div
                  key={news.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between group"
                >
                  <div>
                    {/* Thumbnail Image */}
                    <div className="relative h-44 bg-slate-100 overflow-hidden">
                      <img
                        src={news.imageUrl}
                        alt={news.title}
                        className="w-full h-full object-cover "
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60";
                        }}
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#0d2346]/90 text-white backdrop-blur-xs shadow-xs">
                        {news.category}
                      </span>
                    </div>

                    {/* Body Info */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {news.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {news.readTime}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0d2346] transition line-clamp-2 leading-snug">
                        {news.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {news.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-4 pt-3">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate max-w-[120px]">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{news.author}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditor(news)}
                        className="px-2.5 py-1.5 rounded-lg  bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                        title="Edit Berita"
                      >
                        <Edit3 className="w-3 h-3 text-blue-600" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(news.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50/50 hover:bg-rose-100/80 text-rose-700 text-xs font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                        title="Hapus Berita"
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(p)}
            totalItems={filteredNews.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="Konfirmasi Hapus Berita"
        message="Apakah Anda yakin ingin menghapus artikel berita ini? Berita yang dihapus tidak akan lagi tampil di halaman publik dan portal alumni."
        confirmText="Hapus Berita"
        cancelText="Batal"
        type="danger"
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
