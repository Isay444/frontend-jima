import axiosInstance from "./axiosInstance";

export const getAll = async () => {
    const response = await axiosInstance.get('/zonas-ejidales');
    return response.data;
}

export const getById = async (id) => {
    const response = await axiosInstance.get(`/zonas-ejidales/${id}`);
    return response.data;
  };
  
  export const create = async (data) => {
    const response = await axiosInstance.post('/zonas-ejidales', data);
    return response.data;
  };
  
  export const update = async (id, data) => {
    const response = await axiosInstance.put(`/zonas-ejidales/${id}`, data);
    return response.data;
  };
  
  export const remove = async (id) => {
    const response = await axiosInstance.delete(`/zonas-ejidales/${id}`);
    return response.data;
  };
