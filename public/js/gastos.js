const API = "/api/gastos";

/* =========================
EVENTO CARGA DOCUMENTO
========================= */
document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("guardarGasto")?.addEventListener("click", registrarGasto);

    document.getElementById("btnEscanearQR")?.addEventListener("click", iniciarEscanerQR);

    document.getElementById("fileInput")?.addEventListener("change", procesarQR);

    document.getElementById("ticketOCR")?.addEventListener("change", procesarTicketOCR);

    cargarGastos();
});


/* =========================
ESCANEAR QR DESDE IMAGEN
========================= */
function procesarQR(event){

    const file = event.target.files[0];
    if(!file) return;

    const reader = new FileReader();

    reader.onload = function(e){

        const img = new Image();

        img.onload = function(){

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img,0,0);

            const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);

            const code = jsQR(imageData.data,canvas.width,canvas.height);

            if(code){
                procesarContenidoQR(code.data);
            }else{
                showAlert("No se detectó QR, intentando OCR...", "info");
                analizarTicketImagen(file);
            }

            event.target.value="";
        };

        img.src = e.target.result;
    };

    reader.readAsDataURL(file);
}


/* =========================
PROCESAR QR
========================= */
function procesarContenidoQR(contenido){

contenido = contenido.trim();

const montoInput = document.getElementById("monto");
const fechaInput = document.getElementById("fecha");
const descInput = document.getElementById("descripcion");

/* QR SUNAT */

if(contenido.includes("|")){

const partes = contenido.split("|");

if(partes.length >=5){

const ruc = partes[0];
const tipo = partes[1];
const serie = partes[2];
const numero = partes[3];
const monto = partes[4];
const fecha = partes[5];

if(!isNaN(parseFloat(monto))){
montoInput.value=parseFloat(monto);
}

if(fecha){
fechaInput.value=fecha;
}

let tipoDoc="Comprobante";

if(tipo==="03") tipoDoc="Boleta";
if(tipo==="01") tipoDoc="Factura";

descInput.value=`${tipoDoc} ${serie}-${numero} | RUC ${ruc}`;

showAlert(`${tipoDoc} detectada`, "success");

return;
}
}

/* JSON */

try{

const datos = JSON.parse(contenido);

montoInput.value = datos.monto || "";
fechaInput.value = datos.fecha || "";
descInput.value = datos.descripcion || "";

if(datos.categoria)
document.getElementById("categoria").value=datos.categoria;

if(datos.subcategoria)
document.getElementById("subcategoria").value=datos.subcategoria;

showAlert("Datos cargados desde QR","success");

return;

}catch(e){}

/* URL */

if(/^https?:\/\//i.test(contenido)){
if(confirm("El QR contiene enlace. ¿Abrir?")){
window.open(contenido,"_blank");
}
return;
}

/* MONTO */

const monto = contenido.match(/\d+\.\d{2}/);

if(monto){
montoInput.value = monto[0];
}

/* FECHA */

const fecha = contenido.match(/\d{4}-\d{2}-\d{2}/);

if(fecha){
fechaInput.value = fecha[0];
}

descInput.value = contenido;

showAlert("QR leído correctamente","success");

}


/* =========================
ESCANER CAMARA
========================= */
function iniciarEscanerQR(){

const reader = document.getElementById("reader");

reader.style.display="block";

const qr = new Html5Qrcode("reader");

qr.start(
{facingMode:"environment"},
{fps:10, qrbox:250},
async(decodedText)=>{

await qr.stop();
reader.style.display="none";

procesarContenidoQR(decodedText);

},
()=>{}
).catch(()=>{
showAlert("No se pudo abrir la cámara","error");
reader.style.display="none";
});

}


/* =========================
OCR TICKET
========================= */
async function procesarTicketOCR(event){

const file = event.target.files[0];
if(!file) return;

analizarTicketImagen(file);

event.target.value="";

}


/* =========================
OCR IMAGEN
========================= */
async function analizarTicketImagen(file){

showAlert("Analizando ticket...", "info");

const worker = await Tesseract.createWorker("spa");

const {data} = await worker.recognize(file);

await worker.terminate();

analizarTextoTicket(data.text);

}


/* =========================
ANALISIS INTELIGENTE
========================= */
function analizarTextoTicket(texto){

const montoInput=document.getElementById("monto");
const fechaInput=document.getElementById("fecha");
const descInput=document.getElementById("descripcion");
const categoriaInput=document.getElementById("categoria");

texto = texto.replace(/\s+/g," ");

const lineas = texto.split("\n").filter(l=>l.trim());

/* RUC */

const ruc = texto.match(/\b10\d{9}|\b20\d{9}/);

/* MONTO */

const montos = texto.match(/\d{1,4}\.\d{2}/g);

if(montos){
const mayor=Math.max(...montos.map(Number));
montoInput.value=mayor.toFixed(2);
}

/* FECHA */

const fecha = texto.match(/\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}/);

if(fecha){

let f=fecha[0];

if(f.includes("/")){
const [d,m,y]=f.split("/");
f=`${y}-${m}-${d}`;
}

fechaInput.value=f;

}

/* EMPRESA */

let empresa="";

for(let l of lineas){

if(l.length>4 && l.length<40 && !l.match(/\d{3,}/)){
empresa=l;
break;
}

}

