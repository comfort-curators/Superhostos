import { createContext, useCallback, useContext, useState, type PropsWithChildren } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastApi {
  notify: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const TONE: Record<ToastTone, string> = {
  success: 'border-l-emerald-500',
  error: 'border-l-rose-500',
  info: 'border-l-gold'
};

let counter = 0;

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const notify = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      counter += 1;
      const id = counter;
      setToasts((list) => [...list, { id, message, tone }]);
      setTimeout(() => dismiss(id), 3800);
    },
    [dismiss]
  );

  const api: ToastApi = {
    notify,
    success: (message) => notify(message, 'success'),
    error: (message) => notify(message, 'error')
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,22rem)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.button
              key={t.id}
              type="button"
              layout
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              onClick={() => dismiss(t.id)}
              className={`pointer-events-auto rounded-xl border border-line border-l-4 bg-card px-4 py-3 text-left text-sm text-ink shadow-lg ${TONE[t.tone]}`}
            >
              {t.message}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
