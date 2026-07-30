import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';

import * as usuarioApi from '@/api/usuarioApi';
import * as rolApi from '@/api/rolApi';

const baseSchema = {
  nombre: zod.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  idRol: zod.coerce.number().min(1, 'El rol es obligatorio')
};

const schemaCreacion = zod.object({
  ...baseSchema,
  contrasenia: zod.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

const schemaEdicion = zod.object(baseSchema);

const UsuarioFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const esEdicion = Boolean(id);
  const [errorServidor, setErrorServidor] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(esEdicion ? schemaEdicion : schemaCreacion),
    defaultValues: {
      nombre: '',
      idRol: '',
      contrasenia: ''
    }
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: rolApi.getAll
  });

  const { data: usuarioData, isLoading } = useQuery({
    queryKey: ['usuario', id],
    queryFn: () => usuarioApi.getById(id),
    enabled: esEdicion,
  });

  useEffect(() => {
    if (esEdicion && usuarioData) {
      reset({
        nombre: usuarioData.nombre,
        idRol: usuarioData.idRol
      });
    }
  }, [usuarioData, esEdicion, reset]);

  const mutation = useMutation({
    mutationFn: (data) => {
        if (esEdicion){
          return usuarioApi.update(id, {
            nombre: data.nombre,
            idRol: data.idRol,
            activo: usuarioData.activo
          });
        } else {
          return usuarioApi.create({
            nombre: data.nombre,
            contrasenia: data.contrasenia,
            idRol: data.idRol,
            activo: true
          });
        }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      navigate('/admin/usuarios');
    },
    onError: (err) => {
      const msg = err.response?.data?.mensaje || err.response?.data?.message || 'Error al guardar la información del usuario.';
      setErrorServidor(msg);
    }
  });

  if (esEdicion && isLoading) {
    return <div className="text-center p-10 text-slate-500 font-medium">Cargando datos del usuario...</div>;
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-6 border border-slate-200 rounded-md shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">
          {esEdicion ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {esEdicion ? 'Modifique los datos de acceso del usuario.' : 'Asigne credenciales y privilegios al nuevo usuario.'}
        </p>
      </div>

      <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Nombre de Usuario *</label>
          <input
            type="text"
            {...register('nombre')}
            className={`w-full text-xs px-3 py-2 border rounded-md outline-none ${
              errors.nombre
                ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border-slate-300 focus:ring-1 focus:ring-blue-500'
            }`}
          />
          {errors.nombre && <p className="text-[10px] text-red-500 mt-0.5">{errors.nombre.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Rol del Sistema *</label>
          <select
            {...register('idRol')}
            className={`w-full text-xs px-3 py-2 border bg-white rounded-md outline-none ${
              errors.idRol
                ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border-slate-300 focus:ring-1 focus:ring-blue-500'
            }`}
          >
            <option value="">Seleccione un rol...</option>
            {roles.filter(r => r.activo).map(r => (
              <option key={r.idRol} value={r.idRol}>{r.nombre}</option>
            ))}
          </select>
          {errors.idRol && <p className="text-[10px] text-red-500 mt-0.5">{errors.idRol.message}</p>}
        </div>

        {!esEdicion && (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Contraseña de Acceso *</label>
            <input
              type="password"
              {...register('contrasenia')}
              className={`w-full text-xs px-3 py-2 border rounded-md outline-none ${
                errors.contrasenia
                  ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-slate-300 focus:ring-1 focus:ring-blue-500'
              }`}
            />
            {errors.contrasenia && <p className="text-[10px] text-red-500 mt-0.5">{errors.contrasenia.message}</p>}
          </div>
        )}

        {errorServidor && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-center text-xs font-medium text-red-600">
            {errorServidor}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/admin/usuarios')}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {mutation.isPending
              ? (esEdicion ? 'Guardando...' : 'Creando...')
              : (esEdicion ? 'Actualizar' : 'Crear Usuario')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default UsuarioFormPage;