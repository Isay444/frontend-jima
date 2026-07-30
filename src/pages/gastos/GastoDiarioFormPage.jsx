import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';

import * as gastoDiarioApi from '@/api/gastoDiarioApi';
import { useAuth } from '@/context/AuthContext';

const gastoSchema = zod.object({
  fecha: zod.string().min(1, 'La fecha es requerida'),
  descripcion: zod.string().min(1, 'Ingresa una descripción del gasto'),
  esMateriaPrima: zod.boolean().default(false),
  tipoMateriaPrima: zod.string().optional().or(zod.literal('')),
  metodoPago: zod.enum(['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'], { errorMap: () => ({ message: 'Método de pago inválido' }) }),
  monto: zod.coerce.number().positive('El monto debe ser un número mayor a 0'),
  tieneRecibo: zod.boolean().default(false),
  categoria: zod.enum(['GENERAL', 'FIJO', 'VARIABLE'], { errorMap: () => ({ message: 'Categoría requerida' }) })
});

const GastoDiarioFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { usuario } = useAuth();
  const esEdicion = Boolean(id);
  const [errorServidor, setErrorServidor] = useState('');

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(gastoSchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      descripcion: '', esMateriaPrima: false, tipoMateriaPrima: '',
      metodoPago: 'EFECTIVO', monto: '', tieneRecibo: false, categoria: 'GENERAL'
    }
  });

  // Escucha cambios en el checkbox para controlar la UI de forma condicional
  const esMateriaPrimaWatch = watch('esMateriaPrima');

  // Limpiar el campo dependiente si esMateriaPrima cambia a falso
  useEffect(() => {
    if (!esMateriaPrimaWatch) {
      setValue('tipoMateriaPrima', '');
    }
  }, [esMateriaPrimaWatch, setValue]);

  const { data: gastoData, isLoading } = useQuery({
    queryKey: ['gasto-diario', id],
    queryFn: () => gastoDiarioApi.getById(id),
    enabled: esEdicion,
  });

  useEffect(() => {
    if (esEdicion && gastoData) {
      reset(gastoData);
    }
  }, [gastoData, esEdicion, reset]);

  const mutation = useMutation({
    mutationFn: (data) => {
      // Forzar inserción silenciosa del idUsuario del sistema con fines de auditoría
      const payload = { ...data, idUsuario: usuario.idUsuario };
      // if (!usuario?.idUsuario) setErrorServidor('No se pudo identificar al usuario');
      return esEdicion ? gastoDiarioApi.update(id, payload) : gastoDiarioApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos-diarios'] });
      navigate('/gastos-diarios');
    },
    onError: (err) => {
      setErrorServidor(err.response?.data?.mensaje || err.response?.data?.message || 'Error al persistir el registro del gasto diario.');
    }
  });

  if (esEdicion && isLoading) return <div className="text-center p-10 text-slate-500 font-medium">Leyendo póliza de egreso...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 border border-slate-200 rounded-md shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">{esEdicion ? 'Modificar Registro de Gasto' : 'Asignar Gasto Diario'}</h2>
        <p className="text-xs text-slate-500 mt-1">Capture la información detallada para contabilidad de costos internos.</p>
      </div>

      <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Fecha Operación *</label>
            <input type="date" {...register('fecha')} className={`w-full text-xs px-3 py-2 border rounded-md outline-none ${errors.fecha ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-300 focus:ring-1 focus:ring-blue-500'}`} />
            {errors.fecha && <p className="text-[10px] text-red-500 mt-0.5">{errors.fecha.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Monto Económico ($ MXN) *</label>
            <input type="number" step="0.01" {...register('monto')} placeholder="0.00" className={`w-full text-xs px-3 py-2 border rounded-md outline-none ${errors.monto ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-300 focus:ring-1 focus:ring-blue-500'}`} />
            {errors.monto && <p className="text-[10px] text-red-500 mt-0.5">{errors.monto.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Descripción del Gasto *</label>
          <input type="text" {...register('descripcion')} placeholder="Concepto, proveedor o servicio adquirido" className={`w-full text-xs px-3 py-2 border rounded-md outline-none ${errors.descripcion ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-300 focus:ring-1 focus:ring-blue-500'}`} />
          {errors.descripcion && <p className="text-[10px] text-red-500 mt-0.5">{errors.descripcion.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Método de Pago *</label>
            <select {...register('metodoPago')} className="w-full text-xs px-3 py-2 border bg-white border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none">
              <option value="EFECTIVO">EFECTIVO</option>
              <option value="TRANSFERENCIA">TRANSFERENCIA</option>
              <option value="TARJETA">TARJETA</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Categoría del Gasto *</label>
            <select {...register('categoria')} className="w-full text-xs px-3 py-2 border bg-white border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none">
              <option value="GENERAL">GENERAL</option>
              <option value="FIJO">FIJO</option>
              <option value="VARIABLE">VARIABLE</option>
            </select>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-3">
          <div className="flex items-center">
            <input id="esMateriaPrima" type="checkbox" {...register('esMateriaPrima')} className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer" />
            <label htmlFor="esMateriaPrima" className="ml-2 text-xs font-medium text-slate-700 cursor-pointer select-none">¿El egreso corresponde a Materia Prima de Producción?</label>
          </div>

          {/* Renderizado Condicional dinámico basado en watch() */}
          {esMateriaPrimaWatch && (
            <div className="pt-2 border-t border-slate-200 animate-in fade-in duration-200">
              <label className="block text-xs font-medium text-slate-700 mb-1">Especificación o Tipo de Materia Prima *</label>
              <input type="text" {...register('tipoMateriaPrima')} placeholder="Ej. Grava, Cemento, Acero, Madera..." className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
          )}
        </div>

        <div className="flex items-center pl-1 py-1">
          <input id="tieneRecibo" type="checkbox" {...register('tieneRecibo')} className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer" />
          <label htmlFor="tieneRecibo" className="ml-2 text-xs font-medium text-slate-700 cursor-pointer select-none">¿Cuenta con comprobante / recibo adjunto?</label>
        </div>

        {errorServidor && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-center text-xs font-medium text-red-600">{errorServidor}</div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={() => navigate('/gastos-diarios')} className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">Cancelar</button>
          <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50">
            {mutation.isPending ? 'Procesando...' : 'Guardar Póliza'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GastoDiarioFormPage;