const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Verificar si el encabezado de autorización está presente y correctamente formado
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token requerido" });
    }

    const token = authHeader.split(" ")[1];

    try {
        // Verificar el token utilizando la clave secreta
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Almacenar los datos del usuario decodificados en el objeto `req.user`
        req.user = {
            id: decoded.id,
            rol: decoded.rol,
            nombre: decoded.nombre || '' // Añadir más datos si es necesario
        };

        next(); // Continuar con el siguiente middleware o ruta

    } catch (error) {
        // Manejo de errores: Token expirado o inválido
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Token expirado, por favor inicie sesión nuevamente" });
        }
        return res.status(403).json({ error: "Token inválido o expirado" });
    }
};

module.exports = { authenticateToken };