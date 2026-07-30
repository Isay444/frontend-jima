import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

//Internceptor de request: añade token si existe (Inyecta el token JWT en cada peticion)
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor de response: maneja errores globales - 401 (Ejemplo: redirigir a login si token expira)
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("nombre");
            //Redireccion directa al Login en caso de token expirado o no valido
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;