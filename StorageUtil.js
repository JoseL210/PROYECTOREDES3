const fs = require('fs').promises; // Para manejar operaciones de sistema de archivos
const path = require('path');

class StorageUtil {
    /**
     * Guarda datos en un archivo.
     * @param {string} filePath - Ruta completa del archivo.
     * @param {string} data - Datos a guardar en el archivo.
     */
    static async saveToFile(filePath, data) {
        try {
            await fs.writeFile(filePath, data, 'utf8');
            console.log(`Datos guardados en el archivo: ${filePath}`);
        } catch (error) {
            console.error(`Error al guardar datos en el archivo: ${filePath}`, error);
            throw error;
        }
    }

    /**
     * Lee datos desde un archivo.
     * @param {string} filePath - Ruta completa del archivo.
     * @returns {Promise<string>} - Datos leídos del archivo.
     */
    static async readFromFile(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            console.log(`Datos leídos desde el archivo: ${filePath}`);
            return data;
        } catch (error) {
            console.error(`Error al leer datos del archivo: ${filePath}`, error);
            throw error;
        }
    }

    /**
     * Crea un directorio si no existe.
     * @param {string} directoryPath - Ruta completa del directorio.
     */
    static async createDirectoryIfNotExists(directoryPath) {
        try {
            await fs.mkdir(directoryPath, { recursive: true });
            console.log(`Directorio verificado o creado: ${directoryPath}`);
        } catch (error) {
            console.error(`Error al crear el directorio: ${directoryPath}`, error);
            throw error;
        }
    }
}

module.exports = StorageUtil;
