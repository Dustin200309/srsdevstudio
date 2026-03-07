const express = require('express');
const router = express.Router();
const notificacionesController = require('../controllers/notificacionesController'); // Asegúrate de tener el controlador

// Crear notificación
router.post('/', notificacionesController.crearNotificacion);

// Obtener notificaciones (para los usuarios)
router.get('/', notificacionesController.obtenerNotificaciones);

module.exports = router;