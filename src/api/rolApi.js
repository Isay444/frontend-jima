import axiosInstance from './axiosInstance';

export const getAll = async () => {
  const response = await axiosInstance.get('/roles');
  return response.data;
};

export const getById = async (id) => {
  const response = await axiosInstance.get(`/roles/${id}`);
  return response.data;
};

export const create = async (data) => {
  const response = await axiosInstance.post('/roles', data);
  return response.data;
};

export const actualizarPermisos = async (id, idPermisos) => {
  // Se envía el array plano directamente como requiere el backend, sin envolver en objeto
  const response = await axiosInstance.put(`/roles/${id}/permisos`, idPermisos);
  return response.data;
};

export const activarDesactivar = async (id) => {
  const response = await axiosInstance.patch(`/roles/${id}/activar-desactivar`);
  return response.data;
};

export const remove = async (id) => {
  const response = await axiosInstance.delete(`/roles/${id}`);
  return response.data;
};

export const getPermisosDisponibles = async () => {
  // Ruta base /api/v1 configurada en axiosInstance, por lo que usamos /permisos directamente
  const response = await axiosInstance.get('/permisos');
  return response.data;
};