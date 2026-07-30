import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';

import * as ordenApi from '@/api/ordenApi';
import * as reciboApi from '@/api/reciboApi';

import { PageHeader } from '@/components/shared/PageHeader';
import { formatDate, formatCurrency } from '@/utils/formatters';

// Componentes de UI
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Enums y opciones fijas del Backend
const BANCOS = [
  'BBVA', 'BANORTE', 'SANTANDER', 'BANCOPPEL', 'HSBC', 'SCOTIABANK',
  'BANCO_AZTECA', 'BANAMEX', 'OXXO', 'MERCADO_PAGO'
];

const METODOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'];

// ════════════════════════════════════════════════════════════
// SCHEMA ZOD
// ════════════════════════════════════════════════════════════
const reciboSchema = zod.object({
  idOrden:     zod.number({ required_error: 'La orden es obligatoria' }),
  fecha:       zod.string().min(1, 'La fecha es obligatoria'),
  monto:       zod.number({ required_error: 'El monto es obligatorio' }).positive('El monto debe ser mayor a 0'),
  metodoPago:  zod.string().min(1, 'El método de pago es obligatorio'),
  tipoPago:    zod.string().min(1, 'El tipo de pago es obligatorio'),
  confirmado:  zod.boolean(),
  banco:       zod.string().optional(),
})
.refine(data => {
  if (data.metodoPago === 'TRANSFERENCIA' && !data.banco) return false;
  return true;
}, { message: 'El banco es obligatorio para transferencias', path: ['banco'] });

const ReciboFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const esEdicion = Boolean(id);
  const idOrdenParam = searchParams.get('idOrden');
  const [errorServidor, setErrorServidor] = useState('');

  // ════════════════════════════════════════════════════════════
  // CONSULTA DE DATOS (EDICIÓN / CREACIÓN)
  // ════════════════════════════════════════════════════════════
  
  // 1. Si es edición, cargamos el recibo
  const { data: recibo, isLoading: isLoadingRecibo } = useQuery({
    queryKey: ['recibo', id],
    queryFn: () => reciboApi.getById(id),
    enabled: esEdicion,
  });

  // El id de la orden del contexto actual (sea desde query string o del recibo cargado)
  const idOrdenEfectivo = esEdicion ? recibo?.orden?.id : (idOrdenParam ? Number(idOrdenParam) : undefined);

  // 2. Si es creación, cargamos la orden de manera contextual
  const { data: orden, isLoading: isLoadingOrden } = useQuery({
    queryKey: ['orden', String(idOrdenEfectivo)],
    queryFn: () => ordenApi.getById(idOrdenEfectivo),
    enabled: Boolean(idOrdenEfectivo),
  });

  // 3. Si es creación, cargamos los recibos existentes de la orden para determinar el tipo de pago
  const { data: recibosExistentes = [], isLoading: isLoadingRecibosExistentes } = useQuery({
    queryKey: ['recibos', String(idOrdenEfectivo)],
    queryFn: () => reciboApi.getByOrden(idOrdenEfectivo),
    enabled: Boolean(idOrdenEfectivo) && !esEdicion,
  });

  // ════════════════════════════════════════════════════════════
  // REACT HOOK FORM SETUP
  // ════════════════════════════════════════════════════════════
  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(reciboSchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      confirmado: false,
      idOrden: idOrdenEfectivo ? Number(idOrdenEfectivo) : undefined,
      metodoPago: undefined,
      tipoPago: undefined,
      banco: undefined,
      monto: undefined,
    }
  });

  const metodoPago = watch('metodoPago');
  const tipoPagoSelected = watch('tipoPago');
  const montoActual = watch('monto');
  const verificadoConfirmado = watch('confirmado');

  // Limpiar campo de banco si el método de pago cambia y deja de ser transferencia
  useEffect(() => {
    if (metodoPago !== 'TRANSFERENCIA') {
      setValue('banco', undefined);
    }
  }, [metodoPago, setValue]);

  // Asegurar la sincronía del id de la orden en el formulario
  useEffect(() => {
    if (idOrdenEfectivo) {
      setValue('idOrden', Number(idOrdenEfectivo));
    }
  }, [idOrdenEfectivo, setValue]);

  // ════════════════════════════════════════════════════════════
  // POPULAR FORMULARIO EN EDICIÓN
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (esEdicion && recibo) {
      reset({
        idOrden:    recibo.orden.id,
        fecha:      recibo.fecha,
        monto:      Number(recibo.monto),
        metodoPago: recibo.metodoPago,
        tipoPago:   recibo.tipoPago,
        confirmado: recibo.confirmado,
        banco:      recibo.banco ?? undefined,
      });
    }
  }, [recibo, esEdicion, reset]);

  // ════════════════════════════════════════════════════════════
  // DERIVACIÓN DE TIPOS DE PAGO DISPONIBLES (SOLO CREACIÓN)
  // ════════════════════════════════════════════════════════════
  const tiposDisponibles = useMemo(() => {
    if (esEdicion) return [];
    if (!recibosExistentes) return [];
    const tieneAnticipo = recibosExistentes.some(r => r.tipoPago === 'ANTICIPO' && r.id !== Number(id));
    const tieneSaldo    = recibosExistentes.some(r => r.tipoPago === 'SALDO' && r.id !== Number(id));

    // Reglas del negocio para asignación de tipos de pago
    if (!tieneAnticipo) return ['ANTICIPO'];
    if (tieneAnticipo && !tieneSaldo) return ['ABONO', 'SALDO'];
    return ['ABONO'];
  }, [recibosExistentes, esEdicion, id]);

  // Seteo automático de tipoPago si solo hay una opción disponible en creación
  useEffect(() => {
    if (!esEdicion && tiposDisponibles.length === 1) {
      setValue('tipoPago', tiposDisponibles[0]);
    }
  }, [tiposDisponibles, esEdicion, setValue]);

  const esUnicoTipoPago = !esEdicion && tiposDisponibles.length === 1;

  // ════════════════════════════════════════════════════════════
  // VALIDACIÓN PREVENTIVA DE SOBREPAGO
  // ════════════════════════════════════════════════════════════
  const advertenciaSobrepago = useMemo(() => {
    if (!orden || !montoActual || !verificadoConfirmado) return null;
    
    // Si editamos, el saldo restante ya contempla temporalmente este recibo.
    // Sumamos de vuelta el monto original del recibo para comparar de forma justa
    let saldoReferencia = Number(orden.saldoRestante);
    if (esEdicion && recibo) {
      saldoReferencia += Number(recibo.monto);
    }

    if (montoActual > saldoReferencia) {
      return `El monto supera el saldo restante de la orden (${formatCurrency(saldoReferencia)})`;
    }
    return null;
  }, [orden, montoActual, verificadoConfirmado, esEdicion, recibo]);

  // ════════════════════════════════════════════════════════════
  // ACCIONES Y MUTACIONES
  // ════════════════════════════════════════════════════════════
  const mutation = useMutation({
    mutationFn: (payload) => {
      // Ajuste de banco antes de envío
      if (payload.metodoPago !== 'TRANSFERENCIA') {
        payload.banco = null;
      }
      return esEdicion ? reciboApi.update(id, payload) : reciboApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recibos', String(idOrdenEfectivo)] });
      queryClient.invalidateQueries({ queryKey: ['orden', String(idOrdenEfectivo)] });
      navigate(`/ordenes/${idOrdenEfectivo}`);
    },
    onError: (err) => {
      setErrorServidor(err.response?.data?.message || 'Error al guardar el recibo.');
    }
  });

  const onSubmit = (data) => {
    setErrorServidor('');
    if (advertenciaSobrepago) {
        setErrorServidor('No se puede guardar: ' + advertenciaSobrepago );
        return;
    }
    mutation.mutate(data);
  };

  // Pantallas de carga y manejo de errores preliminares
  if ((esEdicion && isLoadingRecibo) || isLoadingOrden || isLoadingRecibosExistentes) {
    return (
      <div className="text-center p-10 text-slate-500 font-medium">
        Cargando la información requerida...
      </div>
    );
  }

  if (!idOrdenEfectivo) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-md text-center text-sm font-medium">
        Error: No se ha provisto una orden vinculada al recibo.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Cabecera */}
      <PageHeader
        titulo={esEdicion ? 'Editar Recibo' : 'Nuevo Recibo'}
        descripcion="Administración de depósitos, anticipos y saldos de órdenes."
        onNuevo={null}
      />

      {/* ── CARD INFORMATIVA DE LA ORDEN (SOLO LECTURA) ── */}
      {orden && (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs shadow-sm space-y-2">
          <h4 className="font-bold text-slate-700 text-sm border-b pb-1 mb-2">Información Contextual de la Orden</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="block font-medium text-slate-400 uppercase tracking-wider">Folio</span>
              <span className="text-sm font-bold text-blue-600">{orden.folio}</span>
            </div>
            <div>
              <span className="block font-medium text-slate-400 uppercase tracking-wider">Cliente</span>
              <span className="text-slate-700 font-semibold">{orden.cliente?.nombreCompleto || 'N/A'}</span>
            </div>
            <div>
              <span className="block font-medium text-slate-400 uppercase tracking-wider">Monto Total</span>
              <span className="text-slate-800 font-bold">{formatCurrency(orden.montoTotal)}</span>
            </div>
            <div>
              <span className="block font-medium text-slate-400 uppercase tracking-wider">Saldo Restante</span>
              <span className={`font-bold text-sm ${Number(orden.saldoRestante) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {formatCurrency(orden.saldoRestante)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 border border-slate-200 rounded-md shadow-sm space-y-6">
        
        <input type="hidden" {...register('idOrden', { valueAsNumber: true })} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Fecha */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha *</label>
            <input 
              type="date" 
              {...register('fecha')} 
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
            {errors.fecha && <p className="text-[10px] text-red-500 mt-0.5">{errors.fecha.message}</p>}
          </div>

          {/* Tipo de Pago */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Pago *</label>
            {esEdicion || esUnicoTipoPago ? (
              <div className="w-full bg-slate-100 text-xs px-3 py-2 border border-slate-200 rounded-md text-slate-700 font-medium flex items-center">
                <input type="hidden" {...register('tipoPago')} />
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 pointer-events-none uppercase">
                  {tipoPagoSelected || 'ANTICIPO'}
                </Badge>
              </div>
            ) : (
              <select
                {...register('tipoPago')}
                className="w-full text-xs px-3 py-2 border bg-white border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Seleccione tipo de pago...</option>
                {tiposDisponibles.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
            {errors.tipoPago && <p className="text-[10px] text-red-500 mt-0.5">{errors.tipoPago.message}</p>}
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Método de Pago *</label>
            <select
              {...register('metodoPago')}
              className="w-full text-xs px-3 py-2 border bg-white border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Seleccione método...</option>
              {METODOS_PAGO.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {errors.metodoPago && <p className="text-[10px] text-red-500 mt-0.5">{errors.metodoPago.message}</p>}
          </div>

          {/* Banco (Condicional) */}
          {metodoPago === 'TRANSFERENCIA' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Banco *</label>
              <select
                {...register('banco')}
                className="w-full text-xs px-3 py-2 border bg-white border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Seleccione banco...</option>
                {BANCOS.map(b => (
                  <option key={b} value={b}>{b.replace('_', ' ')}</option>
                ))}
              </select>
              {errors.banco && <p className="text-[10px] text-red-500 mt-0.5">{errors.banco.message}</p>}
            </div>
          )}

          {/* Monto */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Monto (MXN) *</label>
            <input 
              type="number" 
              step="0.01" 
              min="0.01"
              {...register('monto', { valueAsNumber: true, setValueAs: (v) => v === '' ? undefined : Number(v) })} 
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
            {errors.monto && <p className="text-[10px] text-red-500 mt-0.5">{errors.monto.message}</p>}
            
            {/* Advertencia preventiva de sobrepago */}
            {advertenciaSobrepago && (
              <p className="text-[10px] text-amber-600 font-semibold mt-1 bg-amber-50 p-1 border border-amber-200 rounded">
                ⚠ {advertenciaSobrepago}
              </p>
            )}
          </div>

          {/* Confirmado (Checkbox) */}
          <div className="flex items-center space-x-2 pt-5">
            <input
              id="confirmado"
              type="checkbox"
              disabled={esEdicion && recibo?.confirmado === true}
              {...register('confirmado')}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
            />
            <label 
              htmlFor="confirmado" 
              className={`text-xs font-semibold ${esEdicion && recibo?.confirmado === true ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700'}`}
            >
              Confirmado (Pago recibido)
            </label>
          </div>

        </div>

        {/* Mensaje de error del backend */}
        {errorServidor && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-center">
            <p className="text-xs text-red-600 font-medium">{errorServidor}</p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/ordenes/${idOrdenEfectivo}`)}
            className="text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-xs"
          >
            {mutation.isPending 
              ? (esEdicion ? 'Guardando...' : 'Registrando...')
              : (esEdicion ? 'Guardar Cambios' : 'Registrar Recibo')}
          </Button>
        </div>

      </form>
    </div>
  );
};

export default ReciboFormPage;