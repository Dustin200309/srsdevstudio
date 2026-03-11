const express = require("express");
const router = express.Router();
const sql = require("mssql");

const { authenticateToken } = require("../middlewares/auth.middleware");
const config = require("../config/db");

/* =========================
   CONEXIÓN SQL
========================= */

async function getPool() {
    return await sql.connect(config);
}

/* =========================
   OBTENER CHAT DEL USUARIO
========================= */

router.get("/", authenticateToken, async (req, res) => {

    try {

        const usuarioId = req.user?.id;

        if (!usuarioId) {
            return res.status(401).json({
                error: "Usuario no autenticado"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input("usuario_id", sql.Int, usuarioId)
            .query(`
                SELECT 
                    id,
                    mensaje,
                    remitente,
                    fecha
                FROM Chat
                WHERE usuario_id = @usuario_id
                ORDER BY fecha ASC
            `);

        res.json(result.recordset);

    } catch (error) {

        console.error("Error obteniendo chat:", error);

        res.status(500).json({
            error: "Error obteniendo chat"
        });

    }

});


/* =========================
   ENVIAR MENSAJE USUARIO
========================= */

router.post("/", authenticateToken, async (req, res) => {

    try {

        const usuarioId = req.user?.id;
        const { mensaje } = req.body;

        if (!usuarioId) {
            return res.status(401).json({
                error: "Usuario no autenticado"
            });
        }

        if (!mensaje || mensaje.trim() === "") {
            return res.status(400).json({
                error: "El mensaje es obligatorio"
            });
        }

        const pool = await getPool();

        await pool.request()
            .input("usuario_id", sql.Int, usuarioId)
            .input("mensaje", sql.NVarChar(sql.MAX), mensaje)
            .query(`
                INSERT INTO Chat (usuario_id, mensaje, remitente, fecha)
                VALUES (@usuario_id, @mensaje, 'usuario', GETDATE())
            `);

        res.json({
            ok: true,
            message: "Mensaje enviado"
        });

    } catch (error) {

        console.error("Error enviando mensaje:", error);

        res.status(500).json({
            error: "Error enviando mensaje"
        });

    }

});


/* =========================
   ADMIN - LISTA USUARIOS CON CHAT
========================= */

router.get("/admin/usuarios", authenticateToken, async (req, res) => {

    try {

        if (req.user.rol !== "admin") {
            return res.status(403).json({
                error: "Acceso solo para administradores"
            });
        }

        const pool = await getPool();

        const result = await pool.request().query(`
            SELECT 
            u.id,
            u.nombre,
            MAX(c.fecha) AS ultimo_mensaje
            FROM Chat c
            INNER JOIN usuarios u ON u.id = c.usuario_id
            GROUP BY u.id, u.nombre
            ORDER BY ultimo_mensaje DESC
        `);

        res.json(result.recordset);

    } catch (error) {

        console.error("Error obteniendo usuarios del chat:", error);

        res.status(500).json({
            error: "Error obteniendo usuarios"
        });

    }

});


/* =========================
   ADMIN - VER CHAT DE USUARIO
========================= */

router.get("/admin/:usuario_id", authenticateToken, async (req, res) => {

    try {

        if (req.user.rol !== "admin") {
            return res.status(403).json({
                error: "Acceso solo para administradores"
            });
        }

        const usuarioId = parseInt(req.params.usuario_id);

        if (!usuarioId) {
            return res.status(400).json({
                error: "usuario_id inválido"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input("usuario_id", sql.Int, usuarioId)
            .query(`
                SELECT
                    id,
                    mensaje,
                    remitente,
                    fecha
                FROM Chat
                WHERE usuario_id = @usuario_id
                ORDER BY fecha ASC
            `);

        res.json(result.recordset);

    } catch (error) {

        console.error("Error obteniendo conversación:", error);

        res.status(500).json({
            error: "Error obteniendo conversación"
        });

    }

});


/* =========================
   ADMIN RESPONDER
========================= */

router.post("/admin/responder", authenticateToken, async (req, res) => {

    try {

        if (req.user.rol !== "admin") {
            return res.status(403).json({
                error: "Acceso solo para administradores"
            });
        }

        const { usuario_id, mensaje } = req.body;

        if (!usuario_id || !mensaje || mensaje.trim() === "") {
            return res.status(400).json({
                error: "Datos incompletos"
            });
        }

        const pool = await getPool();

        await pool.request()
            .input("usuario_id", sql.Int, usuario_id)
            .input("mensaje", sql.NVarChar(sql.MAX), mensaje)
            .query(`
                INSERT INTO Chat (usuario_id, mensaje, remitente, fecha)
                VALUES (@usuario_id, @mensaje, 'admin', GETDATE())
            `);

        res.json({
            ok: true,
            message: "Respuesta enviada"
        });

    } catch (error) {

        console.error("Error respondiendo chat:", error);

        res.status(500).json({
            error: "Error enviando respuesta"
        });

    }

});

router.put("/admin/leido/:usuario_id", authenticateToken, async (req, res) => {

    try {

        if (req.user.rol !== "admin") {
            return res.status(403).json({ error: "Solo admin" });
        }

        const usuarioId = parseInt(req.params.usuario_id);

        const pool = await getPool();

        await pool.request()
            .input("usuario_id", sql.Int, usuarioId)
            .query(`
                UPDATE Chat
                SET leido = 1
                WHERE usuario_id = @usuario_id
                AND remitente = 'usuario'
            `);

        res.json({ ok:true });

    } catch(err){

        console.error(err);

        res.status(500).json({ error:"Error actualizando estado" });

    }

});
/* =========================
   EXPORTAR ROUTER
========================= */

module.exports = router;