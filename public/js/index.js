const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/login";
}

// Variables
let insumosReceta = [];
let intermediosReceta = [];
let packingReceta = [];
let totalBase = 0;
let totalManoObra = 0;
let totalIndirectos = 0;
let costoTotal = 0;
let precioVenta = 0;
let precioUnidad = 0;
let ganancia = 0;
let margenReal = 0;

document.addEventListener("DOMContentLoaded", () => {
    cargarDatos("/api/insumos", "insumoSelect", ["precio", "unidad"]);
    cargarDatos("/api/intermedios", "selectIntermedio", ["costo_unitario"]);
    cargarDatos("/api/packing", "selectPacking", ["costo_unitario"]);

    // Botones
    const btnAgregar = document.getElementById("btnAgregar");
    if (btnAgregar) btnAgregar.addEventListener("click", agregarInsumo);

    const btnAgregarIntermedio = document.getElementById("btnAgregarIntermedio");
    if (btnAgregarIntermedio) btnAgregarIntermedio.addEventListener("click", agregarIntermedio);

    const btnAgregarPacking = document.getElementById("btnAgregarPacking");
    if (btnAgregarPacking) {
        btnAgregarPacking.addEventListener("click", agregarPacking);
    }

    const btnGuardar = document.getElementById("btnGuardar");
    if (btnGuardar) btnGuardar.addEventListener("click", guardarReceta);

    // Inputs automáticos
    [
        "cantidadProducida",
        "manoObraPorcentaje",
        "indirectoValor",
        "margenGanancia"
    ].forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.addEventListener("input", recalcularTotales);
        }
    });

    // Checkbox IGV
    const incluirIGV = document.getElementById("incluirIGV");
    if (incluirIGV) {
        incluirIGV.addEventListener("change", recalcularTotales);
    }
});

// ===============================
//  CARGAR DATOS
// ===============================
async function cargarDatos(apiUrl, selectId, dataAttributes) {
    const select = document.getElementById(selectId);
    if (!select) return;

    try {
        const response = await fetch(apiUrl, {
            headers: { "Authorization": "Bearer " + token }
        });

        const data = await response.json();

        select.innerHTML = `<option value="">Seleccione una opción</option>`;

        data.forEach(item => {
            let optionHTML = `<option value="${item.id}"`;
            dataAttributes.forEach(attr => {
                optionHTML += ` data-${attr}="${item[attr]}"`;
            });
            optionHTML += `>${item.nombre}</option>`;
            select.innerHTML += optionHTML;
        });

    } catch (error) {
        console.error("Error cargando datos:", error);
    }
}

// ===============================
//  VALIDACIÓN
// ===============================
function validarCampos(select, cantidad) {
    if (!select.value || isNaN(cantidad) || cantidad <= 0) {
        return "Seleccione una opción válida y asegúrese de que la cantidad sea un número positivo.";
    }
    return null;
}

function showAlert(message) {
    alert(message);
}

// ===============================
// ➕ AGREGAR INSUMO
// ===============================

function agregarInsumo() {
    const select = document.getElementById("insumoSelect");
    const cantidad = parseFloat(document.getElementById("cantidadUsada")?.value);
    const unidad = document.getElementById("unidadSelect").value;  // Obtener la unidad seleccionada

    const mensajeError = validarCampos(select, cantidad);
    if (mensajeError) {
        showAlert(mensajeError);
        return;
    }

    const option = select.options[select.selectedIndex];
    const precio = parseFloat(option.getAttribute("data-precio"));

    if (isNaN(precio)) {
        showAlert("Precio del insumo no válido");
        return;
    }

    let cantidadBase = cantidad;
    let precioFinal = precio;

    // Convertir el precio según la unidad seleccionada
    if (unidad === "kg") {
        // Si la unidad es kg, mantenemos el precio tal cual
        cantidadBase = cantidad;
    } else if (unidad === "g") {
        // Si la unidad es gramos, convertimos el precio por kg a precio por gramo
        precioFinal = precio / 1000; // Precio por gramo
        cantidadBase = cantidad;    // Mantenemos la cantidad en gramos
    } else if (unidad === "l") {
        // Si la unidad es litro, mantenemos el precio por litro
        cantidadBase = cantidad;
    } else if (unidad === "ml") {
        // Si la unidad es mililitros, convertimos el precio por litro a precio por mililitro
        precioFinal = precio / 1000; // Precio por mililitro
        cantidadBase = cantidad;    // Mantenemos la cantidad en mililitros
    }

    // Calcular el costo de acuerdo con la cantidad en la unidad base
    const costo = precioFinal * cantidadBase;

    const existente = insumosReceta.find(i => i.insumo_id === parseInt(select.value));

    if (existente) {
        existente.cantidad += cantidadBase;  // Actualizar la cantidad base
        existente.costo += costo;
    } else {
        insumosReceta.push({
            tipo: "insumo",
            insumo_id: parseInt(select.value),
            nombre: option.text,
            unidad,
            cantidad: cantidadBase,
            costo
        });
    }

    recalcularTotales();
    renderTabla();
}

