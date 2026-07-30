import axiosInstance from "./axiosInstance";

export const getAll = async () => {
    const response = await axiosInstance.get('/tipos-terreno');
    return response.data;
}

export const getById = async (id) => {
    const response = await axiosInstance.get(`/tipos-terreno/${id}`);
    return response.data;
  };
  
  export const create = async (data) => {
    const response = await axiosInstance.post('/tipos-terreno', data);
    return response.data;
  };
  
  export const update = async (id, data) => {
    const response = await axiosInstance.put(`/tipos-terreno/${id}`, data);
    return response.data;
  };
  
  export const remove = async (id) => {
    const response = await axiosInstance.delete(`/tipos-terreno/${id}`);
    return response.data;
  };
