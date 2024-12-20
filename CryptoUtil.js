const crypto = require('crypto');

// Clase CryptoUtil
class CryptoUtil {
    /**
     * Encripta los datos usando una clave secreta AES
     * @param {string} data - Datos a encriptar
     * @param {Buffer} key - Clave secreta en formato Buffer
     * @returns {string} - Datos encriptados en Base64
     */
    static encrypt(data, key) {
        const cipher = crypto.createCipheriv('aes-256-ecb', key, null); // ECB no requiere IV
        let encrypted = cipher.update(data, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    }

    /**
     * Desencripta los datos en Base64 usando una clave secreta AES
     * @param {string} encryptedData - Datos encriptados en Base64
     * @param {Buffer} key - Clave secreta en formato Buffer
     * @returns {string} - Datos desencriptados
     */
    static decrypt(encryptedData, key) {
        const decipher = crypto.createDecipheriv('aes-256-ecb', key, null); // ECB no requiere IV
        let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    /**
     * Genera una clave secreta a partir de un array de bytes
     * @param {Buffer|string} keyData - Datos de la clave (en formato Buffer o string)
     * @returns {Buffer} - Clave secreta como Buffer
     */
    static generateKey(keyData) {
        return Buffer.from(keyData);
    }
}

module.exports = CryptoUtil;
