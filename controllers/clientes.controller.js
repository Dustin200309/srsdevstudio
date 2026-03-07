const sql = require("mssql");

/* ======================================================
   OBTENER CLIENTES (TOTAL DINÁMICO)
====================================================== */
exports.obtenerClientes = async (req, res) => {
    const usuario_id = req.user.id;

    try {
        const result = await new sql.Request()
            .input("usuario_id", sql.Int, usuario_id)
            .query(`
                SELECT 
                    c.id,
                    c.nombre,
                    c.telefono,
                    ISNULL(SUM(co.monto), 0) AS total_compras
                FROM dbo.clientes c
                LEFT JOIN dbo.compras co ON c.id = co.cliente_id
                WHERE c.usuario_id = @usuario_id
                GROUP BY c.id, c.nombre, c.telefono
                ORDER BY c.id DESC
            `);

        res.json({ success: true, clientes: result.recordset });

    } catch (error) {
        console.error("Error al obtener clientes:", error);
        res.status(500).json({ success: false, message: "Error al obtener clientes" });
    }
};


/* ======================================================
   CREAR CLIENTE
====================================================== */
exports.crearCliente = async (req, res) => {
    const { nombre, telefono } = req.body;
    const usuario_id = req.user.id;

    if (!nombre || !telefono) {
        return res.status(400).json({
            success: false,
            message: "Nombre y teléfono son requeridos"
        });
    }

    try {
        await new sql.Request()
            .input("nombre", sql.VarChar(100), nombre)
            .input("telefono", sql.VarChar(50), telefono)
            .input("usuario_id", sql.Int, usuario_id)
            .query(`
                INSERT INTO dbo.clientes (nombre, telefono, usuario_id)
                VALUES (@nombre, @telefono, @usuario_id)
            `);

        res.status(201).json({ success: true });

    } catch (error) {
        console.error("Error al crear cliente:", error);
        res.status(500).json({ success: false, message: "Error al crear cliente" });
    }
};


/* ======================================================
   REGISTRAR COMPRA
====================================================== */
exports.registrarCompra = async (req, res) => {
    const { cliente_id, descripcion, monto } = req.body;
    const usuario_id = req.user.id;

    if (!monto || monto <= 0) {
        return res.status(400).json({
            success: false,
            message: "El monto debe ser mayor a 0"
        });
    }

    const transaction = new sql.Transaction();

    try {
        await transaction.begin();

        // Verificar que el cliente pertenece al usuario
        const verify = await new sql.Request(transaction)
            .input("cliente_id", sql.Int, cliente_id)
            .input("usuario_id", sql.Int, usuario_id)
            .query(`
                SELECT id FROM dbo.clientes
                WHERE id = @cliente_id
                AND usuario_id = @usuario_id
            `);

        if (verify.recordset.length === 0) {
            await transaction.rollback();
            return res.status(403).json({ success: false, message: "Cliente no encontrado" });
        }

        await new sql.Request(transaction)
    .input("cliente_id", sql.Int, cliente_id)
    .input("descripcion", sql.VarChar(255), descripcion)
    .input("monto", sql.Decimal(10,2), monto)
    .input("usuario_id", sql.Int, usuario_id)
    .query(`
        INSERT INTO dbo.compras (cliente_id, descripcion, monto, usuario_id, fecha)
        VALUES (@cliente_id, @descripcion, @monto, @usuario_id, CAST(GETDATE() AS DATE))
    `);

        await transaction.commit();

        res.status(201).json({ success: true });

    } catch (error) {
        await transaction.rollback();
        console.error("Error al registrar compra:", error);
        res.status(500).json({ success: false, message: "Error al registrar compra" });
    }
};


/* ======================================================
   OBTENER COMPRAS DE UN CLIENTE
====================================================== */
exports.obtenerCompras = async (req, res) => {
    const { clienteId } = req.params;
    const usuario_id = req.user.id;

    try {
        const compras = await new sql.Request()
            .input("cliente_id", sql.Int, clienteId)
            .input("usuario_id", sql.Int, usuario_id)
            .query(`
                SELECT c.id, c.descripcion, c.monto, c.fecha
                FROM dbo.compras c
                INNER JOIN dbo.clientes cl ON c.cliente_id = cl.id
                WHERE cl.id = @cliente_id
                AND cl.usuario_id = @usuario_id
                ORDER BY c.fecha DESC
            `);

        res.json({ success: true, compras: compras.recordset });

    } catch (error) {
        console.error("Error al obtener compras:", error);
        res.status(500).json({ success: false, message: "Error al obtener compras" });
    }
};


