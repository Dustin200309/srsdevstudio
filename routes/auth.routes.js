const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

/* =========================
   LOGIN
========================= */

router.post('/login', authController.login);

/* =========================
   CAMBIAR CONTRASEÑA
========================= */

router.put('/change-password',
    authenticateToken,
    authController.changePassword
);

/* =========================
   USUARIO LOGUEADO
========================= */

router.get('/me', authenticateToken, (req, res) => {

    try {

        res.json({
            id: req.user.id,
            nombre: req.user.nombre,
            email: req.user.email,
            rol: req.user.rol
        });

    } catch (error) {

        console.error("Error obteniendo usuario:", error);

        res.status(500).json({
            error: "Error obteniendo usuario"
        });

    }

});

module.exports = router;