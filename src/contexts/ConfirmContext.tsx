import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../components/ConfirmDialog.css';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel?: () => void;
}

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => void;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
  }, []);

  const handleConfirm = () => {
    options?.onConfirm();
    setOptions(null);
  };

  const handleCancel = () => {
    options?.onCancel?.();
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {options && (
          <motion.div
            className="confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
          >
            <motion.div
              className="confirm-dialog card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="confirm-title" className="confirm-title">{options.title}</h2>
              <p id="confirm-message" className="confirm-message">{options.message}</p>
              <div className="confirm-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  {options.cancelLabel ?? 'Cancel'}
                </button>
                <button
                  type="button"
                  className={options.variant === 'danger' ? 'btn btn-danger' : 'btn btn-primary'}
                  onClick={handleConfirm}
                >
                  {options.confirmLabel ?? 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