// ===============================
// ➕ AGREGAR INTERMEDIO
// ===============================
function agregarIntermedio() {
    const select = document.getElementById("selectIntermedio");
    const cantidad = parseFloat(document.getElementById("cantidadIntermedio")?.value);

    if (!select.value || isNaN(cantidad) || cantidad <= 0) {
        showAlert("Seleccione intermedio y cantidad válida");
        return;
    }

    const option = select.options[select.selectedIndex];
    const costoUnitario = parseFloat(option.getAttribute("data-costo_unitario"));

    if (isNaN(costoUnitario)) {
        showAlert("Costo del intermedio no válido");
        return;
    }

    const costo = costoUnitario * cantidad;

    const existente = intermediosReceta.find(i => i.intermedio_id === parseInt(select.value));

    if (existente) {
        existente.cantidad += cantidad;
        existente.costo += costo;
    } else {
        intermediosReceta.push({
            tipo: "intermedio",
            intermedio_id: parseInt(select.value),
            nombre: option.text,
            cantidad,
            costo
        });
    }

    recalcularTotales();
    renderTabla();
}

//  AGREGAR PACKING
function agregarPacking() {
    const select = document.getElementById("selectPacking");
    const cantidad = parseFloat(document.getElementById("cantidadPackingUsado")?.value);

    if (!select.value || isNaN(cantidad) || cantidad <= 0) {
        showAlert("Seleccione packing y cantidad válida");
        return;
    }

    const option = select.options[select.selectedIndex];
    const costoUnitario = parseFloat(option.getAttribute("data-costo_unitario"));

    if (isNaN(costoUnitario)) {
        showAlert("Costo unitario no válido");
        return;
    }

    const costo = costoUnitario * cantidad;

    const existente = packingReceta.find(p => p.packing_id === parseInt(select.value));

    if (existente) {
        existente.cantidad += cantidad;
        existente.costo += costo;
    } else {
        packingReceta.push({
            tipo: "packing",
            packing_id: parseInt(select.value),
            nombre: option.text,
            cantidad,
            costo
        });
    }

    recalcularTotales();
    renderTabla();
}

