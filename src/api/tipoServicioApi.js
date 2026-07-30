import axiosInstance from "./axiosInstance";

export const getAll = async () => {
    const response = await axiosInstance.get('/tipos-servicio');
    return response.data;
}

export const getById = async (id) => {
    const response = await axiosInstance.get(`/tipos-servicio/${id}`);
    return response.data;
  };
  
  export const create = async (data) => {
    const response = await axiosInstance.post('/tipos-servicio', data);
    return response.data;
  };
  
  export const update = async (id, data) => {
    const response = await axiosInstance.put(`/tipos-servicio/${id}`, data);
    return response.data;
  };
  
  export const remove = async (id) => {
    const response = await axiosInstance.delete(`/tipos-servicio/${id}`);
    return response.data;
  };