/* CATEGORIZADOR */

const t = texto.toLowerCase();

let categoria="OTROS";

if(t.includes("tottus")||t.includes("metro")||t.includes("plaza vea"))
categoria="INSUMOS";

else if(t.includes("restaurant")||t.includes("polleria"))
categoria="SERVICIOS";

else if(t.includes("grif")||t.includes("petro"))
categoria="SERVICIOS";

categoriaInput.value=categoria;

descInput.value = empresa || "Ticket";

if(ruc) descInput.value += ` | RUC ${ruc[0]}`;

showAlert("Ticket procesado automáticamente","success");

}


/* =========================
FORMATO MONEDA
========================= */
function moneda(valor){

return new Intl.NumberFormat("es-PE",{
style:"currency",
currency:"PEN"
}).format(valor||0);

}


/* =========================
REGISTRAR GASTO
========================= */
async function registrarGasto(){

try{

const token=localStorage.getItem("token");

const categoria=document.getElementById("categoria").value;
const subcategoria=document.getElementById("subcategoria").value;
const monto=parseFloat(document.getElementById("monto").value);
const descripcion=document.getElementById("descripcion").value;
const fecha=document.getElementById("fecha").value;

if(!monto || isNaN(monto)){
showAlert("Ingresa monto válido","error");
return;
}

if(!categoria || !subcategoria || !fecha || !descripcion){
showAlert("Completa todos los campos","error");
return;
}

const res=await fetch(API,{
method:"POST",
headers:{
"Content-Type":"application/json",
"Authorization":`Bearer ${token}`
},
body:JSON.stringify({categoria,subcategoria,monto,descripcion,fecha})
});

const data=await res.json();

if(!res.ok) throw new Error();

showAlert("Gasto registrado","success");

limpiarFormulario();
cargarGastos();

}catch(e){

showAlert("Error registrando gasto","error");

}

}


/* =========================
LIMPIAR
========================= */
function limpiarFormulario(){

document.getElementById("monto").value="";
document.getElementById("descripcion").value="";
document.getElementById("fecha").value="";
document.getElementById("categoria").value="";
document.getElementById("subcategoria").value="";

}


/* =========================
CARGAR GASTOS
========================= */
async function cargarGastos(){

try{

const token=localStorage.getItem("token");

const res=await fetch(API,{
headers:{Authorization:`Bearer ${token}`}
});

const gastos=await res.json();

if(!Array.isArray(gastos)) return;

renderTabla(gastos);
calcularResumen(gastos);

}catch{

showAlert("No se pudieron cargar gastos","error");

}

}


/* =========================
TABLA
========================= */
function renderTabla(gastos){

const tabla=document.getElementById("tablaGastos");

tabla.innerHTML="";

if(!gastos.length){

tabla.innerHTML=`<tr><td colspan="6">Sin gastos</td></tr>`;
return;

}

gastos.forEach(g=>{

const fila=document.createElement("tr");

const fecha=g.fecha?g.fecha.split("T")[0]:"";

fila.innerHTML=`
<td>${fecha}</td>
<td>${g.categoria}</td>
<td>${g.subcategoria}</td>
<td>${g.descripcion}</td>
<td>${moneda(g.monto)}</td>
<td><button class="eliminar-btn" data-id="${g.id}">🗑</button></td>
`;

tabla.appendChild(fila);

});

agregarEventListenersEliminar();

}


/* =========================
ELIMINAR
========================= */
function agregarEventListenersEliminar(){

document.querySelectorAll(".eliminar-btn").forEach(btn=>{

btn.addEventListener("click",()=>{

eliminarGasto(btn.dataset.id);

});

});

}


async function eliminarGasto(id){

if(!confirm("¿Eliminar gasto?")) return;

const token=localStorage.getItem("token");

await fetch(`/api/gastos/${id}`,{
method:"DELETE",
headers:{Authorization:`Bearer ${token}`}
});

cargarGastos();

}


/* =========================
RESUMEN
========================= */
function calcularResumen(gastos){

let totalMes=0, insumos=0, servicios=0, mano=0;

const mes=new Date().getMonth();
const año=new Date().getFullYear();

gastos.forEach(g=>{

const f=new Date(g.fecha);

if(f.getMonth()===mes && f.getFullYear()===año)
totalMes+=Number(g.monto)||0;

if(g.categoria==="INSUMOS")
insumos+=Number(g.monto)||0;

if(g.categoria==="SERVICIOS")
servicios+=Number(g.monto)||0;

if(g.categoria==="MANO_DE_OBRA")
mano+=Number(g.monto)||0;

});

document.getElementById("gastosMes").textContent=moneda(totalMes);
document.getElementById("gastosInsumos").textContent=moneda(insumos);
document.getElementById("gastosServicios").textContent=moneda(servicios);
document.getElementById("gastosManoObra").textContent=moneda(mano);

}


/* =========================
ALERTAS
========================= */
function showAlert(message,type){

const alert=document.createElement("div");

alert.className=`toast ${type}`;
alert.textContent=message;

document.body.appendChild(alert);

setTimeout(()=>alert.classList.add("show"),100);

setTimeout(()=>{

alert.classList.remove("show");
document.body.removeChild(alert);

},3000);

}