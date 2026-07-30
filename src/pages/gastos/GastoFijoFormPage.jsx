import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';

import * as gastoFijoApi from '@/api/gastoFijoApi';
import { formatCurrency } from '@/utils/formatters';
import { useAuth } from '@/context/AuthContext';

// Se crea un union para permitir que sea null/vacío o un número válido mayor a 0
const montoRealSchema = zod.union([
  zod.string().length(0).transform(() => null),
  zod.coerce.number().positive('El monto real debe ser mayor a 0 si se proporciona')
]).optional();

const gastoFijoSchema = zod.object({
  descripcion: zod.string().min(1, 'La descripción es requerida'),
  categoria: zod.enum(['GASTOS_VTA', 'GASTOS_ADM', 'AMBOS', 'COSTO'], { errorMap: () => ({ message: 'Categoría requerida' }) }),
  montoEstimado: zod.coerce.number().positive('El monto estimado debe ser mayor a 0'),
  montoReal: montoRealSchema,
  provision: zod.coerce.number().positive('La provisión debe ser mayor a 0'),
  estatus: zod.enum(['LISTO_PARA_PAGAR', 'PENDIENTE', 'PAGADO']).default('PENDIENTE'),
  mes: zod.coerce.number().min(1, 'Mes inválido').max(12, 'Mes inválido'),
  anio: zod.coerce.number().min(2020, 'Año inválido').max(2030, 'Año inválido')
});

const GastoFijoFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { usuario } = useAuth();
  const esEdicion = Boolean(id);
  const [errorServidor, setErrorServidor] = useState('');

  const fechaActual = new Date();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(gastoFijoSchema),
    defaultValues: {
      descripcion: '', categoria: 'GASTOS_ADM',
      montoEstimado: '', montoReal: '', provision: '',
      estatus: 'PENDIENTE', mes: fechaActual.getMonth() + 1, anio: fechaActual.getFullYear()
    }
  });

  const { data: descripcionesSugeridas = [] } = useQuery({
    queryKey: ['gastos-fijos-descripciones'],
    queryFn: gastoFijoApi.getDescripciones,
  });

  const { data: gastoData, isLoading } = useQuery({
    queryKey: ['gasto-fijo', id],
    queryFn: () => gastoFijoApi.getById(id),
    enabled: esEdicion,
  });

  useEffect(() => {
    if (esEdicion && gastoData) {
      reset({
        ...gastoData,
        // Convertir null a string vacío para el input para evitar warnings controlados
        montoReal: gastoData.montoReal !== null ? gastoData.montoReal : ''
      });
    }
  }, [gastoData, esEdicion, reset]);

  const mutation = useMutation({
    mutationFn: (data) => {
      // Excluir cualquier rastro de los campos calculados y forzar la inyección del idUsuario local
      const { ahorro, excedente, resto, ...payloadLimpio } = data;
      const payload = { ...payloadLimpio, idUsuario: usuario.idUsuario };
      return esEdicion ? gastoFijoApi.update(id, payload) : gastoFijoApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos-fijos'] });
      navigate('/gastos-fijos');
    },
    onError: (err) => {
      setErrorServidor(err.response?.data?.mensaje || err.response?.data?.message || 'Error al persistir el gasto fijo.');
    }
  });

  if (esEdicion && isLoading) return <div className="text-center p-10 text-slate-500 font-medium">Cargando presupuesto asignado...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">{esEdicion ? 'Editar Gasto Fijo' : 'Nuevo Gasto Fijo'}</h2>
        <p className="text-xs text-slate-500 mt-1">Defina el presupuesto y las provisiones recurrentes.</p>
      </div>

      <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-6">
        
        {/* SECCIÓN 1: Descripción y Categoría */}
        <div className="bg-white p-5 border border-slate-200 rounded-md space-y-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">1. Descripción y Categoría</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Descripción del Gasto *</label>
              <input 
                type="text" 
                list="descripcionesList"
                {...register('descripcion')} 
                placeholder="Ej. Renta, Luz, Internet..."
                className={`w-full text-xs px-3 py-2 border rounded-md outline-none ${errors.descripcion ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-300 focus:ring-1 focus:ring-blue-500'}`} 
              />
              <datalist id="descripcionesList">
                {descripcionesSugeridas.map((desc, i) => <option key={i} value={desc} />)}
              </datalist>
              {errors.descripcion && <p className="text-[10px] text-red-500 mt-0.5">{errors.descripcion.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Categoría Operativa *</label>
              <select {...register('categoria')} className="w-full text-xs px-3 py-2 border bg-white border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none">
                <option value="GASTOS_ADM">Gastos Administrativos</option>
                <option value="GASTOS_VTA">Gastos de Venta</option>
                <option value="AMBOS">Ambos (Compartido)</option>
                <option value="COSTO">Costo Directo</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Montos */}
        <div className="bg-white p-5 border border-slate-200 rounded-md space-y-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">2. Desglose Financiero</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Monto Estimado *</label>
              <input type="number" step="0.01" {...register('montoEstimado')} placeholder="0.00" className={`w-full text-xs px-3 py-2 border rounded-md outline-none ${errors.montoEstimado ? 'border-red-500' : 'border-slate-300'}`} />
              {errors.montoEstimado && <p className="text-[10px] text-red-500 mt-0.5">{errors.montoEstimado.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Monto Real Generado</label>
              <input type="number" step="0.01" {...register('montoReal')} placeholder="Opcional" className={`w-full text-xs px-3 py-2 border rounded-md outline-none ${errors.montoReal ? 'border-red-500' : 'border-slate-300'}`} />
              {errors.montoReal && <p className="text-[10px] text-red-500 mt-0.5">{errors.montoReal.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Provisión Asignada *</label>
              <input type="number" step="0.01" {...register('provision')} placeholder="0.00" className={`w-full text-xs px-3 py-2 border rounded-md outline-none ${errors.provision ? 'border-red-500' : 'border-slate-300'}`} />
              {errors.provision && <p className="text-[10px] text-red-500 mt-0.5">{errors.provision.message}</p>}
            </div>
          </div>
        </div>

        {/* SECCIÓN 3 y 4: Período y Estatus */}
        <div className="bg-white p-5 border border-slate-200 rounded-md space-y-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">3. Control Operativo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Mes de Aplicación *</label>
              <input type="number" min="1" max="12" {...register('mes')} className={`w-full text-xs px-3 py-2 border rounded-md outline-none ${errors.mes ? 'border-red-500' : 'border-slate-300'}`} />
              {errors.mes && <p className="text-[10px] text-red-500 mt-0.5">{errors.mes.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Año de Ejercicio *</label>
              <input type="number" min="2020" max="2030" {...register('anio')} className={`w-full text-xs px-3 py-2 border rounded-md outline-none ${errors.anio ? 'border-red-500' : 'border-slate-300'}`} />
              {errors.anio && <p className="text-[10px] text-red-500 mt-0.5">{errors.anio.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Estatus Actual</label>
              <select {...register('estatus')} className="w-full text-xs px-3 py-2 border bg-white border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none">
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="LISTO_PARA_PAGAR">LISTO PARA PAGAR</option>
                <option value="PAGADO">PAGADO</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECCIÓN 5: Valores Calculados (Solo Lectura en Edición) */}
        {esEdicion && gastoData && (
          <div className="bg-slate-50 p-5 border border-slate-200 rounded-md">
            <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-3">Auditoría: Valores Calculados</h3>
            <p className="text-[10px] text-slate-500 mb-4">Calculados automáticamente por el sistema al sincronizar.</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-3 border border-slate-200 rounded shadow-sm">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Ahorro</span>
                <span className={`block text-lg font-bold mt-1 ${gastoData.ahorro > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                  {formatCurrency(gastoData.ahorro || 0)}
                </span>
              </div>
              <div className="bg-white p-3 border border-slate-200 rounded shadow-sm">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Excedente</span>
                <span className={`block text-lg font-bold mt-1 ${gastoData.excedente > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                  {formatCurrency(gastoData.excedente || 0)}
                </span>
              </div>
              <div className="bg-white p-3 border border-slate-200 rounded shadow-sm">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Resto Pendiente</span>
                <span className="block text-lg font-bold mt-1 text-slate-700">
                  {formatCurrency(gastoData.resto || 0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {errorServidor && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-center">
            <p className="text-xs text-red-600 font-medium">{errorServidor}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/gastos-fijos')}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Regresar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? 'Almacenando...' : 'Guardar Presupuesto'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GastoFijoFormPage;