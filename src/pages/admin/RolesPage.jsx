import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { Edit2, Trash2, Search, ChevronLeft, ChevronRight, Power } from 'lucide-react';

import * as rolApi from '@/api/rolApi';
import { usePermisos } from '@/hooks/usePermisos';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const RolesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tienePermiso } = usePermisos();

  const [globalFilter, setGlobalFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const [errorEliminar, setErrorEliminar] = useState('');
  const [errorServidor, setErrorServidor] = useState('');

  const { data: roles = [], isLoading, isError } = useQuery({
    queryKey: ['roles'],
    queryFn: rolApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: rolApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDeleteId(null);
      setErrorEliminar('');
    },
    onError: (err) => {
        const msg = err.response?.data?.mensaje || err.response?.data?.message || 'Error al intentar eliminar el rol';
        setErrorEliminar(msg);
      setDeleteId(null);
    }
  });

  const toggleMutation = useMutation({
    mutationFn: rolApi.activarDesactivar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err) => {
        const msg = err.response?.data?.mensaje || err.response?.data?.message || 'Error al cambiar el estado del rol.';
        setErrorServidor(msg);
    }
  });

  const dataFiltrada = useMemo(() => {
    if (!globalFilter) return roles;
    const busqueda = globalFilter.toLowerCase();
    return roles.filter(r => r.nombre?.toLowerCase().includes(busqueda));
  }, [roles, globalFilter]);

  const columns = useMemo(() => [
    {
      accessorKey: 'nombre',
      header: 'Nombre del Rol',
      cell: info => <span className="font-medium text-slate-900 uppercase">{info.getValue()}</span>,
    },
    {
      accessorKey: 'descripcion',
      header: 'Descripción',
      cell: info => <span className="text-xs text-slate-500">{info.getValue() || '—'}</span>,
    },
    {
      accessorKey: 'activo',
      header: 'Estado',
      cell: (info) => (
        <Badge variant={info.getValue() ? 'success' : 'destructive'}>
          {info.getValue() ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => {
        const r = row.original;

        return (
          <div className="flex items-center gap-2">
            {tienePermiso('ROL_UPDATE') && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleMutation.mutate(r.idRol)}
                  disabled={toggleMutation.isPending}
                  className={
                    r.activo
                      ? 'text-amber-600 hover:bg-amber-50 hover:text-amber-700'
                      : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }
                  title={r.activo ? 'Desactivar' : 'Activar'}
                >
                  <Power className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {r.activo ? 'Desactivar' : 'Activar'}
                  </span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/admin/roles/${r.idRol}/editar`)}
                  className="text-slate-500 hover:text-blue-600"
                  title="Editar permisos"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </>
            )}

            {tienePermiso('ROL_DELETE') && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setDeleteId(r.idRol)}
                className="text-slate-500 hover:text-red-600"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    }
  ], [tienePermiso, navigate, toggleMutation]);

  const table = useReactTable({
    data: dataFiltrada,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } }
  });

  if (isLoading) return <div className="text-center p-10 text-slate-500 font-medium">Cargando roles del sistema...</div>;
  if (isError) return <div className="p-4 bg-red-50 text-red-600 text-center rounded-md font-medium">Error al cargar listado de roles</div>;

  return (
    <div className="space-y-4">
      <PageHeader 
        titulo="Gestión de Roles" 
        descripcion="Administración de perfiles y matrices de permisos."
        onNuevo={tienePermiso('ROL_CREATE') ? () => navigate('/admin/roles/nuevo') : null}
      />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          type="search"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-10"
          placeholder="Buscar por nombre de rol..."
        />
      </div>

      <div className="overflow-x-auto rounded-md border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-6 py-3 font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="whitespace-nowrap px-6 py-4 text-slate-600"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No se encontraron roles.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between rounded-md border bg-card px-4 py-3">
          <span className="text-sm text-muted-foreground">
            Página <strong>{table.getState().pagination.pageIndex + 1}</strong> de{' '}
            <strong>{table.getPageCount()}</strong>
          </span>

          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        titulo="¿Eliminar Rol?"
        mensaje="Esta operación es irreversible. Los usuarios asignados a este rol perderán sus accesos inmediatamente."
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />

      {errorEliminar && (
        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md text-xs font-medium text-red-600">
          <span>{errorEliminar}</span>
          <button 
            onClick={() => setErrorEliminar('')} 
            className="ml-2 font-bold hover:text-red-800 transition-colors"
          >
            X
          </button>
        </div>
      )}
      
      {errorServidor && (
          <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md text-xs font-medium text-red-600">
          <span>{errorServidor}</span>
          <button 
            onClick={() => setErrorServidor('')} 
            className="ml-2 font-bold hover:text-red-800 transition-colors"
          >
            X
          </button>
          </div>
        )}
        
    </div>
  );
};

export default RolesPage;