import axiosInstance from "./axiosInstance";

export const getAll = async () => {
    const response = await axiosInstance.get('/usuarios');
    return response.data;
}

export const getById = async (id) => {
    const response = await axiosInstance.get(`/usuarios/${id}`);
    return response.data;
  };
  
  export const create = async (data) => {
  const response = await axiosInstance.post('/usuarios', data);
  return response.data;
  };
  
  export const update = async (id, data) => {
    const response = await axiosInstance.put(`/usuarios/${id}`, data);
    return response.data;
  };
  
  export const remove = async (id, idUsuarioActual) => {
    const response = await axiosInstance.delete(`/usuarios/${id}`, {params: { idUsuarioActual}});
    return response.data;
  };

  export const cambiarPassword = async (id, body) => {
    const response = await axiosInstance.patch(`/usuarios/${id}/cambiar-password`, body);
   return response.data;
  };
/*
  export const getRoles = async () => {
    const response = await axiosInstance.get('/roles');
    return response.data;
  };
  */

  export const activarDesactivar = async (id, idUsuarioActual) => {
    const response = await axiosInstance.patch(`/usuarios/${id}/activar-desactivar`, {params: { idUsuarioActual}});
    return response.data;
  };
