const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();  

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Rutas API
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/productos', require('./routes/producto.routes'));
app.use('/api/pdf', require('./routes/pdf.routes'));
app.use('/api/logo', require('./routes/logo.routes'));
app.use('/api/insumos', require('./routes/insumo.routes'));
app.use('/api/recetas', require('./routes/receta.routes'));
app.use('/api/intermedios', require('./routes/intermedio.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/packing', require('./routes/packing.routes'));
app.use('/api/clientes', require('./routes/clientes.routes'));

app.use('/api/notificaciones', require('./routes/notificaciones.routes'));

app.use('/api/rentabilidad', require('./routes/rentabilidad.routes'));

// 👇 CHAT
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/noticias', require('./routes/noticias.routes'));
// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
});

module.exports = app;