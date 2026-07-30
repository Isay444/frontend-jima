import axiosInstance from './axiosInstance';

export const getAll = async () => {
  const response = await axiosInstance.get('/gastos-fijos');
  return response.data;
};

export const getById = async (id) => {
  const response = await axiosInstance.get(`/gastos-fijos/${id}`);
  return response.data;
};

export const getMesActual = async () => {
  const response = await axiosInstance.get('/gastos-fijos/mes-actual');
  return response.data;
};

export const getConResto = async () => {
  const response = await axiosInstance.get('/gastos-fijos/con-resto');
  return response.data;
};

export const getConExcedente = async () => {
  const response = await axiosInstance.get('/gastos-fijos/con-excedente');
  return response.data;
};

export const getConAhorro = async () => {
  const response = await axiosInstance.get('/gastos-fijos/con-ahorro');
  return response.data;
};

// Devuelve un arreglo de strings para el datalist
export const getDescripciones = async () => {
  const response = await axiosInstance.get('/gastos-fijos/descripciones');
  return response.data;
};

export const create = async (data) => {
  const response = await axiosInstance.post('/gastos-fijos', data);
  return response.data;
};

export const update = async (id, data) => {
  const response = await axiosInstance.put(`/gastos-fijos/${id}`, data);
  return response.data;
};

export const remove = async (id) => {
  const response = await axiosInstance.delete(`/gastos-fijos/${id}`);
  return response.data;
};

export const marcarListoParaPagar = async (id) => {
  const response = await axiosInstance.patch(`/gastos-fijos/${id}/listo-para-pagar`);
  return response.data;
};