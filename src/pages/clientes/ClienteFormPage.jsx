import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';

import * as clienteApi from '../../api/clienteApi';
import * as municipioApi from '../../api/municipioApi';
import * as zonasApi from '../../api/zonaEjidalApi';
import axiosInstance from '@/api/axiosInstance';

// Esquema estructurado de validación de negocio con Zod
const clienteSchema = zod.object({
  //Datos personales
  nombreS: zod.string().min(1, 'Nombre requerido'),
  apellidoPaterno: zod.string().min(1, 'Apellido paterno requerido'),
  apellidoMaterno: zod.string().optional().or(zod.literal('')),
  // direccion (sin campo direccion)
  localidad: zod.string().min(1, 'Localidad requerida'),
  colonia: zod.string().optional().or(zod.literal('')),
  calleNumero: zod.string().optional().or(zod.literal('')),
  codigoPostal: zod.string().max(8, 'Máximo 8 caracteres').regex(/^\d+$/, 'EL CP debe contener sólo digitos').optional().or(zod.literal('')),
  idMunicipio: zod.coerce.number().min(1, 'Municipio requerido'),
  // contacto
  telefono: zod.string().min(1, 'Teléfono requerido').regex(/^\d{10}$/, 'El telefono debe tener exactamente 10 dígitos'),
  email: zod.string().optional().or(zod.literal('')),
  //Clasificación
  tipo: zod.enum(['Particular', 'Notaria'], { errorMap: () => ({ message: 'Tipo inválido' }) }),
  referenciado: zod.enum(['Instagram', 'Facebook', 'TikTok', 'Conocido', 'Comisionista', 'Ninguno'], {
    errorMap: () => ({ message: 'Origen de referencia inválido' })
  }),
});

const ClienteFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const esEdicion = Boolean(id);
  const [errorServidor, setErrorServidor] = useState('');

      //console.log('ID del cliente:', id);
      //console.log('Modo edición:', esEdicion);
      //console.log('Campos del formulario:', clienteSchema.shape);
      
  // Inicialización de React Hook Form acoplado a Zod
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombreS: '', apellidoPaterno: '', apellidoMaterno: '', 
      localidad: '', colonia: '', calleNumero: '', codigoPostal: '',
      idMunicipio: '', telefono: '', email: '', tipo: 'Particular', referenciado: 'Ninguno'
    }
  });

  // Query 1: Obtención asíncrona del catálogo de municipios
  const { data: municipios = [] } = useQuery({
    queryKey: ['municipios'],
    queryFn: municipioApi.getAll
  });

  // Query 2: Hidratación del formulario si nos encontramos en modo Edición
  const { data: clienteData, isLoading: isLoadingCliente } = useQuery({
    queryKey: ['cliente', id],
    queryFn: () => clienteApi.getById(id),
    enabled: esEdicion,
  });

  // Nueva Query para obtener zonas ejidales (localidades) para autocompletar
  const { data: zonasEjidales = [] } = useQuery({
    queryKey: ['zonasEjidales'],
    queryFn: () => zonasApi.getAll()
  });

  // Sincronizar los datos recibidos del backend con el estado interno del formulario
  useEffect(() => {
    if (esEdicion && clienteData) {
      reset(clienteData);
    }
  }, [clienteData, esEdicion, reset]);

  // Mutación para Guardar (Crear o Actualizar de forma transparente)
  const submitMutation = useMutation({
    mutationFn: (data) => esEdicion ? clienteApi.update(id, data) : clienteApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      navigate('/clientes');
    },
    onError: (error) => {
      setErrorServidor(error.response?.data?.message || 'Ocurrió un error inesperado en el servidor al guardar el registro.');
    }
  });

  const onSubmit = (data) => {
    setErrorServidor('');
    submitMutation.mutate(data);
  };

  if (esEdicion && isLoadingCliente) {
    return <div className="text-center p-10 text-slate-500 font-medium">Cargando datos del cliente...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">{esEdicion ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
        <p className="text-xs text-slate-500 mt-1">Completa los campos obligatorios para guardar el registro en el sistema.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* SECCIÓN 1: Datos Personales */}
        <div className="bg-white p-5 border border-slate-200 rounded-md space-y-4">
          <h3 className="text-sm font-semibold text-blue-600 border-b border-slate-100 pb-2">1. Datos Personales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nombre (s) *</label>
              <input type="text" {...register('nombreS')} className={`w-full text-xs px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none ${errors.nombreS ? 'border-red-500' : 'border-slate-300'}`} />
              {errors.nombreS && <p className="text-[10px] text-red-500 mt-0.5">{errors.nombreS.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Apellido Paterno *</label>
              <input type="text" {...register('apellidoPaterno')} className={`w-full text-xs px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none ${errors.apellidoPaterno ? 'border-red-500' : 'border-slate-300'}`} />
              {errors.apellidoPaterno && <p className="text-[10px] text-red-500 mt-0.5">{errors.apellidoPaterno.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Apellido Materno</label>
              <input type="text" {...register('apellidoMaterno')} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Contacto */}
        <div className="bg-white p-5 border border-slate-200 rounded-md space-y-4">
          <h3 className="text-sm font-semibold text-blue-600 border-b border-slate-100 pb-2">2. Información de Contacto</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Teléfono *</label>
              <input type="text" {...register('telefono')} className={`w-full text-xs px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none ${errors.telefono ? 'border-red-500' : 'border-slate-300'}`} placeholder="Ej. 771XXXXXXX" maxLength="10" />
              {errors.telefono && <p className="text-[10px] text-red-500 mt-0.5">{errors.telefono.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Correo Electrónico</label>
              <input type="email" {...register('email')} className={`w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none `} placeholder="correo@ejemplo.com" />
              
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Dirección */}
        <div className="bg-white p-5 border border-slate-200 rounded-md space-y-4">
          <h3 className="text-sm font-semibold text-blue-600 border-b border-slate-100 pb-2">3. Dirección y Ubicación</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Calle y/o Número</label>
              <input type="text" {...register('calleNumero')} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Colonia</label>
              <input type="text" {...register('colonia')} className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
            {/**
             * <div>
             * <label className="block text-xs font-medium text-slate-700 mb-1">Localidad *</label>
             * <input type="text" {...register('localidad')} className={`w-full text-xs px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none ${errors.localidad ? 'border-red-500' : 'border-slate-300'}`} />{errors.localidad && <p className="text-[10px] text-red-500 mt-0.5">{errors.localidad.message}</p>}
             * </div>
             */}
            
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Localidad *</label>
              {/* Se agrega el atributo list="lista-localidades" */}
              <input 
                type="text" list="lista-localidades" {...register('localidad')} className="inputTextStyle uppercase" placeholder="Escribe o selecciona..."
              />
              {/* Datalist nativo para autocompletar sin librerías externas */}
              <datalist id="lista-localidades">
                {zonasEjidales.map((zona) => (
                  <option key={zona.idZonaEjidal} value={zona.nombre} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Código Postal</label>
              <input type="text" {...register('codigoPostal')} className={`w-full text-xs px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none ${errors.codigoPostal ? 'border-red-500' : 'border-slate-300'}`} />
              {errors.codigoPostal && <p className="text-[10px] text-red-500 mt-0.5">{errors.codigoPostal.message}</p>}
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">Municipio *</label>
              <select {...register('idMunicipio')} className={`w-full text-xs px-3 py-2 border rounded-md bg-white focus:ring-1 focus:ring-blue-500 outline-none ${errors.idMunicipio ? 'border-red-500' : 'border-slate-300'}`}>
                <option value="">Selecciona un municipio...</option>
                {municipios.map((m) => (
                  <option key={m.idMunicipios} value={m.idMunicipios}>{m.nombre}</option>
                ))}
              </select>
              {errors.idMunicipio && <p className="text-[10px] text-red-500 mt-0.5">{errors.idMunicipio.message}</p>}
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: Clasificación */}
        <div className="bg-white p-5 border border-slate-200 rounded-md space-y-4">
          <h3 className="text-sm font-semibold text-blue-600 border-b border-slate-100 pb-2">4. Clasificación y Origen</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tipo de Cliente *</label>
              <select {...register('tipo')} className="w-full text-xs px-3 py-2 border border-slate-300 bg-white rounded-md focus:ring-1 focus:ring-blue-500 outline-none">
                <option value="Particular">Particular</option>
                <option value="Notaria">Notaria</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Referenciado desde *</label>
              <select {...register('referenciado')} className="w-full text-xs px-3 py-2 border border-slate-300 bg-white rounded-md focus:ring-1 focus:ring-blue-500 outline-none">
                <option value="Ninguno">Ninguno</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="TikTok">TikTok</option>
                <option value="Conocido">Conocido</option>
                <option value="Comisionista">Comisionista</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alertas de error procedentes del Backend */}
        {errorServidor && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-center">
            <p className="text-xs text-red-600 font-medium">{errorServidor}</p>
          </div>
        )}

        {/* Footer del Formulario con Acciones */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitMutation.isPending ? 'Guardando...' : 'Guardar Cliente'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClienteFormPage;