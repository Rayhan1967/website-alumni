import React, { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useTracerStore } from "@/store/tracerStore";
import { Menu, LogOut, FileText, ChevronDown, Download } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useNavigate } from "react-router-dom";
import { MailNotificationMenu } from "./MailNotificationMenu";

interface DashboardHeaderProps {
  onToggleMobileMenu: () => void;
  onOpenReceipt: () => void;
  onNavigateTab?: (tab: string, respondentId?: string) => void;
}

const getGreetingName = (user: any): string => {
  if (!user) return "Ahmad Dani";
  if (user.role === "admin_bkk") return "Admin";

  const rawName = (user.nama || "").trim();
  const ident = (user.nisn || user.nik || "").trim();

  // If demo user entity (e.g. "User 01", "User 02")
  if (
    /^user\s*\d+/i.test(rawName) ||
    (user.email && user.email.includes("@demo."))
  ) {
    return rawName;
  }

  // If name contains raw placeholder like "Alumni (0061234567)" or "Alumni NIK"
  if (!rawName || /^alumni\s*[\(/]/i.test(rawName)) {
    if (ident.includes("1234567")) return "Ahmad Dani";
    if (ident.includes("2345678")) return "Budi Santoso";
    if (ident.includes("3456789")) return "Citra Dewi";
    if (ident.includes("4567890")) return "Dimas Bagus";
    if (ident.includes("5678901")) return "Eko Wahyudi";
    if (ident.includes("6789012")) return "Farhan Rizki";
    return "Ahmad Dani";
  }

  // Clean any prefix and symbols
  const cleanName = rawName
    .replace(/^alumni\s+/i, "")
    .replace(/[\(\)\d]/g, "")
    .trim();
  const words = cleanName.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0]} ${words[1]}`;
  } else if (words.length === 1) {
    return words[0];
  }

  return "Ahmad Dani";
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onToggleMobileMenu,
  onOpenReceipt,
  onNavigateTab,
}) => {
  const { user, logout } = useAuthStore();
  const { isSubmitted } = useTracerStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isTracerDone =
    isSubmitted ||
    user?.tracerStatus === "SUDAH" ||
    (user as any)?.statusTracer === "SUDAH";

  // Close dropdown when tapping/clicking outside
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handlePointerDown);
      document.addEventListener("touchstart", handlePointerDown);
    }
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [dropdownOpen]);

  const handleLogoutClick = () => {
    setDropdownOpen(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
    } finally {
      setShowLogoutModal(false);
      navigate("/", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3.5 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between shadow-xs">
      {/* Greetings Area (Left) matching Wireframe */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 sm:p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Halo, {getGreetingName(user)}!</span>
            {user?.role === "admin_bkk" && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-slate-700 border border-slate-200 text-[11px] font-semibold">
                Admin
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Right Area: Mail Notification & Profile Circle */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Interactive Mail Notification Center */}
        <MailNotificationMenu
          onNavigateTab={onNavigateTab}
          onOpenReceipt={onOpenReceipt}
        />

        {/* Profile Circle with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
            aria-expanded={dropdownOpen}
          >
            <UserAvatar
              name={user?.nama}
              gender={user?.jenisKelamin}
              className="w-10 h-10 border border-slate-300"
            />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-40 text-xs text-slate-700">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="font-bold text-slate-900">
                  {user?.nama || "Ahmad Dani"}
                </p>
                <p className="text-slate-400 text-[11px] truncate">
                  {user?.email || "admin@smksasmitajaya2.sch.id"}
                </p>
              </div>

              {user?.role !== "admin_bkk" && isTracerDone && (
                <div className="py-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenReceipt();
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-blue-900" />
                    <span>Unduh Bukti Pengisian</span>
                  </button>
                </div>
              )}

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogoutClick}
                  className="w-full px-4 py-2 text-left hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-medium cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Friendly Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Keluar dari Portal Alumni?"
        message="Apakah Anda yakin ingin melanjutkan?"
        confirmText="Ya, Keluar"
        cancelText="Batal"
        type="danger"
      />
    </header>
  );
};
