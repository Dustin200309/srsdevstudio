document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    cargarRecetas();

    // 🔥 Delegación de eventos (solo un listener)
    document.getElementById("listaRecetas").addEventListener("click", function(e) {

        if (e.target.classList.contains("btnEliminar")) {
            const id = e.target.dataset.id;
            eliminarReceta(id, token);
        }

        if (e.target.classList.contains("btnVer")) {
            const id = e.target.dataset.id;
            window.location.href = `receta-detalle.html?id=${id}`;
        }

        if (e.target.classList.contains("btnPdf")) {
            const id = e.target.dataset.id;
            descargarPDF(id, token);
        }

    });

});


// ===============================
// CARGAR RECETAS
// ===============================

async function cargarRecetas() {

    const token = localStorage.getItem("token");

    try {
        const response = await fetch("/api/recetas", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Error cargando recetas");
        }

        renderRecetas(data);

    } catch (error) {
        console.error(error);
        showAlert("Error cargando recetas");
    }
}


// ===============================
// RENDER RECETAS
// ===============================

function renderRecetas(recetas) {

    const contenedor = document.getElementById("listaRecetas");
    contenedor.innerHTML = "";

    if (!Array.isArray(recetas) || recetas.length === 0) {
        contenedor.innerHTML = "<p>No tienes recetas guardadas.</p>";
        return;
    }

    recetas.forEach(receta => {

        const card = document.createElement("div");
        card.classList.add("card-insumo");

        card.innerHTML = `
            <strong>${receta.nombre}</strong><br>
            Precio Venta: S/ ${Number(receta.precio_venta).toFixed(2)}<br>
            Costo Total: S/ ${Number(receta.costo_total).toFixed(2)}<br>
            Fecha: ${receta.fecha_creacion ? new Date(receta.fecha_creacion).toLocaleDateString() : "Sin fecha"}
            <br><br>
            <button type="button" class="btnVer" data-id="${receta.id}">Ver</button>
            <button type="button" class="btnPdf" data-id="${receta.id}">PDF</button>
            <button type="button" class="btnEliminar" data-id="${receta.id}">Eliminar</button>
        `;

        contenedor.appendChild(card);
    });
}

// ===============================
// ELIMINAR RECETA
// ===============================

async function eliminarReceta(id, token) {

    showConfirm("¿Seguro que deseas eliminar esta receta?", async (confirmado) => {

        if (!confirmado) return;

        try {

            const response = await fetch(`/api/recetas/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": "Bearer " + token
                }
            });

            let data = {};
            try {
                data = await response.json();
            } catch (e) {}

            if (!response.ok) {
                throw new Error(data.error || "Error eliminando receta");
            }

            showAlert("Receta eliminada correctamente");
            cargarRecetas();

        } catch (error) {
            console.error(error);
            showAlert(error.message);
        }
        

    });
}


// ===============================
// DESCARGAR PDF
// ===============================

async function descargarPDF(id, token) {

    try {

        const response = await fetch(`/api/pdf/receta/${id}`, {
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
        a.download = `receta-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error(error);
        showAlert("Error descargando PDF");
    }
}


// ===============================
// MODAL
// ===============================

function showAlert(message) {

    const modal = document.getElementById("customModal");
    const msg = document.getElementById("modalMessage");
    const cancel = document.getElementById("modalCancel");

    msg.innerText = message;
    cancel.style.display = "none";
    modal.classList.add("active");

    document.getElementById("modalAccept").onclick = () => {
        modal.classList.remove("active");
    };
}


function showConfirm(message, callback) {

    const modal = document.getElementById("customModal");
    const msg = document.getElementById("modalMessage");
    const cancel = document.getElementById("modalCancel");

    msg.innerText = message;
    cancel.style.display = "inline-block";
    modal.classList.add("active");

    document.getElementById("modalAccept").onclick = () => {
        modal.classList.remove("active");
        callback(true);
    };

    cancel.onclick = () => {
        modal.classList.remove("active");
        callback(false);
    };
}