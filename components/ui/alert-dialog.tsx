import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const AlertDialog = ({
  open,
  onOpenChange,
  children,
}: AlertDialogProps) => {
  if (!open) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in-0'
      onClick={() => onOpenChange(false)}
      role='presentation'
    >
      <div
        className={cn(
          'w-full max-w-md rounded-lg bg-background p-6 shadow-lg animate-in fade-in-0 zoom-in-95 duration-150'
        )}
        onClick={(event) => event.stopPropagation()}
        role='alertdialog'
        aria-modal='true'
      >
        {children}
      </div>
    </div>
  );
};

export const AlertDialogHeader = ({
  children,
}: {
  children: React.ReactNode;
}) => <div className='mb-4'>{children}</div>;

export const AlertDialogTitle = ({
  children,
}: {
  children: React.ReactNode;
}) => <h2 className='text-lg font-semibold'>{children}</h2>;

export const AlertDialogDescription = ({
  children,
}: {
  children: React.ReactNode;
}) => <p className='mt-1 text-sm text-muted-foreground'>{children}</p>;

export const AlertDialogFooter = ({
  children,
}: {
  children: React.ReactNode;
}) => <div className='mt-6 flex justify-end gap-2'>{children}</div>;

interface AlertDialogButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const AlertDialogAction = ({
  children,
  ...props
}: AlertDialogButtonProps) => <Button {...props}>{children}</Button>;

export const AlertDialogCancel = ({
  children,
  ...props
}: AlertDialogButtonProps) => (
  <Button variant='ghost' {...props}>
    {children}
  </Button>
);
