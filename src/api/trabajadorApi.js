import axiosInstance from './axiosInstance';

export const getAll = async () => {
  const response = await axiosInstance.get('/trabajadores');
  return response.data;
};

export const getActivos = async () => {
  const response = await axiosInstance.get('/trabajadores/activos');
  return response.data;
};

export const getById = async (id) => {
  const response = await axiosInstance.get(`/trabajadores/${id}`);
  return response.data;
};

export const create = async (data) => {
  const response = await axiosInstance.post('/trabajadores', data);
  return response.data;
};

export const update = async (id, data) => {
  const response = await axiosInstance.put(`/trabajadores/${id}`, data);
  return response.data;
};

export const remove = async (id) => {
  const response = await axiosInstance.delete(`/trabajadores/${id}`);
  return response.data;
};

/**
 * Endpoint especial para actualizar el estatus laboral a Inactivo
 * @param {number|string} id 
 * @param {Object} data -> { fechaBaja, motivoBaja }
 */
export const darDeBaja = async (id, data) => {
  const response = await axiosInstance.patch(`/trabajadores/${id}/dar-de-baja`, data);
  return response.data;
};