import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReportsPage from '@/pages/reports';

const mockToast = jest.fn();

jest.mock('@/components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/auth/RoleGuard', () => ({
  RoleGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div data-testid='line' />,
  XAxis: () => <div data-testid='x-axis' />,
  YAxis: () => <div data-testid='y-axis' />,
  CartesianGrid: () => <div data-testid='grid' />,
  Tooltip: () => <div data-testid='tooltip' />,
  Legend: () => <div data-testid='legend' />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div data-testid='bar' />,
}));

const mockFetch = jest.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('ReportsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalIncome: 1500,
          totalExpense: 400,
          balance: 1100,
          totalMovements: 10001,
          monthly: [
            { month: '2025-01', income: 1000, expense: 200 },
            { month: '2025-02', income: 500, expense: 200 },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['csv-content'], { type: 'text/csv' }),
      });

    globalThis.URL.createObjectURL = jest.fn(() => 'blob:url');
    globalThis.URL.revokeObjectURL = jest.fn();
  });

  it('renders the report and downloads the CSV with a warning toast', async () => {
    render(<ReportsPage />);

    await waitFor(() =>
      expect(screen.getByText('Reportes financieros')).toBeInTheDocument()
    );

    expect(screen.getByText('$1500.00')).toBeInTheDocument();
    expect(screen.getByText('$400.00')).toBeInTheDocument();
    expect(screen.getByText('$1100.00')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Descargar CSV' }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('/api/reports/csv'));
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Advertencia',
        variant: 'default',
      })
    );
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Reporte descargado',
        variant: 'success',
      })
    );
    expect(globalThis.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
  });
});
