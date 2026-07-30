import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { Edit2, Trash2, Search, ChevronLeft, ChevronRight, Receipt } from 'lucide-react';

import * as gastoDiarioApi from '../../api/gastoDiarioApi';
import { usePermisos } from '../../hooks/usePermisos';
import { PageHeader } from '../../components/shared/PageHeader';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { formatDate, formatCurrency } from '../../utils/formatters';

const GastosDiariosPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tienePermiso } = usePermisos();

  const [globalFilter, setGlobalFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const { data: gastos = [], isLoading, isError } = useQuery({
    queryKey: ['gastos-diarios'],
    queryFn: gastoDiarioApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: gastoDiarioApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos-diarios'] });
      setDeleteId(null);
    },
    onError: () => {
      alert('Error al intentar eliminar el registro de gasto.');
      setDeleteId(null);
    }
  });

  const dataFiltrada = useMemo(() => {
    if (!globalFilter) return gastos;
    const busqueda = globalFilter.toLowerCase();
    return gastos.filter(g => g.descripcion?.toLowerCase().includes(busqueda));
  }, [gastos, globalFilter]);

  const columns = useMemo(() => [
    {
      accessorKey: 'fecha',
      header: 'Fecha',
      cell: info => formatDate(info.getValue()),
    },
    {
      accessorKey: 'descripcion',
      header: 'Descripción',
      cell: info => <span className="font-medium text-slate-900 block max-w-xs truncate">{info.getValue()}</span>,
    },
    {
      accessorKey: 'monto',
      header: 'Monto',
      cell: info => <span className="font-semibold text-slate-900">{formatCurrency(info.getValue())}</span>,
    },
    {
      accessorKey: 'metodoPago',
      header: 'Método de Pago',
      cell: info => <span className="text-xs uppercase bg-slate-100 text-slate-700 px-2 py-1 rounded">{info.getValue()}</span>,
    },
    {
      accessorKey: 'categoria',
      header: 'Categoría',
      cell: info => <span className="text-xs font-medium text-slate-600">{info.getValue()}</span>,
    },
    {
      accessorKey: 'esMateriaPrima',
      header: 'Materia Prima',
      cell: info => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          info.getValue() ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-50 text-slate-500 border border-slate-200'
        }`}>
          {info.getValue() ? 'Sí' : 'No'}
        </span>
      ),
    },
    {
      accessorKey: 'tieneRecibo',
      header: 'Recibo',
      cell: info => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          info.getValue() ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
        }`}>
          {info.getValue() ? 'Sí' : 'No'}
        </span>
      ),
    },
    {
      accessorKey: 'nombreUsuario',
      header: 'Registrado Por',
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => {
        const g = row.original;
        return (
          <div className="flex items-center gap-2">
            {tienePermiso('GASTODIARIO_UPDATE') && (
              <button
                onClick={() => navigate(`/gastos-diarios/editar/${g.idGasto}`)}
                className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors"
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {tienePermiso('GASTODIARIO_DELETE') && (
              <button
                onClick={() => setDeleteId(g.idGasto)}
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

  if (isLoading) return <div className="text-center p-10 text-slate-500 font-medium">Cargando bitácora de gastos...</div>;
  if (isError) return <div className="p-4 bg-red-50 text-red-600 text-center rounded-md font-medium">Error al cargar listado de gastos diarios</div>;

  return (
    <div className="space-y-4">
      <PageHeader 
        titulo="Gastos Diarios" 
        descripcion="Seguimiento financiero instantáneo de flujos de salida y consumos corporativos."
        onNuevo={tienePermiso('GASTODIARIO_CREATE') ? () => navigate('/gastos-diarios/nuevo') : null}
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
          placeholder="Buscar por descripción..."
        />
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-md bg-white">
        <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => (
                    <th key={h.id} className="px-6 py-3 font-semibold">{flexRender(h.column.columnDef.header, h.getContext())}</th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-200">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-slate-600">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-10 text-center text-slate-400">No se encontraron registros de gastos diarios.</td>
                </tr>
              )}
            </tbody>
        </table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-md">
          <span className="text-sm text-slate-700">Página <strong>{table.getState().pagination.pageIndex + 1}</strong> de <strong>{table.getPageCount()}</strong></span>
          <div className="inline-flex shadow-sm rounded-md">
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="p-2 border border-slate-300 bg-white rounded-l-md hover:bg-slate-50 disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="p-2 border border-slate-300 bg-white rounded-r-md hover:bg-slate-50 disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        titulo="¿Eliminar Gasto Diario?"
        mensaje="Esta operación es irreversible y modificará los reportes de egresos globales del día seleccionado."
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default GastosDiariosPage;