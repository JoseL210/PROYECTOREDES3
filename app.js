const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const readline = require('readline');
const { saveToNFS, readFromNFS } = require('./encrypt-utils');
const AuditLogEntry = require('./AuditLogEntry');
const CryptoUtil = require('./CryptoUtil');
const DataEntry = require('./DataEntry');
const StorageUtil = require('./StorageUtil');
const bodyParser = require('body-parser');
const { syncDataBetweenNodes, getNodeStatus, getNodeUptime } = require('./DistributedSystemClient');

const app = express();
const port = 3000;
const SERVER_URL = `http://localhost:${port}`;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Generar clave AES para cifrado/descifrado
const keyData = '12345678901234567890123456789012';
const key = CryptoUtil.generateKey(keyData);

/** ================== RUTAS DEL SERVIDOR ================== **/

app.get('/', (req, res) => res.render('index'));
app.get('/registro', (req, res) => res.render('registro'));
app.get('/login', (req, res) => res.render('login'));
app.get('/paginap', (req, res) => res.render('paginap'));

app.post('/registro', (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    try {
        const id = Math.floor(100000 + Math.random() * 900000).toString();

        let usuarios = [];
        if (fs.existsSync('usuarios.json')) {
            usuarios = JSON.parse(fs.readFileSync('usuarios.json', 'utf8'));
        }

        const registro = { id, nombre, email, password };
        usuarios.push(registro);

        fs.writeFileSync('usuarios.json', JSON.stringify(usuarios, null, 2));

        res.redirect('/paginap');
    } catch (err) {
        console.error('Error al registrar usuario:', err.message);
        res.status(500).send('Error en el servidor.');
    }
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    try {
        const usuarios = JSON.parse(fs.readFileSync('usuarios.json', 'utf8'));
        const usuarioEncontrado = usuarios.find(u => u.email === email && u.password === password);

        if (usuarioEncontrado) {
            return res.redirect('/paginap');
        } else {
            return res.status(401).send('Correo electrónico o contraseña incorrectos');
        }
    } catch (err) {
        console.error('Error al iniciar sesión:', err.message);
        return res.status(500).send('Error en el servidor.');
    }
});

app.get('/save-test', async (req, res) => {
    const testData = { usuario: 'empleado123', contraseña: 'miContraseñaSegura', rol: 'administrador' };
    await saveToNFS(testData);
    res.send('Datos encriptados guardados correctamente en el servidor NFS.');
});

app.get('/read-test', async (req, res) => {
    const data = await readFromNFS();
    if (data) res.json(data);
    else res.status(500).send('No se pudieron leer los datos desde el servidor NFS.');
});

app.post('/api/logs', async (req, res) => {
    const { id, action } = req.body;
    if (!id || !action) return res.status(400).send('Faltan datos para registrar el log.');

    const logEntry = new AuditLogEntry(id, action);
    await StorageUtil.saveToFile('./logs.json', JSON.stringify(logEntry) + '\n');
    res.status(201).send('Log guardado exitosamente.');
});

app.post('/api/encrypt', (req, res) => {
    const { data } = req.body;
    if (!data) return res.status(400).send('Faltan datos para encriptar.');

    try {
        const encryptedData = CryptoUtil.encrypt(data, key);
        res.json({ encryptedData });
    } catch (err) {
        console.error('Error al encriptar:', err.message);
        res.status(500).send('Error al encriptar los datos.');
    }
});

app.post('/api/decrypt', (req, res) => {
    const { encryptedData } = req.body;
    if (!encryptedData) return res.status(400).send('Faltan datos para desencriptar.');

    try {
        const decryptedData = CryptoUtil.decrypt(encryptedData, key);
        res.json({ decryptedData });
    } catch (err) {
        console.error('Error al desencriptar:', err.message);
        res.status(500).send('Error al desencriptar los datos.');
    }
});

app.post('/api/data', async (req, res) => {
    const { id, content } = req.body;
    if (!id || !content) return res.status(400).send('Faltan datos para crear o actualizar un DataEntry.');

    const dataEntry = new DataEntry(id, content);
    const dataFile = './dataEntries.json';
    let dataEntries = [];

    if (fs.existsSync(dataFile)) {
        dataEntries = JSON.parse(await fs.promises.readFile(dataFile, 'utf8'));
    }

    dataEntries.push(dataEntry);
    await fs.promises.writeFile(dataFile, JSON.stringify(dataEntries, null, 2), 'utf8');
    res.status(201).json({ message: 'DataEntry guardado exitosamente', dataEntry });
});

