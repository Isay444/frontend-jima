import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { Edit2, Trash2, Search, ChevronLeft, ChevronRight, XCircle, Eye } from 'lucide-react';

import * as ordenApi from '@/api/ordenApi';
import { usePermisos } from '@/hooks/usePermisos';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatDate, formatCurrency } from '@/utils/formatters';


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const OrdenesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tienePermiso } = usePermisos();

  const [globalFilter, setGlobalFilter] = useState('');
  
  // Estados para almacenar el objeto completo de la orden para las confirmaciones dinámicas
  const [ordenACancelar, setOrdenACancelar] = useState(null);
  const [ordenAEliminar, setOrdenAEliminar] = useState(null);

  const [errorCancelar, setErrorCancelar] = useState('');

  const [errorEliminar, setErrorEliminar] = useState('');

  const { data: ordenes = [], isLoading, isError } = useQuery({
    queryKey: ['ordenes'],
    queryFn: ordenApi.getAll,
  });

  // Extracción y derivación de comisionistas únicos para el futuro formulario
  const comisionistas = useMemo(() => {
    return [...new Set(ordenes.filter(o => o.comisionista).map(o => o.comisionista))];
  }, [ordenes]);

  const cancelarMutation = useMutation({
    mutationFn: ordenApi.cancelar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      setOrdenACancelar(null);
    },
    onError: (err) => {
        const msg = err.response?.data?.message || 'Error al intentar cancelar la orden.'
      setErrorCancelar(msg);
      setOrdenACancelar(null);
    }
  });

  const eliminarMutation = useMutation({
  mutationFn: ordenApi.remove,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['ordenes'] });
    setOrdenAEliminar(null);
    setErrorEliminar(''); // limpiar error si existía
  },
  onError: (err) => {
    const msg = err.response?.data?.mensaje || err.response?.data?.message || 'Error al intentar eliminar la orden. Verifique si tiene recibos asociados.';
    setErrorEliminar(msg);
    setOrdenAEliminar(null); // cierra el diálogo
  }
});

  // Búsqueda local combinada por Folio, Cliente o Servicio
  const dataFiltrada = useMemo(() => {
    if (!ordenes) return [];
    if (!globalFilter) return ordenes;
    const busqueda = globalFilter.toLowerCase();
    return ordenes.filter(o => 
      o.folio?.toLowerCase().includes(busqueda) ||
      o.cliente?.nombreCompleto?.toLowerCase().includes(busqueda) ||
      o.servicio?.nombre?.toLowerCase().includes(busqueda)
    );
  }, [ordenes, globalFilter]);

  const columns = useMemo(() => [
    {
      accessorKey: 'folio',
      header: 'Folio',
      cell: info => <span className="font-bold text-slate-900 tracking-wider">{info.getValue()}</span>,
    },
    {
      accessorKey: 'fecha',
      header: 'Fecha',
      cell: info => <span className="whitespace-nowrap">{formatDate(info.getValue())}</span>,
    },
    {
      id: 'clienteNombre',
      header: 'Cliente',
      cell: ({ row }) => <span className="font-medium text-slate-800">{row.original.cliente?.nombreCompleto}</span>,
    },
    {
      id: 'servicioNombre',
      header: 'Servicio',
      cell: ({ row }) => <span className="text-slate-600">{row.original.servicio?.nombre}</span>,
    },
    {
      id: 'ingenieroNombre',
      header: 'Ingeniero',
      cell: ({ row }) => <span className="text-xs text-slate-600">{row.original.ingeniero?.nombre}</span>,
    },
    {
      id: 'zonaEjidalNombre',
      header: 'Zona Ejidal',
      cell: ({ row }) => <span className="text-xs text-slate-500">{row.original.zonaEjidal?.nombre}</span>,
    },
    {
      accessorKey: 'montoTotal',
      header: 'Total',
      cell: info => <span className="font-semibold text-slate-900">{formatCurrency(info.getValue())}</span>,
    },
    {
      accessorKey: 'saldoRestante',
      header: 'Saldo Restante',
      cell: info => {
        const saldo = info.getValue() || 0;
        return <span className={`font-semibold ${saldo > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{formatCurrency(saldo)}</span>;
      },
    },
    {
      accessorKey: 'fechaLevantamiento',
      header: 'Levantamiento',
      cell: info => {
        const val = info.getValue();
        return val ? <span className="whitespace-nowrap text-xs">{formatDate(val)}</span> : <span className="text-slate-400 text-center block">—</span>;
      },
    },
    {
      accessorKey: 'fechaEntregaPlano',
      header: 'Entrega Plano',
      cell: ({ row }) => {
        const {requierePlano, fechaEntregaPlano} = row.original;
        if (!requierePlano){
          return (
            <Badge variant="secondary">No requiere plano</Badge>
          );
        }

        if (!fechaEntregaPlano){
          return (
            <Badge className="bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-100">Pendiente  Sin fecha</Badge>
          );
        }
        
        return (
          <span className='whitespace-nowrap text-xs'>
            {formatDate(fechaEntregaPlano)}
          </span>
        );
      },       
    },
    {
      accessorKey: 'estatus',
      header: 'Estatus',
      cell: info => {
        const estatus = info.getValue();
        const config = {
          ACTIVA: 'bg-blue-50 text-blue-700 border-blue-200',
          TERMINADA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          CANCELADA: 'bg-red-50 text-red-700 border-red-200',
        };
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${config[estatus] || config.ACTIVA}`}>
            {estatus}
          </span>
        );
      }
    },
    {
      accessorKey: 'solicitaFactura',
      header: 'Factura',
      cell: info => (
        <span className={`text-center block font-bold text-base ${info.getValue() ? 'text-emerald-600' : 'text-red-500'}`}>
          {info.getValue() ? '✓' : '✗'}
        </span>
      ),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => {
        const o = row.original;
        return (
          <div className="flex items-center gap-2">
            {tienePermiso('ORDEN_READ') && (
              <button
              onClick={() => navigate(`/ordenes/${o.id}`)}
              className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors"
              title="Ver detalle de orden"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {tienePermiso('ORDEN_UPDATE') && o.estatus !== 'CANCELADA' && (
              <button
                onClick={() => navigate(`/ordenes/${o.id}/editar`)}
                className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors"
                title="Editar orden"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {tienePermiso('ORDEN_UPDATE') && o.estatus === 'ACTIVA' && (
              <button
                onClick={() => setOrdenACancelar(o)}
                className="p-1 text-slate-500 hover:text-red-500 rounded transition-colors"
                title="Cancelar orden"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
            {tienePermiso('ORDEN_DELETE') && o.estatus !== 'TERMINADA' && (
              <button
                onClick={() => setOrdenAEliminar(o)}
                className="p-1 text-slate-500 hover:text-red-600 rounded transition-colors"
                title="Eliminar orden"
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

  if (isLoading) return <div className="text-center p-10 text-slate-500 font-medium">Cargando registro de órdenes...</div>;
  if (isError) return <div className="p-4 bg-red-50 text-red-600 text-center rounded-md font-medium">Error al cargar listado de órdenes</div>;

  return (
    <div className="space-y-4">
      <PageHeader 
        titulo="Órdenes  " 
        descripcion="Seguimiento técnico, financiero y administrativo de órdenes de servicio."
        onNuevo={tienePermiso('ORDEN_CREATE') ? () => navigate('/ordenes/nuevo') : null}
      />

      {errorEliminar && (
        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md text-xs font-medium text-red-600">
          <span>{errorEliminar}</span>
          <button 
            onClick={() => setErrorEliminar('')} 
            className="ml-2 font-bold hover:text-red-800 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {errorCancelar && (
          <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md text-xs font-medium text-red-600">
          <span>{errorCancelar}</span>
          <button 
            onClick={() => setErrorCancelar('')} 
            className="ml-2 font-bold hover:text-red-800 transition-colors"
          >
            X
          </button>
          </div>
        )}

      <div className="relative max-w-sm">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Buscar por folio, cliente o servicio..."
        />
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="whitespace-nowrap px-4 py-3 font-semibold"
                  >
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
                <TableRow
                  key={row.id}
                  className="transition-colors hover:bg-slate-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="whitespace-nowrap px-4 py-3 text-slate-600"
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
                  className="h-24 text-center text-slate-400"
                >
                  No se encontraron registros de órdenes de servicio.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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

      {/* Confirmación dinámica para cancelación */}
      <ConfirmDialog
        open={Boolean(ordenACancelar)}
        titulo="¿Cancelar Orden?"
        mensaje={`¿Cancelar la orden ${ordenACancelar?.folio}? Esta acción no se puede revertir.`}
        onConfirm={() => cancelarMutation.mutate(ordenACancelar?.id)}
        onCancel={() => setOrdenACancelar(null)}
      />

      {/* Confirmación dinámica para eliminación física */}
      <ConfirmDialog
        open={Boolean(ordenAEliminar)}
        titulo="¿Eliminar Orden?"
        mensaje={`¿Eliminar la orden ${ordenAEliminar?.folio}? Solo es posible si no tiene recibos registrados.`}
        onConfirm={() => eliminarMutation.mutate(ordenAEliminar?.id)}
        onCancel={() => setOrdenAEliminar(null)}
      />

    </div>
  );
};

export default OrdenesPage;