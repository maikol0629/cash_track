import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { TransactionsTable } from '@/components/transactions/TransactionsTable';
import { TransactionFormModal } from '@/components/transactions/TransactionFormModal';

const TransactionsPage = () => {
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <MainLayout>
      <section className='space-y-4'>
        <header className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-semibold'>Movimientos</h1>
            <p className='text-sm text-muted-foreground'>
              Gestiona tus ingresos y egresos.
            </p>
          </div>
        </header>
        <TransactionsTable key={refreshKey} onNew={() => setOpen(true)} />
        <TransactionFormModal
          open={open}
          onOpenChange={setOpen}
          onCreated={handleCreated}
        />
      </section>
    </MainLayout>
  );
};

export default TransactionsPage;
