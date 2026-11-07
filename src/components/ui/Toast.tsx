import React from 'react';
import { createPortal } from 'react-dom';
import { Info, Check, AlertCircle, X } from 'lucide-react';

export interface ToastProps {
  message: string | null | undefined;
  onClose?: () => void;
  type?: 'success' | 'info' | 'error';
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  onClose,
  type = 'info',
  className = '',
}) => {
  if (!message) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:bottom-6 sm:translate-x-0 z-[9999] w-[calc(100%-32px)] sm:w-auto sm:min-w-[320px] max-w-[440px] bg-[#2563eb] text-white px-4 py-3 sm:px-4.5 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-xl shadow-blue-500/25 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 border border-blue-400/30 ${className}`}
    >
      {/* White circle icon container */}
      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
        {type === 'success' ? (
          <Check className="w-3.5 h-3.5 text-[#2563eb] stroke-[3]" />
        ) : type === 'error' ? (
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
        ) : (
          <Info className="w-3.5 h-3.5 text-[#2563eb] stroke-[2.5]" />
        )}
      </div>

      {/* Message Text */}
      <p className="text-xs sm:text-sm font-medium text-white flex-1 leading-snug break-words">
        {message}
      </p>

      {/* Close Button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup notifikasi"
          className="p-1.5 -mr-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>,
    document.body
  );
};
