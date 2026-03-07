const express = require("express");
const router = express.Router();
const sql = require("mssql");

// GET /api/noticias
router.get("/", async (req, res) => {

    try {

        const pool = await sql.connect(); // 👈 usar conexión global

        const result = await pool.request().query(`
            SELECT TOP 10 *
            FROM Noticias
            ORDER BY fecha_creacion DESC
        `);

        res.json(result.recordset);

    } catch (error) {

        console.error("Error obteniendo noticias:", error);
        res.status(500).json({ error: "Error obteniendo noticias" });

    }

});

module.exports = router;