app.get('/api/data', async (req, res) => {
    const dataFile = './dataEntries.json';
    if (fs.existsSync(dataFile)) {
        const dataEntries = JSON.parse(await fs.promises.readFile(dataFile, 'utf8'));
        res.json(dataEntries);
    } else {
        res.status(404).json({ message: 'No se encontraron entradas de datos.' });
    }
});

app.get('/api/data/:id', async (req, res) => {
    const dataFile = './dataEntries.json';
    if (fs.existsSync(dataFile)) {
        const dataEntries = JSON.parse(await fs.promises.readFile(dataFile, 'utf8'));
        const entry = dataEntries.find((d) => d.id === req.params.id);
        if (entry) res.json(entry);
        else res.status(404).json({ message: 'DataEntry no encontrado.' });
    } else {
        res.status(404).json({ message: 'No se encontraron entradas de datos.' });
    }
});

app.delete('/api/data/:id', async (req, res) => {
    const dataFile = './dataEntries.json';
    if (fs.existsSync(dataFile)) {
        const dataEntries = JSON.parse(await fs.promises.readFile(dataFile, 'utf8')).filter((d) => d.id !== req.params.id);
        await fs.promises.writeFile(dataFile, JSON.stringify(dataEntries, null, 2), 'utf8');
        res.json({ message: 'DataEntry eliminado exitosamente.' });
    } else {
        res.status(404).json({ message: 'No se encontraron entradas de datos.' });
    }
});

app.post('/api/error', async (req, res) => {
    const { id, errorMessage } = req.body;
    if (!id || !errorMessage) return res.status(400).send('Faltan datos para registrar el error.');

    await logError(id, errorMessage);
    res.status(201).send('Error registrado correctamente.');
});

app.get('/api/error-log', async (req, res) => {
    const errorLogFile = './errorLog.json';
    if (fs.existsSync(errorLogFile)) {
        const errorLogs = JSON.parse(await fs.promises.readFile(errorLogFile, 'utf8'));
        res.json(errorLogs);
    } else {
        res.status(404).json({ message: 'No se encontraron errores registrados.' });
    }
});

// New Routes for Data Distribution and System Status APIs
app.get('/data', (req, res) => {
    const dataFile = './dataEntries.json';
    if (fs.existsSync(dataFile)) {
        const dataEntries = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        res.json(dataEntries);
    } else {
        res.status(404).json({ message: 'No se encontraron entradas de datos.' });
    }
});

app.post('/data', (req, res) => {
    const newData = req.body;
    newData.id = Math.floor(100000 + Math.random() * 900000).toString();

    let dataEntries = [];
    const dataFile = './dataEntries.json';
    if (fs.existsSync(dataFile)) {
        dataEntries = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    }

    dataEntries.push(newData);
    fs.writeFileSync(dataFile, JSON.stringify(dataEntries, null, 2));
    res.status(201).json({ message: 'Data añadido exitosamente', newData });
});

app.put('/data/:id', (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;

    const dataFile = './dataEntries.json';
    if (fs.existsSync(dataFile)) {
        let dataEntries = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        const dataIndex = dataEntries.findIndex((entry) => entry.id === id);

        if (dataIndex !== -1) {
            dataEntries[dataIndex] = { ...dataEntries[dataIndex], ...updatedData };
            fs.writeFileSync(dataFile, JSON.stringify(dataEntries, null, 2));
            res.json({ message: 'Data actualizado exitosamente', data: dataEntries[dataIndex] });
        } else {
            res.status(404).json({ message: 'Data no encontrado.' });
        }
    } else {
        res.status(404).json({ message: 'No se encontraron entradas de datos.' });
    }
});

app.delete('/data/:id', (req, res) => {
    const id = req.params.id;

    const dataFile = './dataEntries.json';
    if (fs.existsSync(dataFile)) {
        let dataEntries = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        dataEntries = dataEntries.filter((entry) => entry.id !== id);
        fs.writeFileSync(dataFile, JSON.stringify(dataEntries, null, 2));
        res.json({ message: 'Data eliminado exitosamente' });
    } else {
        res.status(404).json({ message: 'No se encontraron entradas de datos.' });
    }
});

app.get('/system/status', (req, res) => {
    const status = getNodeStatus();
    res.json(status);
});