/* ======================================================
   EDITAR COMPRA
====================================================== */
exports.editarCompra = async (req, res) => {
    const { compraId } = req.params;
    const { monto, descripcion } = req.body;
    const usuario_id = req.user.id;

    if (!monto || monto <= 0) {
        return res.status(400).json({
            success: false,
            message: "El monto debe ser mayor a 0"
        });
    }

    const transaction = new sql.Transaction();

    try {
        await transaction.begin();

        // Verificar compra y usuario
        const compra = await new sql.Request(transaction)
            .input("compra_id", sql.Int, compraId)
            .input("usuario_id", sql.Int, usuario_id)
            .query(`
                SELECT c.id
                FROM dbo.compras c
                INNER JOIN dbo.clientes cl ON c.cliente_id = cl.id
                WHERE c.id = @compra_id
                AND cl.usuario_id = @usuario_id
            `);

        if (compra.recordset.length === 0) {
            await transaction.rollback();
            return res.status(403).json({ success: false, message: "Compra no encontrada" });
        }

        await new sql.Request(transaction)
            .input("compra_id", sql.Int, compraId)
            .input("monto", sql.Decimal(10,2), monto)
            .input("descripcion", sql.VarChar(255), descripcion)
            .query(`
                UPDATE dbo.compras
                SET monto = @monto,
                    descripcion = @descripcion
                WHERE id = @compra_id
            `);

        await transaction.commit();

        res.json({ success: true });

    } catch (error) {
        await transaction.rollback();
        console.error("Error al editar compra:", error);
        res.status(500).json({ success: false, message: "Error al editar compra" });
    }
};


/* ======================================================
   ELIMINAR COMPRA
====================================================== */
exports.eliminarCompra = async (req, res) => {
    const { compraId } = req.params;
    const usuario_id = req.user.id;

    const transaction = new sql.Transaction();

    try {
        await transaction.begin();

        const compra = await new sql.Request(transaction)
            .input("compra_id", sql.Int, compraId)
            .input("usuario_id", sql.Int, usuario_id)
            .query(`
                SELECT c.id
                FROM dbo.compras c
                INNER JOIN dbo.clientes cl ON c.cliente_id = cl.id
                WHERE c.id = @compra_id
                AND cl.usuario_id = @usuario_id
            `);

        if (compra.recordset.length === 0) {
            await transaction.rollback();
            return res.status(403).json({ success: false, message: "Compra no encontrada" });
        }

        await new sql.Request(transaction)
            .input("compra_id", sql.Int, compraId)
            .query(`
                DELETE FROM dbo.compras
                WHERE id = @compra_id
            `);

        await transaction.commit();

        res.json({ success: true });

    } catch (error) {
        await transaction.rollback();
        console.error("Error al eliminar compra:", error);
        res.status(500).json({ success: false, message: "Error al eliminar compra" });
    }
};


//Elimina Cliente//
exports.eliminarCliente = async (req, res) => {
    const { clienteId } = req.params;
    const usuario_id = req.user.id;

    const transaction = new sql.Transaction();

    try {
        await transaction.begin();

        const cliente = await new sql.Request(transaction)
            .input("cliente_id", sql.Int, clienteId)
            .input("usuario_id", sql.Int, usuario_id)
            .query(`
                SELECT id
                FROM dbo.clientes
                WHERE id = @cliente_id
                AND usuario_id = @usuario_id
            `);

        if (cliente.recordset.length === 0) {
            await transaction.rollback();
            return res.status(403).json({ success: false, message: "Cliente no encontrado" });
        }

        await new sql.Request(transaction)
            .input("cliente_id", sql.Int, clienteId)
            .query(`DELETE FROM dbo.compras WHERE cliente_id = @cliente_id`);

        await new sql.Request(transaction)
            .input("cliente_id", sql.Int, clienteId)
            .query(`DELETE FROM dbo.clientes WHERE id = @cliente_id`);

        await transaction.commit();

        res.json({ success: true });

    } catch (error) {
        await transaction.rollback();
        console.error("Error al eliminar cliente:", error);
        res.status(500).json({ success: false, message: "Error al eliminar cliente" });
    }
};