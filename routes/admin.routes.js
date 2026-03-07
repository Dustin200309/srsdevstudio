const express = require("express");
const router = express.Router();
const sql = require("mssql");
const bcrypt = require("bcryptjs");

const { authenticateToken } = require("../middlewares/auth.middleware");
const { soloAdmin } = require("../middlewares/role.middleware");

const noticiasController = require("../controllers/noticiasController");
const chatController = require("../controllers/chatController");
const notificacionesController = require("../controllers/notificacionesController");


/* ==============================
   USUARIOS
============================== */

/* Obtener usuarios */

router.get("/usuarios", authenticateToken, soloAdmin, async (req, res) => {

    try {

        const result = await sql.query(`
            SELECT id, nombre, email, rol, activo, fecha_creacion
            FROM dbo.usuarios
            ORDER BY id DESC
        `);

        res.json(result.recordset);

    } catch (err) {

        console.error("Error obteniendo usuarios:", err);
        res.status(500).json({ error: "Error obteniendo usuarios" });

    }

});


/* Activar / desactivar usuario */

router.put("/usuarios/:id/toggle", authenticateToken, soloAdmin, async (req, res) => {

    try {

        const { id } = req.params;

        await sql.query(`
            UPDATE dbo.usuarios
            SET activo = CASE WHEN activo = 1 THEN 0 ELSE 1 END
            WHERE id = ${id}
        `);

        res.json({ message: "Estado del usuario actualizado" });

    } catch (err) {

        console.error("Error actualizando usuario:", err);
        res.status(500).json({ error: "Error actualizando usuario" });

    }

});


/* Resetear contraseña */

router.put("/usuarios/:id/password", authenticateToken, soloAdmin, async (req, res) => {

    try {

        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ error: "Nueva contraseña requerida" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await sql.query(`
            UPDATE dbo.usuarios
            SET password = '${hashedPassword}'
            WHERE id = ${id}
        `);

        res.json({ message: "Contraseña actualizada correctamente" });

    } catch (err) {

        console.error("Error actualizando contraseña:", err);
        res.status(500).json({ error: "Error actualizando contraseña" });

    }

});


/* ==============================
   NOTICIAS
============================== */

router.get(
    "/noticias",
    authenticateToken,
    soloAdmin,
    noticiasController.obtenerNoticias
);

router.post(
    "/noticias",
    authenticateToken,
    soloAdmin,
    noticiasController.crearNoticia
);

router.delete(
    "/noticias/:id",
    authenticateToken,
    soloAdmin,
    noticiasController.eliminarNoticia
);
/* ==============================
   CHAT CLIENTE
============================== */

// Obtener mensajes del usuario logeado
router.get("/chat/usuario", authenticateToken, chatController.obtenerMensajesUsuario);

// Enviar mensaje del usuario
router.post("/chat/usuario", authenticateToken, chatController.enviarMensajeUsuario);

/* ==============================
   CHAT ADMIN
============================== */

// Admin ve todos los mensajes
router.get("/chat/admin", authenticateToken, soloAdmin, chatController.obtenerMensajesAdmin);

// Admin responde a un usuario
router.post("/chat/admin", authenticateToken, soloAdmin, chatController.responderAdmin);

/* ==============================
   NOTIFICACIONES
============================== */

router.post(
    "/notificaciones",
    authenticateToken,
    soloAdmin,
    notificacionesController.crearNotificacion
);

router.get(
    "/notificaciones",
    authenticateToken,
    notificacionesController.obtenerNotificaciones
);

router.delete("/notificaciones/:id", authenticateToken, soloAdmin, async (req, res) => {

    try {

        const { id } = req.params;

        await sql.query(`
            DELETE FROM dbo.Notificaciones
            WHERE id = ${id}
        `);

        res.json({ message: "Notificación eliminada correctamente" });

    } catch (err) {

        console.error("Error eliminando notificación:", err);
        res.status(500).json({ error: "Error eliminando notificación" });

    }

});


module.exports = router;