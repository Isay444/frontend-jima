import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    usuario: null,
    token: null,
    permisos: [],
    loading: true,
  });

  useEffect(() => {
    // Restaurar sesión e hidratar permisos al montar la app
    const token = localStorage.getItem('token');
    const usuarioRaw = localStorage.getItem('usuario');
    const permisosRaw = localStorage.getItem('permisos');

    if (token && usuarioRaw && permisosRaw) {
      try {
        setAuthState({
          usuario: JSON.parse(usuarioRaw),
          token,
          permisos: JSON.parse(permisosRaw),
          loading: false,
        });
      } catch (e) {
        logout();
      }
    } else {
      setAuthState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // Recibe los datos destructurados directamente del payload del backend
  const login = (token, nombre, idUsuario, nombreRol, permisos) => {
    const infoUsuario = { nombre, idUsuario, nombreRol };

    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(infoUsuario));
    localStorage.setItem('permisos', JSON.stringify(permisos));

    setAuthState({
      usuario: infoUsuario,
      token,
      permisos: permisos || [],
      loading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('permisos');
    setAuthState({
      usuario: null,
      token: null,
      permisos: [],
      loading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {!authState.loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  return context;
};