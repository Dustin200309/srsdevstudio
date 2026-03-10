let insumosReceta = [];
let totalMateriales = 0;
function mostrarToast(mensaje, tipo = "success") {

    const toast = document.getElementById("toastSuccess");

    if (!toast) return;

    toast.innerHTML = `
        <span class="icon">${tipo === "success" ? "✔" : "⚠"}</span>
        <span>${mensaje}</span>
    `;

    toast.className = `toast show ${tipo}`;

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);

}
document.addEventListener("DOMContentLoaded", () => {
    
    const tabla = document.getElementById("tablaInsumos");
    const totalMaterialesSpan = document.getElementById("totalMateriales");
    const costoManoObraSpan = document.getElementById("costoManoObra");
    const totalGeneralSpan = document.getElementById("totalGeneral");
    const costoUnitarioSpan = document.getElementById("costoUnitario");

    const manoObraInput = document.getElementById("manoObra");
    const cantidadProducidaInput = document.getElementById("cantidadProducida");

    const btnAgregar = document.getElementById("btnAgregar");
    const btnGuardar = document.getElementById("btnGuardar");

    cargarInsumos();

    if (btnAgregar) {
        btnAgregar.addEventListener("click", agregarInsumo);
    }

    if (btnGuardar) {
        btnGuardar.addEventListener("click", guardarIntermedio);
    }

    if (manoObraInput) {
        manoObraInput.addEventListener("input", calcularTotales);
    }

    if (cantidadProducidaInput) {
        cantidadProducidaInput.addEventListener("input", calcularTotales);
    }

    async function cargarInsumos() {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch("/api/insumos", {
                headers: {
                    "Authorization": "Bearer " + token
                }
            });

            const insumos = await response.json();

            const select = document.getElementById("selectInsumo");

            if (!select) return;

            select.innerHTML = '<option value="">Seleccione un insumo</option>';

            insumos.forEach(insumo => {
                const option = document.createElement("option");
                option.value = insumo.id;
                option.textContent = `${insumo.nombre} (${insumo.unidad}) - S/ ${insumo.precio}`;
                option.dataset.precio = insumo.precio;
                option.dataset.unidad = insumo.unidad;
                select.appendChild(option);
            });

        } catch (error) {
            console.error("Error cargando insumos:", error);
        }
    }

    function agregarInsumo() {

        const select = document.getElementById("selectInsumo");
        const cantidad = parseFloat(document.getElementById("cantidadInsumo")?.value);
        const unidad = document.getElementById("unidadSelect")?.value;

        const mensajeError = validarCampos(select, cantidad);
        if (mensajeError) {
            mostrarToast(mensajeError, "error");
            return;
        }

        const option = select.options[select.selectedIndex];
        const precio = parseFloat(option.dataset.precio);

        let cantidadBase = cantidad;
        let precioFinal = precio;

        if (unidad === "g") precioFinal = precio / 1000;
        if (unidad === "ml") precioFinal = precio / 1000;

        const costo = precioFinal * cantidadBase;

        const existente = insumosReceta.find(i => i.insumo_id === parseInt(select.value));

        if (existente) {
            existente.cantidad += cantidadBase;
            existente.costo += costo;
        } else {
            insumosReceta.push({
                insumo_id: parseInt(select.value),
                nombre: option.text,
                unidad,
                cantidad: cantidadBase,
                costo
            });
        }

        renderTabla();
        calcularTotales();

        document.getElementById("cantidadInsumo").value = "";
    }

    function renderTabla() {

        if (!tabla) return;

        tabla.innerHTML = "";

        insumosReceta.forEach((i, index) => {

            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>${i.nombre}</td>
                <td>${i.cantidad}</td>
                <td>S/ ${i.costo.toFixed(2)}</td>
                <td>
                    <button type="button" class="btnEliminar" data-index="${index}">X</button>
                </td>
            `;

            tabla.appendChild(fila);
        });

        document.querySelectorAll(".btnEliminar").forEach(btn => {
            btn.addEventListener("click", function () {
                eliminarInsumo(this.dataset.index);
            });
        });
    }

    function eliminarInsumo(index) {
        insumosReceta.splice(index, 1);
        renderTabla();
        calcularTotales();
    }

    function calcularTotales() {

        totalMateriales = insumosReceta.reduce((acc, i) => acc + i.costo, 0);

        const porcentaje = parseFloat(manoObraInput?.value) || 0;
        const costoManoObra = totalMateriales * (porcentaje / 100);

        const totalGeneral = totalMateriales + costoManoObra;

        const cantidadProducida = parseFloat(cantidadProducidaInput?.value) || 1;
        const costoUnitario = totalGeneral / cantidadProducida;

        if (totalMaterialesSpan) totalMaterialesSpan.innerText = "S/ " + totalMateriales.toFixed(2);
        if (costoManoObraSpan) costoManoObraSpan.innerText = "S/ " + costoManoObra.toFixed(2);
        if (totalGeneralSpan) totalGeneralSpan.innerText = "S/ " + totalGeneral.toFixed(2);
        if (costoUnitarioSpan) costoUnitarioSpan.innerText = "S/ " + costoUnitario.toFixed(2);
    }

    function guardarIntermedio() {

        const token = localStorage.getItem("token");

        const nombre = document.getElementById("nombre")?.value;
        const cantidadProducida = parseFloat(cantidadProducidaInput?.value);
        const manoObra = parseFloat(manoObraInput?.value);

        if (!nombre || insumosReceta.length === 0) {
            mostrarToast("Complete todos los datos", "error");
            return;
        }

        fetch("/api/intermedios/crear", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                nombre,
                cantidad_producida: cantidadProducida,
                mano_obra: manoObra,
                detalles: insumosReceta
            })
        })
        .then(res => res.json())
        .then(() => {
            mostrarToast("Intermedio guardado correctamente", "success");

            setTimeout(()=>{
             location.reload();
            },1500);
        })
        .catch(error => {
            console.error("Error guardando intermedio:", error);
        });
    }

    function validarCampos(select, cantidad) {
        if (!select?.value || isNaN(cantidad) || cantidad <= 0) {
            return "Seleccione un insumo válido y una cantidad correcta.";
        }
        return null;
    }

});