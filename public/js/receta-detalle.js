const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/login.html";
}

const params = new URLSearchParams(window.location.search);
const recetaId = params.get("id");

document.addEventListener("DOMContentLoaded", () => {

    cargarDetalle();
    configurarBotonPdf();
    configurarBotonEditar();

});


// =============================
// CARGAR DETALLE
// =============================

async function cargarDetalle() {

    if (!recetaId || isNaN(recetaId)) {
        alert("ID inválido");
        return;
    }

    try {

        const response = await fetch(`/api/recetas/${recetaId}`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Error obteniendo receta");
        }

        renderDetalle(data);

    } catch (error) {

        console.error("Error cargando detalle:", error);
        alert("Error cargando detalle");

    }
}


// =============================
// RENDER DETALLE
// =============================

function renderDetalle(data) {

    const receta = data.receta || {};
    const insumos = Array.isArray(data.insumos) ? data.insumos : [];

    const resumen = data.resumen || {

        subtotal: Number(receta.subtotal) || 0,
        igv: (Number(receta.costo_total) || 0) - (Number(receta.subtotal) || 0),
        costo_total: Number(receta.costo_total) || 0,
        precio_venta: Number(receta.precio_venta) || 0,
        ganancia: (Number(receta.precio_venta) || 0) - (Number(receta.costo_total) || 0),
        margen: receta.precio_venta > 0
            ? ((receta.precio_venta - receta.costo_total) / receta.precio_venta) * 100
            : 0

    };

    document.getElementById("nombreReceta").innerText = receta.nombre || "-";

    if (receta.fecha_creacion) {
        document.getElementById("fechaReceta").innerText =
            new Date(receta.fecha_creacion).toLocaleDateString();
    }

    document.getElementById("usuarioNombre").innerText =
        receta.usuario_nombre || "-";

    const tabla = document.getElementById("tablaInsumosDetalle");
    tabla.innerHTML = "";

    insumos.forEach(i => {

        const cantidad = Number(i.cantidad) || 0;
        const costo = Number(i.costo) || 0;

        const costoUnitario = cantidad > 0 ? costo / cantidad : 0;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${i.nombre || "-"}</td>
            <td>${cantidad.toFixed(2)}</td>
            <td>${i.unidad || "-"}</td>
            <td>S/ ${costoUnitario.toFixed(2)}</td>
            <td><strong>S/ ${costo.toFixed(2)}</strong></td>
        `;

        tabla.appendChild(row);

    });

    document.getElementById("subtotalTabla").innerText =
        "S/ " + resumen.subtotal.toFixed(2);

    document.getElementById("igvDetalle").innerText =
        "S/ " + resumen.igv.toFixed(2);

    document.getElementById("costoTotal").innerText =
        "S/ " + resumen.costo_total.toFixed(2);

    document.getElementById("precioVenta").innerText =
        "S/ " + resumen.precio_venta.toFixed(2);

    document.getElementById("gananciaDetalle").innerText =
        "S/ " + resumen.ganancia.toFixed(2);

    const margenEl = document.getElementById("margenDetalle");

    margenEl.innerText = resumen.margen.toFixed(2) + " %";

    margenEl.style.color =
        resumen.margen < 20 ? "red" :
        resumen.margen < 30 ? "orange" :
        "green";

}


// =============================
// BOTÓN PDF
// =============================

function configurarBotonPdf() {

    const btnPdf = document.getElementById("btnPdf");

    if (!btnPdf) return;

    btnPdf.addEventListener("click", async () => {

        try {

            const response = await fetch(`/api/pdf/receta/${recetaId}`, {
                headers: {
                    "Authorization": "Bearer " + token
                }
            });

            if (!response.ok) {
                throw new Error("Error generando PDF");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `receta-${recetaId}.pdf`;

            document.body.appendChild(a);
            a.click();
            a.remove();

            window.URL.revokeObjectURL(url);

        } catch (error) {

            console.error("Error descargando PDF:", error);
            alert("Error descargando PDF");

        }

    });

}


// =============================
// BOTÓN EDITAR
// =============================

function configurarBotonEditar() {

    const btnEditar = document.getElementById("btnEditar");

    if (!btnEditar) return;

    btnEditar.addEventListener("click", () => {

        if (!recetaId) return;

        window.location.href = `/dashboard.html?id=${recetaId}`;

    });

}