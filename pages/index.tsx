import React from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

const HomePage: React.FC = () => {
  const { user } = useCurrentUser();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <MainLayout>
      <RoleGuard>
        <div className='space-y-10'>
          {/* Hero / bienvenida */}
          <section className='rounded-xl bg-gradient-to-r from-primary/5 via-primary/0 to-primary/5 px-6 py-6 shadow-sm'>
            <div className='flex flex-col gap-3'>
              <div>
                <h1 className='text-2xl font-semibold tracking-tight'>
                  Bienvenido a Cash Track
                </h1>
                <p className='mt-1 text-sm text-muted-foreground'>
                  Controla tus ingresos y egresos, gestiona usuarios y visualiza
                  reportes financieros en un solo lugar.
                </p>
              </div>
              {user && (
                <div className='inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm'>
                  <span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary'>
                    {user.email?.[0]?.toUpperCase() ?? 'U'}
                  </span>
                  <span>{user.email}</span>
                  <span className='h-4 w-px bg-border' />
                  <span className='rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase text-primary'>
                    Rol: {user.role}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Resumen rápido (placeholder, listo para conectar a API) */}
          <section className='space-y-3'>
            <h2 className='text-sm font-medium text-muted-foreground'>
              Resumen financiero rápido
            </h2>
            <div className='grid gap-4 md:grid-cols-3'>
              <SummaryCard
                label='Saldo actual'
                value='$ 0'
                description='Disponible actualmente'
                accent='primary'
              />
              <SummaryCard
                label='Ingresos del mes'
                value='$ 0'
                description='Total de ingresos registrados'
                accent='emerald'
              />
              <SummaryCard
                label='Egresos del mes'
                value='$ 0'
                description='Total de egresos registrados'
                accent='rose'
              />
            </div>
          </section>

          {/* Navegación principal */}
          <section className='space-y-4'>
            <h2 className='text-sm font-medium text-muted-foreground'>
              ¿Qué deseas gestionar hoy?
            </h2>
            <div className='grid gap-4 md:grid-cols-3'>
              {/* Movimientos */}
              <FeatureCard
                title='Gestión de movimientos'
                subtitle='Registra y consulta ingresos y egresos.'
                badgeText='Gestión diaria'
              >
                <Link href='/movements'>
                  <Button className='mt-4 w-full justify-center transition-all duration-200 hover:translate-y-[1px]'>
                    Ir a movimientos
                  </Button>
                </Link>
              </FeatureCard>

              {/* Usuarios */}
              <FeatureCard
                title='Gestión de usuarios'
                subtitle='Administra nombres y roles de acceso.'
                badgeText='Solo admin'
                badgeVariant='warning'
              >
                {isAdmin ? (
                  <Link href='/users'>
                    <Button className='mt-4 w-full justify-center transition-all duration-200 hover:translate-y-[1px]'>
                      Gestionar usuarios
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className='mt-4 w-full justify-center'
                    variant='outline'
                    disabled
                    title='Solo administradores pueden acceder a esta sección'
                  >
                    Solo administradores
                  </Button>
                )}
              </FeatureCard>

              {/* Reportes */}
              <FeatureCard
                title='Reportes y análisis'
                subtitle='Visualiza gráficos, saldo actual y exporta CSV.'
                badgeText='Solo admin'
                badgeVariant='info'
              >
                {isAdmin ? (
                  <Link href='/reports'>
                    <Button className='mt-4 w-full justify-center transition-all duration-200 hover:translate-y-[1px]'>
                      Ver reportes
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className='mt-4 w-full justify-center'
                    variant='outline'
                    disabled
                    title='Solo administradores pueden acceder a esta sección'
                  >
                    Solo administradores
                  </Button>
                )}
              </FeatureCard>
            </div>
          </section>
        </div>
      </RoleGuard>
    </MainLayout>
  );
};

interface SummaryCardProps {
  label: string;
  value: string;
  description: string;
  accent: 'primary' | 'emerald' | 'rose';
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  value,
  description,
  accent,
}) => {
  const accentColor =
    accent === 'emerald'
      ? 'bg-emerald-500/15 text-emerald-600'
      : accent === 'rose'
        ? 'bg-rose-500/15 text-rose-600'
        : 'bg-primary/10 text-primary';

  return (
    <div className='group rounded-xl border bg-card/80 p-4 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-primary/40 hover:shadow-md'>
      <div className='flex items-center justify-between'>
        <span className='text-xs font-medium text-muted-foreground'>
          {label}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${accentColor}`}
        >
          Hoy
        </span>
      </div>
      <div className='mt-2 text-xl font-semibold tabular-nums'>{value}</div>
      <p className='mt-1 text-xs text-muted-foreground'>{description}</p>
    </div>
  );
};

interface FeatureCardProps {
  title: string;
  subtitle: string;
  badgeText: string;
  badgeVariant?: 'default' | 'warning' | 'info';
  children: React.ReactNode;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  subtitle,
  badgeText,
  badgeVariant = 'default',
  children,
}) => {
  const badgeClasses =
    badgeVariant === 'warning'
      ? 'bg-amber-100 text-amber-800'
      : badgeVariant === 'info'
        ? 'bg-sky-100 text-sky-800'
        : 'bg-primary/10 text-primary';

  return (
    <article className='group flex h-full flex-col rounded-xl border bg-card/80 p-4 shadow-sm transition-all duration-200 hover:-translate-y-[2px] hover:border-primary/40 hover:shadow-md'>
      <div className='mb-2 flex items-center justify-between gap-2'>
        <h3 className='text-sm font-semibold'>{title}</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${badgeClasses}`}
        >
          {badgeText}
        </span>
      </div>
      <p className='text-xs text-muted-foreground'>{subtitle}</p>
      <div className='mt-auto'>{children}</div>
    </article>
  );
};

export default HomePage;
