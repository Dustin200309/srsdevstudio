const sql = require("mssql");

/* =========================
   CONEXION SQL
========================= */
const poolPromise = sql.connect({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
});

/* =========================
   OBTENER USUARIO CON CHAT
========================= */
async function obtenerUsuariosChat(req, res) {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT DISTINCT
                u.id,
                u.nombre
            FROM ChatMensajes c
            INNER JOIN Usuarios u ON u.id = c.usuario_id
            ORDER BY u.nombre
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Error obteniendo usuarios chat:", err);
        res.status(500).json({ error: "Error obteniendo usuarios chat" });
    }
}

/* =========================
   OBTENER MENSAJES CLIENTE
========================= */
async function obtenerMensajesUsuario(req, res) {
    try {
        const usuario_id = req.user.id; // usuario logeado
        const pool = await poolPromise;

        const result = await pool.request()
            .input("usuario_id", sql.Int, usuario_id)
            .query(`
                SELECT 
                    m.id,
                    m.mensaje,
                    m.remitente,
                    m.fecha,
                    u.nombre AS usuario
                FROM ChatMensajes m
                INNER JOIN Usuarios u ON u.id = m.usuario_id
                WHERE m.usuario_id = @usuario_id
                ORDER BY m.fecha ASC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error("Error obteniendo mensajes usuario:", err);
        res.status(500).json({ error: "Error obteniendo mensajes usuario" });
    }
}

/* =========================
   OBTENER MENSAJES ADMIN
========================= */
async function obtenerMensajesAdmin(req, res) {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT 
                m.id,
                m.mensaje,
                m.remitente,
                m.fecha,
                u.nombre AS usuario
            FROM ChatMensajes m
            INNER JOIN Usuarios u ON u.id = m.usuario_id
            ORDER BY m.fecha ASC
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error("Error obteniendo mensajes admin:", err);
        res.status(500).json({ error: "Error obteniendo mensajes admin" });
    }
}

/* =========================
   MENSAJE USUARIO
========================= */
async function enviarMensajeUsuario(req, res) {
    try {
        const usuario_id = req.user.id;
        const { mensaje } = req.body;

        if (!mensaje || mensaje.trim() === "") {
            return res.status(400).json({ error: "Mensaje requerido" });
        }

        const pool = await poolPromise;

        await pool.request()
            .input("usuario_id", sql.Int, usuario_id)
            .input("mensaje", sql.NVarChar(sql.MAX), mensaje)
            .query(`
                INSERT INTO ChatMensajes (usuario_id, mensaje, remitente, fecha)
                VALUES (@usuario_id, @mensaje, 'usuario', GETDATE())
            `);

        res.json({ message: "Mensaje enviado" });
    } catch (err) {
        console.error("Error enviando mensaje:", err);
        res.status(500).json({ error: "Error enviando mensaje" });
    }
}

/* =========================
   RESPUESTA ADMIN
========================= */
async function responderAdmin(req, res) {
    try {
        const { usuario_id, mensaje } = req.body;

        if (!usuario_id || !mensaje || mensaje.trim() === "") {
            return res.status(400).json({ error: "Datos incompletos" });
        }

        const pool = await poolPromise;

        await pool.request()
            .input("usuario_id", sql.Int, usuario_id)
            .input("mensaje", sql.NVarChar(sql.MAX), mensaje)
            .query(`
                INSERT INTO ChatMensajes (usuario_id, mensaje, remitente, fecha)
                VALUES (@usuario_id, @mensaje, 'admin', GETDATE())
            `);

        res.json({ message: "Respuesta enviada" });
    } catch (err) {
        console.error("Error respondiendo:", err);
        res.status(500).json({ error: "Error respondiendo mensaje" });
    }
}

/* =========================
   EXPORT
========================= */
module.exports = {
    obtenerUsuariosChat,
    obtenerMensajesUsuario,
    obtenerMensajesAdmin,
    enviarMensajeUsuario,
    responderAdmin
};