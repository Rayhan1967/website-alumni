import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";

interface AdminMobileNoticeModalProps {
  isAdmin: boolean;
}

const STORAGE_KEY = "admin_mobile_device_notice_dismissed";

export const AdminMobileNoticeModal: React.FC<AdminMobileNoticeModalProps> = ({
  isAdmin,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    const checkMobileAndOpen = () => {
      // Deteksi resolusi layar mobile / tablet (< 1024px)
      const isMobileDevice = window.innerWidth < 1024;
      const hasDismissed = sessionStorage.getItem(STORAGE_KEY) === "true";

      if (isMobileDevice && !hasDismissed) {
        setIsOpen(true);
      }
    };

    // Sedikit jeda saat pertama kali mount agar transisi halaman selesai
    const timer = setTimeout(checkMobileAndOpen, 400);

    // Listener responsif saat user resize atau aktifkan Device Mode di DevTools
    window.addEventListener("resize", checkMobileAndOpen);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkMobileAndOpen);
    };
  }, [isAdmin]);

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  };

  if (!isAdmin) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      maxWidth="sm"
      title="Rekomendasi Perangkat"
    >
      <div className="flex flex-col items-center space-y-3.5">
        {/* Gambar Banner Rujukan */}
        <div className="w-full flex items-center justify-center overflow-hidden">
          <img
            src="/notice-desktop-device.jpg"
            alt="Akses website melalui PC atau laptop agar pengalaman menjelajah lebih nyaman dan lengkap."
            className="w-full max-h-[290px] sm:max-h-[340px] object-contain rounded-xl select-none"
            loading="eager"
          />
        </div>

        {/* Tombol Aksi */}
        <div className="w-full pt-1">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0d2346] hover:bg-[#163868] text-white text-xs font-semibold shadow-xs transition active:scale-[0.99] cursor-pointer"
          >
            Lanjutkan di Perangkat Ini
          </button>
        </div>
      </div>
    </Modal>
  );
};

