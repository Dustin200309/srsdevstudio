const sql = require('mssql');

exports.listarProductos = async (req, res) => {
    res.json([]);
};

exports.crearProducto = async (req, res) => {
    res.json({ message: "Producto creado" });
};

exports.actualizarProducto = async (req, res) => {
    res.json({ message: "Producto actualizado" });
};

exports.eliminarProducto = async (req, res) => {
    res.json({ message: "Producto eliminado" });
};

exports.obtenerProducto = async (req, res) => {
    res.json({});
};