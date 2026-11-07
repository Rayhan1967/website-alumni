import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useAdminStore } from "@/store/adminStore";
import { getHelpdeskWaUrl } from "@/lib/whatsapp";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ArrowRight, ChevronRight, Headphones } from "lucide-react";

const ALUR_LANGKAH = [
  {
    step: 1,
    title: "Validasi Identitas Alumni",
    desc: "Memastikan nama lengkap, NIK, NISN, jurusan, angkatan kelulusan, dan nomor WhatsApp aktif.",
    badgeBg: "bg-blue-900",
  },
  {
    step: 2,
    title: "Pemilihan Status Kegiatan Utama",
    desc: "Memilih kategori: Bekerja, Melanjutkan Pendidikan (Kuliah), Wirausaha, atau Belum Bekerja / Mencari Kerja.",
    badgeBg: "bg-blue-900",
  },
  {
    step: 3,
    title: "Rincian Informasi Profesi & Institusi",
    desc: "Mengisi data instansi tempat bekerja/kampus/usaha serta tingkat kesesuaian dengan jurusan SMK.",
    badgeBg: "bg-blue-900",
  },
  {
    step: 4,
    title: "Evaluasi Pembelajaran & Umpan Balik",
    desc: "Memberikan rating skor relevansi materi sekolah serta saran untuk pengembangan fasilitas & kurikulum.",
    badgeBg: "bg-blue-900",
  },
  {
    step: 5,
    title: "Finalisasi & Unduh Bukti Pengisian",
    desc: "Memeriksa ringkasan isian dan mengunduh Tanda Bukti Resmi ber-QR Code untuk syarat pengambilan ijazah.",
    badgeBg: "bg-emerald-600",
  },
];

const HIGHLIGHT_STATS = [
  { label: "Total Alumni Terdaftar", value: "3.500+ Orang" },
  { label: "Tingkat Keterserapan Kerja", value: "87,5 %" },
  { label: "Melanjutkan Kuliah", value: "12,5 %" },
  { label: "Waktu Pengisian", value: "3 - 5 Menit" },
];

