import axiosInstance from './axiosInstance';

export const getAll = async () => {
  const response = await axiosInstance.get('/ordenes');
  return response.data;
};

export const getById = async (id) => {
  const response = await axiosInstance.get(`/ordenes/${id}`);
  return response.data;
};

export const create = async (data) => {
  const response = await axiosInstance.post('/ordenes', data);
  return response.data;
};

export const update = async (id, data) => {
  const response = await axiosInstance.put(`/ordenes/${id}`, data);
  return response.data;
};

export const cancelar = async (id) => {
  const response = await axiosInstance.patch(`/ordenes/${id}/cancelar`);
  return response.data;
};

export const remove = async (id) => {
  const response = await axiosInstance.delete(`/ordenes/${id}`);
  return response.data;
};

export const getFolioPreview = async () => {
  const response = await axiosInstance.get('/ordenes/folio-preview');
  return response.data;
};

export const actualizarEstadoPlano = async(id, estadoPlano) => {
  const response = await axiosInstance.patch(`/ordenes/${id}/estado-plano?estadoPlano=${estadoPlano}`);
  return response.data;
};

export const subirPlano = async(id, archivo) => {
  const formData = new FormData();
  formData.append('archivo', archivo)
  const response = await axiosInstance.post(`/ordenes/${id}/plano`, formData, {
    headers: {'Content-Type': 'multipart/form-data'},
  });
  return response.data;
}