const express = require("express");
const router = express.Router();

const gastosController = require("../controllers/gastos.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.post("/", authenticateToken, gastosController.crearGasto);

router.get("/", authenticateToken, gastosController.obtenerGastos);

router.delete("/:id", authenticateToken, gastosController.eliminarGasto);

router.get("/resumen", authenticateToken, gastosController.resumenGastos);

router.get("/mes", authenticateToken, gastosController.gastosMes);

module.exports = router;