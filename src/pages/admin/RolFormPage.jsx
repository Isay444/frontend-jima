import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { AlertCircle, CheckCircle } from 'lucide-react';

import * as rolApi from '@/api/rolApi';
import PermisosMatrix from '@/components/shared/PermisosMatrix';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

const rolSchema = zod.object({
  nombre: zod.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: zod.string().max(200, 'Máximo 200 caracteres').optional(),
  activo: zod.boolean().default(true)
});

const RolFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const esEdicion = Boolean(id);

  const [permisosSeleccionados, setPermisosSeleccionados] = useState(new Set());
  const [errorPermisos, setErrorPermisos] = useState(false);
  const [exitoGuardado, setExitoGuardado] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(rolSchema),
    defaultValues: { nombre: '', descripcion: '', activo: true }
  });

  const { data: catalogoPermisos = [], isLoading: cargandoCatalogo } = useQuery({
    queryKey: ['permisos-disponibles'],
    queryFn: rolApi.getPermisosDisponibles
  });

  const { data: rolData, isLoading: cargandoRol } = useQuery({
    queryKey: ['rol', id],
    queryFn: () => rolApi.getById(id),
    enabled: esEdicion,
  });

  // Efecto para sincronizar los permisos al cargar datos existentes
  useEffect(() => {
    if (esEdicion && rolData?.permisos) {
      const ids = new Set(rolData.permisos.map(p => p.idPermiso));
      setPermisosSeleccionados(ids);
    }
  }, [rolData, esEdicion]);

  // Se oculta la alerta de éxito al cabo de 10 segundos
  useEffect(() => {
    if (exitoGuardado) {
      const t = setTimeout(() => setExitoGuardado(false), 10000);
      return () => clearTimeout(t);
    }
  }, [exitoGuardado]);

  const mutationCreate = useMutation({
    mutationFn: (data) => rolApi.create({
      ...data,
      idPermisos: Array.from(permisosSeleccionados)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      navigate('/admin/roles');
    }
  });

  const mutationUpdate = useMutation({
    mutationFn: () => rolApi.actualizarPermisos(id, Array.from(permisosSeleccionados)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['rol', id] });
      setExitoGuardado(true);
    }
  });

  const onSubmitCreacion = (data) => {
    if (permisosSeleccionados.size === 0) {
      setErrorPermisos(true);
      return;
    }
    setErrorPermisos(false);
    mutationCreate.mutate(data);
  };

  const handleGuardarEdicion = () => {
    if (permisosSeleccionados.size === 0) {
      setErrorPermisos(true);
      return;
    }
    setErrorPermisos(false);
    mutationUpdate.mutate();
  };

  if (esEdicion && (cargandoRol || cargandoCatalogo)) return <div className="text-center p-10 text-slate-500 text-sm">Cargando matriz de permisos...</div>;
  if (!esEdicion && cargandoCatalogo) return <div className="text-center p-10 text-slate-500 text-sm">Cargando catálogo de permisos...</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6"> 
      <div className="mb-6"> 
        <h2 className="text-lg font-bold text-slate-900"> {esEdicion ? 'Ajustar Permisos del Rol' : 'Crear Nuevo Rol'} </h2>
        <p className="mt-1 text-xs text-slate-500">
          {esEdicion
            ? 'Modifique únicamente los niveles de acceso del rol.'
            : 'Defina un perfil de acceso base para asignarlo posteriormente a los usuarios.'}
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5">
          {esEdicion ? (
            <div className="space-y-4">
              <Alert className="border-blue-100 bg-blue-50 py-3 text-blue-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-xs">
                </AlertTitle>
                <AlertDescription className="text-xs text-blue-800">
                  El nombre y descripción del rol no son editables por seguridad e
                  integridad de la auditoría.  Únicamente puede reconfigurar los
                  accesos del perfil.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-500">
                    Nombre del Rol
                  </Label>

                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold uppercase text-slate-700">
                    {rolData?.nombre}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-500">
                    Descripción
                  </Label>

                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    {rolData?.descripcion || 'Sin descripción asignada.'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form
              id="form-creacion"
              onSubmit={handleSubmit(onSubmitCreacion)}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <div className="space-y-1">
                <Label
                  htmlFor="nombre"
                  className="text-xs font-medium text-slate-700"
                >
                  Nombre del Rol *
                </Label>

                <Input
                  id="nombre"
                  {...register('nombre')}
                  className={`h-9 text-xs uppercase ${
                    errors.nombre
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                  }`}
                />

                {errors.nombre && (
                  <p className="text-[10px] text-red-500">
                    {errors.nombre.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="descripcion"
                  className="text-xs font-medium text-slate-700"
                >
                  Descripción
                </Label>

                <Input
                  id="descripcion"
                  {...register('descripcion')}
                  className={`h-9 text-xs ${
                    errors.descripcion
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                  }`}
                />

                {errors.descripcion && (
                  <p className="text-[10px] text-red-500">
                    {errors.descripcion.message}
                  </p>
                )}
              </div>

              <Controller
                name="activo"
                control={control}
                render={({ field }) => (
                  <div className="mt-2 flex items-center gap-2 md:col-span-2">
                    <Checkbox
                      id="activo"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />

                    <Label
                      htmlFor="activo"
                      className="cursor-pointer text-xs font-medium text-slate-700"
                    >
                      Rol activo al crear
                    </Label>
                  </div>
                )}
              />
            </form>
          )}
        </CardContent>
      </Card>

      {/* MATRIZ DE PERMISOS */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Matriz de Accesos</h3>
          <p className="text-xs text-slate-500">Seleccione las acciones que estarán permitidas para este perfil.</p>
        </div>
        
        {errorPermisos && (
          <p className="text-xs font-medium text-red-600 mb-2">Debe seleccionar al menos un permiso para guardar el rol.</p>
        )}
        
        <PermisosMatrix 
          catalogoPermisos={catalogoPermisos}
          permisosSeleccionados={permisosSeleccionados}
          onChange={(nuevoSet) => {
            setPermisosSeleccionados(nuevoSet);
            if (nuevoSet.size > 0) setErrorPermisos(false);
          }}
        />
      </div>

      {exitoGuardado && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Permisos actualizados</AlertTitle>
          <AlertDescription>
            Los permisos han sido actualizados exitosamente en la base de datos.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-end gap-3 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/admin/roles')}
        >
          {esEdicion ? 'Regresar al listado' : 'Cancelar'}
        </Button>

        {esEdicion ? (
          <Button
            type="button"
            onClick={handleGuardarEdicion}
            disabled={mutationUpdate.isPending}
          >
            {mutationUpdate.isPending
              ? 'Guardando cambios...'
              : 'Guardar permisos'}
          </Button>
        ) : (
          <Button
            type="submit"
            form="form-creacion"
            disabled={mutationCreate.isPending}
          >
            {mutationCreate.isPending
              ? 'Creando rol...'
              : 'Crear rol de sistema'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default RolFormPage;