// ===============================
// 🖥 RENDER TABLA
// ===============================
function renderTabla() {
    const tabla = document.getElementById("tablaInsumos");
    if (!tabla) return;

    tabla.innerHTML = "";

    totalBase = 0;

    const items = [...insumosReceta, ...intermediosReceta, ...packingReceta];

    items.forEach((item, index) => {
        totalBase += item.costo;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${item.nombre}</td>
            <td>${item.cantidad} ${item.unidad ? item.unidad : ""}</td>
            <td>S/ ${item.costo.toFixed(2)}</td>
            <td><button class="btnEliminar" data-index="${index}">X</button></td>
        `;

        tabla.appendChild(row);
    });

    document.querySelectorAll(".btnEliminar").forEach(btn => {
        btn.addEventListener("click", function () {
            if (!confirm("¿Eliminar este item?")) return;

            const index = parseInt(this.getAttribute("data-index"));

            const totalInsumos = insumosReceta.length;
            const totalIntermedios = intermediosReceta.length;

            if (index < totalInsumos) {
                // Es insumo
                insumosReceta.splice(index, 1);
            } else if (index < totalInsumos + totalIntermedios) {
                // Es intermedio
                intermediosReceta.splice(index - totalInsumos, 1);
            } else {
                // Es packing
                packingReceta.splice(index - totalInsumos - totalIntermedios, 1);
            }

            recalcularTotales();
            renderTabla();
        });
    });

    const totalEl = document.getElementById("totalInsumos");
    if (totalEl) totalEl.innerText = totalBase.toFixed(2);
}

// ===============================
// 💰 CALCULAR TOTALES
// ===============================
function formatCurrency(valor) {
    return valor.toFixed(2);
}

function recalcularTotales() {
    const cantidadProducida = parseFloat(document.getElementById("cantidadProducida")?.value) || 1;
    const porcentajeMO = parseFloat(document.getElementById("manoObraPorcentaje")?.value) || 0;
    const porcentajeIndirectos = parseFloat(document.getElementById("indirectoValor")?.value) || 0;
    const margenDeseado = parseFloat(document.getElementById("margenGanancia")?.value) || 0;
    const incluirIGV = document.getElementById("incluirIGV")?.checked || false;

    const costoMateriales = totalBase;
    totalManoObra = (costoMateriales * porcentajeMO) / 100;
    const baseProductiva = costoMateriales + totalManoObra;
    totalIndirectos = (baseProductiva * porcentajeIndirectos) / 100;
    const subtotalProduccion = baseProductiva + totalIndirectos;
    const igv = incluirIGV ? subtotalProduccion * 0.18 : 0;

    costoTotal = subtotalProduccion + igv;
    precioVenta = costoTotal * (1 + margenDeseado / 100);
    ganancia = precioVenta - costoTotal;
    margenReal = precioVenta > 0 ? (ganancia / precioVenta) * 100 : 0;
    precioUnidad = precioVenta / cantidadProducida;

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    };

    setText("totalManoObra", formatCurrency(totalManoObra));
    setText("totalIndirectos", formatCurrency(totalIndirectos));
    setText("subtotal", formatCurrency(subtotalProduccion));
    setText("igv", formatCurrency(igv));
    setText("costoTotal", formatCurrency(costoTotal));
    setText("precioVenta", formatCurrency(precioVenta));
    setText("ganancia", formatCurrency(ganancia));
    setText("precioUnidad", formatCurrency(precioUnidad));

    const margenElemento = document.getElementById("margenReal");
    if (margenElemento) {
        margenElemento.innerText = `${margenReal.toFixed(2)} %`;
        margenElemento.style.color =
            margenReal < 20 ? "red" :
            margenReal < 30 ? "orange" : "green";
    }
}

// ===============================
// 💾 GUARDAR RECETA
// ===============================
function guardarReceta() {
    const nombre = document.getElementById("nombreProducto").value.trim();
    const cantidad_producida = parseFloat(document.getElementById("cantidadProducida").value);
    const subtotal = parseFloat(document.getElementById("subtotal").textContent);
    const costoTotal = parseFloat(document.getElementById("costoTotal").textContent);
    const precioVenta = parseFloat(document.getElementById("precioVenta").textContent);

    // Validaciones generales
    if (!nombre || cantidad_producida <= 0) {
        showAlert("Ingrese nombre del producto y cantidad válida.");
        return;
    }

    if (
        insumosReceta.length === 0 &&
        intermediosReceta.length === 0 &&
        packingReceta.length === 0
    ) {
        showAlert("Debe agregar al menos un componente (insumo, intermedio o packing).");
        return;
    }

    if (
        isNaN(subtotal) || subtotal <= 0 ||
        isNaN(costoTotal) || costoTotal <= 0 ||
        isNaN(precioVenta) || precioVenta <= 0
    ) {
        showAlert("Los valores financieros no son válidos.");
        return;
    }

    // Formatear insumos
    const insumosFormateados = insumosReceta.map(item => {
        const insumo_id = parseInt(item.insumo_id);
        const cantidad = parseFloat(item.cantidad);
        const costo = parseFloat(item.costo);

        if (
            isNaN(insumo_id) || insumo_id <= 0 ||
            isNaN(cantidad) || cantidad <= 0 ||
            isNaN(costo) || costo < 0
        ) {
            throw new Error("Insumos inválidos.");
        }

        return { insumo_id, cantidad, costo };
    });

    // Formatear intermedios
    const intermediosFormateados = intermediosReceta.map(item => {
        const intermedio_id = parseInt(item.intermedio_id);
        const cantidad = parseFloat(item.cantidad);
        const costo = parseFloat(item.costo);

        if (
            isNaN(intermedio_id) || intermedio_id <= 0 ||
            isNaN(cantidad) || cantidad <= 0 ||
            isNaN(costo) || costo < 0
        ) {
            throw new Error("Intermedios inválidos.");
        }

        return { intermedio_id, cantidad, costo };
    });

    // Formatear packing
    const packingFormateado = packingReceta.map(item => {
        const packing_id = parseInt(item.packing_id);
        const cantidad = parseFloat(item.cantidad);
        const costo = parseFloat(item.costo);

        if (
            isNaN(packing_id) || packing_id <= 0 ||
            isNaN(cantidad) || cantidad <= 0 ||
            isNaN(costo) || costo < 0
        ) {
            throw new Error("Packing inválido.");
        }

        return { packing_id, cantidad, costo };
    });

    // Objeto final
    const receta = {
        nombre,
        cantidad_producida,
        subtotal,
        costo_total: costoTotal,
        precio_venta: precioVenta,
        insumos: insumosFormateados,
        intermedios: intermediosFormateados,
        packing: packingFormateado
    };

    // Enviar al backend
    fetch("/api/recetas", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(receta)
    })
    .then(async response => {
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Error al guardar receta");
        }

        alert("Receta guardada correctamente");
    })
    .catch(error => {
        console.error("Error real:", error);
        alert(error.message);
    });
}