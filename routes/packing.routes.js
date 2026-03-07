const express = require("express");
const router = express.Router();

const packingController = require("../controllers/packing.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Obtener todos
router.get("/", authenticateToken, packingController.obtenerPacking);

// Obtener uno por ID
router.get("/:id", authenticateToken, packingController.obtenerPackingPorId);

// Crear
router.post("/", authenticateToken, packingController.crearPacking);

// Actualizar
router.put("/:id", authenticateToken, packingController.actualizarPacking);

// Eliminar (soft delete)
router.delete("/:id", authenticateToken, packingController.eliminarPacking);

module.exports = router;