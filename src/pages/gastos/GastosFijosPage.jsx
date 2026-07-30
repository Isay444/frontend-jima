import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { Edit2, Trash2, CheckCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';

import * as gastoFijoApi from '@/api/gastoFijoApi';
import { usePermisos } from '@/hooks/usePermisos';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatCurrency } from '@/utils/formatters';
import { PageHeader } from '@/components/shared/PageHeader';

const GastosFijosPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tienePermiso } = usePermisos();

  const [globalFilter, setGlobalFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [listoParaPagarId, setListoParaPagarId] = useState(null);

  const { data: gastos = [], isLoading, isError } = useQuery({
    queryKey: ['gastos-fijos'],
    queryFn: gastoFijoApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: gastoFijoApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos-fijos'] });
      setDeleteId(null);
    },
    onError: () => {
      alert('Error al intentar eliminar el gasto fijo.');
      setDeleteId(null);
    }
  });

  const listoMutation = useMutation({
    mutationFn: gastoFijoApi.marcarListoParaPagar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos-fijos'] });
      setListoParaPagarId(null);
    },
    onError: () => {
      alert('Error al actualizar el estatus del gasto.');
      setListoParaPagarId(null);
    }
  });

  const dataFiltrada = useMemo(() => {
    if (!globalFilter) return gastos;
    const busqueda = globalFilter.toLowerCase();
    return gastos.filter(g => g.descripcion?.toLowerCase().includes(busqueda));
  }, [gastos, globalFilter]);

  const columns = useMemo(() => [
    {
      accessorKey: 'descripcion',
      header: 'Descripción',
      cell: info => <span className="font-medium text-slate-900">{info.getValue()}</span>,
    },
    {
      accessorKey: 'categoria',
      header: 'Categoría',
      cell: info => <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{info.getValue()?.replace('_', ' ')}</span>,
    },
    {
      accessorKey: 'montoEstimado',
      header: 'Estimado',
      cell: info => <span className="font-medium">{formatCurrency(info.getValue())}</span>,
    },
    {
      accessorKey: 'montoReal',
      header: 'Real',
      cell: info => {
        const val = info.getValue();
        return val != null ? <span className="font-medium">{formatCurrency(val)}</span> : <span className="text-slate-400">—</span>;
      },
    },
    {
      accessorKey: 'provision',
      header: 'Provisión',
      cell: info => <span className="font-medium text-slate-700">{formatCurrency(info.getValue())}</span>,
    },
    {
      accessorKey: 'ahorro',
      header: 'Ahorro',
      cell: info => {
        const val = info.getValue() || 0;
        return <span className={`font-medium ${val > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>{formatCurrency(val)}</span>;
      },
    },
    {
      accessorKey: 'excedente',
      header: 'Excedente',
      cell: info => {
        const val = info.getValue() || 0;
        return <span className={`font-medium ${val > 0 ? 'text-red-600' : 'text-slate-500'}`}>{formatCurrency(val)}</span>;
      },
    },
    {
      accessorKey: 'resto',
      header: 'Resto',
      cell: info => <span className="font-medium">{formatCurrency(info.getValue() || 0)}</span>,
    },
    {
      accessorKey: 'estatus',
      header: 'Estatus',
      cell: info => {
        const estatus = info.getValue();
        const config = {
          PENDIENTE: 'bg-amber-50 text-amber-700 border-amber-200',
          LISTO_PARA_PAGAR: 'bg-blue-50 text-blue-700 border-blue-200',
          PAGADO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${config[estatus] || config.PENDIENTE}`}>
            {estatus?.replace(/_/g, ' ')}
          </span>
        );
      }
    },
    {
      id: 'periodo',
      header: 'Mes/Año',
      cell: ({ row }) => <span className="text-xs font-medium text-slate-600">{row.original.mes} / {row.original.anio}</span>,
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => {
        const g = row.original;
        return (
          <div className="flex items-center gap-2">
            {tienePermiso('GASTOFIJO_UPDATE') && g.estatus === 'PENDIENTE' && (
              <button
                onClick={() => setListoParaPagarId(g.idGastoFijo)}
                className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors"
                title="Marcar listo para pagar"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
            {tienePermiso('GASTOFIJO_UPDATE') && (
              <button
                onClick={() => navigate(`/gastos-fijos/editar/${g.idGastoFijo}`)}
                className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors"
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {tienePermiso('GASTOFIJO_DELETE') && (
              <button
                onClick={() => setDeleteId(g.idGastoFijo)}
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

  if (isLoading) return <div className="text-center p-10 text-slate-500 font-medium">Cargando presupuesto de gastos fijos...</div>;
  if (isError) return <div className="p-4 bg-red-50 text-red-600 text-center rounded-md font-medium">Error al cargar listado de gastos fijos</div>;

  return (
    <div className="space-y-4">
      <PageHeader 
        titulo="Gastos Fijos" 
        descripcion="Planificación y control del presupuesto operativo recurrente."
        onNuevo={tienePermiso('GASTOFIJO_CREATE') ? () => navigate('/gastos-fijos/nuevo') : null}
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
          placeholder="Buscar descripción del gasto..."
        />
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-md bg-white">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th key={h.id} className="px-4 py-3 font-semibold whitespace-nowrap">{flexRender(h.column.columnDef.header, h.getContext())}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-200">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-slate-400">No se encontraron registros de gastos fijos.</td>
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
        titulo="¿Eliminar Gasto Fijo?"
        mensaje="Esta acción borrará este registro del presupuesto mensual y no se podrá deshacer."
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        open={Boolean(listoParaPagarId)}
        titulo="¿Marcar este gasto como listo para pagar?"
        mensaje="El estatus cambiará a LISTO_PARA_PAGAR, habilitándolo para el flujo de tesorería."
        onConfirm={() => listoMutation.mutate(listoParaPagarId)}
        onCancel={() => setListoParaPagarId(null)}
      />
    </div>
  );
};

export default GastosFijosPage;