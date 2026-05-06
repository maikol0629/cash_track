import * as React from 'react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      <button
        type='button'
        aria-label='Close dialog'
        className='absolute inset-0 cursor-default border-0 bg-black/40 p-0 backdrop-blur-sm animate-in fade-in-0'
        onClick={() => onOpenChange(false)}
      />
      <dialog
        open
        aria-modal='true'
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full max-w-lg rounded-lg bg-background p-6 shadow-lg animate-in fade-in-0 zoom-in-95 duration-150'
        )}
      >
        {children}
      </dialog>
    </div>
  );
};

interface DialogHeaderProps {
  title: string;
  description?: string;
}

export const DialogHeader = ({ title, description }: DialogHeaderProps) => (
  <div className='mb-4'>
    <h2 className='text-lg font-semibold'>{title}</h2>
    {description && (
      <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
    )}
  </div>
);
