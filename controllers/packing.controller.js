const sql = require("../config/db");

exports.obtenerPacking = async (req, res) => {

    const usuario_id = req.user?.id;

    if (!usuario_id) {
        return res.status(401).json({ error: "Usuario no identificado" });
    }

    try {

        const result = await sql.query`
            SELECT 
                id,
                nombre,
                unidad_medida,
                precio_base,
                cantidad_por_paquete,
                CASE 
                    WHEN cantidad_por_paquete IS NULL 
                         OR cantidad_por_paquete = 0
                        THEN 0
                    ELSE CAST(precio_base AS DECIMAL(18,6)) 
                         / CAST(cantidad_por_paquete AS DECIMAL(18,6))
                END AS costo_unitario
            FROM packing
            WHERE usuario_id = ${usuario_id}
            AND activo = 1
            ORDER BY id DESC
        `;

        res.json(result.recordset);

    } catch (error) {
        console.error("ERROR SQL REAL:", error);
        res.status(500).json({ error: "Error al obtener packing" });
    }
};
// CREAR PACKING
exports.crearPacking = async (req, res) => {

    const usuario_id = req.user?.id;

    if (!usuario_id) {
        return res.status(401).json({ error: "Usuario no identificado" });
    }

    const { nombre, unidad_medida, precio_base, cantidad_por_paquete } = req.body;

    if (!nombre || !precio_base || !cantidad_por_paquete) {
        return res.status(400).json({ error: "Datos incompletos" });
    }

    try {

        await sql.query`
            INSERT INTO packing
            (usuario_id, nombre, unidad_medida, precio_base, cantidad_por_paquete, activo)
            VALUES
            (${usuario_id}, ${nombre}, ${unidad_medida}, ${precio_base}, ${cantidad_por_paquete}, 1)
        `;

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al guardar packing" });
    }
};
exports.obtenerPackingPorId = async (req, res) => {

    const usuario_id = req.user?.id;
    const id = req.params.id;

    try {

        const result = await sql.query`
            SELECT *
            FROM packing
            WHERE id = ${id}
            AND usuario_id = ${usuario_id}
            AND activo = 1
        `;

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Packing no encontrado" });
        }

        res.json(result.recordset[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error cargando packing" });
    }
};
exports.actualizarPacking = async (req, res) => {

    const usuario_id = req.user?.id;
    const id = req.params.id;

    const {
        nombre,
        unidad_medida,
        precio_base,
        cantidad_por_paquete
    } = req.body;

    try {

        await sql.query`
            UPDATE packing
            SET
                nombre = ${nombre},
                unidad_medida = ${unidad_medida},
                precio_base = ${precio_base},
                cantidad_por_paquete = ${cantidad_por_paquete}
            WHERE id = ${id}
            AND usuario_id = ${usuario_id}
        `;

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error actualizando packing" });
    }
};
exports.eliminarPacking = async (req, res) => {

    const usuario_id = req.user?.id;
    const id = req.params.id;

    try {

        await sql.query`
            UPDATE packing
            SET activo = 0
            WHERE id = ${id}
            AND usuario_id = ${usuario_id}
        `;

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error eliminando packing" });
    }
};