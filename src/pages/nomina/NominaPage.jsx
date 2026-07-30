import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { Edit2, Trash2, CheckSquare, Search, ChevronLeft, ChevronRight } from 'lucide-react';

import * as nominaApi from '@/api/nominaApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { usePermisos } from '@/hooks/usePermisos';

const NominaPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tienePermiso } = usePermisos();

  const [globalFilter, setGlobalFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [payId, setPayId] = useState(null);

  const { data: nominas = [], isLoading, isError } = useQuery({
    queryKey: ['nominas'],
    queryFn: nominaApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: nominaApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nominas'] });
      setDeleteId(null);
    },
    onError: () => {
      alert('Error de red al eliminar el recibo de nómina.');
      setDeleteId(null);
    }
  });

  const payMutation = useMutation({
    mutationFn: nominaApi.marcarPagado,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nominas'] });
      setPayId(null);
    },
    onError: () => {
      alert('No se pudo dispersar la nómina. Verifique el estatus del servidor.');
      setPayId(null);
    }
  });

  const dataFiltrada = useMemo(() => {
    if (!globalFilter) return nominas;
    const busqueda = globalFilter.toLowerCase();
    return nominas.filter(n => n.nombreTrabajador?.toLowerCase().includes(busqueda));
  }, [nominas, globalFilter]);

  const columns = useMemo(() => [
    {
      accessorKey: 'nombreTrabajador',
      header: 'Trabajador',
      cell: info => <span className="font-semibold text-slate-900">{info.getValue()}</span>,
    },
    {
      accessorKey: 'sueldo',
      header: 'Sueldo',
      cell: info => <span className="font-medium text-slate-800">{formatCurrency(info.getValue())}</span>,
    },
    {
      id: 'periodo',
      header: 'Período Laboral',
      cell: ({ row }) => {
        const { periodoInicio, periodoFin } = row.original;
        return <span className="text-xs text-slate-600">{formatDate(periodoInicio)} — {formatDate(periodoFin)}</span>;
      }
    },
    {
      accessorKey: 'fechaPago',
      header: 'Fecha Pago',
      cell: info => formatDate(info.getValue()),
    },
    {
      accessorKey: 'periodicidad',
      header: 'Periodicidad',
    },
    {
      accessorKey: 'metodoPago',
      header: 'Método',
    },
    {
      accessorKey: 'estatusPago',
      header: 'Estatus',
      cell: info => {
        const estatus = info.getValue();
        const classes = {
          PENDIENTE: 'bg-amber-50 text-amber-700 border-amber-200',
          PAGADO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          CANCELADO: 'bg-red-50 text-red-700 border-red-200',
        };
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes[estatus] || classes.PENDIENTE}`}>
            {estatus}
          </span>
        );
      }
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => {
        const n = row.original;
        const esPendiente = n.estatusPago === 'PENDIENTE';
        return (
          <div className="flex items-center gap-2">
            {tienePermiso('NOMINA_UPDATE') && esPendiente && (
              <button
                onClick={() => setPayId(n.idNomina)}
                className="p-1 text-slate-500 hover:text-emerald-600 rounded transition-colors"
                title="Marcar como Pagado"
              >
                <CheckSquare className="w-4 h-4" />
              </button>
            )}
            {tienePermiso('NOMINA_UPDATE') && esPendiente && (
              <button
                onClick={() => navigate(`/nomina/editar/${n.idNomina}`)}
                className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors"
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {tienePermiso('NOMINA_DELETE') && (
              <button
                onClick={() => setDeleteId(n.idNomina)}
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

  if (isLoading) return <div className="text-center p-10 text-slate-500 font-medium">Cargando libro de nóminas...</div>;
  if (isError) return <div className="p-4 bg-red-50 text-red-600 text-center rounded-md font-medium">Error al cargar registros de nóminas</div>;

  return (
    <div className="space-y-4">
      <PageHeader 
        titulo="Nómina y Retribuciones" 
        descripcion="Gestión, timbrado y control general de pagos de salarios a colaboradores."
        onNuevo={tienePermiso('NOMINA_CREATE') ? () => navigate('/nomina/nuevo') : null}
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
          placeholder="Buscar por colaborador..."
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
                <td colSpan={columns.length} className="px-6 py-10 text-center text-slate-400">No se localizaron registros de nómina.</td>
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
        titulo="¿Eliminar Registro de Nómina?"
        mensaje="Esta operación purgará la asignación de sueldo seleccionada de forma permanente."
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        open={Boolean(payId)}
        titulo="¿Confirmar Dispersión de Pago?"
        mensaje="El estatus cambiará a PAGADO. Asegúrese de haber efectuado la transferencia bancaria o entrega en efectivo."
        onConfirm={() => payMutation.mutate(payId)}
        onCancel={() => setPayId(null)}
      />
    </div>
  );
};

export default NominaPage;