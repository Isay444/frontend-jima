import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  useReactTable, 
  getCoreRowModel, 
  getPaginationRowModel,
  flexRender, 
  getSortedRowModel
} from '@tanstack/react-table';
import { Edit2, Trash2, Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

import * as clienteApi from '../../api/clienteApi';
import { usePermisos } from '../../hooks/usePermisos';
import { PageHeader } from '../../components/shared/PageHeader';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';

const ClientesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tienePermiso } = usePermisos();

  // Estados locales para filtros y modal de confirmación
  const [globalFilter, setGlobalFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  // Consulta de datos de clientes con React Query
  const { data: clientes = [], isLoading, isError } = useQuery({
    queryKey: ['clientes'],
    queryFn: clienteApi.getAll,
  });

  // Mutación para eliminación atómica
  const deleteMutation = useMutation({
    mutationFn: clienteApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setDeleteId(null);
    },
    onError: () => {
      alert('Error al intentar eliminar el cliente.');
      setDeleteId(null);
    }
  });

  // Filtrado del lado del cliente por nombre completo en base a búsqueda reactiva
  const dataFiltrada = useMemo(() => {
    if (!globalFilter) return clientes;
    const busqueda = globalFilter.toLowerCase();
    return clientes.filter(cliente => {
      const nombreCompleto = `${cliente.nombreS || ''} ${cliente.apellidoPaterno || ''} ${cliente.apellidoMaterno || ''}`.toLowerCase();
      return nombreCompleto.includes(busqueda);
    });
  }, [clientes, globalFilter]);

  // Definición de las columnas de la tabla conforme a TanStack Table v8
  const columns = useMemo(() => [
    {
      accessorFn: row => `${row.nombreS || ''} ${row.apellidoPaterno || ''} ${row.apellidoMaterno || ''}`.trim(),
      id: 'nombreCompleto',
      header: 'Nombre Completo',
      cell: info => <span className="font-medium text-slate-900">{info.getValue()}</span>,
    },
    {
      accessorKey: 'telefono',
      header: 'Teléfono',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'nombreMunicipio',
      header: 'Municipio',
      cell: info => {
        const municipio = info.getValue();
        return municipio ? <span>{municipio}</span> : <span className="text-slate-400 block max-w-xs truncate">—</span>;
      },
    },
    {
      accessorKey: 'direccion',
      header: 'Dirección',
      cell: info => info.getValue() || '—',
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: info => {
        const tipo = info.getValue();
        const estanteEstilos = tipo === 'Notaria' 
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
          : 'bg-blue-50 text-blue-700 border-blue-200';
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${estanteEstilos}`}>
            {tipo}
          </span>
        );
      }
    },
    {
      accessorKey: 'referenciado',
      header: 'Referenciado',
    },
    {
      id: 'acciones',
      header: 'Acciones',
      enableSorting: false,
      cell: ({ row }) => {
        const id = row.original.idClientes;
        return (
          <div className="flex items-center gap-2">
            {tienePermiso('CLIENTE_UPDATE') && (
              <button
                onClick={() => navigate(`/clientes/editar/${id}`)}
                className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors"
                title="Editar Cliente"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {tienePermiso('CLIENTE_DELETE') && (
              <button
                onClick={() => setDeleteId(id)}
                className="p-1 text-slate-500 hover:text-red-600 rounded transition-colors"
                title="Eliminar Cliente"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {!tienePermiso('CLIENTE_UPDATE') && !tienePermiso('CLIENTE_DELETE') && <span>—</span>}
          </div>
        );
      }
    }
  ], [tienePermiso, navigate]);

  // Configuración del objeto principal de TanStack Table
  const table = useReactTable({
    data: dataFiltrada,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 20 }
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500 font-medium">Cargando clientes...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md my-4">
        <p className="text-sm text-red-600 font-medium text-center">Error al cargar clientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader 
        titulo="Clientes" 
        descripcion="Administración del catálogo general de clientes y contratantes de topografía."
        onNuevo={tienePermiso('CLIENTE_CREATE') ? () => navigate('/clientes/nuevo') : null}
      />

      {/* Control superior de filtrado */}
      <div className="relative max-w-sm">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Buscar por nombre..."
        />
      </div>

      {/* Contenedor de la Tabla */}
      <div className="overflow-x-auto border border-slate-200 rounded-md bg-white">
        <table className="w-full min-w-[800px] text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  const canSort = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();

                  return (
                    <th 
                      key={header.id} 
                      className={`px-6 py-3 font-semibold ${canSort ? 'cursor-pointer select-none hover:bg-slate-100' : ''}`}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      >
                      <div className='flex items-center gap-1'>
                        {flexRender(header.column.columnDef.header, header.getContext())}

                        {/* Indicadores visuales de ordenamiento */}
                        {isSorted === 'asc' && <ArrowUp className='w-3 h-3 text-blue-600'/>}
                        {isSorted === 'desc' && <ArrowDown className='w-3 h-3 text-blue-600'/>}
                        {canSort && !isSorted && <ArrowUpDown className='w-3 h-3 text-slate-400'/>}
                      </div>
                    </th>
                  );
                })}
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
                  No se encontraron registros de clientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Controles de Paginación */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 mt-4">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                Mostrando página <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span> de{' '}
                <span className="font-medium">{table.getPageCount()}</span>
              </p>
            </div>
            <div>
              <nav className="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="relative inline-flex items-center rounded-l-md border border-slate-300 bg-white p-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="relative inline-flex items-center rounded-r-md border border-slate-300 bg-white p-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo genérico de Confirmación */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        titulo="¿Estás completamente seguro?"
        mensaje="Esta acción eliminará el registro del cliente permanentemente del sistema de ventas y no se puede deshacer."
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default ClientesPage;