import { usePermisos } from "@/hooks/usePermisos";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { Edit2, Trash2, Search, ChevronLeft, ChevronRight, Key, Power } from 'lucide-react';

import * as usuarioApi from "@/api/usuarioApi";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import CambiarPasswordDialog from "@/components/shared/CambiarPasswordDialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

const UsuariosPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tienePermiso } = usePermisos();

  const [globalFilter, setGlobalFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [passwordDialogUser, setPasswordDialogUser] = useState(null);

  const [errorEliminar, setErrorEliminar] = useState('');

  const {usuario} = useAuth();

  const { data: usuarios, isLoading, isError } = useQuery({
    queryKey: ['usuarios'],
    queryFn: usuarioApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usuarioApi.remove(id, usuario.idUsuario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setDeleteId(null);setErrorEliminar('');
    },
    onError: (err) => {
        const msg = err.response?.data?.mensaje || err.response?.data?.message || 'Error al intentar eliminar el usuario';
        setErrorEliminar(msg);
      setDeleteId(null);
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => usuarioApi.activarDesactivar (id, usuario.idUsuario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: () => {
      alert('Error al cambiar el estado del usuario');
    }
  });

  const dataFiltrada = useMemo(() => {
    if (!usuarios) return [];
    if (!globalFilter) return usuarios;
    const busqueda = globalFilter.toLowerCase();
    return usuarios.filter(u =>
      u.nombre?.toLowerCase().includes(busqueda) ||
      u.nombreRol?.toLowerCase().includes(busqueda)
    );
  }, [usuarios, globalFilter]);

  const columns = useMemo(() => [
    {
      accessorKey: 'nombre',
      header: 'Nombre de Usuario'
    },
    {
      accessorKey: 'nombreRol',
      header: 'Rol',
      cell: info => (
        <span className="text-xs uppercase bg-slate-100 text-slate-700 px-2 py-1 rounded">
          {info.getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'activo',
      header: 'Estado',
      cell: info => {
        const activo = info.getValue();
        return (
          <Badge
        className={
          activo
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }
      >
        {activo ? 'Activo' : 'Inactivo'}
      </Badge>
        );
      },
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex items-center gap-2">
            {tienePermiso('USUARIO_UPDATE') && (
              <>
              {!(u.idUsuario === usuario.idUsuario && u.activo) && (
                <button
                  onClick={() => toggleMutation.mutate(u.idUsuario)}
                  disabled={toggleMutation.isPending}
                  className={`flex items-center gap-1 p-1 rounded transition-colors text-xs font-medium ${
                    u.activo
                      ? 'text-amber-600 hover:bg-amber-50'
                      : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                  title={u.activo ? 'Desactivar' : 'Activar'}
                >
                  <Power className="w-4 h-4" />
                  <span className="hidden sm:inline">{u.activo ? 'Desactivar' : 'Activar'}</span>
                </button>
              )}
                
                <button
                  onClick={() => setPasswordDialogUser({ id: u.idUsuario, nombre: u.nombre })}
                  className="p-1 text-slate-500 hover:text-indigo-600 rounded transition-colors"
                  title="Cambiar contraseña"
                >
                  <Key className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate(`/admin/usuarios/${u.idUsuario}/editar`)}
                  className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            )}
            {tienePermiso('USUARIO_DELETE') && (
              <button
                onClick={() => setDeleteId(u.idUsuario)}
                className="p-1 text-slate-500 hover:text-red-600 rounded transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      }
    }
  ], [tienePermiso, navigate, toggleMutation]);

  const table = useReactTable({
    data: dataFiltrada,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } }
  });

  if (isLoading) return <div className="text-center p-10 text-slate-500 font-medium">Cargando directorio de usuarios...</div>;
  if (isError) return <div className="p-4 bg-red-50 text-red-600 text-center rounded-md font-medium">Error al cargar listado de usuarios</div>;

  return (
    <div className="space-y-4">
      <PageHeader
        titulo="Gestión de Usuarios"
        descripcion="Administración de accesos, roles y credenciales del sistema."
        onNuevo={tienePermiso('USUARIO_CREATE') ? () => navigate('/admin/usuarios/nuevo') : null}
      />

      <div className="relative max-w-sm">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Buscar por nombre o rol..."
        />
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-md bg-white">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th key={h.id} className="px-6 py-3 font-semibold">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-200">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-slate-400">
                  No se encontraron usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-md">
          <span className="text-sm text-slate-700">
            Página <strong>{table.getState().pagination.pageIndex + 1}</strong> de <strong>{table.getPageCount()}</strong>
          </span>
          <div className="inline-flex shadow-sm rounded-md">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 border border-slate-300 bg-white rounded-l-md hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 border border-slate-300 bg-white rounded-r-md hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        titulo="¿Eliminar Usuario?"
        mensaje="Esta operación es irreversible y revocará el acceso al sistema de forma permanente para este usuario."
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

      <CambiarPasswordDialog
        open={Boolean(passwordDialogUser)}
        onClose={() => setPasswordDialogUser(null)}
        usuarioId={passwordDialogUser?.id}
        nombreUsuario={passwordDialogUser?.nombre}
      />
    </div>
  );
};

export default UsuariosPage;