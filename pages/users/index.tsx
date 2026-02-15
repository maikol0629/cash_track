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
import { Form, FormField, FormActions } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import type { Role } from '@/lib/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { UserDeleteDialog } from '@/components/users/UserDeleteDialog';
import { useToast } from '@/components/ui/use-toast';

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
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const { toast } = useToast();

  const formMethods = useForm<EditUserFormValues>({
    defaultValues: {
      name: '',
      role: 'USER',
    },
  });

  // Carga inicial de usuarios visibles para el administrador
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

  const adminCount = users.filter((u) => u.role === 'ADMIN').length;

  // Abre el modal de edición precargando los datos del usuario seleccionado
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

  // Envía los cambios de nombre y rol al backend y actualiza el listado en memoria
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
      toast({
        title: 'Error al actualizar',
        description:
          err instanceof Error
            ? err.message
            : 'No se pudo actualizar el usuario.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='h-6 w-40 animate-pulse rounded bg-muted' />
              <div className='mt-2 h-4 w-64 animate-pulse rounded bg-muted' />
            </div>
          </div>

          <div className='rounded-lg border bg-white p-4 shadow-sm'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className='text-right'>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map((key) => (
                  <TableRow key={key}>
                    <TableCell>
                      <div className='h-4 w-40 animate-pulse rounded bg-muted' />
                    </TableCell>
                    <TableCell>
                      <div className='h-4 w-48 animate-pulse rounded bg-muted' />
                    </TableCell>
                    <TableCell>
                      <div className='h-4 w-28 animate-pulse rounded bg-muted' />
                    </TableCell>
                    <TableCell>
                      <div className='h-4 w-20 animate-pulse rounded bg-muted' />
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='ml-auto h-4 w-6 animate-pulse rounded bg-muted' />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <p className='text-center text-red-500'>
          Ocurrió un error al cargar usuarios: {error}
        </p>
      );
    }

    if (users.length === 0) {
      return <p className='text-center'>No hay usuarios registrados.</p>;
    }

    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-semibold'>Gestión de usuarios</h1>
            <p className='text-sm text-gray-500'>
              Solo los administradores pueden ver y editar usuarios.
            </p>
          </div>
        </div>

        <div className='rounded-lg border bg-white p-4 shadow-sm'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className='text-right'>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isLastAdmin = user.role === 'ADMIN' && adminCount === 1;
                const deleteTooltip = isLastAdmin
                  ? 'No puedes eliminar el último administrador.'
                  : undefined;

                return (
                  <TableRow key={user.id}>
                    <TableCell className='font-medium'>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone ?? '—'}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell className='text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button
                            size='sm'
                            variant='ghost'
                            aria-label='Acciones'
                          >
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => openEditDialog(user)}
                          >
                            <Pencil className='mr-2 h-4 w-4' />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (isLastAdmin) return;
                              setUserToDelete(user);
                              setIsDeleteOpen(true);
                            }}
                            disabled={isLastAdmin}
                            title={deleteTooltip}
                          >
                            <Trash2 className='mr-2 h-4 w-4 text-red-600' />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
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
        <main className='mx-auto max-w-5xl py-6'>
          {renderContent()}

          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => !open && closeDialog()}
          >
            <DialogHeader
              title='Editar usuario'
              description='Actualiza el nombre y el rol del usuario.'
            />
            <Form methods={formMethods} onSubmit={handleSubmit}>
              <FormField
                label='Nombre'
                name='name'
                error={formMethods.formState.errors.name?.message ?? undefined}
              >
                <Input
                  id='name'
                  {...formMethods.register('name')}
                  placeholder='Nombre del usuario'
                />
              </FormField>

              <FormField
                label='Rol'
                name='role'
                error={formMethods.formState.errors.role?.message ?? undefined}
              >
                <select
                  id='role'
                  className='mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
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
                <Button type='button' variant='ghost' onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button type='submit' disabled={isSaving} className='gap-2'>
                  {isSaving && (
                    <span className='h-3 w-3 animate-spin rounded-full border-[2px] border-current border-r-transparent' />
                  )}
                  {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </FormActions>
            </Form>
          </Dialog>

          {userToDelete && (
            <UserDeleteDialog
              open={isDeleteOpen}
              onOpenChange={(open) => {
                setIsDeleteOpen(open);
                if (!open) {
                  setUserToDelete(null);
                }
              }}
              user={userToDelete}
              onDeleted={() => {
                void loadUsers();
              }}
            />
          )}
        </main>
      </RoleGuard>
    </MainLayout>
  );
};

export default UsersPage;
