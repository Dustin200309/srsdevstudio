const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const intermedioController = require('../controllers/intermedio.controller');


// ================= CREAR INTERMEDIO =================
router.post(
    '/crear',
    authenticateToken,
    intermedioController.crearIntermedio
);


// ================= LISTAR INTERMEDIOS =================
router.get(
    '/',
    authenticateToken,
    intermedioController.listarIntermedios
);


// ================= OBTENER DETALLE INTERMEDIO =================
router.get(
    '/:id/detalle',
    authenticateToken,
    intermedioController.obtenerDetalleIntermedio
);


// ================= OBTENER INTERMEDIO POR ID =================
router.get(
    '/:id',
    authenticateToken,
    intermedioController.obtenerIntermedio
);


// ================= ELIMINAR INTERMEDIO =================
router.delete(
    '/:id',
    authenticateToken,
    intermedioController.eliminarIntermedio
);


module.exports = router;