import axiosInstance from "./axiosInstance";

/**
 * Realiza la petición de login al backend de Spring Boot
 * @param {string} nombre - Mapeado exactamente igual que en la base de datos MySQL
 * @param {string} contrasenia - Mapeado exactamente igual que en la base de datos MySQL
 */

export const login = async (nombre, contrasenia) => {
        const response = await axiosInstance.post("/auth/login", {
            nombre: nombre,
            contrasenia: contrasenia
        });
        return response.data; // Retorna el payload: { token, nombre, idUsuario, nombreRol, permisos[] }
};