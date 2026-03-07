const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/login.html";
}

const params = new URLSearchParams(window.location.search);
const recetaId = params.get("id");

document.addEventListener("DOMContentLoaded", () => {
    cargarDetalle();
    configurarBotonPdf();
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

        if (!data || !data.receta) {
            throw new Error("Datos incompletos del backend");
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

    const receta = data.receta;
    const insumos = Array.isArray(data.insumos) ? data.insumos : [];

    // Calcular resumen si backend no lo envía
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

    // ================= HEADER =================

    const nombreEl = document.getElementById("nombreReceta");
    if (nombreEl) nombreEl.innerText = receta.nombre || "-";

    const fechaEl = document.getElementById("fechaReceta");
    if (fechaEl && receta.fecha_creacion) {
        fechaEl.innerText =
            new Date(receta.fecha_creacion).toLocaleDateString();
    }

    const usuarioEl = document.getElementById("usuarioNombre");
    if (usuarioEl) {
        usuarioEl.innerText = receta.usuario_nombre || "-";
    }

    // ================= TABLA INSUMOS =================

    const tabla = document.getElementById("tablaInsumosDetalle");
    if (tabla) {

        tabla.innerHTML = "";

        insumos.forEach(i => {

            const cantidad = Number(i.cantidad) || 0;
            const costo = Number(i.costo) || 0;

            const costoUnitario =
                cantidad > 0 ? costo / cantidad : 0;

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
    }

    // Subtotal tabla (id corregido)
    const subtotalTablaEl = document.getElementById("subtotalTabla");
    if (subtotalTablaEl) {
        subtotalTablaEl.innerText =
            "S/ " + resumen.subtotal.toFixed(2);
    }

    // ================= RESUMEN FINANCIERO =================

    const igvEl = document.getElementById("igvDetalle");
    if (igvEl) igvEl.innerText =
        "S/ " + resumen.igv.toFixed(2);

    const totalEl = document.getElementById("costoTotal");
    if (totalEl) totalEl.innerText =
        "S/ " + resumen.costo_total.toFixed(2);

    const precioEl = document.getElementById("precioVenta");
    if (precioEl) precioEl.innerText =
        "S/ " + resumen.precio_venta.toFixed(2);

    const gananciaEl = document.getElementById("gananciaDetalle");
    if (gananciaEl) gananciaEl.innerText =
        "S/ " + resumen.ganancia.toFixed(2);

    const margenEl = document.getElementById("margenDetalle");
    if (margenEl) {
        margenEl.innerText =
            resumen.margen.toFixed(2) + " %";

        margenEl.style.color =
            resumen.margen < 20 ? "red" :
            resumen.margen < 30 ? "orange" : "green";
    }
}


// =============================
// BOTÓN PDF
// =============================

function configurarBotonPdf() {

    const btnPdf = document.getElementById("btnPdf");

    if (!btnPdf) return;

    btnPdf.addEventListener("click", async (e) => {

        e.preventDefault();

        try {

            const response = await fetch(`/api/pdf/receta/${recetaId}`, {
                headers: {
                    "Authorization": "Bearer " + token
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error backend PDF:", errorText);
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