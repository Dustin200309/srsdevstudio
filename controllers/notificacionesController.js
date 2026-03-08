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
            WHERE eliminado_por_usuario = 0
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

/* ==============================
   MARCAR NOTIFICACIÓN COMO LEÍDA
============================== */
async function marcarComoLeida(req, res) {
    try {
        const { notificacionId } = req.body;

        // Validar si el id de la notificación está presente
        if (!notificacionId) {
            return res.status(400).json({
                error: "El ID de la notificación es obligatorio"
            });
        }

        // Marcar la notificación como leída
        await sql.query`
            UPDATE Notificaciones
            SET leida = 1
            WHERE id = ${notificacionId}
        `;

        res.json({
            message: "Notificación marcada como leída"
        });

    } catch (err) {
        console.error("Error marcando notificación como leída:", err);
        res.status(500).json({
            error: "Error marcando la notificación como leída"
        });
    }
}

/* ==============================
   ELIMINAR NOTIFICACIÓN
============================== */
async function eliminarNotificacion(req, res) {
    try {
        const { notificacionId } = req.body;

        // Validar si el id de la notificación está presente
        if (!notificacionId) {
            return res.status(400).json({
                error: "El ID de la notificación es obligatorio"
            });
        }

        // Marcar la notificación como eliminada para el usuario
        await sql.query`
            UPDATE Notificaciones
            SET eliminado_por_usuario = 1
            WHERE id = ${notificacionId}
        `;

        res.json({
            message: "Notificación eliminada"
        });

    } catch (err) {
        console.error("Error eliminando notificación:", err);
        res.status(500).json({
            error: "Error eliminando la notificación"
        });
    }
}

module.exports = {
    crearNotificacion,
    obtenerNotificaciones,
    marcarComoLeida,   // Agregado
    eliminarNotificacion  // Agregado
};