import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';

import * as puestoApi from '@/api/puestoApi';

const puestoSchema = zod.object({
  nombre: zod.string().min(1, 'El nombre es requerido'),
  descripcion: zod.string().optional().or(zod.literal('')),
  activo: zod.boolean().default(true),
});

const PuestoFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const esEdicion = Boolean(id);
  const [errorServidor, setErrorServidor] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(puestoSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      activo: true,
    },
  });

  // Cargar datos si es edición
  const { data: puestoData, isLoading } = useQuery({
    queryKey: ['puesto', id],
    queryFn: () => puestoApi.getById(id),
    enabled: esEdicion,
  });

  useEffect(() => {
    if (esEdicion && puestoData) {
      const { idPuesto, ...rest } = puestoData;
      reset(rest);
    }
  }, [puestoData, esEdicion, reset]);

  const mutation = useMutation({
    mutationFn: (data) => esEdicion ? puestoApi.update(id, data) : puestoApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['puestos'] });
      navigate('/catalogos/puestos');
    },
    onError: (error) => {
      setErrorServidor(error.response?.data?.message || 'Error al guardar el puesto');
    },
  });

  const onSubmit = (data) => {
    setErrorServidor('');
    mutation.mutate(data);
  };

  if (esEdicion && isLoading) {
    return <div className="text-center p-10">Cargando datos...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          {esEdicion ? 'Editar Puesto' : 'Nuevo Puesto'}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Complete los campos para {esEdicion ? 'actualizar' : 'crear'} el puesto.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white p-6 border border-slate-200 rounded-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              {...register('nombre')}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase ${
                errors.nombre ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.nombre && (
              <p className="text-xs text-red-500 mt-1">{errors.nombre.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descripción
            </label>
            <textarea
              {...register('descripcion')}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('activo')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded "
            />
            <label className="ml-2 block text-sm text-slate-700">
              Activo
            </label>
          </div>
        </div>

        {errorServidor && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-center">
            <p className="text-sm text-red-600">{errorServidor}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar Puesto'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PuestoFormPage;