import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import * as ordenApi from '@/api/ordenApi';
import * as reciboApi from '@/api/reciboApi';

import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatDate, formatCurrency } from '../../utils/formatters';

// Componentes de UI 
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ConfirmDialog }from '@/components/shared/ConfirmDialog';
import { usePermisos } from '@/hooks/usePermisos';

const OrdenDetallePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tienePermiso } = usePermisos();

  // Estados de control de diálogos
  const [isPlanoDialogOpen, setIsPlanoDialogOpen] = useState(false);
  const [nuevoEstadoPlano, setNuevoEstadoPlano] = useState('');

  const [ErrorConfirmacion, setErrorConfirmacion] = useState('');
  
  const [confirmDialogConfig, setConfirmDialogConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // ESTADOS PARA SUBIDAS DE PLANO
  const [archivoSelected, setArchivoSelected] = useState(null);
  const [errorArchivo, setErrorArchivo] = useState('');

  // ── CONSULTAS DE DATOS ──
  const { data: orden, isLoading: isLoadingOrden, isError: isErrorOrden } = useQuery({
    queryKey: ['orden', id],
    queryFn: () => ordenApi.getById(id),
  });

  const { data: recibos = [], isLoading: isLoadingRecibos } = useQuery({
    queryKey: ['recibos', id],
    queryFn: () => reciboApi.getByOrden(id),
  });

  // ── MUTACIONES ──
  const updateEstadoPlanoMutation = useMutation({
    mutationFn: ({ idOrden, estado }) => ordenApi.actualizarEstadoPlano(idOrden, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orden', id] });
      setIsPlanoDialogOpen(false);
    }
  });

  const confirmarReciboMutation = useMutation({
    mutationFn: (idRecibo) => reciboApi.confirmar(idRecibo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recibos', id] });
      queryClient.invalidateQueries({ queryKey: ['orden', id] });
    },
    onError: (err) => {
        const mensaje = err.response?.data?.message || 'Error al confirmar el recibo';
        setErrorConfirmacion(mensaje);
    }
  });

  const eliminarReciboMutation = useMutation({
    mutationFn: (idRecibo) => reciboApi.remove(idRecibo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recibos', id] });
      queryClient.invalidateQueries({ queryKey: ['orden', id] });
    }
  });

  const subirPlanoMutation = useMutation({
    mutationFn: (archivo) => ordenApi.subirPlano(id, archivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orden', id]});
      setArchivoSelected(null);
      setErrorArchivo('');
    },
    onError: (err) => {
      setErrorArchivo(err.response?.data?.message || 'Error al subir el plano')
    }
  });

  // Manejadores de acciones
  const handleOpenPlanoDialog = () => {
    setNuevoEstadoPlano(orden?.estadoPlano || 'PENDIENTE');
    setIsPlanoDialogOpen(true);
  };

  const handleSaveEstadoPlano = () => {
    updateEstadoPlanoMutation.mutate({ idOrden: id, estado: nuevoEstadoPlano });
  };

  const handleConfirmarReciboClick = (recibo) => {
    setConfirmDialogConfig({
      isOpen: true,
      title: 'Confirmar Recibo',
      message: `¿Confirmar el recibo por ${formatCurrency(recibo.monto)}? Esta acción no se puede deshacer y afectará el saldo restante.`,
      onConfirm: () => {
        confirmarReciboMutation.mutate(recibo.id);
        setConfirmDialogConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleEliminarReciboClick = (recibo) => {
    setConfirmDialogConfig({
      isOpen: true,
      title: 'Eliminar Recibo',
      message: `¿Estás seguro de eliminar el recibo por ${formatCurrency(recibo.monto)}?`,
      onConfirm: () => {
        eliminarReciboMutation.mutate(recibo.id);
        setConfirmDialogConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSeleccionArchivo = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png'];
    const tamanioMaximo = 10 * 1024 * 1024; // 10MB

    if (!tiposPermitidos.includes(archivo.type)) {
      setErrorArchivo('Tipo de archivo no permitido. Solo se aceptan PDF, JPG o PNG');
      setArchivoSelected(null);
      e.target.value = ''; // Limpiar input
      return;
    }
    if (archivo.size > tamanioMaximo) {
      setErrorArchivo('El archivo excede el tamaño máximo permitido de 10MB');
      setArchivoSelected(null);
      e.target.value = ''; // Limpiar input
      return;
    }
    setErrorArchivo('');
    setArchivoSelected(archivo);
  };

  const handleSubirArchivo = () => {
    if (archivoSelected) {
      subirPlanoMutation.mutate(archivoSelected);
    }
  };

  const esUrlValida = (url) => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleAbrirPlano = (url) => {
    if (!esUrlValida(url)) {
      setErrorArchivo('La URL del plano no es válida');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };


  const InputSubidaPlano = () => (
    <div className="mt-2 space-y-2">
      <input type="file" accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleSeleccionArchivo}
        className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0
               file:bg-blue-50 file:text-blue-700 file:text-xs
               hover:file:bg-blue-100 cursor-pointer "
      />
      {archivoSelected && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-600">{archivoSelected.name}</span>
          <Button size="sm" className="rounded-lg" 
            onClick={handleSubirArchivo} disabled={subirPlanoMutation.isPending}
          >
            {subirPlanoMutation.isPending ? 'Subiendo...' : 'Subir'}
          </Button>
        </div>
      )}
      {errorArchivo && (
        <p className="text-[10px] text-red-500 font-medium">{errorArchivo}</p>
      )}
    </div>
  );

  if (isLoadingOrden) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-slate-500 text-sm">Cargando información de la orden...</p>
      </div>
    );
  }

  if (isErrorOrden || !orden) {
    return (
      <div className="p-10 text-center max-w-lg mx-auto">
        <p className="text-red-500 font-medium">Error al cargar la orden o la orden no existe.</p>
        <Button onClick={() => navigate('/ordenes')} className="rounded-full mt-4" variant="outline">
          Volver a Órdenes
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      
      {/* ── CABECERA Y ACCIONES GLOBAL ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <PageHeader 
          titulo={`Orden ${orden.folio ?? ''}`} 
          descripcion="Consulta los detalles generales, económicos, de plano y el histórico de cobros." 
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate('/ordenes')}>
            ← Volver
          </Button>
          {/** */}
          {tienePermiso('ORDEN_UPDATE') && orden.estatus !== 'CANCELADA' && (
            <Button size="sm" className="rounded-full" onClick={() => navigate(`/ordenes/${id}/editar`)}>
              Editar Orden
            </Button>
          )}
        </div>
      </div>

      {/* ── DETALLE DE LA ORDEN (SOLO LECTURA) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Subsección: Datos Generales */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Datos Generales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="block font-medium text-slate-500">Folio</span>
              <span className="text-lg font-bold text-blue-600">{orden.folio}</span>
            </div>
            <div>
              <span className="block font-medium text-slate-500">Estatus</span>
              <div className="mt-1">
                {orden.estatus === 'ACTIVA'    && <Badge variant="active">ACTIVA</Badge>}
                {orden.estatus === 'TERMINADA' && <Badge variant="secondary" className="bg-green-100 text-green-800">TERMINADA</Badge>}
                {orden.estatus === 'CANCELADA' && <Badge variant="destructive">CANCELADA</Badge>}
              </div>
            </div>
            <div>
              <span className="block font-medium text-slate-500">Fecha</span>
              <span className="text-slate-800 font-medium">{formatDate(orden.fecha)}</span>
            </div>
            <div>
              <span className="block font-medium text-slate-500">Cliente</span>
              <span className="text-slate-800 font-medium">{orden.cliente?.nombreCompleto}</span>
            </div>
            <div>
              <span className="block font-medium text-slate-500">Servicio</span>
              <span className="text-slate-800 font-medium">{orden.servicio?.nombre}</span>
            </div>
            <div>
              <span className="block font-medium text-slate-500">Ingeniero</span>
              <span className="text-slate-800 font-medium">{orden.ingeniero?.nombre}</span>
            </div>
            <div>
              <span className="block font-medium text-slate-500">Solicita Factura</span>
              <span className="text-slate-800 font-medium">{orden.solicitaFactura ? 'Sí' : 'No'}</span>
            </div>
            <div>
              <span className="block font-medium text-slate-500">Registrado por</span>
              <span className="text-slate-800 font-medium">{orden.usuario?.nombre || 'N/A'}</span>
            </div>
            {orden.observaciones && (
              <div className="sm:col-span-2">
                <span className="block font-medium text-slate-500">Observaciones</span>
                <p className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 mt-1 whitespace-pre-wrap">{orden.observaciones}</p>
              </div>
            )}
          </div>
        </div>

        {/* Subsección: Ubicación y Terreno */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-4">Ubicación y Terreno</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block font-medium text-slate-500">Municipio</span>
                <span className="text-slate-800 font-medium">{orden.municipio?.nombre}</span>
              </div>
              <div>
                <span className="block font-medium text-slate-500">Zona Ejidal / Localidad</span>
                <span className="text-slate-800 font-medium">{orden.zonaEjidal?.nombre}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="block font-medium text-slate-500">Subtipo de Terreno</span>
                <span className="text-slate-800 font-medium">{orden.subtipoTerreno?.nombre}</span>
              </div>
            </div>
          </div>

          {/* Subsección: Económico */}
          <div className="border-t pt-4 mt-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Económico</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block font-medium text-slate-500">Monto Total</span>
                <span className="text-base font-bold text-slate-900">{formatCurrency(orden.montoTotal)}</span>
              </div>
              <div>
                <span className="block font-medium text-slate-500">Saldo Restante</span>
                <span className={`text-base font-bold ${Number(orden.saldoRestante) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(orden.saldoRestante)}
                </span>
              </div>
              <div>
                <span className="block font-medium text-slate-500">Tiene Comisión</span>
                <span className="text-slate-800 font-medium">{orden.tieneComision ? 'Sí' : 'No'}</span>
              </div>
              {orden.tieneComision && (
                <>
                  <div>
                    <span className="block font-medium text-slate-500">Comisionista</span>
                    <span className="text-slate-800 font-medium">{orden.comisionista}</span>
                  </div>
                  <div>
                    <span className="block font-medium text-slate-500">Porcentaje Comisión</span>
                    <span className="text-slate-800 font-medium">{orden.porcentajeComision}%</span>
                  </div>
                  <div>
                    <span className="block font-medium text-slate-500">Monto Comisión</span>
                    <span className="text-slate-800 font-medium text-amber-700 font-bold"> {formatCurrency(orden.montoComision)} </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Subsección: Plano y Fechas */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-slate-800">Plano y Fechas de Ejecución</h3>
            {tienePermiso('ORDEN_UPDATE') && orden.estatus !== 'CANCELADA' && orden.requierePlano && (
              <Button size="sm" variant="outline" className="rounded-lg border border-slate-300 hover:bg-slate-100" onClick={handleOpenPlanoDialog}>
                Actualizar estado plano
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="block font-medium text-slate-500">Requiere Plano</span>
              <span className="text-slate-800 font-medium">{orden.requierePlano ? 'Sí' : 'No'}</span>
            </div>
            {orden.requierePlano && (
              <div>
                <span className="block font-medium text-slate-500">Estado Plano</span>
                <div className="mt-1">
                  {orden.estadoPlano === 'PENDIENTE' && <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">PENDIENTE</Badge>}
                  {orden.estadoPlano === 'ENTREGADO' && <Badge className="bg-green-100 text-green-800 border-green-200">ENTREGADO</Badge>}
                  {orden.estadoPlano === 'INDEFINIDO' && <Badge className="bg-slate-100 text-slate-800 border-slate-200">INDEFINIDO</Badge>}
                </div>
              </div>
            )}
            <div>
              <span className="block font-medium text-slate-500">Días Entrega Plano</span>
              <span className="text-slate-800 font-medium">{orden.diasEntregaPlano} días</span>
            </div>
            <div>
              <span className="block font-medium text-slate-500">Plano topogrfico</span>
              <div className="mt-0.5">
                
                {orden.rutaPlano ? (
                  <>
                  
                    {esUrlValida(orden.rutaPlano) ? (
                    <button
                      onClick={() => handleAbrirPlano(orden.rutaPlano)}
                      className="text-blue-600 underline font-medium hover:text-blue-800 cursor-pointer"
                    > {orden.rutaPlano?.toLowerCase().endsWith(".pdf") ? "Ver PDF" : "Ver imagen"}
                    </button>
                  ) : (
                    <span className="text-amber-600 italic">URL del plano no válida</span>
                  )}
                  {/* Reemplazar plano si tiene permiso */}
                  {tienePermiso('ORDEN_UPDATE') && orden.estatus !== 'CANCELADA' && (
                    <div className="mt-1">
                      <p className="text-[10px] text-slate-400">Reemplazar plano</p>
                      <InputSubidaPlano />
                    </div>
                  )}
                </>
                ) : (
                  <>
                    <span className="text-slate-400 italic">Sin plano registrado</span>
                    {/* Subir plano si no existe y tiene permiso */}
                    {tienePermiso('ORDEN_UPDATE') && orden.estatus !== 'CANCELADA' && orden.requierePlano && (
                      <InputSubidaPlano />
                    )}
                  </>
                )}
                {errorArchivo && (
                  <p className="text-[10px] text-red-500 font-medium mt-1">{errorArchivo}</p>
                )}
              </div>
            </div>
            <div className="border-t pt-2 sm:col-span-2 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <span className="block font-medium text-slate-500">Fecha Levantamiento Automático</span>
                <span className="text-slate-800 font-medium">{orden.calcFechaLevantamientoAuto ? 'Sí' : 'No'}</span>
              </div>
              <div>
                <span className="block font-medium text-slate-500">Fecha Levantamiento</span>
                <span className="text-slate-800 font-medium">
                  {orden.fechaLevantamiento ? formatDate(orden.fechaLevantamiento) : <span className="text-amber-600 font-semibold">Pendiente</span>}
                </span>
              </div>
              <div>
                <span className="block font-medium text-slate-500">Fecha Entrega Automática</span>
                <span className="text-slate-800 font-medium">{orden.calcFechaEntregaAuto ? 'Sí' : 'No'}</span>
              </div>
              <div>
                <span className="block font-medium text-slate-500">Fecha Entrega Plano</span>
                <span className="text-slate-800 font-medium">
                  {orden.fechaEntregaPlano ? formatDate(orden.fechaEntregaPlano) : <span className="text-amber-600 font-semibold">Pendiente</span>}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN 2: HISTÓRICO DE RECIBOS Y COBROS ── */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-800">Recibos de la Orden</h3>
            <p className="text-[11px] text-slate-500">Abonos, anticipos y saldos validados de este servicio.</p>
          </div>
          {tienePermiso('RECIBO_CREATE') && orden.estatus !== 'CANCELADA' && orden.estatus !== 'TERMINADA' && (
            <Button size="sm" className="rounded-full" onClick={() => navigate(`/recibos/nuevo?idOrden=${id}`)}>
              + Agregar Recibo
            </Button>
          )}
        </div>

        {isLoadingRecibos ? (
          <p className="text-xs text-slate-500 text-center py-6">Cargando recibos...</p>
        ) : recibos.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-8">No se han registrado recibos para esta orden.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 text-slate-500 font-medium">
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Tipo Pago</th>
                  <th className="p-3">Método Pago</th>
                  <th className="p-3">Banco</th>
                  <th className="p-3">Monto</th>
                  <th className="p-3 text-center">Confirmado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {recibos.map((recibo) => (
                  <tr key={recibo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">{formatDate(recibo.fecha)}</td>
                    <td className="p-3">
                      {recibo.tipoPago === 'ANTICIPO' && <Badge className="bg-blue-50 text-blue-700 border-blue-200">ANTICIPO</Badge>}
                      {recibo.tipoPago === 'ABONO' && <Badge className="bg-yellow-50 text-yellow-800 border-yellow-200">ABONO</Badge>}
                      {recibo.tipoPago === 'SALDO' && <Badge className="bg-green-50 text-green-700 border-green-200">SALDO</Badge>}
                    </td>
                    <td className="p-3">{recibo.metodoPago}</td>
                    <td className="p-3">{recibo.banco || '—'}</td>
                    <td className="p-3 font-semibold text-slate-900">{formatCurrency(recibo.monto)}</td>
                    <td className="p-3 text-center">
                      {recibo.confirmado ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">Confirmado</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-600 border-slate-200">Pendiente</Badge>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-1">
                      {/*{tienePermiso('RECIBO_UPDATE') && !recibo.confirmado && (*/}
                      {tienePermiso('RECIBO_UPDATE') && (
                          <Button className="rounded-lg" size="sm" variant="outline" onClick={() => navigate(`/recibos/${recibo.id}/editar`)}>
                            Editar
                          </Button>
                      )}
                      {tienePermiso('RECIBO_DELETE') && recibo.tipoPago !== 'ANTICIPO' && !recibo.confirmado && (
                        <Button className="rounded-lg" size="sm" variant="destructive" onClick={() => handleEliminarReciboClick(recibo)}>
                          Eliminar
                        </Button>
                      )}
                      {tienePermiso('RECIBO_UPDATE') && !recibo.confirmado && (
                        <Button  size="sm" variant="outline" className="rounded-lg text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700" onClick={() => handleConfirmarReciboClick(recibo)}>
                            Confirmar
                          </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── DIALOG DE ACTUALIZAR PLANO ── */}
      <Dialog open={isPlanoDialogOpen} onOpenChange={setIsPlanoDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Actualizar Estado del Plano</DialogTitle>
          </DialogHeader>
          <DialogDescription>Seleccion de nuevo estado para el plano</DialogDescription>
          <div className="py-4 space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-700">Seleccionar nuevo estado</label>
              <select 
                value={nuevoEstadoPlano} 
                onChange={(e) => setNuevoEstadoPlano(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="ENTREGADO">ENTREGADO</option>
                <option value="INDEFINIDO">INDEFINIDO</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsPlanoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSaveEstadoPlano} disabled={updateEstadoPlanoMutation.isPending}>
              {updateEstadoPlanoMutation.isPending ? 'Guardando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CONFIRM DIALOG GLOBAL ── */}
      <ConfirmDialog 
        open={confirmDialogConfig.isOpen} 
        titulo={confirmDialogConfig.title}
        mensaje={confirmDialogConfig.message}
        onConfirm={confirmDialogConfig.onConfirm}
        onCancel={() => setConfirmDialogConfig(prev => ({ ...prev, isOpen: false }))}
        />

        {ErrorConfirmacion && (
          <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md text-xs font-medium text-red-600">
          <span>{ErrorConfirmacion}</span>
          <button 
            onClick={() => setErrorConfirmacion('')} 
            className="ml-2 font-bold hover:text-red-800 transition-colors"
          >
            X
          </button>
          </div>
        )}
    </div>
  );
};

export default OrdenDetallePage;