import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Asegúrate de que las rutas a los APIs coincidan con tu estructura
import * as ordenApi from '../../api/ordenApi';
import * as clienteApi from '../../api/clienteApi';
import * as servicioApi from '../../api/servicioApi';
import * as subtipoTerrenoApi from '../../api/subtipoTerrenoApi';
import * as municipioApi from '../../api/municipioApi';
import * as zonaEjidalApi from '../../api/zonaEjidalApi';
import * as ingenieroApi from '../../api/ingenieroApi';

import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/shared/PageHeader';

// ── SCHEMA ÚNICO ──
const ordenSchema = z.object({
  idCliente: z.number({ required_error: 'El cliente es obligatorio' }),
  idServicio: z.number({ required_error: 'El servicio es obligatorio' }),
  idSubtipoTerreno: z.number({ required_error: 'El terreno es obligatorio' }),
  idMunicipio: z.number({ required_error: 'El municipio es obligatorio' }),
  idZonaEjidal: z.number({ required_error: 'La localidad es obligatoria' }),
  idIngeniero: z.number({ required_error: 'El ingeniero es obligatorio' }),
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  observaciones: z.string().optional(),
  montoTotal: z.number({ required_error: 'El monto total es obligatorio' }).positive('Debe ser mayor a 0'),
  solicitaFactura: z.boolean(),
  requierePlano: z.boolean(),
  estadoPlano: z.string().optional(),
  tieneComision: z.boolean(),
  comisionista: z.string().optional(),
  porcentajeComision: z.number().optional(),
  calcFechaLevantamientoAuto: z.boolean(),
  calcFechaEntregaAuto: z.boolean(),
  diasEntregaPlano: z.number({ required_error: 'Los días de entrega son obligatorios' }).int().min(1),
  fechaLevantamiento: z.string().optional(),
  fechaEntregaPlano: z.string().optional(),
});

