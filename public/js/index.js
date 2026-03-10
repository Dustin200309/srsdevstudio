const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/login";
}

/* ===============================
VARIABLES
=============================== */

let insumosReceta = [];
let intermediosReceta = [];
let packingReceta = [];

let listaInsumos = [];
let listaIntermedios = [];
let listaPacking = [];

let insumoSeleccionado = null;
let intermedioSeleccionado = null;
let packingSeleccionado = null;

let totalBase = 0;
let totalManoObra = 0;
let totalIndirectos = 0;
let costoTotal = 0;
let precioVenta = 0;
let precioUnidad = 0;
let ganancia = 0;
let margenReal = 0;

/* ===============================
INICIO
=============================== */

document.addEventListener("DOMContentLoaded", async () => {

    await cargarDatos("/api/insumos", "insumos");
    await cargarDatos("/api/intermedios", "intermedios");
    await cargarDatos("/api/packing", "packing");

    configurarBuscadores();

    document.getElementById("btnAgregar")?.addEventListener("click", agregarInsumo);
    document.getElementById("btnAgregarIntermedio")?.addEventListener("click", agregarIntermedio);
    document.getElementById("btnAgregarPacking")?.addEventListener("click", agregarPacking);

    document.getElementById("btnGuardar")?.addEventListener("click", guardarReceta);

    [
        "cantidadProducida",
        "manoObraPorcentaje",
        "indirectoValor",
        "margenGanancia"
    ].forEach(id=>{
        document.getElementById(id)?.addEventListener("input", recalcularTotales);
    });

    document.getElementById("incluirIGV")?.addEventListener("change", recalcularTotales);

});


/* ===============================
CARGAR DATOS
=============================== */

async function cargarDatos(apiUrl, tipo){

    try{

        const response = await fetch(apiUrl,{
            headers:{Authorization:"Bearer "+token}
        });

        const data = await response.json();

        if(tipo==="insumos") listaInsumos = data;
        if(tipo==="intermedios") listaIntermedios = data;
        if(tipo==="packing") listaPacking = data;

    }catch(error){
        console.error("Error cargando datos:",error);
    }

}


/* ===============================
BUSCADORES
=============================== */

function configurarBuscadores(){

    crearBuscador("buscarInsumo","resultadosInsumo",listaInsumos,item=>insumoSeleccionado=item);
    crearBuscador("buscarIntermedio","resultadosIntermedio",listaIntermedios,item=>intermedioSeleccionado=item);
    crearBuscador("buscarPacking","resultadosPacking",listaPacking,item=>packingSeleccionado=item);

}

function crearBuscador(inputId,listaId,data,onSelect){

    const input=document.getElementById(inputId);
    const lista=document.getElementById(listaId);

    if(!input || !lista) return;

    input.addEventListener("input",()=>{

        const texto=input.value.toLowerCase();

        lista.innerHTML="";

        if(texto.length===0){
            lista.style.display="none";
            return;
        }

        const resultados=data
        .filter(i=>i.nombre.toLowerCase().includes(texto))
        .slice(0,10);

        resultados.forEach(item=>{

            const div=document.createElement("div");
            div.className="resultado-item";
            div.textContent=item.nombre;

            div.onclick=()=>{

                onSelect(item);
                input.value=item.nombre;
                lista.style.display="none";

            };

            lista.appendChild(div);

        });

        lista.style.display="block";

    });

}


/* ===============================
AGREGAR INSUMO
=============================== */
function agregarInsumo(){

    if(!insumoSeleccionado){
        alert("Seleccione un insumo");
        return;
    }

    const cantidad = parseFloat(document.getElementById("cantidadUsada").value);
    const unidad = document.getElementById("unidadSelect").value;

    if(isNaN(cantidad) || cantidad <= 0){
        alert("Cantidad inválida");
        return;
    }

    const precio = parseFloat(insumoSeleccionado.precio);

    if(isNaN(precio)){
        alert("Precio del insumo no válido");
        return;
    }

    let precioFinal = precio;
    let cantidadBase = cantidad;

    // Conversión de unidades
    if(unidad === "g"){
        precioFinal = precio / 1000;
    }

    if(unidad === "ml"){
        precioFinal = precio / 1000;
    }

    if(unidad === "kg"){
        precioFinal = precio;
    }

    if(unidad === "l"){
        precioFinal = precio;
    }

    const costo = precioFinal * cantidadBase;

    insumosReceta.push({
        tipo: "insumo",
        insumo_id: insumoSeleccionado.id,
        nombre: insumoSeleccionado.nombre,
        unidad,
        cantidad: cantidadBase,
        costo
    });

    recalcularTotales();
    renderTabla();
    document.getElementById("buscarInsumo").value = "";
    document.getElementById("cantidadUsada").value = "";
    insumoSeleccionado = null;
}

/* ===============================
AGREGAR INTERMEDIO
=============================== */

function agregarIntermedio(){

    if(!intermedioSeleccionado){
        alert("Seleccione un intermedio");
        return;
    }

    const cantidad=parseFloat(document.getElementById("cantidadIntermedio").value);

    if(isNaN(cantidad) || cantidad<=0){
        alert("Cantidad inválida");
        return;
    }

    const costo=intermedioSeleccionado.costo_unitario*cantidad;

    intermediosReceta.push({
        tipo:"intermedio",
        intermedio_id:intermedioSeleccionado.id,
        nombre:intermedioSeleccionado.nombre,
        cantidad,
        costo
    });

    recalcularTotales();
    renderTabla();

}


