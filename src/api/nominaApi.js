import axiosInstance from './axiosInstance';

export const getAll = async () => {
  const response = await axiosInstance.get('/nominas');
  return response.data;
};

export const getById = async (id) => {
  const response = await axiosInstance.get(`/nominas/${id}`);
  return response.data;
};

export const getRango = async (fechaInicio, fechaFin) => {
  const response = await axiosInstance.get('/nominas/rango', {
    params: { fechaInicio, fechaFin }
  });
  return response.data;
};

export const create = async (data) => {
  const response = await axiosInstance.post('/nominas', data);
  return response.data;
};

export const update = async (id, data) => {
  const response = await axiosInstance.put(`/nominas/${id}`, data);
  return response.data;
};

export const remove = async (id) => {
  const response = await axiosInstance.delete(`/nominas/${id}`);
  return response.data;
};

export const marcarPagado = async (id) => {
  const response = await axiosInstance.patch(`/nominas/${id}/marcar-pagado`);
  return response.data;
};