const OrdenFormPage = () => {
  const { id } = useParams();
  const esEdicion = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { usuario } = useAuth();
  
  const [errorServidor, setErrorServidor] = useState('');

  // ── QUERIES ──
  const { data: ordenData, isLoading: isLoadingOrden } = useQuery({
    queryKey: ['orden', id],
    queryFn: () => ordenApi.getById(id),
    enabled: esEdicion,
  });

  const { data: folioPreview } = useQuery({
    queryKey: ['folio-preview'],
    queryFn: ordenApi.getFolioPreview,
    enabled: !esEdicion,
  });

  const { data: ordenesData = [] } = useQuery({
    queryKey: ['ordenes'],
    queryFn: ordenApi.getAll,
  });

  const { data: clientes = [], isLoading: loadC } = useQuery({ queryKey: ['clientes'], queryFn: clienteApi.getAll });
  const { data: servicios = [], isLoading: loadS } = useQuery({ queryKey: ['servicios'], queryFn: servicioApi.getAll });
  const { data: subtiposTerreno = [], isLoading: loadT } = useQuery({ queryKey: ['subtipos-terreno'], queryFn: subtipoTerrenoApi.getAll });
  const { data: municipios = [], isLoading: loadM } = useQuery({ queryKey: ['municipios'], queryFn: municipioApi.getAll });
  const { data: zonasEjidales = [], isLoading: loadZ } = useQuery({ queryKey: ['zonas-ejidales'], queryFn: zonaEjidalApi.getAll });
  const { data: ingenieros = [], isLoading: loadI } = useQuery({ queryKey: ['ingenieros'], queryFn: ingenieroApi.getAll });

  // ── DERIVAR COMISIONISTAS ──
  const comisionistas = useMemo(() => {
    return [...new Set(ordenesData?.filter(o => o.comisionista).map(o => o.comisionista))] ?? [];
  }, [ordenesData]);

  // ── FORMULARIO ──
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(ordenSchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      solicitaFactura: false,
      requierePlano: true,
      tieneComision: false,
      calcFechaLevantamientoAuto: true,
      calcFechaEntregaAuto: true,
      diasEntregaPlano: 15,
      estadoPlano: 'PENDIENTE',
    }
  });

  // ── POPULATE EDICIÓN ──
  useEffect(() => {
    if (esEdicion && ordenData) {
      reset({
        idCliente: ordenData.cliente?.id,
        idServicio: ordenData.servicio?.id,
        idSubtipoTerreno: ordenData.subtipoTerreno?.id,
        idMunicipio: ordenData.municipio?.id,
        idZonaEjidal: ordenData.zonaEjidal?.id,
        idIngeniero: ordenData.ingeniero?.id,
        fecha: ordenData.fecha,
        observaciones: ordenData.observaciones ?? '',
        montoTotal: Number(ordenData.montoTotal),
        solicitaFactura: ordenData.solicitaFactura,
        requierePlano: ordenData.requierePlano,
        estadoPlano: ordenData.estadoPlano || 'PENDIENTE',
        tieneComision: ordenData.tieneComision,
        comisionista: ordenData.comisionista ?? '',
        porcentajeComision: ordenData.porcentajeComision ? Number(ordenData.porcentajeComision) : undefined,
        calcFechaLevantamientoAuto: ordenData.calcFechaLevantamientoAuto,
        calcFechaEntregaAuto: ordenData.calcFechaEntregaAuto,
        diasEntregaPlano: ordenData.diasEntregaPlano || 15,
        fechaLevantamiento: ordenData.fechaLevantamiento ?? '',
        fechaEntregaPlano: ordenData.fechaEntregaPlano ?? '',
      });
    }
  }, [esEdicion, ordenData, reset]);

  // ── WATCHERS & CÁLCULOS ──
  const tieneComision = watch('tieneComision');
  const requierePlano = watch('requierePlano');
  const calcFechaLevantamientoAuto = watch('calcFechaLevantamientoAuto');
  const calcFechaEntregaAuto = watch('calcFechaEntregaAuto');
  const montoTotal = watch('montoTotal');
  const porcentajeComision = watch('porcentajeComision');

  const montoComisionCalculado = useMemo(() => {
    if (tieneComision && montoTotal && porcentajeComision) {
      return ((Number(montoTotal) * Number(porcentajeComision)) / 100).toFixed(2);
    }
    return '0.00';
  }, [tieneComision, montoTotal, porcentajeComision]);

  // ── MUTATION Y SUBMIT ──
  const mutation = useMutation({
    mutationFn: (payload) => esEdicion ? ordenApi.update(id, payload) : ordenApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      navigate('/ordenes');
    },
    onError: (err) => {
      setErrorServidor(err.response?.data?.mensaje || 'Error al procesar la orden.');
    }
  });

  const onSubmit = (data) => {
    setErrorServidor('');
    const payload = { ...data, idUsuario: usuario?.idUsuario };

    // Limpieza según negocio
    if (!payload.tieneComision) {
      payload.comisionista = null;
      payload.porcentajeComision = null;
    }
    if (payload.calcFechaLevantamientoAuto) payload.fechaLevantamiento = null;
    if (payload.calcFechaEntregaAuto) payload.fechaEntregaPlano = null;
    if (!payload.requierePlano) payload.estadoPlano = null;

    // Convertir strings vacíos a null para el backend
    Object.keys(payload).forEach(key => {
      if (payload[key] === '') payload[key] = null;
    });

    mutation.mutate(payload);
  };

  if (esEdicion && isLoadingOrden) return <div className="p-10 text-center text-slate-500 text-sm">Cargando información de la orden...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <PageHeader 
        titulo={esEdicion ? 'Editar Orden' : 'Nueva Orden'} 
        descripcion={!esEdicion && folioPreview ? `Folio asignado: ${folioPreview} (Temporal)` : ''}
      />

      {errorServidor && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm font-medium">
          {errorServidor}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* ── DATOS GENERALES ── */}
        <section className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2">Datos Generales</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fecha de Ingreso *</label>
              <input type="date" {...register('fecha')} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500" />
              {errors.fecha && <p className="text-[10px] text-red-500 mt-0.5">{errors.fecha.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Cliente *</label>
              <select {...register('idCliente', { valueAsNumber: true })} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500">
                <option value="">Seleccionar...</option>
                {loadC && <option disabled>Cargando...</option>}
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombreCompletoCliente}</option>)}
              </select>
              {errors.idCliente && <p className="text-[10px] text-red-500 mt-0.5">{errors.idCliente.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Servicio *</label>
              <select {...register('idServicio', { valueAsNumber: true })} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500">
                <option value="">Seleccionar...</option>
                {loadS && <option disabled>Cargando...</option>}
                {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              {errors.idServicio && <p className="text-[10px] text-red-500 mt-0.5">{errors.idServicio.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ingeniero *</label>
              <select {...register('idIngeniero', { valueAsNumber: true })} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500">
                <option value="">Seleccionar...</option>
                {loadI && <option disabled>Cargando...</option>}
                {ingenieros.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
              </select>
              {errors.idIngeniero && <p className="text-[10px] text-red-500 mt-0.5">{errors.idIngeniero.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Observaciones</label>
              <textarea {...register('observaciones')} rows={1} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500" placeholder="Detalles adicionales..." />
            </div>
          </div>
        </section>

        {/* ── UBICACIÓN Y TERRENO ── */}
        <section className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2">Ubicación y Terreno</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Municipio *</label>
              <select {...register('idMunicipio', { valueAsNumber: true })} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500">
                <option value="">Seleccionar...</option>
                {loadM && <option disabled>Cargando...</option>}
                {municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
              {errors.idMunicipio && <p className="text-[10px] text-red-500 mt-0.5">{errors.idMunicipio.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Zona Ejidal / Localidad *</label>
              <select {...register('idZonaEjidal', { valueAsNumber: true })} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500">
                <option value="">Seleccionar...</option>
                {loadZ && <option disabled>Cargando...</option>}
                {zonasEjidales.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
              </select>
              {errors.idZonaEjidal && <p className="text-[10px] text-red-500 mt-0.5">{errors.idZonaEjidal.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Subtipo de Terreno *</label>
              <select {...register('idSubtipoTerreno', { valueAsNumber: true })} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500">
                <option value="">Seleccionar...</option>
                {loadT && <option disabled>Cargando...</option>}
                {subtiposTerreno.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
              {errors.idSubtipoTerreno && <p className="text-[10px] text-red-500 mt-0.5">{errors.idSubtipoTerreno.message}</p>}
            </div>
          </div>
        </section>

        {/* ── ECONÓMICO ── */}
        <section className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2">Económico</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Monto Total ($) *</label>
              <input type="number" step="0.01" {...register('montoTotal', { valueAsNumber: true })} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500" />
              {errors.montoTotal && <p className="text-[10px] text-red-500 mt-0.5">{errors.montoTotal.message}</p>}
            </div>
            
            <div className="flex flex-col gap-2 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('solicitaFactura')} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                <span className="text-xs font-medium text-slate-700">Solicita Factura</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('tieneComision')} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                <span className="text-xs font-medium text-slate-700">Tiene Comisión</span>
              </label>
            </div>

            {tieneComision && (
              <>
                <datalist id="comisionistas-list">
                  {comisionistas.map((c, i) => <option key={i} value={c} />)}
                </datalist>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Comisionista</label>
                  <input type="text" list="comisionistas-list" {...register('comisionista')} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500" placeholder="Nombre..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Porcentaje (%)</label>
                  <input type="number" step="0.01" {...register('porcentajeComision', { valueAsNumber: true })} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500" />
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">Monto de comisión estimado: ${montoComisionCalculado}</p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── PLANO Y FECHAS ── */}
        <section className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2">Plano y Fechas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            <div className="flex flex-col gap-2 pt-1 lg:col-span-4 border-b border-slate-100 pb-3 mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('requierePlano')} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                <span className="text-xs font-medium text-slate-700">Requiere Plano</span>
              </label>
            </div>

            {requierePlano && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Estado Plano</label>
                <select {...register('estadoPlano')} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500">
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="ENTREGADO">ENTREGADO</option>
                  <option value="INDEFINIDO">INDEFINIDO</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Días Entrega Plano *</label>
              <input type="number" {...register('diasEntregaPlano', { valueAsNumber: true })} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500" min={1} />
              {errors.diasEntregaPlano && <p className="text-[10px] text-red-500 mt-0.5">{errors.diasEntregaPlano.message}</p>}
            </div>

            <div className="space-y-2 lg:col-start-1 lg:col-span-2 p-3 bg-slate-50 border border-slate-100 rounded-md">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('calcFechaLevantamientoAuto')} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                <span className="text-xs font-medium text-slate-700">Calcular fecha levantamiento automáticamente</span>
              </label>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-1 uppercase">Fecha Levantamiento Manual</label>
                <input type="date" {...register('fechaLevantamiento')} disabled={calcFechaLevantamientoAuto} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md disabled:bg-slate-100 disabled:text-slate-400 focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>

            <div className="space-y-2 lg:col-span-2 p-3 bg-slate-50 border border-slate-100 rounded-md">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('calcFechaEntregaAuto')} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                <span className="text-xs font-medium text-slate-700">Calcular fecha entrega plano automáticamente</span>
              </label>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-1 uppercase">Fecha Entrega Plano Manual</label>
                <input type="date" {...register('fechaEntregaPlano')} disabled={calcFechaEntregaAuto} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md disabled:bg-slate-100 disabled:text-slate-400 focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        </section>

        {/* ── BOTONES ── */}
        <div className="flex justify-end items-center gap-3 pt-4">
          <button 
            type="button" 
            onClick={() => navigate('/ordenes')} 
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={mutation.isPending} 
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? (esEdicion ? 'Guardando...' : 'Creando...') : (esEdicion ? 'Guardar cambios' : 'Crear Orden')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrdenFormPage;