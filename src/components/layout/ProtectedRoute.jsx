import { useAuth } from '@/context/AuthContext'
import { usePermisos } from '@/hooks/usePermisos';
import React from 'react'
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({permiso, children}) => {
    const {token, loading } = useAuth();
    const { tienePermiso } = usePermisos();

    if (loading) {
        return <div className='p-4 text-center'>Cargando...</div>;
    }

    if (!token) {
        return <Navigate to="/login" replace />; 
    }

    if(permiso && !tienePermiso(permiso)) {
        return <Navigate to="/sin-acceso" replace />; 
    }
    return children;
};
