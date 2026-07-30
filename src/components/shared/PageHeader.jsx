import { Plus } from 'lucide-react';

export const PageHeader = ({ titulo, descripcion, onNuevo }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5 mb-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{titulo}</h2>
        {descripcion && (
          <p className="mt-1 text-sm text-slate-500">{descripcion}</p>
        )}
      </div>
      {onNuevo && (
        <button
          type="button"
          onClick={onNuevo}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Agregar {titulo.slice(0, -1)}
        </button>
      )}
    </div>
  );
};