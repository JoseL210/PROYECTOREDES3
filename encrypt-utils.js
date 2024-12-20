const fs = require('fs');
const crypto = require('crypto');

// Configuración de la clave y el algoritmo de encriptación
const algorithm = 'aes-256-cbc';
const secretKey = crypto.randomBytes(32); // Sustituir con una clave fija en producción
const iv = crypto.randomBytes(16); // Vector de inicialización

// Ruta al servidor NFS (ajustar según la configuración)
const nfsPath = '/ruta/al/servidor/nfs/datos.json';

// Función para encriptar datos
function encryptData(data) {
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
    };
}

// Función para desencriptar datos
function decryptData(encrypted) {
    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(encrypted.iv, 'hex'));
    let decrypted = decipher.update(encrypted.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
}

// Función para guardar datos en el servidor NFS
function saveToNFS(data) {
    const encrypted = encryptData(data);
    fs.writeFile(nfsPath, JSON.stringify(encrypted, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Error al guardar los datos en el servidor NFS:', err);
        } else {
            console.log('Datos guardados en el servidor NFS correctamente.');
        }
    });
}

// Función para leer y desencriptar datos del servidor NFS
function readFromNFS() {
    if (fs.existsSync(nfsPath)) {
        const encryptedData = JSON.parse(fs.readFileSync(nfsPath, 'utf8'));
        return decryptData(encryptedData);
    } else {
        console.error('El archivo no existe en el servidor NFS.');
        return null;
    }
}

module.exports = { encryptData, decryptData, saveToNFS, readFromNFS };
