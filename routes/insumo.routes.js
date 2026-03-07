const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middlewares/auth.middleware");
const insumoController = require("../controllers/insumo.controller");

// Todas protegidas con JWT
router.get("/", authenticateToken, insumoController.listarInsumos);
router.get("/:id", authenticateToken, insumoController.obtenerInsumo);
router.post("/", authenticateToken, insumoController.crearInsumo);
router.put("/:id", authenticateToken, insumoController.actualizarInsumo);
router.delete("/:id", authenticateToken, insumoController.eliminarInsumo);

module.exports = router;