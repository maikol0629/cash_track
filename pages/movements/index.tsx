import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { MovementsTable } from '@/components/movements/MovementsTable';
import { MovementFormModal } from '@/components/movements/MovementFormModal';

const MovementsPage = () => {
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <MainLayout>
      <RoleGuard>
        <section className='space-y-4'>
          <header className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-semibold'>Movimientos</h1>
              <p className='text-sm text-muted-foreground'>
                Gestiona tus ingresos y egresos.
              </p>
            </div>
          </header>
          <MovementsTable key={refreshKey} onNew={() => setOpen(true)} />
          <MovementFormModal
            open={open}
            onOpenChange={setOpen}
            onCreated={handleCreated}
          />
        </section>
      </RoleGuard>
    </MainLayout>
  );
};

export default MovementsPage;
