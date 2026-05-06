import * as React from 'react';

type ToastVariant = 'default' | 'success' | 'destructive';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

interface Toast extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (options: ToastOptions) => void;
  toast: (options: ToastOptions) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined
);

let toastIdCounter = 0;

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const showToast = React.useCallback((options: ToastOptions) => {
    const id = ++toastIdCounter;
    const toast: Toast = { id, ...options };

    setToasts((prev) => [...prev, toast]);

    scheduleToastRemoval(id);
  }, []);

  const scheduleToastRemoval = (id: number) => {
    globalThis.setTimeout(() => {
      removeToastById(id);
    }, 3000);
  };

  const removeToastById = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const value = React.useMemo(
    () => ({ toasts, showToast, toast: showToast }),
    [toasts, showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};


export const useToast = () => {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
};
