import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const ToastContext = createContext({
  toast: () => {},
  dismiss: () => {},
});

const toastIcons = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
  error: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
  info: <Info className="h-5 w-5 text-sky-600 shrink-0" />,
};

const toastBorderStyles = {
  success: 'border-emerald-200 bg-emerald-50/40',
  warning: 'border-amber-200 bg-amber-50/40',
  error: 'border-rose-200 bg-rose-50/40',
  info: 'border-sky-200 bg-sky-50/40',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = 'info', duration = 4000 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast = { id, title, description, variant, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }

      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-0 right-0 z-100 flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-md pointer-events-none gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'pointer-events-auto relative flex w-full items-start gap-3 rounded-2xl border p-4 shadow-lg bg-white/95 backdrop-blur-sm',
                toastBorderStyles[t.variant] || toastBorderStyles.info
              )}
            >
              <div className="mt-0.5">{toastIcons[t.variant] || toastIcons.info}</div>
              <div className="flex-1 space-y-1">
                {t.title && <h5 className="text-sm font-semibold text-slate-900 leading-tight">{t.title}</h5>}
                {t.description && <p className="text-xs text-slate-600 leading-relaxed">{t.description}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  return context || { toast: () => {}, dismiss: () => {} };
}
