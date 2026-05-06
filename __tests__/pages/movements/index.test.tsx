import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MovementsPage from '@/pages/movements';

jest.mock('@/components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/auth/RoleGuard', () => ({
  RoleGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/movements/table/MovementsTable', () => ({
  MovementsTable: ({ onNew }: { onNew: () => void }) => (
    <button type='button' onClick={onNew}>
      Open movement form
    </button>
  ),
}));

jest.mock('@/components/movements/MovementFormModal', () => ({
  MovementFormModal: ({ open }: { open: boolean }) => (
    <div>{open ? 'movement-form-open' : 'movement-form-closed'}</div>
  ),
}));

describe('MovementsPage', () => {
  it('opens the movement form when the table requests a new movement', () => {
    render(<MovementsPage />);

    expect(screen.getByText('movement-form-closed')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open movement form' }));

    expect(screen.getByText('movement-form-open')).toBeInTheDocument();
  });
});
