const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middlewares/auth.middleware");
const recetasController = require("../controllers/recetas.controller");

router.get("/", authenticateToken, recetasController.listarRecetas);

router.get("/:id", authenticateToken, recetasController.obtenerRecetaPorId);

router.post("/", authenticateToken, recetasController.crearReceta);

router.delete("/:id", authenticateToken, recetasController.eliminarReceta);

router.put("/:id", authenticateToken, recetasController.actualizarReceta);

module.exports = router;