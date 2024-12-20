const axios = require('axios'); // Para solicitudes HTTP
const readline = require('readline'); // Para la interacción con el usuario en la consola

const SERVER_URL = 'http://localhost:8080'; // URL base del servidor

// Configuración para entrada de usuario desde la consola
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Función principal para mostrar el menú e interactuar con el usuario
function showMenu() {
    console.log('\n--- Menú ---');
    console.log('1. Crear o Actualizar Datos');
    console.log('2. Leer Datos');
    console.log('3. Eliminar Datos');
    console.log('4. Ver Log de Auditoría');
    console.log('5. Ver Log de Errores');
    console.log('6. Salir');
    rl.question('Elige una opción: ', async (choice) => {
        switch (choice) {
            case '1':
                await handleCreateOrUpdate();
                break;
            case '2':
                await handleReadData();
                break;
            case '3':
                await handleDeleteData();
                break;
            case '4':
                await handleViewAuditLog();
                break;
            case '5':
                await handleViewErrorLog();
                break;
            case '6':
                console.log('Saliendo...');
                rl.close();
                return;
            default:
                console.log('Opción no válida.');
        }
        showMenu(); // Mostrar el menú nuevamente después de cada acción
    });
}

// Función para manejar la creación o actualización de datos
async function handleCreateOrUpdate() {
    rl.question('Ingresa el ID del dato: ', (id) => {
        rl.question('Ingresa el contenido del dato: ', async (content) => {
            try {
                const response = await sendRequest('POST', `/data/${id}`, content);
                console.log('Respuesta del servidor:', response);
            } catch (err) {
                console.error('Error:', err.message);
            }
            showMenu();
        });
    });
}

// Función para leer datos por ID
async function handleReadData() {
    rl.question('Ingresa el ID del dato a leer: ', async (id) => {
        try {
            const response = await sendRequest('GET', `/data/${id}`);
            console.log('Respuesta del servidor:', response);
        } catch (err) {
            console.error('Error:', err.message);
        }
        showMenu();
    });
}

// Función para eliminar datos por ID
async function handleDeleteData() {
    rl.question('Ingresa el ID del dato a eliminar: ', async (id) => {
        try {
            const response = await sendRequest('DELETE', `/data/${id}`);
            console.log('Respuesta del servidor:', response);
        } catch (err) {
            console.error('Error:', err.message);
        }
        showMenu();
    });
}

// Función para ver el log de auditoría
async function handleViewAuditLog() {
    try {
        const response = await sendRequest('GET', '/audit-log');
        console.log('--- Log de Auditoría ---\n' + response);
    } catch (err) {
        console.error('Error:', err.message);
    }
    showMenu();
}

// Función para ver el log de errores
async function handleViewErrorLog() {
    try {
        const response = await sendRequest('GET', '/error-log');
        console.log('--- Log de Errores ---\n' + response);
    } catch (err) {
        console.error('Error:', err.message);
    }
    showMenu();
}

// Función genérica para enviar solicitudes HTTP al servidor
async function sendRequest(method, endpoint, body = null) {
    try {
        const options = {
            method,
            url: `${SERVER_URL}${endpoint}`,
            data: body ? body : undefined,
            headers: {
                'Content-Type': 'text/plain', // Datos enviados como texto plano
            },
        };

        const response = await axios(options);
        return response.data;
    } catch (err) {
        if (err.response) {
            // El servidor respondió con un error
            throw new Error(
                `Error del servidor (Código: ${err.response.status}): ${err.response.data}`
            );
        } else if (err.request) {
            // No hubo respuesta del servidor
            throw new Error('No se recibió respuesta del servidor.');
        } else {
            // Error en la configuración de la solicitud
            throw new Error(`Error al realizar la solicitud: ${err.message}`);
        }
    }
}

// Iniciar el cliente
showMenu();
