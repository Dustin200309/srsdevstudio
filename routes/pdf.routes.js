const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const pdfController = require('../controllers/pdf.controller');

router.get('/receta/:id', authenticateToken, pdfController.generarPDFReceta);

module.exports = router;