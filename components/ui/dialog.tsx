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
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'
      onClick={() => onOpenChange(false)}
      role='presentation'
    >
      <div
        className={cn('w-full max-w-lg rounded-lg bg-background p-6 shadow-lg')}
        onClick={(e) => e.stopPropagation()}
        role='dialog'
        aria-modal='true'
      >
        {children}
      </div>
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
