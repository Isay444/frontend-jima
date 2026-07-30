import axiosInstance from './axiosInstance';

export const getAll = async () => {
  const response = await axiosInstance.get('/municipios');
  return response.data;
};
export const getById = async (id) => {
    const response = await axiosInstance.get(`/municipios/${id}`);
    return response.data;
  };
  
  export const create = async (data) => {
    const response = await axiosInstance.post('/municipios', data);
    return response.data;
  };
  
  export const update = async (id, data) => {
    const response = await axiosInstance.put(`/municipios/${id}`, data);
    return response.data;
  };
  
  export const remove = async (id) => {
    const response = await axiosInstance.delete(`/municipios/${id}`);
    return response.data;
  };
