import { useMemo } from 'react';

const PermisosMatrix = ({ catalogoPermisos = [], permisosSeleccionados, onChange, disabled = false }) => {
  // Agrupar los permisos por la entidad a la que afectan
  const permisosAgrupados = useMemo(() => {
    return catalogoPermisos.reduce((acc, permiso) => {
      const { entidad } = permiso;
      if (!acc[entidad]) acc[entidad] = [];
      acc[entidad].push(permiso);
      return acc;
    }, {});
  }, [catalogoPermisos]);

  const handleToggle = (idPermiso) => {
    if (disabled) return;
    
    // El Set asegura O(1) de complejidad en validaciones y evita duplicados en un solo pase.
    const nuevoSet = new Set(permisosSeleccionados);
    if (nuevoSet.has(idPermiso)) {
      nuevoSet.delete(idPermiso);
    } else {
      nuevoSet.add(idPermiso);
    }
    onChange(nuevoSet);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(permisosAgrupados).map(([entidad, permisos]) => (
        <div key={entidad} className="border border-slate-200 rounded-md bg-white overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">{entidad}</h4>
          </div>
          <div className="p-3 space-y-2">
            {permisos.map((permiso) => (
              <label 
                key={permiso.idPermiso} 
                className={`flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-50'} p-1 -m-1 rounded transition-colors`}
              >
                <input
                  type="checkbox"
                  checked={permisosSeleccionados.has(permiso.idPermiso)}
                  onChange={() => handleToggle(permiso.idPermiso)}
                  disabled={disabled}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-slate-700 capitalize">
                  {permiso.accion.toLowerCase()}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PermisosMatrix;