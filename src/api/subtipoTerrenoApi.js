import axiosInstance from "./axiosInstance";

export const getAll = async () => {
    const response = await axiosInstance.get('/subtipos-terreno');
    return response.data;
}

export const getById = async (id) => {
    const response = await axiosInstance.get(`/subtipos-terreno/${id}`);
    return response.data;
  };
  
  export const create = async (data) => {
    const response = await axiosInstance.post('/subtipos-terreno', data);
    return response.data;
  };
  
  export const update = async (id, data) => {
    const response = await axiosInstance.put(`/subtipos-terreno/${id}`, data);
    return response.data;
  };
  
  export const remove = async (id) => {
    const response = await axiosInstance.delete(`/subtipos-terreno/${id}`);
    return response.data;
  };
