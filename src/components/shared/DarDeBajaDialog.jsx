import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const bajaSchema = zod.object({
  fechaBaja: zod.string().min(1, 'Fecha de baja requerida'),
  motivo: zod.string().min(5, 'Ingresa el motivo de baja (mínimo 5 caracteres)'),
});

export const DarDeBajaDialog = ({ open, nombreTrabajador, onConfirm, onCancel }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(bajaSchema),
    defaultValues: { fechaBaja: '', motivo: 'Motivos no especificados' }
  });

  // Limpiar el formulario cuando se abre el diálogo
  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      onCancel(); // llama al cancelar externo
      reset({ fechaBaja: '', motivo: 'Motivos no especificados' });
    }
  };

  const onSubmit = (data) => {
    onConfirm(data);
    reset({ fechaBaja: '', motivo: 'Motivos no especificados' });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dar de Baja Trabajador</DialogTitle>
          <DialogDescription>
            Estás registrando la baja laboral de:{' '}
            <span className="font-semibold text-slate-800">{nombreTrabajador}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Fecha de Baja *
            </label>
            <input
              type="date"
              {...register('fechaBaja')}
              className={`w-full text-xs px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none ${
                errors.fechaBaja ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.fechaBaja && (
              <p className="text-[10px] text-red-500 mt-0.5">{errors.fechaBaja.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Motivo de la Baja *
            </label>
            <textarea
              rows={3}
              {...register('motivo')}
              placeholder="Describa brevemente la razón de la baja (ej. Renuncia voluntaria, fin de contrato)..."
              className={`w-full text-xs px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none resize-none ${
                errors.motivo ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.motivo && (
              <p className="text-[10px] text-red-500 mt-0.5">{errors.motivo.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive">
              Dar de baja
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
/**/
/*

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';

const bajaSchema = zod.object({
  motivo: zod.string().min(5, 'Ingresa el motivo de baja (mínimo 5 caracteres)'),
});

export const DarDeBajaDialog = ({ open, nombreTrabajador, onConfirm, onCancel }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(bajaSchema),
    defaultValues: { fechaBaja: '', motivo: '' }
  });

  // Limpiar el estado interno del formulario al abrir/cerrar el modal
  useEffect(() => {
    if (open) {
      reset({ fechaBaja: '', motivo: '' });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [open, reset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 transition-opacity animate-in fade-in" onClick={onCancel} />
      
      <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150 z-10">
        <h3 className="text-lg font-semibold text-slate-900 leading-6 mb-1">
          Dar de Baja Trabajador
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Estás registrando la baja laboral de: <span className="font-semibold text-slate-800">{nombreTrabajador}</span>.
        </p>

        <form onSubmit={handleSubmit(onConfirm)} className="space-y-4">

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Motivo de la Baja *</label>
            <textarea 
              rows={3}
              {...register('motivo')}
              placeholder="Describa brevemente la razón de la baja (ej. Renuncia voluntaria, fin de contrato)..."
              className={`w-full text-xs px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none resize-none ${errors.motivo ? 'border-red-500' : 'border-slate-300'}`}
            />
            {errors.motivo && <p className="text-[10px] text-red-500 mt-0.5">{errors.motivo.message}</p>}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 outline-none transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 outline-none transition-colors shadow-sm"
            >
              Dar de baja
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

*/