export const AboutDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800">
      {/* Top Header / Sticky Navbar */}
      <Navbar />

      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200/60 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto whitespace-nowrap">
            <Link to="/" className="hover:text-blue-600 transition-colors">
              Beranda
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-800">
              Tentang Tracer Study
            </span>
          </nav>
        </div>
      </div>

      {/* Hero Banner Header */}
      <section className="bg-gradient-to-r from-[#0d223f] via-[#163863] to-[#0f2747] text-white py-12 sm:py-16 relative overflow-hidden">
        {/* Background Decorative Motif & Ambient Lighting */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
          {/* Ambient Glows */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-20 -translate-y-1/2 w-64 h-64 bg-sky-500/10 rounded-full blur-2xl" />

          {/* Subtle Dot Matrix Grid */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.12]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="about-banner-dots"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1" fill="#93c5fd" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#about-banner-dots)" />
          </svg>

          {/* Geometric & Wavy Flow Illustration Motif (Right Side) */}
          <svg
            className="absolute right-0 top-0 bottom-0 h-full w-[550px] sm:w-[700px] lg:w-[860px] max-w-none opacity-30 sm:opacity-40"
            viewBox="0 0 900 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient
                id="about-line-grad-1"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient
                id="about-line-grad-2"
                x1="100%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#818cf8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Dynamic Flowing Waves */}
            <path
              d="M100 280 C 280 260, 360 80, 560 120 C 720 150, 800 50, 900 90"
              stroke="url(#about-line-grad-1)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M140 300 C 310 270, 390 100, 590 140 C 740 170, 820 70, 900 110"
              stroke="url(#about-line-grad-1)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              strokeOpacity="0.7"
            />
            <path
              d="M200 240 C 350 180, 480 230, 680 90 C 790 20, 850 60, 900 40"
              stroke="url(#about-line-grad-2)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M230 260 C 380 200, 510 250, 710 110 C 810 40, 870 80, 920 60"
              stroke="url(#about-line-grad-2)"
              strokeWidth="1"
              strokeOpacity="0.5"
            />

            {/* Concentric Circles / Radar & Orbit System */}
            <g transform="translate(680, 110)">
              <circle
                cx="0"
                cy="0"
                r="110"
                stroke="#93c5fd"
                strokeWidth="1"
                strokeDasharray="3 6"
                opacity="0.25"
              />
              <circle
                cx="0"
                cy="0"
                r="80"
                stroke="#60a5fa"
                strokeWidth="1"
                opacity="0.35"
              />
              <circle
                cx="0"
                cy="0"
                r="50"
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeDasharray="2 4"
                opacity="0.45"
              />
              <circle
                cx="0"
                cy="0"
                r="22"
                stroke="#a78bfa"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <circle cx="0" cy="0" r="5" fill="#38bdf8" />

              {/* Orbiting Satellite Nodes */}
              <circle cx="80" cy="0" r="3" fill="#60a5fa" />
              <circle cx="-35" cy="35" r="4" fill="#a78bfa" />
              <circle cx="56" cy="-56" r="3" fill="#38bdf8" />
              <line
                x1="-80"
                y1="0"
                x2="80"
                y2="0"
                stroke="#93c5fd"
                strokeWidth="0.8"
                strokeDasharray="2 4"
                opacity="0.3"
              />
              <line
                x1="0"
                y1="-80"
                x2="0"
                y2="80"
                stroke="#93c5fd"
                strokeWidth="0.8"
                strokeDasharray="2 4"
                opacity="0.3"
              />
            </g>

            {/* Secondary Node Hub on the left wave */}
            <g transform="translate(420, 170)">
              <circle
                cx="0"
                cy="0"
                r="40"
                stroke="#60a5fa"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.3"
              />
              <circle cx="0" cy="0" r="4" fill="#60a5fa" />
              <circle cx="28" cy="-28" r="2.5" fill="#38bdf8" />
              <line
                x1="0"
                y1="0"
                x2="28"
                y2="-28"
                stroke="#60a5fa"
                strokeWidth="1"
                opacity="0.4"
              />
            </g>

            {/* Neat Geometric Crosses / Plus Accents */}
            <g stroke="#93c5fd" strokeWidth="1.5" opacity="0.4">
              <path d="M 520 40 L 520 50 M 515 45 L 525 45" />
              <path d="M 320 120 L 320 130 M 315 125 L 325 125" />
              <path d="M 830 210 L 830 220 M 825 215 L 835 215" />
              <path d="M 610 240 L 610 250 M 605 245 L 615 245" />
            </g>

            {/* Modern Diamond & Polygon accents */}
            <polygon
              points="560,95 565,100 560,105 555,100"
              fill="#38bdf8"
              opacity="0.6"
            />
            <polygon
              points="760,200 766,206 760,212 754,206"
              stroke="#818cf8"
              strokeWidth="1.2"
              fill="none"
              opacity="0.5"
            />
            <polygon
              points="380,60 385,65 380,70 375,65"
              fill="#93c5fd"
              opacity="0.4"
            />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              Tentang Tracer Study <br className="hidden sm:inline" />
              SMK Sasmita Jaya 2 Pamulang
            </h1>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Article Column (8 cols) */}
          <div className="lg:col-span-8 space-y-10">
            {/* Overview Section */}
            <article className="p-6 sm:p-9 space-y-6">
              <div className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Mengapa Tracer Study Sangat Penting?
                </h2>
              </div>

              <div className="prose max-w-none text-slate-600 text-sm sm:text-[15px] leading-relaxed space-y-4">
                <p>
                  Tracer Study SMK Sasmita Jaya 2 Pamulang merupakan survei
                  longitudinal terstruktur yang diselenggarakan secara berkala
                  oleh <strong>Bursa Kerja Khusus (BKK)</strong> dan Tim
                  Penjaminan Mutu Pendidikan Sekolah.
                </p>
                <p>
                  Sesuai dengan amanat{" "}
                  <strong>Perpres No. 68 Tahun 2022</strong> tentang
                  Revitalisasi Pendidikan Vokasi dan Pelatihan Vokasi,
                  keberhasilan sebuah SMK tidak hanya diukur dari angka
                  kelulusan, melainkan dari <em>keterserapan lulusan</em> di
                  dunia kerja, keberhasilan berwirausaha, serta kesiapan
                  melanjutkan pendidikan ke jenjang yang lebih tinggi.
                </p>
                <p className="border-l-4 border-blue-900 pl-4 py-1.5 bg-blue-50/50 font-medium text-slate-800">
                  Data yang Anda isikan menjadi kompas strategis bagi sekolah
                  dalam mengevaluasi kurikulum, memperbarui fasilitas
                  laboratorium kejuruan, dan menjalin kemitraan rekrutmen dengan
                  industri-industri terkemuka.
                </p>
              </div>
            </article>

            {/* Tahapan Alur Pengisian */}
            <section className="p-6 sm:p-9 space-y-6">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                  Alur 5 Langkah Pengisian Kuesioner
                </h3>
              </div>

              <div className="space-y-4">
                {ALUR_LANGKAH.map((item) => (
                  <div
                    key={item.step}
                    className="flex items-start gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <span
                      className={`w-7 h-7 rounded-full ${item.badgeBg} text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      {item.step}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Keamanan & Kerahasiaan Data */}
            <div className="bg-blue-50/50 text-slate-900 p-6 sm:p-8 flex items-start gap-4 border border-blue-900/10 rounded-xl">
              <div className="w-16 h-16 flex items-center justify-center shrink-0 p-2.5">
                <img
                  src="/Shield.svg"
                  alt="Keamanan Data"
                  className="w-20 h-20 object-contain text-blue-900"
                />
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-bold text-slate-900">
                  Jaminan Kerahasiaan & Keamanan Data Alumni
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Seluruh data identitas pribadi, kontak perusahaan/atasan, dan
                  informasi pendapatan yang Anda masukkan dilindungi dengan
                  standar keamanan enkripsi. Data hanya dipergunakan secara
                  agregat untuk keperluan riset pendidikan sekolah dan pelaporan
                  resmi Direktorat Jenderal Pendidikan Vokasi.
                </p>
              </div>
            </div>
          </div>

          {/* Right Sidebar Column (4 cols) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Action CTA Card */}
            <div className="p-6 space-y-4 text-center">
              <div className="w-14 h-14 rounded-full text-blue-900 flex items-center justify-center mx-auto shadow-xs">
                <img
                  src="/icon-login-btn.svg"
                  alt="Isi Kuisioner"
                  className="w-7 h-7 object-contain"
                />
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {isAuthenticated
                    ? "Lanjutkan Pengisian"
                    : "Mulai Tracer Study Sekarang"}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Luangkan waktu 3–5 menit untuk mengisi data karir dan studi
                  terbaru Anda.
                </p>
              </div>

              <button
                onClick={() =>
                  navigate(isAuthenticated ? "/tracer-study" : "/login")
                }
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-[#132238] hover:bg-[#1a3050] text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <span>
                  {isAuthenticated ? "Buka Formulir Kuesioner" : "Login"}
                </span>
                <ArrowRight className="w-4 h-4 text-white-400" />
              </button>
            </div>

            {/* Helpdesk Contact Box */}
            <div className="bg-slate-50 rounded-md p-5 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-slate-950 font-bold text-sm">
                <Headphones className="w-4 h-4 text-slate-600" />
                <span>Butuh Bantuan?</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Jika mengalami kendala NISN atau verifikasi data akun, silakan
                hubungi tim Helpdesk kami.
              </p>
              <a
                href={getHelpdeskWaUrl(
                  useAdminStore.getState().settings.kontakBkk,
                  "Halo Helpdesk Tracer Study SMK Sasmita Jaya 2",
                )}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-xs"
              >
                <span>Hubungi Helpdesk</span>
              </a>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
