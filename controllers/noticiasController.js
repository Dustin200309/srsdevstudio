const sql = require('mssql');

// Obtener todas las noticias
async function obtenerNoticias(req, res) {
    try {
        const result = await sql.query`
            SELECT id, titulo, contenido, fecha_creacion
            FROM Noticias
            ORDER BY fecha_creacion DESC
        `;
        res.json(result.recordset);
    } catch (err) {
        console.error("Error obteniendo noticias:", err);
        res.status(500).json({ error: "Error obteniendo noticias" });
    }
}

// Crear nueva noticia
async function crearNoticia(req, res) {
    try {
        const { titulo, contenido } = req.body;

        if (!titulo || !contenido) {
            return res.status(400).json({ error: "Título y contenido son requeridos" });
        }

        await sql.query`
            INSERT INTO Noticias (titulo, contenido, fecha_creacion)
            VALUES (${titulo}, ${contenido}, GETDATE())
        `;
        res.json({ message: "Noticia agregada correctamente" });
    } catch (err) {
        console.error("Error agregando noticia:", err);
        res.status(500).json({ error: "Error agregando noticia" });
    }
}

// Eliminar una noticia
async function eliminarNoticia(req, res) {
    try {
        const { id } = req.params;

        await sql.query`
            DELETE FROM Noticias WHERE id = ${id}
        `;
        res.json({ message: "Noticia eliminada correctamente" });
    } catch (err) {
        console.error("Error eliminando noticia:", err);
        res.status(500).json({ error: "Error eliminando noticia" });
    }
}

module.exports = { obtenerNoticias, crearNoticia, eliminarNoticia };