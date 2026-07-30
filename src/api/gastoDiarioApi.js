import axiosInstance from './axiosInstance';

export const getAll = async () => {
  const response = await axiosInstance.get('/gastos-diarios');
  return response.data;
};

export const getById = async (id) => {
  const response = await axiosInstance.get(`/gastos-diarios/${id}`);
  return response.data;
};

export const getRango = async (fechaInicio, fechaFin) => {
  const response = await axiosInstance.get('/gastos-diarios/rango', {
    params: { fechaInicio, fechaFin }
  });
  return response.data;
};

export const create = async (data) => {
  const response = await axiosInstance.post('/gastos-diarios', data);
  return response.data;
};

export const update = async (id, data) => {
  const response = await axiosInstance.put(`/gastos-diarios/${id}`, data);
  return response.data;
};

export const remove = async (id) => {
  const response = await axiosInstance.delete(`/gastos-diarios/${id}`);
  return response.data;
};