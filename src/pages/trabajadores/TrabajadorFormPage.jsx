import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';

import * as trabajadorApi from '@/api/trabajadorApi';
import * as usuarioApi from '@/api/usuarioApi';
// Importaciones de catálogos complementarios existentes
import * as areaApi from '@/api/areaApi';
import * as puestoApi from '@/api/puestoApi';
import { useAuth } from '@/context/AuthContext';

const trabajadorSchema = zod.object({
  nombre: zod.string().min(1, 'El nombre es requerido'),
  apellidoPaterno: zod.string().min(1, 'El apellido paterno es requerido'),
  apellidoMaterno: zod.string().optional().or(zod.literal('')),
  idPuesto: zod.coerce.number().min(1, 'Puesto requerido'),
  idArea: zod.coerce.number().min(1, 'Área requerida'),
  rfc: zod.string().max(13, 'El RFC no debe exceder 13 caracteres').regex(/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'El RFC debe tener formato valido').optional().or(zod.literal('')), // 
  curp: zod.string().max(18, 'La CURP no debe exceder 18 caracteres').regex(/^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[A-Z0-9]{2}$/, 'El CURP debe tener formato valido').optional().or(zod.literal('')), //
  telefono: zod.string().max(10, 'Teléfono no debe exceder 10 digitos').optional().or(zod.literal('')),
  email: zod.string().email('Email inválido').optional().or(zod.literal('')),
  fechaAlta: zod.string().min(1, 'Fecha de alta requerida'),
  activo: zod.boolean().default(true),
  idUsuario: zod.coerce.number().optional().or(zod.literal(''))
});

