'use client';
// ErrorToast — animated error notification
import { useEffect } from 'react';

interface ErrorToastProps {
  message: string;
  onClose: () => void;
}

export default function ErrorToast({ message, onClose }: ErrorToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="glass-strong border border-red-500/40 rounded-xl px-6 py-3 flex items-center gap-3 shadow-[0_0_24px_rgba(239,68,68,0.3)]">
        <span className="text-xl">⚠️</span>
        <p className="text-red-300 font-medium">{message}</p>
        <button onClick={onClose} className="text-white/40 hover:text-white ml-2">✕</button>
      </div>
    </div>
  );
}

