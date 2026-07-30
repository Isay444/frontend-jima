export const formatCurrency = (monto) => {
  if (monto === null || monto === undefined || isNaN(monto)) return '$0.00';
  return new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN' 
    }).format(monto);
};

export const formatDate = (fecha) => {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-MX', { 
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatFolio = (folio) => folio || '—';

export const formatEstatus = (estatus) => {
  const mapiado = {
    ACTIVA: { label: 'Activa', variant: 'default' },
    TERMINADA: { label: 'Terminada', variant: 'success' },
    CANCELADA: { label: 'Cancelada', variant: 'destructive' },
  };
  return mapiado[estatus] || { label: estatus, variant: 'secondary' };
};