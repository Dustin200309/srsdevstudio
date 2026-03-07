const soloAdmin = (req, res, next) => {
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ error: "No autorizado" });
    }
    next();
};

module.exports = { soloAdmin };