/* ===============================
AGREGAR PACKING
=============================== */

function agregarPacking(){

    if(!packingSeleccionado){
        alert("Seleccione packing");
        return;
    }

    const cantidad=parseFloat(document.getElementById("cantidadPackingUsado").value);

    if(isNaN(cantidad) || cantidad<=0){
        alert("Cantidad inválida");
        return;
    }

    const costo=packingSeleccionado.costo_unitario*cantidad;

    packingReceta.push({
        tipo:"packing",
        packing_id:packingSeleccionado.id,
        nombre:packingSeleccionado.nombre,
        cantidad,
        costo
    });

    recalcularTotales();
    renderTabla();

}


/* ===============================
RENDER TABLA
=============================== */

function renderTabla(){

    const tabla=document.getElementById("tablaInsumos");

    tabla.innerHTML="";

    totalBase=0;

    const items=[...insumosReceta,...intermediosReceta,...packingReceta];

    items.forEach((item,index)=>{

        totalBase+=item.costo;

        const row=document.createElement("tr");

        row.innerHTML=`
        <td>${item.nombre}</td>
        <td>${item.cantidad}</td>
        <td>S/ ${item.costo.toFixed(2)}</td>
        <td><button class="btnEliminar" data-index="${index}">X</button></td>
        `;

        tabla.appendChild(row);

    });

    document.querySelectorAll(".btnEliminar").forEach(btn=>{

        btn.addEventListener("click",function(){

            const index=parseInt(this.dataset.index);

            const totalInsumos=insumosReceta.length;
            const totalIntermedios=intermediosReceta.length;

            if(index<totalInsumos){

                insumosReceta.splice(index,1);

            }else if(index<totalInsumos+totalIntermedios){

                intermediosReceta.splice(index-totalInsumos,1);

            }else{

                packingReceta.splice(index-totalInsumos-totalIntermedios,1);

            }

            recalcularTotales();
            renderTabla();

        });

    });

    document.getElementById("totalInsumos").innerText=totalBase.toFixed(2);

}


/* ===============================
CALCULAR TOTALES
=============================== */

function recalcularTotales(){

    const cantidadProducida=parseFloat(document.getElementById("cantidadProducida").value)||1;
    const porcentajeMO=parseFloat(document.getElementById("manoObraPorcentaje").value)||0;
    const porcentajeIndirectos=parseFloat(document.getElementById("indirectoValor").value)||0;
    const margenDeseado=parseFloat(document.getElementById("margenGanancia").value)||0;
    const incluirIGV=document.getElementById("incluirIGV").checked;

    const costoMateriales=totalBase;

    totalManoObra=(costoMateriales*porcentajeMO)/100;

    const baseProductiva=costoMateriales+totalManoObra;

    totalIndirectos=(baseProductiva*porcentajeIndirectos)/100;

    const subtotalProduccion=baseProductiva+totalIndirectos;

    const igv=incluirIGV?subtotalProduccion*0.18:0;

    costoTotal=subtotalProduccion+igv;

    precioVenta=costoTotal*(1+margenDeseado/100);

    ganancia=precioVenta-costoTotal;

    margenReal=precioVenta>0?(ganancia/precioVenta)*100:0;

    precioUnidad=precioVenta/cantidadProducida;

    const setText=(id,value)=>{
        document.getElementById(id).innerText=value.toFixed(2);
    };

    setText("totalManoObra",totalManoObra);
    setText("totalIndirectos",totalIndirectos);
    setText("subtotal",subtotalProduccion);
    setText("igv",igv);
    setText("costoTotal",costoTotal);
    setText("precioVenta",precioVenta);
    setText("ganancia",ganancia);
    setText("precioUnidad",precioUnidad);

    document.getElementById("margenReal").innerText=margenReal.toFixed(2)+" %";

}


/* ===============================
GUARDAR RECETA
=============================== */

function guardarReceta(){

    const nombre=document.getElementById("nombreProducto").value.trim();

    if(!nombre){
        alert("Ingrese nombre del producto");
        return;
    }

    const receta={

        nombre,

        cantidad_producida:parseFloat(document.getElementById("cantidadProducida").value),

        subtotal:parseFloat(document.getElementById("subtotal").textContent),

        costo_total:parseFloat(document.getElementById("costoTotal").textContent),

        precio_venta:parseFloat(document.getElementById("precioVenta").textContent),

        insumos:insumosReceta.map(i=>({
            insumo_id:i.insumo_id,
            cantidad:i.cantidad,
            costo:i.costo
        })),

        intermedios:intermediosReceta.map(i=>({
            intermedio_id:i.intermedio_id,
            cantidad:i.cantidad,
            costo:i.costo
        })),

        packing:packingReceta.map(i=>({
            packing_id:i.packing_id,
            cantidad:i.cantidad,
            costo:i.costo
        }))

    };

    fetch("/api/recetas",{
        method:"POST",
        headers:{
            "Content-Type":"application/json",
            Authorization:"Bearer "+token
        },
        body:JSON.stringify(receta)
    })
    .then(r=>r.json())
    .then(()=>{

        alert("Receta guardada correctamente");

    })
    .catch(err=>{
        console.error(err);
        alert("Error guardando receta");
    });

}