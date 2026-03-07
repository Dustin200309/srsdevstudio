const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middlewares/auth.middleware');
const rentabilidadController = require('../controllers/rentabilidad.controller');

router.get("/", authenticateToken, rentabilidadController.obtenerRentabilidad);

module.exports = router;