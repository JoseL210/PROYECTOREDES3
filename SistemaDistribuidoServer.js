const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 8080;

// Almacenamiento de datos (simula una base de datos)
const dataStorage = new Map();
const auditLog = [];
const errorLog = [];

// Middleware para manejar datos JSON y texto plano
app.use(bodyParser.text()); // Para datos en texto plano
app.use(bodyParser.json()); // Para datos JSON (si es necesario)

// Ruta para crear o actualizar datos
app.post('/data/:id', (req, res) => {
    const id = req.params.id;
    const content = req.body;

    if (!id || !content) {
        errorLog.push(`Error: Invalid request to create/update data`);
        res.status(400).send('Error: Invalid request. ID and content are required.');
        return;
    }

    // Crear o actualizar datos
    dataStorage.set(id, content);
    auditLog.push(`Created/Updated data with ID: ${id}`);

    res.status(200).send(`Data saved with ID: ${id}`);
});

// Ruta para leer datos por ID
app.get('/data/:id', (req, res) => {
    const id = req.params.id;

    if (dataStorage.has(id)) {
        const content = dataStorage.get(id);
        auditLog.push(`Read data with ID: ${id}`);
        res.status(200).send(content);
    } else {
        const errorMsg = `Error: Data with ID ${id} not found`;
        errorLog.push(errorMsg);
        res.status(404).send(errorMsg);
    }
});

// Ruta para eliminar datos por ID
app.delete('/data/:id', (req, res) => {
    const id = req.params.id;

    if (dataStorage.has(id)) {
        dataStorage.delete(id);
        auditLog.push(`Deleted data with ID: ${id}`);
        res.status(200).send(`Data with ID ${id} deleted`);
    } else {
        const errorMsg = `Error: Data with ID ${id} not found for deletion`;
        errorLog.push(errorMsg);
        res.status(404).send(errorMsg);
    }
});

// Ruta para obtener el log de auditoría
app.get('/audit-log', (req, res) => {
    res.status(200).send(auditLog.join('\n'));
});

// Ruta para obtener el log de errores
app.get('/error-log', (req, res) => {
    res.status(200).send(errorLog.join('\n'));
});

// Inicia el servidor
app.listen(port, () => {
    console.log(`Servidor en ejecución en http://localhost:${port}/`);
});
