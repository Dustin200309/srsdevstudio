const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

const mensajeDiv = document.getElementById("mensaje");

function mostrarMensaje(texto, tipo = "error") {
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `mensaje ${tipo}`;
    mensajeDiv.classList.remove("oculto");

    setTimeout(() => {
        mensajeDiv.classList.add("oculto");
    }, 3000);
}

// ===============================
// CARGAR INTERMEDIOS
// ===============================

async function cargarIntermedios() {

    try {

        const response = await fetch("/api/intermedios", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) {
            throw new Error("Error en la respuesta del servidor");
        }

        const data = await response.json();
        const contenedor = document.getElementById("listaIntermedios");

        if (!Array.isArray(data) || data.length === 0) {
            contenedor.innerHTML = "<p class='empty'>No tienes intermedios guardados.</p>";
            return;
        }

        contenedor.innerHTML = "";

        data.forEach(intermedio => {

            const card = document.createElement("div");
            card.classList.add("card");

            card.innerHTML = `
                <h3>${intermedio.nombre}</h3>
                <p><strong>Cantidad:</strong> ${intermedio.cantidad_producida}</p>
                <p><strong>Costo total:</strong> S/ ${Number(intermedio.costo_total || 0).toFixed(2)}</p>
                <p class="precio">
                    Costo unitario: S/ ${Number(intermedio.costo_unitario || 0).toFixed(2)}
                </p>

                <div class="acciones">
    <button class="btn btn-ver" data-id="${intermedio.id}">👁 Ver</button>
    <button class="btn btn-eliminar" data-id="${intermedio.id}">🗑 Eliminar</button>
</div>
            `;

            contenedor.appendChild(card);

            // EVENTOS (sin onclick, compatible con CSP)

            card.querySelector(".btn-ver").addEventListener("click", () => {
                window.location.href = `detalle-intermedio.html?id=${intermedio.id}`;
            });

            card.querySelector(".btn-eliminar").addEventListener("click", () => {
                eliminarIntermedio(intermedio.id);
            });

        });

    } catch (error) {
        console.error("Error al cargar intermedios:", error);
        mostrarMensaje("Error cargando intermedios");
    }
}

// ===============================
// ELIMINAR
// ===============================

async function eliminarIntermedio(id) {

    try {

        const response = await fetch(`/api/intermedios/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) {
            const err = await response.json();
            mostrarMensaje(err.error || "No se pudo eliminar");
            return;
        }

        mostrarMensaje("Intermedio eliminado", "success");
        cargarIntermedios();

    } catch (error) {
        console.error("Error al eliminar:", error);
        mostrarMensaje("Error al eliminar");
    }
}

document.addEventListener("DOMContentLoaded", cargarIntermedios);