const express = require('express');
const router = express.Router();
const multer = require('multer');
const sql = require('mssql');
const path = require('path');

// Configuración de almacenamiento para el logo
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/upload/logo');
    },
    filename: (req, file, cb) => {
        const fileName = `logo_${Date.now()}_${file.originalname}`;
        cb(null, fileName);
    }
});
const upload = multer({ storage: storage });

// Subir el logo
router.post('/upload-logo', upload.single('logo'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send("No logo uploaded");
    }

    const logoPath = `upload/logo/${req.file.filename}`;

    try {
        await sql.query`
            UPDATE Usuarios
            SET LogoPath = ${logoPath}
            WHERE Id = ${req.userId}
        `;
        res.json({ message: 'Logo uploaded successfully', logoPath });
    } catch (error) {
        res.status(500).json({ error: 'Error saving logo path' });
    }
});

module.exports = router;