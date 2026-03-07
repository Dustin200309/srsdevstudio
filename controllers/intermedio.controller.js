const sql = require("../config/db");

/* ============================= */
/* CREAR INTERMEDIO */
/* ============================= */
exports.crearIntermedio = async (req, res) => {

    const { nombre, cantidad_producida, mano_obra, detalles } = req.body;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (
        !nombre ||
        !cantidad_producida ||
        isNaN(cantidad_producida) ||
        mano_obra === undefined ||
        !Array.isArray(detalles) ||
        detalles.length === 0
    ) {
        return res.status(400).json({ error: "Datos inválidos" });
    }

    const pool = await sql.connect();
    const transaction = new sql.Transaction(pool);

    try {

        await transaction.begin();

        let costoMateriales = 0;

        detalles.forEach(d => {
            costoMateriales += Number(d.costo);
        });

        const costoManoObra = costoMateriales * (mano_obra / 100);
        const costoTotal = costoMateriales + costoManoObra;
        const costoUnitario = costoTotal / cantidad_producida;

        const request = new sql.Request(transaction);

        request.input("usuario_id", sql.Int, usuarioId);
        request.input("nombre", sql.VarChar, nombre);
        request.input("cantidad_producida", sql.Decimal(10,2), cantidad_producida);
        request.input("costo_materiales", sql.Decimal(10,2), costoMateriales);
        request.input("mano_obra", sql.Decimal(10,2), mano_obra);
        request.input("costo_mano_obra", sql.Decimal(10,2), costoManoObra);
        request.input("costo_total", sql.Decimal(10,2), costoTotal);
        request.input("costo_unitario", sql.Decimal(10,2), costoUnitario);

        const result = await request.query(`
            INSERT INTO dbo.intermedios
            (usuario_id, nombre, cantidad_producida,
             costo_materiales, mano_obra_porcentaje,
             costo_mano_obra, costo_total, costo_unitario)
            OUTPUT INSERTED.id
            VALUES
            (@usuario_id, @nombre, @cantidad_producida,
             @costo_materiales, @mano_obra,
             @costo_mano_obra, @costo_total, @costo_unitario)
        `);

        const intermedioId = result.recordset[0].id;

        for (const d of detalles) {

            const detalleRequest = new sql.Request(transaction);

            detalleRequest.input("intermedio_id", sql.Int, intermedioId);
            detalleRequest.input("insumo_id", sql.Int, d.insumo_id);
            detalleRequest.input("cantidad", sql.Decimal(10,2), d.cantidad);
            detalleRequest.input("unidad_usada", sql.VarChar, d.unidad_usada);
            detalleRequest.input("costo", sql.Decimal(10,2), d.costo);

            await detalleRequest.query(`
                INSERT INTO dbo.intermedio_detalle
                (intermedio_id, insumo_id, cantidad, unidad_usada, costo)
                VALUES
                (@intermedio_id, @insumo_id, @cantidad, @unidad_usada, @costo)
            `);
        }

        await transaction.commit();

        res.json({ message: "Intermedio creado correctamente" });

    } catch (error) {

        await transaction.rollback();
        console.error("Error creando intermedio:", error);
        res.status(500).json({ error: "Error al crear intermedio" });
    }
};


/* ============================= */
/* LISTAR INTERMEDIOS */
/* ============================= */
exports.listarIntermedios = async (req, res) => {

    const usuarioId = req.user?.id;

    if (!usuarioId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
    }

    try {

        const result = await sql.query`
            SELECT id, nombre, cantidad_producida,
                   costo_total, costo_unitario
            FROM dbo.intermedios
            WHERE usuario_id = ${usuarioId}
            ORDER BY id DESC
        `;

        res.json(result.recordset);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error listando intermedios" });
    }
};


/* ============================= */
/* OBTENER INTERMEDIO POR ID */
/* ============================= */
exports.obtenerIntermedio = async (req, res) => {

    const { id } = req.params;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
    }

    try {

        const result = await sql.query`
            SELECT *
            FROM dbo.intermedios
            WHERE id = ${id}
            AND usuario_id = ${usuarioId}
        `;

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Intermedio no encontrado" });
        }

        res.json(result.recordset[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error obteniendo intermedio" });
    }
};


/* ============================= */
/* ELIMINAR INTERMEDIO */
/* ============================= */
exports.eliminarIntermedio = async (req, res) => {

    const { id } = req.params;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
    }

    try {

        await sql.query`
            DELETE FROM dbo.intermedio_detalle
            WHERE intermedio_id = ${id}
        `;

        await sql.query`
            DELETE FROM dbo.intermedios
            WHERE id = ${id}
            AND usuario_id = ${usuarioId}
        `;

        res.json({ message: "Intermedio eliminado correctamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error eliminando intermedio" });
    }
};


/* ============================= */
/* OBTENER DETALLE INTERMEDIO */
/* ============================= */
exports.obtenerDetalleIntermedio = async (req, res) => {

    const { id } = req.params;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
    }

    try {

       const result = await sql.query`
    SELECT 
        i.nombre,
        i.cantidad_producida,
        i.costo_total,
        i.costo_unitario,
        ins.nombre AS nombre_insumo,
        d.cantidad,
        ISNULL(d.unidad_usada, ins.unidad) AS unidad_usada,
        d.costo
    FROM dbo.intermedios i
    LEFT JOIN dbo.intermedio_detalle d
        ON i.id = d.intermedio_id
    LEFT JOIN dbo.insumos ins
        ON d.insumo_id = ins.id
    WHERE i.id = ${id}
    AND i.usuario_id = ${usuarioId}
`;

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Intermedio no encontrado" });
        }

        res.json(result.recordset);

    } catch (error) {
        console.error("Error detalle intermedio:", error);
        res.status(500).json({ error: "Error obteniendo detalle" });
    }
};