import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import * as authApi from '@/api/authApi';
import { useAuth } from '@/context/AuthContext';

// Esquema de validación estricto con Zod
const loginSchema = zod.object({
  nombre: zod.string().min(1, 'El nombre es requerido'),
  contrasenia: zod.string().min(1, 'La contraseña es requerida'),
});

const LoginPage = () => {
  const { token, login: authContextLogin } = useAuth();
  const navigate = useNavigate();
  
  const [errorServidor, setErrorServidor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirección si el usuario ya cuenta con un token activo
  useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { nombre: '', contrasenia: '' }
  });

  const onSubmit = async (data) => {
    setErrorServidor('');
    setIsSubmitting(true);

    try {
      const res = await authApi.login(data.nombre, data.contrasenia);
      
      // Desestructuración del payload del backend para guardarlo en el contexto
      authContextLogin(res.token, res.nombre, res.idUsuario, res.nombreRol, res.permisos);
      
      navigate('/', { replace: true });
    } catch (error) {
      // Manejo controlado del error sin disparar alerts invasivos
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        setErrorServidor('Credenciales incorrectas');
      } else {
        setErrorServidor('Error de conexión con el servidor. Intente más tarde.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md border border-slate-200 p-8">
        {/* Cabecera de la Tarjeta */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-950 tracking-tight">Sistema de Ventas</h2>
          <p className="text-sm text-slate-500 mt-1">Inicia sesión para continuar</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Usuario
            </label>
            <input
              type="text"
              {...register('nombre')}
              className={`w-full px-3 py-2 border rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.nombre ? 'border-destructive focus:ring-destructive' : 'border-slate-300'
              }`}
              placeholder="Introduce tu usuario"
              disabled={isSubmitting}
            />
            {errors.nombre && (
              <p className="text-xs text-red-500 font-medium mt-1">{errors.nombre.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              {...register('contrasenia')}
              className={`w-full px-3 py-2 border rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.contrasenia ? 'border-destructive focus:ring-destructive' : 'border-slate-300'
              }`}
              placeholder="••••••••"
              disabled={isSubmitting}
            />
            {errors.contrasenia && (
              <p className="text-xs text-red-500 font-medium mt-1">{errors.contrasenia.message}</p>
            )}
          </div>

          {/* Mensaje de Error del Servidor */}
          {errorServidor && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-center">
              <p className="text-sm text-red-600 font-medium">{errorServidor}</p>
            </div>
          )}

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;