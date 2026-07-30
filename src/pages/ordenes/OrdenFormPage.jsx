import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';

import * as ordenApi from '@/api/ordenApi';
import * as clienteApi from '@/api/clienteApi';
import * as servicioApi from '@/api/servicioApi';
import * as subtipoTerrenoApi from '@/api/subtipoTerrenoApi';
import * as municipioApi from '@/api/municipioApi';
import * as zonaEjidalApi from '@/api/zonaEjidalApi';
import * as ingenieroApi from '@/api/ingenieroApi';

import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/shared/PageHeader';

// ════════════════════════════════════════════════════════════
// SCHEMA ZOD (con validaciones de fechas)
// ════════════════════════════════════════════════════════════
const ordenSchema = zod.object({
  idCliente:             zod.number({ required_error: 'El cliente es obligatorio' }),
  idServicio:            zod.number({ required_error: 'El servicio es obligatorio' }),
  idSubtipoTerreno:      zod.number({ required_error: 'El terreno es obligatorio' }),
  idMunicipio:           zod.number({ required_error: 'El municipio es obligatorio' }),
  idZonaEjidal:          zod.number({ required_error: 'La localidad es obligatoria' }),
  idIngeniero:           zod.number({ required_error: 'El ingeniero es obligatorio' }),
  fecha:                 zod.string().min(1, 'La fecha es obligatoria'),
  observaciones:         zod.string().optional(),
  montoTotal:            zod.number({ required_error: 'El monto total es obligatorio' }).positive('Debe ser mayor a 0'),
  solicitaFactura:       zod.boolean(),
  requierePlano:         zod.boolean(),
  estadoPlano:           zod.string().optional(),
  tieneComision:         zod.boolean(),
  comisionista:          zod.string().optional(),
  porcentajeComision:    zod.number().optional(),
  calcFechaLevantamientoAuto: zod.boolean(),
  calcFechaEntregaAuto:  zod.boolean(),
  diasEntregaPlano:      zod.number().optional(),
  fechaLevantamiento:    zod.string().optional(),
  fechaEntregaPlano:     zod.string().optional(),
})
.refine(data => {
  if (data.requierePlano) {
    return data.diasEntregaPlano && data.diasEntregaPlano > 0;
  }
  return true;
}, {
  message: 'Los días de entrega son obligatorios',
  path: ['diasEntregaPlano']
})
.refine(data => {
  // Solo validar si la fecha no es automática y tiene valor
  if (!data.calcFechaLevantamientoAuto && data.fechaLevantamiento && data.fecha
      && data.fechaLevantamiento < data.fecha) {
    return false;
  }
  return true;
}, { message: 'La fecha de levantamiento no puede ser anterior a la fecha de orden', path: ['fechaLevantamiento'] })
.refine(data => {
  // Solo validar si ambas fechas no son automáticas y tienen valor
  if (!data.calcFechaEntregaAuto && data.fechaEntregaPlano && data.fechaLevantamiento
      && data.fechaEntregaPlano < data.fechaLevantamiento) {
    return false;
  }
  return true;
}, { message: 'La fecha de entrega no puede ser anterior a la de levantamiento', path: ['fechaEntregaPlano'] })

.refine(data => {
  if (data.requierePlano && !data.estadoPlano) {
    return false;
  }
  return true;
}, { message: 'El estado del plano es obligatorio', path: ['estadoPlano'] })
.refine(data => {
  // Validación: si tiene comisión, el comisionista es obligatorio
  if (data.tieneComision && !data.comisionista) {
    return false;
  }
  return true;
}, { message: 'El comisionista es obligatorio cuando tiene comisión', path: ['comisionista'] })
.refine(data => {
  // Validación: si tiene comisión, el porcentaje es obligatorio y mayor a 0
  if (data.tieneComision && (!data.porcentajeComision || data.porcentajeComision <= 0)) {
    return false;
  }
  return true;
}, { message: 'El porcentaje de comisión es obligatorio y debe ser mayor a 0', path: ['porcentajeComision'] });

const OrdenFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { usuario } = useAuth();
  const esEdicion = Boolean(id);
  const [errorServidor, setErrorServidor] = useState('');

  // ════════════════════════════════════════════════════════════
  // DATOS CON useQuery (en paralelo)
  // ════════════════════════════════════════════════════════════
  const { data: ordenesData = [] } = useQuery({ queryKey: ['ordenes'], queryFn: ordenApi.getAll });
  const { data: folioPreview, isLoading: isLoadingFolio } = useQuery({
    queryKey: ['folio-preview'],
    queryFn: ordenApi.getFolioPreview,
    enabled: !esEdicion,
  });

  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery({ queryKey: ['clientes'], queryFn: clienteApi.getAll });
  const { data: servicios = [], isLoading: isLoadingServicios } = useQuery({ queryKey: ['servicios'], queryFn: servicioApi.getAll });
  const { data: subtiposTerreno = [], isLoading: isLoadingSubtipos } = useQuery({ queryKey: ['subtiposTerreno'], queryFn: subtipoTerrenoApi.getAll });
  const { data: municipios = [], isLoading: isLoadingMunicipios } = useQuery({ queryKey: ['municipios'], queryFn: municipioApi.getAll });
  const { data: zonasEjidales = [], isLoading: isLoadingZonas } = useQuery({ queryKey: ['zonasEjidales'], queryFn: zonaEjidalApi.getAll });
  const { data: ingenieros = [], isLoading: isLoadingIngenieros } = useQuery({ queryKey: ['ingenieros'], queryFn: ingenieroApi.getAll });

  // ════════════════════════════════════════════════════════════
  // DERIVAR COMISIONISTAS (para datalist)
  // ════════════════════════════════════════════════════════════
  const comisionistas = useMemo(() => {
    return [...new Set(ordenesData.filter(o => o.comisionista).map(o => o.comisionista))];
  }, [ordenesData]);

  // ════════════════════════════════════════════════════════════
  // REACT HOOK FORM
  // ════════════════════════════════════════════════════════════
  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
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

      
      observaciones: undefined,
      montoTotal: undefined,
      comisionista: undefined,
      porcentajeComision: undefined,
      fechaLevantamiento: undefined,
      fechaEntregaPlano: undefined,
    }
  });

  // ════════════════════════════════════════════════════════════
  // WATCH PARA CAMPOS CONDICIONALES
  // ════════════════════════════════════════════════════════════
  const tieneComision              = watch('tieneComision');
  const requierePlano              = watch('requierePlano');
  const calcFechaLevantamientoAuto = watch('calcFechaLevantamientoAuto');
  const calcFechaEntregaAuto       = watch('calcFechaEntregaAuto');
  const montoTotal                 = watch('montoTotal');
  const porcentajeComision         = watch('porcentajeComision');

  // UseEffect para desactivar campos de Plano cuando no se requiere plano
  useEffect(() => {
    if (!requierePlano) {
      setValue('estadoPlano', null);
      setValue('diasEntregaPlano', undefined);

      setValue('calcFechaEntregaAuto', false);
      setValue('fechaEntregaPlano', '');

    } else {
      // Valores por defecto cuando vuelve a activarse
      setValue('estadoPlano', 'PENDIENTE');

      if (!watch('diasEntregaPlano')) {
        setValue('diasEntregaPlano', 15);
      }

      setValue('calcFechaEntregaAuto', true);
    }
  }, [requierePlano, setValue]);

  // ════════════════════════════════════════════════════════════
  // CARGA DE DATOS EN EDICIÓN
  // ════════════════════════════════════════════════════════════
  const { data: orden, isLoading: isLoadingOrden } = useQuery({
    queryKey: ['orden', id],
    queryFn: () => ordenApi.getById(id),
    enabled: esEdicion,
  });

  useEffect(() => {
    if (esEdicion && orden) {
      reset({
        idCliente:                  orden.cliente.id,
        idServicio:                 orden.servicio.id,
        idSubtipoTerreno:           orden.subtipoTerreno.id,
        idMunicipio:                orden.municipio.id,
        idZonaEjidal:               orden.zonaEjidal.id,
        idIngeniero:                orden.ingeniero.id,
        fecha:                      orden.fecha,
        observaciones:              orden.observaciones ?? '',
        montoTotal:                 Number(orden.montoTotal),
        solicitaFactura:            orden.solicitaFactura,
        requierePlano:              orden.requierePlano,
        estadoPlano:                orden.estadoPlano,
        tieneComision:              orden.tieneComision,
        comisionista:               orden.comisionista ?? '',
        porcentajeComision:         orden.porcentajeComision ? Number(orden.porcentajeComision) : undefined,
        calcFechaLevantamientoAuto: orden.calcFechaLevantamientoAuto,
        calcFechaEntregaAuto:       orden.calcFechaEntregaAuto,
        diasEntregaPlano:           orden.diasEntregaPlano,
        fechaLevantamiento:         orden.fechaLevantamiento ?? '',
        fechaEntregaPlano:          orden.fechaEntregaPlano ?? '',
      });
    }
  }, [orden, esEdicion, reset]);

  // ════════════════════════════════════════════════════════════
  // MUTACIÓN
  // ════════════════════════════════════════════════════════════
  const mutation = useMutation({
    mutationFn: (data) => {
      // Añadir idUsuario solo si es creación
      const payload = { ...data , idUsuario: usuario?.idUsuario };
      // Limpiar campos condicionales
      if (!payload.tieneComision) {
        payload.comisionista = null;
        payload.porcentajeComision = null;
      }
      if (payload.calcFechaLevantamientoAuto) payload.fechaLevantamiento = null;
      if (payload.calcFechaEntregaAuto) payload.fechaEntregaPlano = null;
      if (!payload.requierePlano) {
        payload.estadoPlano = null;
        payload.diasEntregaPlano = null;
        payload.calcFechaEntregaAuto = false;
        payload.fechaEntregaPlano = null;
      }
      
      // Convertir fechas vacías a null para el backend
      ['fechaLevantamiento', 'fechaEntregaPlano'].forEach(f => {
        if (payload[f] === '') payload[f] = null;
      });

      return esEdicion ? ordenApi.update(id, payload) : ordenApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      navigate('/ordenes');
    },
    onError: (err) => {
      setErrorServidor(err.response?.data?.message || 'Error al guardar la orden.');
    }
  });

  const onSubmit = (data) => {
    setErrorServidor('');
    mutation.mutate(data);
  };

  // ════════════════════════════════════════════════════════════
  // CÁLCULO DE COMISIÓN ESTIMADA (solo cosmético)
  // ════════════════════════════════════════════════════════════
  const montoComisionCalculado = (tieneComision && montoTotal && porcentajeComision)
    ? ((Number(montoTotal) * Number(porcentajeComision)) / 100).toFixed(2)
    : '0.00';

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  if (esEdicion && isLoadingOrden) {
    return <div className="text-center p-10 text-slate-500 font-medium">Cargando orden...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto bg-white p-6 border border-slate-200 rounded-md shadow-sm">
      {/* Título dinámico y folio preview */}
      <PageHeader
        titulo={esEdicion ? 'Editar Orden' : 'Nueva Orden'}
        descripcion="Complete la información de la orden de servicio topográfico."
        onNuevo={null}
      />
      {!esEdicion && !isLoadingFolio && folioPreview && (
        <p className="text-sm text-slate-500 mt-1 -mb-4">
          Folio asignado: <strong>{folioPreview}</strong> <span className="text-xs text-slate-400">(Temporal)</span>
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
        {/* ─── SECCIÓN 1: DATOS GENERALES ─── */}
        <div className="p-4 border border-slate-200 rounded-md space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">1. Datos Generales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fecha *</label>
              <input type="date" {...register('fecha')} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md" />
              {errors.fecha && <p className="text-[10px] text-red-500 mt-0.5">{errors.fecha.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Cliente *</label>
              <select
                {...register('idCliente', { 
                  valueAsNumber: true,
                  setValueAs: (v) => v === '' ? undefined : Number(v)
                })}
                className="w-full text-xs px-3 py-2 border bg-white border-slate-300 rounded-md"
              >
                <option value="">Seleccione cliente...</option>
                {isLoadingClientes ? <option disabled>Cargando...</option> :
                  clientes.map(c => <option key={c.idClientes} value={c.idClientes}>{`${c.nombreS} ${c.apellidoPaterno} ${c.apellidoMaterno != null ? c.apellidoMaterno : ''}`}</option>)}
              </select>
              {errors.idCliente && <p className="text-[10px] text-red-500 mt-0.5">{errors.idCliente.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Servicio *</label>
              <select {...register('idServicio', { 
                valueAsNumber: true,
                setValueAs: (v) => v === '' ? undefined : Number(v)
                })} className="w-full text-xs px-3 py-2 border bg-white border-slate-300 rounded-md">
                <option value="">Seleccione servicio...</option>
                {isLoadingServicios ? <option disabled>Cargando...</option> :
                  servicios.map(s => <option key={s.idServicio} value={s.idServicio}>{s.nombre}</option>)}
              </select>
              {errors.idServicio && <p className="text-[10px] text-red-500 mt-0.5">{errors.idServicio.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ingeniero *</label>
              <select {...register('idIngeniero', { 
                valueAsNumber: true,
                setValueAs: (v) => v === '' ? undefined : Number(v)
                })} className="w-full text-xs px-3 py-2 border bg-white border-slate-300 rounded-md">
                <option value="">Seleccione ingeniero...</option>
                {isLoadingIngenieros ? <option disabled>Cargando...</option> :
                  ingenieros.map(i => <option key={i.idIngeniero} value={i.idIngeniero}>{i.nombre}</option>)}
              </select>
              {errors.idIngeniero && <p className="text-[10px] text-red-500 mt-0.5">{errors.idIngeniero.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Observaciones</label>
              <textarea {...register('observaciones')} rows={2} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md resize-none" placeholder="Detallles adicionales..." />
            </div>
          </div>
        </div>

        {/* ─── SECCIÓN 2: UBICACIÓN Y TERRENO ─── */}
        <div className="p-4 border border-slate-200 rounded-md space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">2. Ubicación y Terreno</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Municipio *</label>
              <select {...register('idMunicipio',{ 
                valueAsNumber: true,
                setValueAs: (v) => v === '' ? undefined : Number(v)
                })} className="w-full text-xs px-3 py-2 border bg-white border-slate-300 rounded-md">
                <option value="">Seleccione municipio...</option>
                {isLoadingMunicipios ? <option disabled>Cargando...</option> :
                  municipios.map(m => <option key={m.idMunicipios} value={m.idMunicipios}>{m.nombre}</option>)}
              </select>
              {errors.idMunicipio && <p className="text-[10px] text-red-500 mt-0.5">{errors.idMunicipio.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Localidad *</label>
              <select {...register('idZonaEjidal', { 
                valueAsNumber: true,
                setValueAs: (v) => v === '' ? undefined : Number(v)
                })} className="w-full text-xs px-3 py-2 border bg-white border-slate-300 rounded-md">
                <option value="">Seleccione localidad...</option>
                {isLoadingZonas ? <option disabled>Cargando...</option> :
                  zonasEjidales.map(z => <option key={z.idZonaEjidal} value={z.idZonaEjidal}>{z.nombre}</option>)}
              </select>
              {errors.idZonaEjidal && <p className="text-[10px] text-red-500 mt-0.5">{errors.idZonaEjidal.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Subtipo de Terreno *</label>
              <select {...register('idSubtipoTerreno', { 
                valueAsNumber: true,
                setValueAs: (v) => v === '' ? undefined : Number(v)
                 })} className="w-full text-xs px-3 py-2 border bg-white border-slate-300 rounded-md">
                <option value="">Seleccione terreno...</option>
                {isLoadingSubtipos ? <option disabled>Cargando...</option> :
                  subtiposTerreno.map(st => <option key={st.idSubtipoTerreno} value={st.idSubtipoTerreno}>{st.nombre}</option>)}
              </select>
              {errors.idSubtipoTerreno && <p className="text-[10px] text-red-500 mt-0.5">{errors.idSubtipoTerreno.message}</p>}
            </div>
          </div>
        </div>

        {/* ─── SECCIÓN 3: ECONÓMICO ─── */}
        <div className="p-4 border border-slate-200 rounded-md space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">3. Económico</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Monto Total (MXN) *</label>
              <input type="number" step="0.01" min="0.01"{...register('montoTotal', { valueAsNumber: true, setValueAs: (v) => v === '' ? undefined : Number(v)
               })} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md" />
              {errors.montoTotal && <p className="text-[10px] text-red-500 mt-0.5">{errors.montoTotal.message}</p>}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input id="solicitaFactura" type="checkbox" {...register('solicitaFactura')} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                <label htmlFor="solicitaFactura" className="ml-2 text-xs font-medium text-slate-700">Solicita factura</label>
              </div>
              <div className="flex items-center">
                <input id="tieneComision" type="checkbox" {...register('tieneComision')} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                <label htmlFor="tieneComision" className="ml-2 text-xs font-medium text-slate-700">Tiene comisión</label>
              </div>
            </div>
          </div>

          {/* Campos condicionales de comisión */}
          {tieneComision && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Comisionista</label>
                  <input
                    type="text"
                    {...register('comisionista')}
                    list="comisionistas-list"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                  />
                  <datalist id="comisionistas-list">
                    {comisionistas.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Porcentaje (%)</label>
                  <input type="number" step="0.01" {...register('porcentajeComision', { valueAsNumber: true, setValueAs: (v) => v === '' ? undefined : Number(v) })} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md" />
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Monto de comisión estimado: <strong>${montoComisionCalculado}</strong>
              </p>
            </div>
          )}
        </div>

        {/* ─── SECCIÓN 4: PLANO Y FECHAS ─── */}
        <div className="p-4 border border-slate-200 rounded-md space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">4. Plano y Fechas</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <input id="requierePlano" type="checkbox" {...register('requierePlano')} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                <label htmlFor="requierePlano" className="ml-2 text-xs font-medium text-slate-700">Requiere plano</label>
              </div>
              {requierePlano && (
                <div className="flex items-center">
                  <label className="text-xs font-medium text-slate-700 mr-2">Estado Plano:</label>
                  <select {...register('estadoPlano')} className="text-xs px-3 py-1 border border-slate-300 rounded-md">
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="ENTREGADO">ENTREGADO</option>
                    <option value="INDEFINIDO">INDEFINIDO</option>
                  </select>
                </div>
              )}
            </div>

            <div >
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Días Entrega Plano *</label>
                <input type="number" {...register('diasEntregaPlano', { valueAsNumber: true })}
                disabled={!requierePlano}
                className={`w-full text-xs px-3 py-2 border rounded-md ${ !requierePlano ? 'bg-slate-100 border-slate-200' : 'border-slate-300' }`}
                />
                {errors.diasEntregaPlano && <p className="text-[10px] text-red-500 mt-0.5">{errors.diasEntregaPlano.message}</p>}
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Fecha Levantamiento</label>
                <input
                  type="date" {...register('fechaLevantamiento')} className={`w-full text-xs px-3 py-2 border rounded-md ${calcFechaLevantamientoAuto ? 'bg-slate-100 border-slate-200' : 'border-slate-300'}`}
                  disabled={calcFechaLevantamientoAuto}
                />
                {errors.fechaLevantamiento && <p className="text-[10px] text-red-500 mt-0.5">{errors.fechaLevantamiento.message}</p>}
              </div>

              <div className="flex items-center">
                <input id="calcFechaLevantamientoAuto" type="checkbox" {...register('calcFechaLevantamientoAuto')} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                <label htmlFor="calcFechaLevantamientoAuto" className="ml-2 text-xs font-medium text-slate-700">Calcular fecha levantamiento automáticamente</label>
              </div>
              
              
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Fecha Entrega Plano</label>
                <input 
                type="date" {...register('fechaEntregaPlano')} className={`w-full text-xs px-3 py-2 border rounded-md ${calcFechaEntregaAuto ? 'bg-slate-100 border-slate-200' : 'border-slate-300'}`}
                disabled= {!requierePlano || calcFechaEntregaAuto}
              />
              {errors.fechaEntregaPlano && <p className="text-[10px] text-red-500 mt-0.5">{errors.fechaEntregaPlano.message}</p>}
              </div>

              <div className="flex items-center">
                <input id="calcFechaEntregaAuto" type="checkbox" {...register('calcFechaEntregaAuto')} className="h-4 w-4 rounded border-slate-300 text-blue-600"
                disabled={!requierePlano} />
                <label htmlFor="calcFechaEntregaAuto" className="ml-2 text-xs font-medium text-slate-700">Calcular fecha entrega plano automáticamente</label>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Mensaje de error del servidor */}
        {errorServidor && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-center">
            <p className="text-xs text-red-600 font-medium">{errorServidor}</p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
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
            {mutation.isPending
              ? (esEdicion ? 'Guardando...' : 'Creando...')
              : (esEdicion ? 'Guardar cambios' : 'Crear Orden')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrdenFormPage;