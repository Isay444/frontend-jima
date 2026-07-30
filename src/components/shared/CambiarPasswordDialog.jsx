import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useMutation } from '@tanstack/react-query';
import * as usuarioApi from '@/api/usuarioApi';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const passwordSchema = zod.object({
  contraseniaActual: zod.string().min(1, 'La contraseña actual es obligatoria'),
  contraseniaNueva: zod.string().min(6, 'Debe tener al menos 6 caracteres'),
  confirmarPassword: zod.string()
}).refine(data => data.contraseniaNueva === data.confirmarPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmarPassword']
});

const CambiarPasswordDialog = ({ open, onClose, usuarioId, nombreUsuario }) => {
  const [errorServidor, setErrorServidor] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { contraseniaActual: '', contraseniaNueva: '', confirmarPassword: '' }
  });

  useEffect(() => {
    if (open) {
      reset();
      setErrorServidor('');
    }
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (data) => usuarioApi.cambiarPassword(usuarioId, {
      contraseniaActual: data.contraseniaActual,
      contraseniaNueva: data.contraseniaNueva
    }),
    onSuccess: () => {
      alert(`Contraseña actualizada exitosamente para ${nombreUsuario}`);
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data?.mensaje || err.response?.data?.message || 'Error al intentar cambiar la contraseña.';
      setErrorServidor(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
          <DialogDescription>
            Actualizar credenciales de <strong>{nombreUsuario}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-4">
          {errorServidor && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-md text-center text-xs font-medium text-red-600">
              {errorServidor}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Contraseña Actual *</label>
            <input
              type="password"
              {...register('contraseniaActual')}
              className={`w-full text-xs px-3 py-2 border rounded-md outline-none ${
                errors.contraseniaActual
                  ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-slate-300 focus:ring-1 focus:ring-blue-500'
              }`}
            />
            {errors.contraseniaActual && (
              <p className="text-[10px] text-red-500 mt-0.5">{errors.contraseniaActual.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nueva Contraseña *</label>
            <input
              type="password"
              {...register('contraseniaNueva')}
              className={`w-full text-xs px-3 py-2 border rounded-md outline-none ${
                errors.contraseniaNueva
                  ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-slate-300 focus:ring-1 focus:ring-blue-500'
              }`}
            />
            {errors.contraseniaNueva && (
              <p className="text-[10px] text-red-500 mt-0.5">{errors.contraseniaNueva.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Confirmar Nueva Contraseña *</label>
            <input
              type="password"
              {...register('confirmarPassword')}
              className={`w-full text-xs px-3 py-2 border rounded-md outline-none ${
                errors.confirmarPassword
                  ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-slate-300 focus:ring-1 focus:ring-blue-500'
              }`}
            />
            {errors.confirmarPassword && (
              <p className="text-[10px] text-red-500 mt-0.5">{errors.confirmarPassword.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Actualizando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CambiarPasswordDialog;