app.post('/system/sync', (req, res) => {
    const result = syncDataBetweenNodes();
    res.json({ message: 'Sincronización completada', result });
});

app.get('/system/uptime', (req, res) => {
    const uptime = getNodeUptime();
    res.json(uptime);
});

// CLIENTE INTERACTIVO
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function waitForEnter(callback) {
    rl.question('\nPresiona Enter para continuar...', () => {
        callback();
    });
}

function showMenu() {
    console.clear();
    console.log(`Servidor corriendo en http://localhost:${port}`);
    console.log('\n--- Menú ---');
    console.log('1. Crear o Actualizar Datos');
    console.log('2. Leer Datos');
    console.log('3. Eliminar Datos');
    console.log('4. Ver Log de Auditoría');
    console.log('5. Ver Log de Errores');
    console.log('6. Salir');
    rl.question('Elige una opción: ', async (choice) => {
        switch (choice) {
            case '1': await handleCreateOrUpdate(); break;
            case '2': await handleReadData(); break;
            case '3': await handleDeleteData(); break;
            case '4': await handleViewAuditLog(); break;
            case '5': await handleViewErrorLog(); break;
            case '6': console.log('Saliendo...'); rl.close(); return;
            default: console.log('Opción no válida.');
        }
        showMenu();
    });
}

async function sendRequest(method, endpoint, body = null) {
    try {
        const response = await axios({ method, url: `${SERVER_URL}${endpoint}`, data: body });
        return response.data;
    } catch (err) {
        console.error('Error:', err.message);
        throw err;
    }
}

async function handleCreateOrUpdate() {
    rl.question('Ingresa el nombre del usuario: ', (nombre) => {
        rl.question('Ingresa el email del usuario: ', (email) => {
            rl.question('Ingresa el password del usuario: ', (password) => {
                try {
                    let usuarios = [];

                    if (fs.existsSync('usuarios.json')) {
                        usuarios = JSON.parse(fs.readFileSync('usuarios.json', 'utf8'));
                    }

                    function generarIdUnico() {
                        let id;
                        let idExistente;
                        do {
                            id = Math.floor(100000 + Math.random() * 900000).toString();
                            idExistente = usuarios.find((usuario) => usuario.id === id);
                        } while (idExistente);
                        return id;
                    }

                    const id = generarIdUnico();

                    const nuevoUsuario = { id, nombre, email, password };
                    usuarios.push(nuevoUsuario);

                    fs.writeFileSync('usuarios.json', JSON.stringify(usuarios, null, 2));
                    console.log('Usuario creado/actualizado:', nuevoUsuario);
                } catch (err) {
                    console.error('Error:', err.message);
                }

                waitForEnter(showMenu);
            });
        });
    });
}

async function handleReadData() {
    rl.question('Ingresa el ID del usuario a leer: ', (id) => {
        try {
            const usuarios = JSON.parse(fs.readFileSync('usuarios.json', 'utf8'));
            const usuario = usuarios.find((u) => u.id === id);

            if (usuario) {
                console.log('Información del usuario:', usuario);
            } else {
                console.log('Usuario no encontrado.');
            }
        } catch (err) {
            console.error('Error:', err.message);
        }

        waitForEnter(showMenu);
    });
}

async function handleDeleteData() {
    rl.question('Ingresa el ID del usuario a eliminar: ', (id) => {
        try {
            let usuarios = JSON.parse(fs.readFileSync('usuarios.json', 'utf8'));
            const usuariosFiltrados = usuarios.filter((u) => u.id !== id);

            if (usuarios.length === usuariosFiltrados.length) {
                console.log('Usuario no encontrado.');
            } else {
                fs.writeFileSync('usuarios.json', JSON.stringify(usuariosFiltrados, null, 2));
                console.log(`Usuario con ID ${id} eliminado.`);
            }
        } catch (err) {
            console.error('Error:', err.message);
        }

        waitForEnter(showMenu);
    });
}

async function handleViewAuditLog() {
    try {
        const response = await sendRequest('GET', '/api/logs');
        console.log('--- Log de Auditoría ---\n' + response);
    } catch (err) {
        console.error('Error:', err.message);
    }
    waitForEnter(showMenu);
}

async function handleViewErrorLog() {
    try {
        const response = await sendRequest('GET', '/api/error-log');
        console.log('--- Log de Errores ---\n' + response);
    } catch (err) {
        console.error('Error:', err.message);
    }
    showMenu();
}

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}` );
    showMenu();
}