import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { Edit2, Trash2, UserMinus, Search, ChevronLeft, ChevronRight } from 'lucide-react';

import * as trabajadorApi from '@/api/trabajadorApi';
import { usePermisos } from '@/hooks/usePermisos';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DarDeBajaDialog } from '@/components/shared/DarDeBajaDialog';
import { formatDate } from '@/utils/formatters';

const TrabajadoresPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tienePermiso } = usePermisos();

  const [globalFilter, setGlobalFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [bajaTrabajador, setBajaTrabajador] = useState(null); // Almacena el objeto { id, nombreCompleto }

  const { data: trabajadores = [], isLoading, isError } = useQuery({
    queryKey: ['trabajadores'],
    queryFn: trabajadorApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: trabajadorApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trabajadores'] });
      setDeleteId(null);
    },
    onError: () => {
      alert('Error al eliminar el registro del trabajador.');
      setDeleteId(null);
    }
  });

  const bajaMutation = useMutation({
    mutationFn: ({ id, payload }) => trabajadorApi.darDeBaja(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trabajadores'] });
      setBajaTrabajador(null);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Error al procesar la baja del trabajador.');
      setBajaTrabajador(null);
    }
  });

  const dataFiltrada = useMemo(() => {
    if (!globalFilter) return trabajadores;
    const busqueda = globalFilter.toLowerCase();
    return trabajadores.filter(t => {
      const nombreCompleto = `${t.nombre || ''} ${t.apellidoPaterno || ''} ${t.apellidoMaterno || ''}`.toLowerCase();
      return nombreCompleto.includes(busqueda);
    });
  }, [trabajadores, globalFilter]);

  const columns = useMemo(() => [
    {
      accessorFn: row => `${row.nombre} ${row.apellidoPaterno} ${row.apellidoMaterno || ''}`.trim(),
      id: 'nombreCompleto',
      header: 'Nombre Completo',
      cell: info => <span className="font-medium text-slate-900">{info.getValue()}</span>,
    },
    {
      accessorKey: 'nombrePuesto',
      header: 'Puesto',
    },
    {
      accessorKey: 'nombreArea',
      header: 'Área',
    },
    {
      accessorKey: 'telefono',
      header: 'Teléfono',
      cell: info => info.getValue() || '—',
    },
    {
      accessorKey: 'activo',
      header: 'Estatus',
      cell: info => {
        const activo = info.getValue();
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
            activo 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {activo ? 'Activo' : 'Inactivo'}
          </span>
        );
      }
    },
    {
      accessorKey: 'fechaAlta',
      header: 'Fecha Alta',
      cell: info => formatDate(info.getValue()),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => {
        const t = row.original;
        const nombreC = `${t.nombre} ${t.apellidoPaterno}`;
        return (
          <div className="flex items-center gap-2">
            {tienePermiso('TRABAJADOR_UPDATE') && (
              <button
                onClick={() => navigate(`/trabajadores/editar/${t.idTrabajador}`)}
                className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors"
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {tienePermiso('TRABAJADOR_UPDATE') && t.activo && (
              <button
                onClick={() => setBajaTrabajador({ id: t.idTrabajador, nombreCompleto: nombreC })}
                className="p-1 text-slate-500 hover:text-amber-600 rounded transition-colors"
                title="Dar de Baja"
              >
                <UserMinus className="w-4 h-4" />
              </button>
            )}
            {tienePermiso('TRABAJADOR_DELETE') && (
              <button
                onClick={() => setDeleteId(t.idTrabajador)}
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
  ], [tienePermiso, navigate]);

  const table = useReactTable({
    data: dataFiltrada,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } }
  });

  if (isLoading) return <div className="text-center p-10 text-slate-500 font-medium">Cargando plantilla de trabajadores...</div>;
  if (isError) return <div className="p-4 bg-red-50 text-red-600 text-center rounded-md font-medium">Error al cargar trabajadores</div>;

  return (
    <div className="space-y-4">
      <PageHeader 
        titulo="Trabajadores" 
        descripcion="Gestión operativa de la plantilla de ingenieros, topógrafos y administrativos."
        onNuevo={tienePermiso('TRABAJADOR_CREATE') ? () => navigate('/trabajadores/nuevo') : null}
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
          placeholder="Buscar trabajador..."
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
                  No se encontraron registros de trabajadores.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-md mt-4">
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
        titulo="¿Eliminar Trabajador?"
        mensaje="Esta acción borrará el registro de forma definitiva. Para bajas operativas utilice la acción 'Dar de baja'."
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />

      <DarDeBajaDialog
        open={Boolean(bajaTrabajador)}
        nombreTrabajador={bajaTrabajador?.nombreCompleto || ''}
        onConfirm={(formData) => bajaMutation.mutate({ id: bajaTrabajador.id, payload: formData })}
        onCancel={() => setBajaTrabajador(null)}
      />
    </div>
  );
};

export default TrabajadoresPage;