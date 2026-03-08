const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const notificacionesController = require('../controllers/notificacionesController');


/* =============================
   CONFIGURAR MULTER
============================= */

const storage = multer.diskStorage({

destination: (req, file, cb) => {
cb(null, 'uploads/notificaciones/');
},

filename: (req, file, cb) => {

const extension = path.extname(file.originalname);

cb(null, Date.now() + extension);

}

});

const upload = multer({ storage });


/* =============================
   RUTAS
============================= */

// Crear notificación (CON imagen)
router.post(
'/',
upload.single('imagen'),
notificacionesController.crearNotificacion
);


// Obtener notificaciones
router.get(
'/',
notificacionesController.obtenerNotificaciones
);


// Marcar como leída
router.post(
'/marcar-como-leida',
notificacionesController.marcarComoLeida
);


// Eliminar
router.post(
'/eliminar',
notificacionesController.eliminarNotificacion
);


module.exports = router;