const TrabajadorFormPage = () => {
  const { id } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const esEdicion = Boolean(id);
  const [errorServidor, setErrorServidor] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(trabajadorSchema),
    defaultValues: {
      nombre: '', apellidoPaterno: '', apellidoMaterno: '',
      idPuesto: '', idArea: '', rfc: '', curp: '',
      telefono: '', email: '', fechaAlta: new Date().toISOString().split('T')[0],
      activo: true,
      idUsuario: !esEdicion ? (usuario?.idUsuario || '') : '' // <-- solo para nuevo
    }
  });

  // Carga asíncrona paralela de catálogos de dependencias
  const { data: areas = [], isLoading: isLoadingareas } = useQuery({ queryKey: ['areas'], queryFn: areaApi.getAll });
  const { data: puestos = [] } = useQuery({ queryKey: ['puestos'], queryFn: puestoApi.getAll });
  const { data: usuarios = [] } = useQuery({ queryKey: ['usuarios'], queryFn: usuarioApi.getAll });

  const { data: trabajadorData, isLoading: isLoadingTrabajador } = useQuery({
    queryKey: ['trabajador', id],
    queryFn: () => trabajadorApi.getById(id),
    enabled: esEdicion,
  });

  useEffect(() => {
    if (esEdicion && trabajadorData) {
      // Normalizar campos nulos provenientes de llaves foráneas opcionales
      reset({
        ...trabajadorData,
        idUsuario: trabajadorData.idUsuario || ''
      });
    }
  }, [trabajadorData, esEdicion, reset]);

  const submitMutation = useMutation({
    mutationFn: (data) => {
      // Limpieza de datos: si idUsuario está vacío se envía nulo
      const payload = { ...data, idUsuario: data.idUsuario || null };
      return esEdicion ? trabajadorApi.update(id, payload) : trabajadorApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trabajadores'] });
      navigate('/trabajadores');
    },
    onError: (err) => {
      setErrorServidor(err.response?.data?.message || 'Error al guardar el registro del trabajador.');
    }
  });

  if (esEdicion && isLoadingTrabajador) {
    return <div className="text-center p-10 text-slate-500 font-medium">Cargando expediente del trabajador...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">{esEdicion ? 'Editar Trabajador' : 'Nuevo Trabajador'}</h2>
        <p className="text-xs text-slate-500 mt-1">Expediente de control interno e identificación de personal.</p>
      </div>

      <form onSubmit={handleSubmit(data => submitMutation.mutate(data))} className="space-y-6">
        
        {/* SECCIÓN 1: Datos Personales */}
        <div className="bg-white p-5 border border-slate-200 rounded-md space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">1. Datos Personales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nombre *</label>
              <input type="text" {...register('nombre')} className={`w-full text-xs px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none ${errors.nombre ? 'border-red-500' : 'border-slate-300'}`} />
              {errors.nombre && <p className="text-[10px] text-red-500 mt-0.5">{errors.nombre.message}</p>}
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

        {/* SECCIÓN 2: Puesto y Área */}
        <div className="bg-white p-5 border border-slate-200 rounded-md space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">2. Estructura Organizacional</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Puesto Asignado *</label>
              <select {...register('idPuesto')} className={`w-full text-xs px-3 py-2 border bg-white rounded-md focus:ring-1 focus:ring-blue-500 outline-none ${errors.idPuesto ? 'border-red-500' : 'border-slate-300'}`}>
                <option value="">Selecciona un puesto...</option>
                {puestos.map(p => <option key={p.idPuesto} value={p.idPuesto}>{p.nombre}</option>)}
              </select>
              {errors.idPuesto && <p className="text-[10px] text-red-500 mt-0.5">{errors.idPuesto.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Área Adscrita *</label>
              <select {...register('idArea')} className={`w-full text-xs px-3 py-2 border bg-white rounded-md focus:ring-1 focus:ring-blue-500 outline-none ${errors.idArea ? 'border-red-500' : 'border-slate-300'}`}>
                <option value="">Selecciona un área...</option>
                {isLoadingareas ? (
                  <option disabled>Cargando areas...</option>) : 
                  ( 
                    areas.map(a => (<option key={a.idArea} value={a.idArea}>{a.nombre}</option>))
                  )
                }
              </select>
              {errors.idArea && <p className="text-[10px] text-red-500 mt-0.5">{errors.idArea.message}</p>}
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Documentos Oficiales */}
        <div className="bg-white p-5 border border-slate-200 rounded-md space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">3. Identificadores Oficiales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">RFC</label>
              <input type="text" {...register('rfc')} placeholder="13 dígitos" className={`w-full text-xs px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none uppercase ${errors.rfc ? 'border-red-500' : 'border-slate-300'}`} maxLength="13"/>
              {errors.rfc && <p className="text-[10px] text-red-500 mt-0.5">{errors.rfc.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">CURP</label>
              <input type="text" {...register('curp')} placeholder="18 dígitos" className={`w-full text-xs px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none uppercase ${errors.curp ? 'border-red-500' : 'border-slate-300'}`} maxLength="18" />
              {errors.curp && <p className="text-[10px] text-red-500 mt-0.5">{errors.curp.message}</p>}
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: Contacto */}
        <div className="bg-white p-5 border border-slate-200 rounded-md space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">4. Medios de Contacto</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Teléfono</label>
              <input type="text" {...register('telefono')} className={`w-full text-xs px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none ${errors.telefono ? 'border-red-500' : 'border-slate-300' }` } placeholder="Ej. 771XXXXXXX" maxLength="10" />
              {errors.telefono && <p className="text-[10px] text-red-500 mt-0.5">{errors.telefono.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Correo Electrónico</label>
              <input type="text" {...register('email')} className={`w-full text-xs px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none ${errors.email ? 'border-red-500' : 'border-slate-300'}`} placeholder="Ej. correo@ejemplo.com"/>
              {errors.email && <p className="text-[10px] text-red-500 mt-0.5">{errors.email.message}</p>}
            </div>
          </div>
        </div>

        {/* SECCIÓN 5: Acceso al sistema e historial */}
        <div className="bg-white p-5 border border-slate-200 rounded-md space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">5. Configuración de Acceso y Alta</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Usuario del Sistema Vinculado (Opcional)</label>
              <select {...register('idUsuario')} className="w-full text-xs px-3 py-2 border bg-white border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none">
                <option value="">Sin usuario asignado (Personal de campo)</option>
                {usuarios.map(u => <option key={u.idUsuario} value={u.idUsuario}>{u.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fecha de Ingreso *</label>
              <input type="date" {...register('fechaAlta')} className={`w-full text-xs px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none ${errors.fechaAlta ? 'border-red-500' : 'border-slate-300'}`} />
              {errors.fechaAlta && <p className="text-[10px] text-red-500 mt-0.5">{errors.fechaAlta.message}</p>}
            </div>
            <div className="flex items-center h-10 pl-1">
              <input 
                id="activo" 
                type="checkbox" 
                {...register('activo')}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="activo" className="ml-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                Trabajador Activo en Plantilla
              </label>
            </div>
          </div>
        </div>

        {errorServidor && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-center">
            <p className="text-xs text-red-600 font-medium">{errorServidor}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => navigate('/trabajadores')}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitMutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TrabajadorFormPage;