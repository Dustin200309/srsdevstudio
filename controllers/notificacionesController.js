const sql = require("mssql");


/* ==============================
   CREAR NOTIFICACIÓN
============================== */
async function crearNotificacion(req, res) {
    try {
        const mensaje = req.body?.mensaje?.trim();

        if (!mensaje) {
            return res.status(400).json({
                success: false,
                error: "El mensaje de la notificación es obligatorio"
            });
        }

        let imagen = null;

        if (req.file) {
            imagen = `/uploads/notificaciones/${req.file.filename}`;
        }

        // Insertar la nueva notificación
        await sql.query`
            INSERT INTO Notificaciones (mensaje, imagen, fecha_creacion, leida, eliminado_por_usuario)
            VALUES (${mensaje}, ${imagen}, GETDATE(), 0, 0)
        `;

        // Obtener el total de notificaciones
        const totalNotificaciones = await sql.query`
            SELECT COUNT(*) AS total FROM Notificaciones WHERE eliminado_por_usuario = 0
        `;
        
        return res.status(201).json({
            success: true,
            message: "Notificación creada correctamente",
            totalNotificaciones: totalNotificaciones.recordset[0].total  // Devuelves el total de notificaciones
        });

    } catch (error) {
        console.error("❌ Error creando notificación:", error);

        return res.status(500).json({
            success: false,
            error: "Error interno del servidor"
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
                imagen,
                leida,
                fecha_creacion
            FROM Notificaciones
            WHERE eliminado_por_usuario = 0
            ORDER BY fecha_creacion DESC
        `;

        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {

        console.error("❌ Error obteniendo notificaciones:", error);

        return res.status(500).json({
            success: false,
            error: "Error obteniendo notificaciones"
        });

    }
}


/* ==============================
   MARCAR COMO LEÍDA
============================== */
async function marcarComoLeida(req, res) {

    try {

        const notificacionId = parseInt(req.body?.notificacionId);

        if (!notificacionId) {
            return res.status(400).json({
                success: false,
                error: "ID de notificación inválido"
            });
        }

        await sql.query`
            UPDATE Notificaciones
            SET leida = 1
            WHERE id = ${notificacionId}
        `;

        return res.status(200).json({
            success: true,
            message: "Notificación marcada como leída"
        });

    } catch (error) {

        console.error("❌ Error marcando notificación:", error);

        return res.status(500).json({
            success: false,
            error: "Error marcando notificación como leída"
        });

    }
}


/* ==============================
   ELIMINAR NOTIFICACIÓN
============================== */
async function eliminarNotificacion(req, res) {

    try {

        const notificacionId = parseInt(req.body?.notificacionId);

        if (!notificacionId) {
            return res.status(400).json({
                success: false,
                error: "ID de notificación inválido"
            });
        }

        await sql.query`
            UPDATE Notificaciones
            SET eliminado_por_usuario = 1
            WHERE id = ${notificacionId}
        `;

        return res.status(200).json({
            success: true,
            message: "Notificación eliminada"
        });

    } catch (error) {

        console.error("❌ Error eliminando notificación:", error);

        return res.status(500).json({
            success: false,
            error: "Error eliminando notificación"
        });

    }
}


module.exports = {
    crearNotificacion,
    obtenerNotificaciones,
    marcarComoLeida,
    eliminarNotificacion
};