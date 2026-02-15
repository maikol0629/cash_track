import * as React from 'react';
import { cn } from '@/lib/utils';

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

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: showToast }}>
      {children}
      <div className='fixed bottom-4 right-4 z-50 flex flex-col gap-2'>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'min-w-[260px] rounded-md border bg-card px-4 py-3 text-sm shadow-lg',
              toast.variant === 'destructive' &&
                'border-red-500 text-red-900 dark:border-red-600',
              toast.variant === 'success' &&
                'border-emerald-500 text-emerald-900 dark:border-emerald-600'
            )}
          >
            {toast.title && <div className='font-semibold'>{toast.title}</div>}
            {toast.description && (
              <div className='mt-1 text-xs text-muted-foreground'>
                {toast.description}
              </div>
            )}
          </div>
        ))}
      </div>
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
