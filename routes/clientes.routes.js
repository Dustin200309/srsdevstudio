const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const clienteController = require('../controllers/clientes.controller');

/* ======================================================
   CLIENTES
====================================================== */

// Obtener todos los clientes del usuario autenticado
router.get('/', authenticateToken, clienteController.obtenerClientes);

// Crear cliente
router.post('/', authenticateToken, clienteController.crearCliente);

// Eliminar cliente
router.delete('/:clienteId', authenticateToken, clienteController.eliminarCliente);


/* ======================================================
   COMPRAS
====================================================== */

// Registrar compra
router.post('/compras', authenticateToken, clienteController.registrarCompra);

// Obtener compras de un cliente
router.get('/compras/:clienteId', authenticateToken, clienteController.obtenerCompras);

// Eliminar compra
router.delete('/compras/:compraId', authenticateToken, clienteController.eliminarCompra);

// Editar compra
router.put('/compras/:compraId', authenticateToken, clienteController.editarCompra);

module.exports = router;