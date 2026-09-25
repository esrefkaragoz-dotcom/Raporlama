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

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-white dark:bg-slate-800 border-emerald-500/30 text-slate-800 dark:text-slate-100',
    error: 'bg-white dark:bg-slate-800 border-rose-500/30 text-slate-800 dark:text-slate-100',
    info: 'bg-white dark:bg-slate-800 border-blue-500/30 text-slate-800 dark:text-slate-100',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-lg ${bgStyles[toast.type]} animate-in slide-in-from-bottom-2 duration-200`}
    >
      <div className="flex items-center space-x-2.5">
        {icons[toast.type]}
        <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
