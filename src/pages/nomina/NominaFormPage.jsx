import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';

import * as nominaApi from '@/api/nominaApi';
import * as trabajadorApi from '@/api/trabajadorApi';
import { useAuth } from '@/context/AuthContext';

const nominaSchema = zod.object({
  idTrabajador: zod.coerce.number().min(1, 'Trabajador requerido'),
  sueldo: zod.coerce.number().positive('El sueldo debe ser un monto mayor a 0'),
  periodicidad: zod.enum(['SEMANAL', 'QUINCENAL', 'MENSUAL'], { errorMap: () => ({ message: 'Seleccione la periodicidad' }) }),
  metodoPago: zod.enum(['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE'], { errorMap: () => ({ message: 'Seleccione método de pago' }) }),
  fechaPago: zod.string().min(1, 'Fecha de pago requerida'),
  periodoInicio: zod.string().min(1, 'Fecha de inicio del período requerida'),
  periodoFin: zod.string().min(1, 'Fecha de fin del período requerida'),
  estatusPago: zod.enum(['PENDIENTE', 'PAGADO', 'CANCELADO']).default('PENDIENTE'),
  observaciones: zod.string().max(500, 'Máximo 500 caracteres').optional().or(zod.literal(''))
}).refine(data => {
  return new Date(data.periodoFin) >= new Date(data.periodoInicio);
}, {
  message: "La fecha de fin debe ser igual o posterior al periodo de inicio",
  path: ["periodoFin"]
});

const NominaFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { usuario } = useAuth();
  const esEdicion = Boolean(id);
  const [errorServidor, setErrorServidor] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(nominaSchema),
    defaultValues: {
      idTrabajador: '', sueldo: '', periodicidad: 'SEMANAL',
      metodoPago: 'TRANSFERENCIA', fechaPago: new Date().toISOString().split('T')[0],
      periodoInicio: '', periodoFin: '', estatusPago: 'PENDIENTE', observaciones: ''
    }
  });

  const { data: trabajadores = [] } = useQuery({
    queryKey: ['trabajadores-activos'],
    queryFn: trabajadorApi.getActivos
  });

  const { data: nominaData, isLoading: isLoadingNomina } = useQuery({
    queryKey: ['nomina', id],
    queryFn: () => nominaApi.getById(id),
    enabled: esEdicion,
  });

  useEffect(() => {
    if (esEdicion && nominaData) {
      reset(nominaData);
    }
  }, [nominaData, esEdicion, reset]);

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, idUsuario: usuario.idUsuario };
      return esEdicion ? nominaApi.update(id, payload) : nominaApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nominas'] });
      navigate('/nomina');
    },
    onError: (err) => {
      setErrorServidor(err.response?.data?.mensaje || err.response?.data?.message || 'Error al guardar el recibo de nómina.');
    }
  });

  if (esEdicion && isLoadingNomina) return <div className="text-center p-10 text-slate-500 font-medium">Abriendo desglose de nómina...</div>;

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 border border-slate-200 rounded-md shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">{esEdicion ? 'Editar Registro de Nómina' : 'Generar Nueva Nómina'}</h2>
        <p className="text-xs text-slate-500 mt-1">Defina el cálculo de percepciones y períodos del empleado seleccionado.</p>
      </div>

      <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Trabajador Destinatario *</label>
            <select {...register('idTrabajador')} className={`w-full text-xs px-3 py-2 border bg-white rounded-md outline-none ${errors.idTrabajador ? 'border-red-500' : 'border-slate-300'}`}>
              <option value="">Seleccione colaborador activo...</option>
              {trabajadores.map(t => (
                <option key={t.idTrabajador} value={t.idTrabajador}>
                  {`${t.nombre} ${t.apellidoPaterno} ${t.apellidoMaterno || ''}`}
                </option>
              ))}
            </select>
            {errors.idTrabajador && <p className="text-[10px] text-red-500 mt-0.5">{errors.idTrabajador.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Sueldo Base ($ MXN) *</label>
            <input type="number" step="0.01" {...register('sueldo')} placeholder="0.00" className={`w-full text-xs px-3 py-2 border rounded-md outline-none ${errors.sueldo ? 'border-red-500' : 'border-slate-300'}`} />
            {errors.sueldo && <p className="text-[10px] text-red-500 mt-0.5">{errors.sueldo.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Periodicidad *</label>
            <select {...register('periodicidad')} className="w-full text-xs px-3 py-2 border bg-white border-slate-300 rounded-md outline-none">
              <option value="SEMANAL">SEMANAL</option>
              <option value="QUINCENAL">QUINCENAL</option>
              <option value="MENSUAL">MENSUAL</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Canal de Pago *</label>
            <select {...register('metodoPago')} className="w-full text-xs px-3 py-2 border bg-white border-slate-300 rounded-md outline-none">
              <option value="EFECTIVO">EFECTIVO</option>
              <option value="TRANSFERENCIA">TRANSFERENCIA</option>
              <option value="CHEQUE">CHEQUE</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Fecha programada de Pago *</label>
            <input type="date" {...register('fechaPago')} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md outline-none" />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
          <span className="block text-xs font-semibold text-slate-800 mb-3">Duración del Período Laborado</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Desde (Inicio) *</label>
              <input type="date" {...register('periodoInicio')} className={`w-full text-xs px-3 py-2 border bg-white rounded-md outline-none ${errors.periodoInicio ? 'border-red-500' : 'border-slate-300'}`} />
              {errors.periodoInicio && <p className="text-[10px] text-red-500 mt-0.5">{errors.periodoInicio.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Hasta (Cierre) *</label>
              <input type="date" {...register('periodoFin')} className={`w-full text-xs px-3 py-2 border bg-white rounded-md outline-none ${errors.periodoFin ? 'border-red-500' : 'border-slate-300'}`} />
              {errors.periodoFin && <p className="text-[10px] text-red-500 mt-0.5">{errors.periodoFin.message}</p>}
            </div>
          </div>
        </div>

        {esEdicion && (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Estatus del Recibo</label>
            <select {...register('estatusPago')} className="w-full text-xs px-3 py-2 border bg-white border-slate-300 rounded-md outline-none">
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="PAGADO">PAGADO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Observaciones / Incidencias</label>
          <textarea rows={3} {...register('observaciones')} placeholder="Bonos extras, horas extra, retenciones o deducciones específicas..." className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md outline-none resize-none" />
          {errors.observaciones && <p className="text-[10px] text-red-500 mt-0.5">{errors.observaciones.message}</p>}
        </div>

        {errorServidor && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-center text-xs font-medium text-red-600">{errorServidor}</div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={() => navigate('/nomina')} className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">Cancelar</button>
          <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50">
            {mutation.isPending ? 'Guardando...' : 'Compilar Nómina'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NominaFormPage;