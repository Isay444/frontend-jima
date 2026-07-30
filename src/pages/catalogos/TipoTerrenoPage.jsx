import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  useReactTable, 
  getCoreRowModel, 
  getPaginationRowModel,
  flexRender, 
  getFilteredRowModel
} from '@tanstack/react-table';
import { Edit2, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

import * as tipoTerrenoApi from '@/api/tipoTerrenoApi';
import { usePermisos } from '@/hooks/usePermisos';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

const TipoTerrenoPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { tienePermiso } = usePermisos();

    const [globalFilter, setGlobalFilter] = useState('');
    const [deleteId, setDeleteId] = useState(null);

    //Obtener datos
    const { data: tiposTerreno = [], isLoading, isError } = useQuery({
        queryKey: ['tiposTerreno'],
        queryFn: tipoTerrenoApi.getAll,
    });

    //Mutacion para eliminar
    const deleteMutation = useMutation({
        mutationFn: tipoTerrenoApi.remove,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tiposTerreno'] });
            setDeleteId(null);
        },
        onError: (error) => {
            alert('Error al eliminar el terreno');
            console.error('Error al eliminar el terreno:', error);
        }
    });

    //Filtrado local por nombre
    const dataFiltrada = useMemo(() => {
        if (!globalFilter) return tiposTerreno;
        const busqueda = globalFilter.toLowerCase();
        return tiposTerreno.filter(tiposTerreno => 
            tiposTerreno.nombre?.toLowerCase().includes(busqueda)
        );
    }, [tiposTerreno, globalFilter]);

    // Defincion de columnas para React Table
    const columns = useMemo(
        () => [
            {
                accessorKey: 'nombre',
                header: 'Nombre',
                cell: info => <span className='font-medium'>{info.getValue()}</span>,
            },            
            {
                id: 'acciones',
                header: 'Acciones',
                cell: ({ row }) => {
                    const id = row.original.idTipoTerreno;
                    return (
                        <div className='flex items-center gap-2'>
                            {tienePermiso('TIPOTERRENO_UPDATE') && (
                                <button 
                                    onClick={() => navigate(`/catalogos/tipos-terreno/editar/${id}`)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title='Editar'
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            )}
                            {tienePermiso('TIPOTERRENO_DELETE') && (
                                <button 
                                    onClick={() => setDeleteId(id)}
                                    className="text-red-600 hover:text-red-900 transition-colors"
                                    title='Eliminar'
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    );
                },
            },
        ], [tienePermiso, navigate]);

    const table = useReactTable({
        data: dataFiltrada,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        initialState: {
            pagination: { pageSize: 10 },
        },
    });
    
    if(isLoading){
        return(
            <div className='flex justify-center items-center min-h-[400px]'>
                <p className="text-slate-500">Cargando terrenos...</p>
            </div>
        );
    }

    if (isError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-600 text-center">Error al cargar las áreas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        titulo="Terreno"
        descripcion="Catalógo de los tipos de terrenos para los trabajos"
        onNuevo={tienePermiso('TIPOTERRENO_CREATE') ? () => navigate('/catalogos/tipos-terreno/nuevo') : null}
        botonTexto="Terrenos"
      />

      {/* Filtro de búsqueda */}
      <div className="relative max-w-sm">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
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

      {/* Tabla */}
      <div className="overflow-x-auto border border-slate-200 rounded-md bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
               </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-slate-50">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-slate-400">
                  No hay áreas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200 sm:px-6">
          <div className="flex justify-between flex-1 sm:hidden">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-4 py-2 text-sm font-medium border rounded-md disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-4 py-2 ml-3 text-sm font-medium border rounded-md disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                Página <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span> de{' '}
                <span className="font-medium">{table.getPageCount()}</span>
              </p>
            </div>
            <div>
              <nav className="inline-flex -space-x-px rounded-md shadow-sm">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        titulo="¿Eliminar el tipo de terreno?"
        mensaje="Esta acción eliminará el terreno permanentemente. ¿Estás seguro?"
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default TipoTerrenoPage;
