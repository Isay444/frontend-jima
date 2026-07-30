import axiosInstance from './axiosInstance';

// Obtiene todos los recibos asociados a una orden específica
export const getByOrden = async (idOrden) => {
  const { data } = await axiosInstance.get(`/recibos/orden/${idOrden}`);
  return data;
};

// Obtiene el detalle de un recibo por su ID
export const getById = async (id) => {
  const { data } = await axiosInstance.get(`/recibos/${id}`);
  return data;
};

// Crea un nuevo recibo en el sistema
export const create = async (payload) => {
  const { data } = await axiosInstance.post('/recibos', payload);
  return data;
};

// Actualiza los datos de un recibo existente (no confirmado)
export const update = async (id, payload) => {
  const { data } = await axiosInstance.put(`/recibos/${id}`, payload);
  return data;
};

// Confirma un recibo de forma irreversible, aplicando el abono a la orden
export const confirmar = async (id) => {
  const { data } = await axiosInstance.patch(`/recibos/${id}/confirmar`);
  return data;
};

// Elimina un recibo (siempre que no esté confirmado ni sea el anticipo original)
export const remove = async (id) => {
  const { data } = await axiosInstance.delete(`/recibos/${id}`);
  return data;
};