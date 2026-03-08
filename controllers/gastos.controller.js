const sql = require('../config/db');

/* =========================
CREAR GASTO
========================= */

exports.crearGasto = async (req, res) => {

try {

const usuarioId = req.user.id;

const {
categoria,
subcategoria,
monto,
descripcion,
fecha
} = req.body;

if (!monto || !categoria) {
return res.status(400).json({
message: "Categoría y monto son obligatorios"
});
}

const pool = await sql.connect();

await pool.request()
.input("usuario_id", sql.Int, usuarioId)
.input("categoria", sql.VarChar(50), categoria)
.input("subcategoria", sql.VarChar(50), subcategoria || "")
.input("monto", sql.Decimal(10,2), monto)
.input("descripcion", sql.VarChar(255), descripcion || "")
.input("fecha", sql.Date, fecha || new Date())
.query(`
INSERT INTO gastos
(usuario_id,categoria,subcategoria,monto,descripcion,fecha)
VALUES
(@usuario_id,@categoria,@subcategoria,@monto,@descripcion,@fecha)
`);

res.json({
message:"Gasto registrado correctamente"
});

} catch (error) {

console.error("Error creando gasto:", error);

res.status(500).json({
message:"Error registrando gasto"
});

}

};


/* =========================
OBTENER GASTOS
========================= */

exports.obtenerGastos = async (req,res)=>{

try{

const usuarioId = req.user.id;

const pool = await sql.connect();

const result = await pool.request()
.input("usuario_id", sql.Int, usuarioId)
.query(`
SELECT
id,
categoria,
subcategoria,
descripcion,
monto,
fecha
FROM gastos
WHERE usuario_id = @usuario_id
ORDER BY fecha DESC
`);

res.json(result.recordset);

}catch(error){

console.error("Error obteniendo gastos:",error);

res.status(500).json({
message:"Error obteniendo gastos"
});

}

};


/* =========================
ELIMINAR GASTO
========================= */

exports.eliminarGasto = async (req,res)=>{

try{

const usuarioId = req.user.id;
const { id } = req.params;

const pool = await sql.connect();

await pool.request()
.input("usuario_id", sql.Int, usuarioId)
.input("id", sql.Int, id)
.query(`
DELETE FROM gastos
WHERE id = @id
AND usuario_id = @usuario_id
`);

res.json({
message:"Gasto eliminado"
});

}catch(error){

console.error("Error eliminando gasto:",error);

res.status(500).json({
message:"Error eliminando gasto"
});

}

};


/* =========================
RESUMEN DE GASTOS
========================= */

exports.resumenGastos = async (req,res)=>{

try{

const usuarioId = req.user.id;

const pool = await sql.connect();

const result = await pool.request()
.input("usuario_id", sql.Int, usuarioId)
.query(`
SELECT
categoria,
SUM(monto) total
FROM gastos
WHERE usuario_id = @usuario_id
GROUP BY categoria
`);

res.json(result.recordset);

}catch(error){

console.error("Error resumen gastos:",error);

res.status(500).json({
message:"Error obteniendo resumen"
});

}

};


/* =========================
GASTOS DEL MES
========================= */

exports.gastosMes = async (req,res)=>{

try{

const usuarioId = req.user.id;

const pool = await sql.connect();

const result = await pool.request()
.input("usuario_id", sql.Int, usuarioId)
.query(`
SELECT
SUM(monto) total
FROM gastos
WHERE usuario_id = @usuario_id
AND MONTH(fecha) = MONTH(GETDATE())
AND YEAR(fecha) = YEAR(GETDATE())
`);

res.json({
total: result.recordset[0].total || 0
});

}catch(error){

console.error("Error gastos del mes:",error);

res.status(500).json({
message:"Error obteniendo gastos del mes"
});

}

};