const sql = require('mssql');

/* ======================================================
   OBTENER CLIENTES POR USUARIO
====================================================== */
const obtenerClientes = async (usuario_id) => {

    try {

        const result = await new sql.Request()
            .input("usuario_id", sql.Int, usuario_id)
            .query(`
                SELECT id, nombre, telefono, total_compras
                FROM dbo.clientes
                WHERE usuario_id = @usuario_id
                ORDER BY id DESC
            `);

        return result.recordset;

    } catch (error) {
        console.error("Error en modelo obtenerClientes:", error);
        throw error;
    }
};


/* ======================================================
   CREAR CLIENTE
====================================================== */
const crearCliente = async (nombre, telefono, usuario_id) => {

    try {

        const result = await new sql.Request()
            .input("nombre", sql.VarChar, nombre)
            .input("telefono", sql.VarChar, telefono)
            .input("usuario_id", sql.Int, usuario_id)
            .query(`
                INSERT INTO dbo.clientes (nombre, telefono, usuario_id, total_compras)
                VALUES (@nombre, @telefono, @usuario_id, 0)
            `);

        return result.rowsAffected[0] > 0;

    } catch (error) {
        console.error("Error en modelo crearCliente:", error);
        throw error;
    }
};


/* ======================================================
   ELIMINAR CLIENTE
====================================================== */
const eliminarCliente = async (cliente_id, usuario_id) => {

    try {

        const result = await new sql.Request()
            .input("cliente_id", sql.Int, cliente_id)
            .input("usuario_id", sql.Int, usuario_id)
            .query(`
                DELETE FROM dbo.clientes
                WHERE id = @cliente_id
                AND usuario_id = @usuario_id
            `);

        return result.rowsAffected[0] > 0;

    } catch (error) {
        console.error("Error en modelo eliminarCliente:", error);
        throw error;
    }
};


module.exports = {
    obtenerClientes,
    crearCliente,
    eliminarCliente
};