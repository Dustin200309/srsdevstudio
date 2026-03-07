const sql = require('mssql');

/* ==============================
   CREAR NOTIFICACIÓN
============================== */

async function crearNotificacion(req, res) {

    try {

        const { mensaje } = req.body;

        if (!mensaje || mensaje.trim() === "") {
            return res.status(400).json({
                error: "El mensaje de la notificación es obligatorio"
            });
        }

        await sql.query`
            INSERT INTO Notificaciones (mensaje, fecha_creacion)
            VALUES (${mensaje}, GETDATE())
        `;

        res.json({
            message: "Notificación enviada correctamente"
        });

    } catch (err) {

        console.error("Error creando notificación:", err);

        res.status(500).json({
            error: "Error enviando notificación"
        });

    }

}


/* ==============================
   OBTENER NOTIFICACIONES
============================== */

async function obtenerNotificaciones(req, res) {

    try {

        const result = await sql.query`
            SELECT 
                id,
                mensaje,
                fecha_creacion
            FROM Notificaciones
            ORDER BY fecha_creacion DESC
        `;

        res.json(result.recordset);

    } catch (err) {

        console.error("Error obteniendo notificaciones:", err);

        res.status(500).json({
            error: "Error obteniendo notificaciones"
        });

    }

}

module.exports = {
    crearNotificacion,
    obtenerNotificaciones
};