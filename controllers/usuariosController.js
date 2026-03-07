const sql = require('mssql');

// Crear usuario
exports.crearUsuario = async (req, res) => {
    const { nombre, email, password, rol } = req.body;

    try {
        const pool = await sql.connect(config);  // Asegúrate de que `config` esté definido

        await pool.request()
            .input("nombre", sql.NVarChar, nombre)
            .input("email", sql.NVarChar, email)
            .input("password", sql.NVarChar, password)
            .input("rol", sql.NVarChar, rol)
            .query(`
                INSERT INTO Usuarios (nombre, email, password, rol, activo)
                VALUES (@nombre, @email, @password, @rol, 1)
            `);

        res.json({ ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error creando usuario" });
    }
};