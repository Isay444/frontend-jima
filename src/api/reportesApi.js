import axiosInstance from './axiosInstance';

/**
 * API de reportes — todas las funciones descargan archivos Excel (.xlsx)
 * como blobs para que el frontend maneje la descarga vía triggerDownload.
 */

export const getReporteVentas = (fechaInicio, fechaFin) =>
    axiosInstance.get('/reportes/ventas', {
        params: { fechaInicio, fechaFin },
        responseType: 'blob',
    });

export const getReporteIngresos = (fechaInicio, fechaFin) =>
    axiosInstance.get('/reportes/ingresos', {
        params: { fechaInicio, fechaFin },
        responseType: 'blob',
    });

export const getReporteGastosDiarios = (fechaInicio, fechaFin) =>
    axiosInstance.get('/reportes/gastos-diarios', {
        params: { fechaInicio, fechaFin },
        responseType: 'blob',
    });

export const getReporteGastosFijos = (mes, anio) =>
    axiosInstance.get('/reportes/gastos-fijos', {
        params: { mes, anio },
        responseType: 'blob',
    });

export const getReporteNomina = (fechaInicio, fechaFin) =>
    axiosInstance.get('/reportes/nomina', {
        params: { fechaInicio, fechaFin },
        responseType: 'blob',
    });