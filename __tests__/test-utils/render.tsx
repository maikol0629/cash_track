import { render } from '@testing-library/react';
import type React from 'react';
import { ToastProvider } from '@/components/ui/use-toast';

export const renderWithProviders = (ui: React.ReactElement) =>
  render(<ToastProvider>{ui}</ToastProvider>);
