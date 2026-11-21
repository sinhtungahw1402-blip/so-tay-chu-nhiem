import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-11/12 max-w-md pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const bgStyles = {
    success: 'bg-emerald-600 text-white shadow-emerald-200',
    error: 'bg-rose-600 text-white shadow-rose-200',
    info: 'bg-blue-600 text-white shadow-blue-200',
  }[toast.type];

  const icon = {
    success: <CheckCircle2 className="w-5 h-5 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 shrink-0" />,
    info: <Info className="w-5 h-5 shrink-0" />,
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl transition-all duration-300 transform translate-y-0 ${bgStyles}`}
      role="alert"
    >
      <div className="flex items-center gap-2.5 text-sm font-medium">
        {icon}
        <span>{toast.message}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
        aria-label="Đóng"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
