import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

type ToastOptions = {
  message: string;
  type?: ToastType;
  duration?: number;
};

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
};

type ToastContextValue = {
  notify: (options: ToastOptions) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

type ConfirmState = ConfirmOptions & { open: boolean };

type ToastState = ToastOptions & { open: boolean };

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const notify = useCallback(({ message, type = 'info', duration = 3200 }: ToastOptions) => {
    closeToast();
    setToast({ open: true, message, type, duration });
    timeoutRef.current = window.setTimeout(() => {
      closeToast();
    }, duration);
  }, [closeToast]);

  const closeConfirm = useCallback((result = false) => {
    setConfirmState(null);
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setConfirmState({
        open: true,
        title: options.title || 'Confirmar acción',
        message: options.message,
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
      });
    });
  }, []);

  const handleConfirm = () => closeConfirm(true);
  const handleCancel = () => closeConfirm(false);

  return (
    <ToastContext.Provider value={{ notify, confirm }}>
      {children}

      <div style={{ position: 'fixed', zIndex: 1200, top: 24, right: 24, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
        {toast && (
          <div style={{
            minWidth: 280,
            padding: '16px 18px',
            borderRadius: 16,
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.14)',
            color: '#fff',
            background: toast.type === 'success' ? '#16a34a' : toast.type === 'error' ? '#dc2626' : toast.type === 'warning' ? '#f59e0b' : '#2563eb',
            border: '1px solid rgba(255,255,255,0.16)',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
          }}
          onClick={closeToast}
          >
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{toast.type === 'success' ? '¡Listo!' : toast.type === 'error' ? 'Error' : toast.type === 'warning' ? 'Atención' : 'Información'}</div>
            <div style={{ fontSize: 13, lineHeight: '1.5' }}>{toast.message}</div>
          </div>
        )}
      </div>

      {confirmState && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'grid', placeItems: 'center', padding: 24, background: 'rgba(15, 23, 42, 0.28)' }}>
          <div style={{ width: 'min(100%, 420px)', background: '#fff', borderRadius: 24, boxShadow: '0 24px 80px rgba(15, 23, 42, 0.18)', overflow: 'hidden' }}>
            <div style={{ padding: '24px 24px 18px' }}>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, color: '#111827' }}>{confirmState.title}</div>
              <div style={{ color: '#334155', fontSize: 14, lineHeight: '1.7' }}>{confirmState.message}</div>
            </div>
            <div style={{ display: 'flex', gap: 12, padding: '18px 20px 20px', background: '#f8fafc' }}>
              <button type="button" onClick={handleCancel} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontWeight: 700, cursor: 'pointer' }}>
                {confirmState.cancelText}
              </button>
              <button type="button" onClick={handleConfirm} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
