import { useAuth } from "@/context/AuthContext";

export const usePermisos = () => {
  const { permisos } = useAuth();

  const tienePermiso = (permisoRequerido) => {
    if (!permisoRequerido) return true;
    return permisos.includes(permisoRequerido);
  };

  return { tienePermiso };
};