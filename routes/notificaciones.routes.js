const express = require('express');
const router = express.Router();
const notificacionesController = require('../controllers/notificacionesController'); // Asegúrate de que el controlador está importado correctamente

// Crear notificación
router.post('/', notificacionesController.crearNotificacion);

// Obtener notificaciones (para los usuarios)
router.get('/', notificacionesController.obtenerNotificaciones);

// Marcar una notificación como leída
router.post('/marcar-como-leida', notificacionesController.marcarComoLeida);

// Eliminar una notificación
router.post('/eliminar', notificacionesController.eliminarNotificacion);

module.exports = router;