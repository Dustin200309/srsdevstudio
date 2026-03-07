const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middlewares/auth.middleware');
const productoController = require('../controllers/producto.controller');

router.use(authenticateToken);

router.get('/', productoController.listarProductos);
router.get('/:id', productoController.obtenerProducto);
router.post('/', productoController.crearProducto);
router.put('/:id', productoController.actualizarProducto);
router.delete('/:id', productoController.eliminarProducto);

module.exports = router;