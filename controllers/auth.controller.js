const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sql = require('mssql');

/* =========================
   LOGIN
========================= */

exports.login = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email y password requeridos"
            });
        }

        // 🔎 Buscar usuario
        const result = await sql.query`
            SELECT id, Nombre, Email, Password, rol, activo
            FROM Usuarios
            WHERE Email = ${email}
        `;

        if (result.recordset.length === 0) {
            return res.status(404).json({
                error: "Usuario no encontrado"
            });
        }

        const user = result.recordset[0];

        // 🔐 Validar contraseña
        const valid = await bcrypt.compare(password, user.Password);

        if (!valid) {
            return res.status(401).json({
                error: "Password incorrecto"
            });
        }

        // 🚫 Validar si está desactivado
        if (!user.activo) {
            return res.status(403).json({
                error: "Cuenta desactivada. Contacte al administrador."
            });
        }

        // 🎟 Crear token con nombre incluido
        const token = jwt.sign(
            {
                id: user.id,
                nombre: user.Nombre,
                email: user.Email,
                rol: user.rol
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        // 📦 Respuesta
        res.json({
            token,
            usuario: {
                id: user.id,
                nombre: user.Nombre,
                email: user.Email,
                rol: user.rol
            }
        });

    } catch (err) {

        console.error("Error login:", err);

        res.status(500).json({
            error: "Error en login"
        });

    }

};


/* =========================
   CAMBIAR CONTRASEÑA
========================= */

exports.changePassword = async (req, res) => {

    try {

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: "Datos incompletos"
            });
        }

        const result = await sql.query`
            SELECT Password
            FROM Usuarios
            WHERE id = ${req.user.id}
        `;

        if (result.recordset.length === 0) {
            return res.status(404).json({
                error: "Usuario no encontrado"
            });
        }

        const user = result.recordset[0];

        const valid = await bcrypt.compare(currentPassword, user.Password);

        if (!valid) {
            return res.status(401).json({
                error: "Contraseña actual incorrecta"
            });
        }

        const hashed = await bcrypt.hash(newPassword, 10);

        await sql.query`
            UPDATE Usuarios
            SET Password = ${hashed}
            WHERE id = ${req.user.id}
        `;

        res.json({
            message: "Contraseña actualizada correctamente"
        });

    } catch (err) {

        console.error("Error cambiando contraseña:", err);

        res.status(500).json({
            error: "Error cambiando contraseña"
        });

    }

};