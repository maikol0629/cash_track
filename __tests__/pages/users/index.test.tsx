import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UsersPage from '@/pages/users';

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
    showToast: mockToast,
  }),
}));

const mockFetch = jest.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('UsersPage', () => {
  let users = [
    {
      id: 'user-1',
      name: 'Jane',
      email: 'jane@example.com',
      phone: '123',
      role: 'ADMIN' as const,
    },
    {
      id: 'user-2',
      name: 'John',
      email: 'john@example.com',
      phone: null,
      role: 'USER' as const,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    users = [
      {
        id: 'user-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: '123',
        role: 'ADMIN' as const,
      },
      {
        id: 'user-2',
        name: 'John',
        email: 'john@example.com',
        phone: null,
        role: 'USER' as const,
      },
    ];

    mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/users' && method === 'GET') {
        return {
          ok: true,
          json: async () => users,
        } as Response;
      }

      if (url === '/api/users/user-1' && method === 'PATCH') {
        const updated = {
          ...users[0],
          name: 'Jane Updated',
        };
        users = users.map((user) => (user.id === updated.id ? updated : user));
        return {
          ok: true,
          json: async () => updated,
        } as Response;
      }

      if (url === '/api/users/user-2' && method === 'DELETE') {
        users = users.filter((user) => user.id !== 'user-2');
        return {
          ok: true,
          json: async () => ({}),
        } as Response;
      }

      throw new Error(`Unexpected request: ${method} ${url}`);
    });
  });

  it('edits a user and updates the table', async () => {
    render(<UsersPage />);

    await waitFor(() => expect(screen.getByText('Jane')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button', { name: 'Acciones' })[0]);
    fireEvent.click(screen.getByText('Editar'));

    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'Jane Updated' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(screen.getByText('Jane Updated')).toBeInTheDocument()
    );
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/users/user-1',
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('deletes a user and refreshes the table', async () => {
    render(<UsersPage />);

    await waitFor(() => expect(screen.getByText('John')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button', { name: 'Acciones' })[1]);
    fireEvent.click(screen.getByText('Eliminar'));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith('/api/users/user-2', {
        method: 'DELETE',
      })
    );
    await waitFor(() =>
      expect(screen.queryByText('john@example.com')).not.toBeInTheDocument()
    );
  });

  it('renders empty state when no users are returned', async () => {
    mockFetch.mockImplementationOnce(async () => ({
      ok: true,
      json: async () => [],
    } as Response));

    render(<UsersPage />);

    await waitFor(() =>
      expect(screen.getByText('No hay usuarios registrados.')).toBeInTheDocument()
    );
  });

  it('renders load error when users request fails', async () => {
    mockFetch.mockImplementationOnce(async () => ({
      ok: false,
      json: async () => ({}),
    } as Response));

    render(<UsersPage />);

    await waitFor(() =>
      expect(
        screen.getByText(/Ocurrió un error al cargar usuarios: No se pudieron cargar los usuarios/)
      ).toBeInTheDocument()
    );
  });

  it('shows destructive toast when edit request fails', async () => {
    mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/users' && method === 'GET') {
        return {
          ok: true,
          json: async () => users,
        } as Response;
      }

      if (url === '/api/users/user-1' && method === 'PATCH') {
        return {
          ok: false,
          json: async () => ({ message: 'No se pudo actualizar el usuario' }),
        } as Response;
      }

      throw new Error(`Unexpected request: ${method} ${url}`);
    });

    render(<UsersPage />);

    await waitFor(() => expect(screen.getByText('Jane')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button', { name: 'Acciones' })[0]);
    fireEvent.click(screen.getByText('Editar'));
    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'Jane Updated' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error al actualizar',
          variant: 'destructive',
        })
      )
    );
  });
});
