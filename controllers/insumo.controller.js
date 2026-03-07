const sql = require("mssql");

/* ============================= */
/* CREAR INSUMO */
/* ============================= */
exports.crearInsumo = async (req, res) => {

    const { nombre, unidad, precio } = req.body;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
    }

    try {

        await sql.query`
            INSERT INTO dbo.insumos (nombre, unidad, precio, usuario_id)
            VALUES (${nombre}, ${unidad}, ${precio}, ${usuarioId})
        `;

        res.json({ message: "Insumo creado correctamente" });

    } catch (error) {
        console.error("ERROR SQL:", error);
        res.status(500).json({ error: "Error al crear insumo" });
    }
};


/* ============================= */
/* LISTAR INSUMOS */
/* ============================= */
exports.listarInsumos = async (req, res) => {

    const usuarioId = req.user?.id;

    if (!usuarioId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
    }

    try {

        const result = await sql.query`
            SELECT id, nombre, unidad, precio
            FROM dbo.insumos
            WHERE usuario_id = ${usuarioId}
            ORDER BY id DESC
        `;

        res.json(result.recordset);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al listar insumos" });
    }
};


/* ============================= */
/* OBTENER INSUMO */
/* ============================= */
exports.obtenerInsumo = async (req, res) => {

    const { id } = req.params;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
    }

    try {

        const result = await sql.query`
            SELECT id, nombre, unidad, precio
            FROM dbo.insumos
            WHERE id = ${id}
            AND usuario_id = ${usuarioId}
        `;

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Insumo no encontrado" });
        }

        res.json(result.recordset[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener insumo" });
    }
};


/* ============================= */
/* ACTUALIZAR INSUMO */
/* ============================= */
exports.actualizarInsumo = async (req, res) => {

    const { id } = req.params;
    const { nombre, unidad, precio } = req.body;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
    }

    try {

        await sql.query`
            UPDATE dbo.insumos
            SET nombre = ${nombre},
                unidad = ${unidad},
                precio = ${precio}
            WHERE id = ${id}
            AND usuario_id = ${usuarioId}
        `;

        res.json({ message: "Insumo actualizado correctamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar insumo" });
    }
};


/* ELIMINAR INSUMO */

exports.eliminarInsumo = async (req, res) => {

    const { id } = req.params;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
    }

    try {

        // 🔎 Verificar si está usado en recetas
        const usoRecetas = await sql.query`
            SELECT TOP 1 id 
            FROM dbo.RecetaInsumos
            WHERE insumo_id = ${id}
        `;

        // 🔎 Verificar si está usado en intermedios
        const usoIntermedios = await sql.query`
            SELECT TOP 1 id
            FROM dbo.intermedio_detalle
            WHERE insumo_id = ${id}
        `;

        if (usoRecetas.recordset.length > 0 || usoIntermedios.recordset.length > 0) {
            return res.status(400).json({
                error: "No puedes eliminar este insumo porque está siendo utilizado en recetas o intermedios"
            });
        }

        const result = await sql.query`
            DELETE FROM dbo.insumos
            WHERE id = ${id}
            AND usuario_id = ${usuarioId}
        `;

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                error: "Insumo no encontrado"
            });
        }

        res.json({ message: "Insumo eliminado correctamente" });

    } catch (error) {
        console.error("ERROR SQL:", error);
        res.status(500).json({
            error: "Error al eliminar insumo"
        });
    }
};