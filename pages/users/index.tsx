import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Dialog, DialogHeader } from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormActions,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import type { Role } from '@/lib/auth';

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: Role;
}

interface EditUserFormValues {
  name: string;
  role: Role;
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const formMethods = useForm<EditUserFormValues>({
    defaultValues: {
      name: '',
      role: 'USER',
    },
  });

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/users');

      if (!res.ok) {
        throw new Error('No se pudieron cargar los usuarios');
      }

      const data = (await res.json()) as User[];
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    formMethods.reset({
      name: user.name ?? '',
      role: user.role,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
  };

  const handleSubmit = async (values: EditUserFormValues) => {
    if (!selectedUser) return;

    try {
      setIsSaving(true);

      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        throw new Error('No se pudo actualizar el usuario');
      }

      const updated = (await res.json()) as User;

      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
      );

      closeDialog();
    } catch (err) {
      // En un entorno real, mostraríamos un toast de error
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-center">Cargando usuarios...</p>;
    }

    if (error) {
      return (
        <p className="text-center text-red-500">
          Ocurrió un error al cargar usuarios: {error}
        </p>
      );
    }

    if (users.length === 0) {
      return <p className="text-center">No hay usuarios registrados.</p>;
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Gestión de usuarios</h1>
            <p className="text-sm text-gray-500">
              Solo los administradores pueden ver y editar usuarios.
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name ?? '—'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone ?? '—'}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(user)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const roleOptions: Role[] = ['USER', 'ADMIN'];

  return (
    <MainLayout>
      <RoleGuard allowedRoles={['ADMIN']}>
        <main className="mx-auto max-w-5xl py-6">
          {renderContent()}

          <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogHeader
              title="Editar usuario"
              description="Actualiza el nombre y el rol del usuario."
            />
            <Form methods={formMethods} onSubmit={handleSubmit}>
              <FormField
                label="Nombre"
                name="name"
                error={
                  formMethods.formState.errors.name?.message as string | undefined
                }
              >
                <Input
                  id="name"
                  {...formMethods.register('name')}
                  placeholder="Nombre del usuario"
                />
              </FormField>

              <FormField
                label="Rol"
                name="role"
                error={
                  formMethods.formState.errors.role?.message as string | undefined
                }
              >
                <select
                  id="role"
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  {...formMethods.register('role')}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormActions>
                <Button type="button" variant="ghost" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </FormActions>
            </Form>
          </Dialog>
        </main>
      </RoleGuard>
    </MainLayout>
  );
};

export default UsersPage;
