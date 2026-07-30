import axiosInstance from "./axiosInstance";
export const getAll = async () => {
    const response = await axiosInstance.get('/clientes');
    return response.data;
}

export const getById = async (id) => {
    const response = await axiosInstance.get(`/clientes/${id}`);
    return response.data;
  };
  
  export const create = async (data) => {
    const response = await axiosInstance.post('/clientes', data);
    return response.data;
  };
  
  export const update = async (id, data) => {
    const response = await axiosInstance.put(`/clientes/${id}`, data);
    return response.data;
  };
  
  export const remove = async (id) => {
    const response = await axiosInstance.delete(`/clientes/${id}`);
    return response.data;
  };