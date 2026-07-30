import axiosInstance from "./axiosInstance";

export const getAll = async () => {
    const response = await axiosInstance.get('/ingenieros');
    return response.data;
}

export const getById = async (id) => {
    const response = await axiosInstance.get(`/ingenieros/${id}`);
    return response.data;
  };
  
  export const create = async (data) => {
    const response = await axiosInstance.post('/ingenieros', data);
    return response.data;
  };
  
  export const update = async (id, data) => {
    const response = await axiosInstance.put(`/ingenieros/${id}`, data);
    return response.data;
  };
  
  export const remove = async (id) => {
    const response = await axiosInstance.delete(`/ingenieros/${id}`);
    return response.data;
  };
