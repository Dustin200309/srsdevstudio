const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const Fuse = require("fuse.js");

/* =========================
   LEER CONTENIDO DE LA WEB
========================= */

function cargarContenido(){

const filePath = path.join(__dirname,"../public/index.html");

const html = fs.readFileSync(filePath,"utf8");

const $ = cheerio.load(html);

/* extraer textos importantes */

let textos = [];

$("h1,h2,h3,p,li").each((i,el)=>{
const t = $(el).text().trim();
if(t.length > 20){
textos.push({
pregunta:t,
respuesta:t
});
}
});

return textos;

}

/* =========================
   BASE DE CONOCIMIENTO
========================= */

const contenidoWeb = cargarContenido();

const baseExtra = [
{
pregunta:"que hace el sistema",
respuesta:"El sistema permite calcular el costo real de tus productos, controlar insumos y mejorar tu rentabilidad."
},
{
pregunta:"planes",
respuesta:"Puedes ver los planes disponibles en la sección de planes."
},
{
pregunta:"clientes",
respuesta:"Puedes registrar clientes y gestionar pedidos fácilmente."
}
];

const conocimiento = [...contenidoWeb,...baseExtra];

/* =========================
   BUSCADOR INTELIGENTE
========================= */

const fuse = new Fuse(conocimiento,{
keys:["pregunta"],
threshold:0.45
});

/* =========================
   LIMPIAR TEXTO
========================= */

function limpiar(texto){
return texto
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g,"");
}

/* =========================
   MOTOR
========================= */

function pensar(texto){

texto = limpiar(texto);

if(texto.includes("hola")){
return "Hola 👋 Soy Mini Sam. Puedo ayudarte con información sobre el sistema de costeo.";
}

const resultado = fuse.search(texto);

if(resultado.length){
return resultado[0].item.respuesta;
}

return "Puedo ayudarte con información sobre el sistema de costeo, planes o cómo calcular costos.";
}

/* =========================
   API
========================= */

router.post("/",(req,res)=>{

try{

const pregunta = req.body.mensaje || "";

const respuesta = pensar(pregunta);

res.json({respuesta});

}catch(error){

console.error(error);

res.status(500).json({
respuesta:"Mini Sam tuvo un problema pensando 🤖"
});

}

});

module.exports = router;