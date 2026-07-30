/**
 * Descarga un archivo Blob creando un enlace temporal en el DOM.
 * Libera automáticamente la URL temporal para evitar fugas de memoria.
 *
 * @param {Blob} blobData - El blob recibido de la respuesta de axios
 * @param {string} filename - Nombre del archivo a descargar
 */
export const triggerDownload = (blobData, filename) => {
    const url = window.URL.createObjectURL(blobData);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};