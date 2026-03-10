const sql = require("../config/db");

/* =============================== */
/* LISTAR */
/* =============================== */
const listarRecetas = async (req, res) => {

    const usuario_id = req.user?.id;

    if (!usuario_id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
    }

    try {

        const result = await sql.query`
            SELECT id, nombre, subtotal, costo_total, precio_venta, fecha_creacion
            FROM dbo.recetas
            WHERE usuario_id = ${usuario_id}
            ORDER BY fecha_creacion DESC
        `;

        res.json(result.recordset);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error obteniendo recetas" });
    }
};


/* =============================== */
/* CREAR */
/* =============================== */
const crearReceta = async (req, res) => {

    const {
        nombre,
        cantidad_producida,
        subtotal,
        costo_total,
        precio_venta,
        insumos = [],
        intermedios = [],
        packing = []
    } = req.body;

    const usuario_id = req.user?.id;

    if (!usuario_id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (!nombre || nombre.trim() === "") {
        return res.status(400).json({ error: "Nombre inválido" });
    }

    const pool = await sql.connect();
    const transaction = new sql.Transaction(pool);

    try {

        await transaction.begin();

        const request = new sql.Request(transaction);

        request.input("usuario_id", sql.Int, usuario_id);
        request.input("nombre", sql.VarChar(255), nombre.trim());
        request.input("cantidad_producida", sql.Decimal(10, 2), Number(cantidad_producida));
        request.input("subtotal", sql.Decimal(10, 2), Number(subtotal));
        request.input("costo_total", sql.Decimal(10, 2), Number(costo_total));
        request.input("precio_venta", sql.Decimal(10, 2), Number(precio_venta));

        const recetaResult = await request.query(`
            INSERT INTO dbo.recetas
            (usuario_id, nombre, cantidad_producida, subtotal, costo_total, precio_venta)
            OUTPUT INSERTED.id
            VALUES (@usuario_id, @nombre, @cantidad_producida, @subtotal, @costo_total, @precio_venta)
        `);

        const receta_id = recetaResult.recordset[0].id;

        // INSUMOS
        for (const insumo of insumos) {

            await new sql.Request(transaction)
                .input("receta_id", sql.Int, receta_id)
                .input("insumo_id", sql.Int, Number(insumo.insumo_id))
                .input("cantidad", sql.Decimal(10, 2), Number(insumo.cantidad))
                .input("costo", sql.Decimal(10, 2), Number(insumo.costo))
                .query(`
                    INSERT INTO dbo.RecetaInsumos
                    (receta_id, insumo_id, cantidad, costo)
                    VALUES (@receta_id, @insumo_id, @cantidad, @costo)
                `);
        }

        // INTERMEDIOS
        for (const item of intermedios) {

            await new sql.Request(transaction)
                .input("receta_id", sql.Int, receta_id)
                .input("intermedio_id", sql.Int, Number(item.intermedio_id))
                .input("cantidad", sql.Decimal(10, 2), Number(item.cantidad))
                .input("costo", sql.Decimal(10, 2), Number(item.costo))
                .query(`
                    INSERT INTO dbo.receta_intermedios
                    (receta_id, intermedio_id, cantidad, costo)
                    VALUES (@receta_id, @intermedio_id, @cantidad, @costo)
                `);
        }

        // PACKING (si existe tabla receta_packing)
        for (const item of packing) {

            await new sql.Request(transaction)
                .input("receta_id", sql.Int, receta_id)
                .input("packing_id", sql.Int, Number(item.packing_id))
                .input("cantidad", sql.Decimal(10, 2), Number(item.cantidad))
                .input("costo", sql.Decimal(10, 2), Number(item.costo))
                .query(`
                    INSERT INTO dbo.receta_packing
                    (receta_id, packing_id, cantidad, costo)
                    VALUES (@receta_id, @packing_id, @cantidad, @costo)
                `);
        }

        await transaction.commit();

        res.status(201).json({ message: "Receta guardada", receta_id });

    } catch (error) {

        await transaction.rollback();
        console.error(error);
        res.status(500).json({ error: "Error guardando receta" });
    }
};


/* =============================== */
/* ELIMINAR */
/* =============================== */
const eliminarReceta = async (req, res) => {

    const recetaId = parseInt(req.params.id);
    const usuario_id = req.user?.id;

    if (!usuario_id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
    }

    try {

        await sql.query`
            DELETE FROM dbo.recetas
            WHERE id = ${recetaId}
            AND usuario_id = ${usuario_id}
        `;

        res.json({ message: "Receta eliminada" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error eliminando receta" });
    }
};


/* =============================== */
/* DETALLE */
/* =============================== */
const obtenerRecetaPorId = async (req, res) => {

    const recetaId = parseInt(req.params.id);
    const usuario_id = req.user?.id;

    if (!usuario_id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
    }

    try {

        const receta = (await sql.query`
            SELECT *
            FROM dbo.recetas
            WHERE id = ${recetaId}
            AND usuario_id = ${usuario_id}
        `).recordset[0];

        const insumos = (await sql.query`
            SELECT i.nombre, i.unidad, ri.cantidad, ri.costo
            FROM dbo.RecetaInsumos ri
            INNER JOIN dbo.insumos i ON ri.insumo_id = i.id
            WHERE ri.receta_id = ${recetaId}
        `).recordset;

        const intermedios = (await sql.query`
            SELECT im.nombre, ri.cantidad, ri.costo
            FROM dbo.receta_intermedios ri
            INNER JOIN dbo.intermedios im ON ri.intermedio_id = im.id
            WHERE ri.receta_id = ${recetaId}
        `).recordset;

        res.json({ receta, insumos, intermedios });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error obteniendo detalle" });
    }
};


/* =============================== */
/* ACTUALIZAR */
/* =============================== */
const actualizarReceta = async (req, res) => {

    const recetaId = parseInt(req.params.id);
    const usuario_id = req.user?.id;

    const {
        nombre,
        cantidad_producida,
        subtotal,
        costo_total,
        precio_venta,
        insumos = [],
        intermedios = [],
        packing = []
    } = req.body;

    if (!usuario_id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const pool = await sql.connect();
    const transaction = new sql.Transaction(pool);

    try {

        await transaction.begin();

        // actualizar receta
        await new sql.Request(transaction)
            .input("id", sql.Int, recetaId)
            .input("usuario_id", sql.Int, usuario_id)
            .input("nombre", sql.VarChar(255), nombre.trim())
            .input("cantidad_producida", sql.Decimal(10,2), Number(cantidad_producida))
            .input("subtotal", sql.Decimal(10,2), Number(subtotal))
            .input("costo_total", sql.Decimal(10,2), Number(costo_total))
            .input("precio_venta", sql.Decimal(10,2), Number(precio_venta))
            .query(`
                UPDATE dbo.recetas
                SET nombre=@nombre,
                    cantidad_producida=@cantidad_producida,
                    subtotal=@subtotal,
                    costo_total=@costo_total,
                    precio_venta=@precio_venta
                WHERE id=@id AND usuario_id=@usuario_id
            `);

        // limpiar ingredientes actuales
        await new sql.Request(transaction)
            .input("receta_id", sql.Int, recetaId)
            .query(`DELETE FROM dbo.RecetaInsumos WHERE receta_id=@receta_id`);

        await new sql.Request(transaction)
            .input("receta_id", sql.Int, recetaId)
            .query(`DELETE FROM dbo.receta_intermedios WHERE receta_id=@receta_id`);

        await new sql.Request(transaction)
            .input("receta_id", sql.Int, recetaId)
            .query(`DELETE FROM dbo.receta_packing WHERE receta_id=@receta_id`);

        // insertar insumos
        for (const insumo of insumos) {

            await new sql.Request(transaction)
                .input("receta_id", sql.Int, recetaId)
                .input("insumo_id", sql.Int, Number(insumo.insumo_id))
                .input("cantidad", sql.Decimal(10,2), Number(insumo.cantidad))
                .input("costo", sql.Decimal(10,2), Number(insumo.costo))
                .query(`
                    INSERT INTO dbo.RecetaInsumos
                    (receta_id, insumo_id, cantidad, costo)
                    VALUES (@receta_id,@insumo_id,@cantidad,@costo)
                `);
        }

        // insertar intermedios
        for (const item of intermedios) {

            await new sql.Request(transaction)
                .input("receta_id", sql.Int, recetaId)
                .input("intermedio_id", sql.Int, Number(item.intermedio_id))
                .input("cantidad", sql.Decimal(10,2), Number(item.cantidad))
                .input("costo", sql.Decimal(10,2), Number(item.costo))
                .query(`
                    INSERT INTO dbo.receta_intermedios
                    (receta_id,intermedio_id,cantidad,costo)
                    VALUES (@receta_id,@intermedio_id,@cantidad,@costo)
                `);
        }

        await transaction.commit();

        res.json({ message: "Receta actualizada" });

    } catch (error) {

        await transaction.rollback();
        console.error(error);
        res.status(500).json({ error: "Error actualizando receta" });

    }

};
module.exports = {
    listarRecetas,
    crearReceta,
    eliminarReceta,
    obtenerRecetaPorId,
    actualizarReceta
};