import axiosInstance from "./axiosInstance";

export const getAll = async () => {
    const response = await axiosInstance.get('/puestos');
    return response.data;
}

export const getById = async (id) => {
    const response = await axiosInstance.get(`/puestos/${id}`);
    return response.data;
  };
  
  export const create = async (data) => {
    const response = await axiosInstance.post('/puestos', data);
    return response.data;
  };
  
  export const update = async (id, data) => {
    const response = await axiosInstance.put(`/puestos/${id}`, data);
    return response.data;
  };
  
  export const remove = async (id) => {
    const response = await axiosInstance.delete(`/puestos/${id}`);
    return response.data;
  };
