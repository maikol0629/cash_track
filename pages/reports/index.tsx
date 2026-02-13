import { useEffect, useState } from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

interface MonthlyAggregate {
  month: string; // YYYY-MM
  income: number;
  expense: number;
}

interface ReportsResponse {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  monthly: MonthlyAggregate[];
}

const ReportsPage = () => {
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/reports');

        if (!res.ok) {
          throw new Error('No se pudo cargar el reporte.');
        }

        const json = (await res.json()) as ReportsResponse;
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchReports();
  }, []);

  const handleDownloadCsv = async () => {
    try {
      const res = await fetch('/api/reports/csv');

      if (!res.ok) {
        throw new Error('No se pudo descargar el archivo CSV.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'movements-report.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // For now just log; in a real app we might show a toast
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="mx-auto max-w-6xl space-y-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 w-40 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-9 w-32 animate-pulse rounded bg-muted" />
          </div>

          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((key) => (
              <div
                key={key}
                className="rounded-lg border bg-white p-4 shadow-sm"
              >
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="mt-3 h-7 w-28 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>

          <div className="h-80 rounded-lg border bg-white p-4 shadow-sm">
            <div className="h-full w-full animate-pulse rounded bg-muted" />
          </div>

          <div className="h-80 rounded-lg border bg-white p-4 shadow-sm">
            <div className="h-full w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <p className="text-center text-red-500">
          Ocurrió un error: {error}
        </p>
      );
    }

    if (!data) {
      return <p className="text-center">No hay información para mostrar.</p>;
    }

    const { totalIncome, totalExpense, balance, monthly } = data;

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Reportes financieros</h1>
            <p className="text-sm text-gray-500">
              Resumen de ingresos y egresos mensuales.
            </p>
          </div>
          <Button onClick={handleDownloadCsv}>Descargar CSV</Button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Ingresos totales</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-600">
              ${totalIncome.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Egresos totales</p>
            <p className="mt-2 text-2xl font-semibold text-red-600">
              ${totalExpense.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Saldo actual</p>
            <p
              className={`mt-2 text-2xl font-semibold ${
                balance >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              ${balance.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Ingresos vs Egresos por mes</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" name="Ingresos" fill="#22c55e" />
                <Bar dataKey="expense" name="Egresos" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Tendencia de saldo mensual</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthly.map((m, index) => {
                  const cumulativeBalance = monthly
                    .slice(0, index + 1)
                    .reduce((acc, cur) => acc + cur.income - cur.expense, 0);
                  return { ...m, cumulativeBalance };
                })}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cumulativeBalance"
                  name="Saldo acumulado"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <RoleGuard allowedRoles={['ADMIN']}>
        <main className="mx-auto max-w-6xl py-8">{renderContent()}</main>
      </RoleGuard>
    </MainLayout>
  );
};

export default ReportsPage;
