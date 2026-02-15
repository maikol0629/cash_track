import * as React from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<
  DropdownMenuContextValue | undefined
>(undefined);

const useDropdownMenuContext = () => {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx) {
    throw new Error(
      'DropdownMenu components must be used inside <DropdownMenu>'
    );
  }
  return ctx;
};

interface DropdownMenuProps {
  children: React.ReactNode;
}

export const DropdownMenu = ({ children }: DropdownMenuProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className='relative inline-block text-left'>{children}</div>
    </DropdownMenuContext.Provider>
  );
};

interface DropdownMenuTriggerProps {
  children: React.ReactElement;
}

export const DropdownMenuTrigger = ({ children }: DropdownMenuTriggerProps) => {
  const { open, setOpen } = useDropdownMenuContext();

  return React.cloneElement(children, {
    'aria-expanded': open,
    onClick: (event: React.MouseEvent) => {
      children.props.onClick?.(event);
      setOpen(!open);
    },
  });
};

interface DropdownMenuContentProps {
  children: React.ReactNode;
}

export const DropdownMenuContent = ({ children }: DropdownMenuContentProps) => {
  const { open } = useDropdownMenuContext();

  if (!open) return null;

  return (
    <div className='absolute right-0 z-50 mt-2 w-40 origin-top-right rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95 duration-150'>
      <div className='py-1'>{children}</div>
    </div>
  );
};

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const DropdownMenuItem = ({
  children,
  className,
  disabled,
  onClick,
  ...props
}: DropdownMenuItemProps) => {
  const { setOpen } = useDropdownMenuContext();

  return (
    <button
      type='button'
      className={cn(
        'flex w-full cursor-pointer select-none items-center px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      onClick={(event) => {
        if (disabled) return;
        onClick?.(event);
        setOpen(false);
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
