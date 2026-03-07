const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/login.html";
}

let editandoId = null; // 🔥 Control modo edición


document.addEventListener("DOMContentLoaded", () => {
    cargarInsumos();

    document.getElementById("btnGuardarInsumo").addEventListener("click", guardarInsumo);
    document.getElementById("btnLimpiar").addEventListener("click", limpiarFormulario);
    document.getElementById("buscarInsumo").addEventListener("input", filtrarInsumos);
});

// ===============================
// 🔄 CARGAR INSUMOS
// ===============================
async function cargarInsumos() {
    try {
        const response = await fetch("/api/insumos", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Error al cargar insumos");
        }

        renderInsumos(data);
    } catch (error) {
        console.error(error);
        showModal("Error", "Error al conectar con el servidor", "error");
    }
}

// ===============================
// 💾 GUARDAR / ACTUALIZAR
// ===============================
async function guardarInsumo() {
    const nombre = document.getElementById("nombreInsumo").value.trim();
    const unidad = document.getElementById("unidadInsumo").value;
    const precio = parseFloat(document.getElementById("precioInsumo").value);

    if (!nombre || isNaN(precio) || precio <= 0) {
        showModal("Advertencia", "Complete los campos correctamente", "warning");
        return;
    }

    try {
        let url = "/api/insumos";
        let method = "POST";

        if (editandoId) {
            url = `/api/insumos/${editandoId}`;
            method = "PUT";
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ nombre, unidad, precio })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Error guardando insumo");
        }

        showModal("Éxito", editandoId ? "Insumo actualizado correctamente" : "Insumo guardado correctamente", "success");
        limpiarFormulario();
        cargarInsumos();
    } catch (error) {
        console.error(error);
        showModal("Error", error.message, "error");
    }
}

function renderInsumos(insumos) {
    const lista = document.getElementById("listaInsumos");
    const contador = document.getElementById("contadorInsumos");

    if (!lista || !contador) return; 
    lista.innerHTML = ""
    contador.innerText = insumos.length;

    insumos.forEach(insumo => {

        const card = document.createElement("div");
        card.classList.add("insumo-item");

        card.innerHTML = `
            <div>
                <strong>${insumo.nombre}</strong><br>
                ${insumo.unidad} - S/ ${parseFloat(insumo.precio).toFixed(2)}
            </div>

            <div class="insumo-actions">
                <button class="btn-action btn-edit" data-id="${insumo.id}">
                    ✏️ Editar
                </button>
                <button class="btn-action btn-delete" data-id="${insumo.id}">
                    🗑 Eliminar
                </button>
            </div>
        `;

        lista.appendChild(card);
    });

    // EDITAR
    document.querySelectorAll(".btn-edit").forEach(btn => {
        btn.addEventListener("click", function () {
            const id = this.dataset.id;
            editarInsumo(id);
        });
    });

    // ELIMINAR
    document.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", function () {
            const id = this.dataset.id;
            eliminarInsumo(id);
        });
    });
    
}
// ===============================
// ✏ EDITAR
// ===============================
async function editarInsumo(id) {
    try {
        const response = await fetch(`/api/insumos/${id}`, {
            headers: { "Authorization": "Bearer " + token }
        });

        const insumo = await response.json();

        if (!response.ok) {
            throw new Error(insumo.error || "Error cargando insumo");
        }

        document.getElementById("nombreInsumo").value = insumo.nombre;
        document.getElementById("unidadInsumo").value = insumo.unidad;
        document.getElementById("precioInsumo").value = insumo.precio;

        editandoId = id; // 🔥 Activamos modo edición

        document.getElementById("btnGuardarInsumo").innerText = "Actualizar";

    } catch (error) {
        console.error(error);
        showModal("Error", error.message, "error");
    }
}

// ===============================
// 🗑 ELIMINAR (FRONTEND)
// ===============================
async function eliminarInsumo(id) {

    if (!id) {
        showModal("Error", "ID inválido", "error");
        return;
    }

    showConfirm("¿Seguro que deseas eliminar este insumo?", async (confirmado) => {

        if (!confirmado) return;

        try {

            const response = await fetch(`/api/insumos/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": "Bearer " + token
                }
            });

            let data = {};
            try {
                data = await response.json();
                } catch (_) {}

            if (!response.ok) {
                throw new Error(data.error || "Error eliminando insumo");
            }

            showModal("Éxito", "Insumo eliminado correctamente", "success");
            cargarInsumos();

        } catch (error) {
            console.error(error);
            showModal("Error", error.message, "error");
        }

    });
}

// ===============================
// 🔍 FILTRAR
// ===============================
function filtrarInsumos() {
    const filtro = document.getElementById("buscarInsumo").value.toLowerCase();
    const cards = document.querySelectorAll(".insumo-item");

    cards.forEach(card => {
        const texto = card.innerText.toLowerCase();
        card.style.display = texto.includes(filtro) ? "flex" : "none";
    });
}

// ===============================
// 🧹 LIMPIAR
// ===============================
function limpiarFormulario() {
    document.getElementById("nombreInsumo").value = "";
    document.getElementById("precioInsumo").value = "";
    editandoId = null; // 🔥 Salir de modo edición
    document.getElementById("btnGuardarInsumo").innerText = "Guardar";
}

// ===============================
// 🟢 MODAL (REUTILIZADO)
// ===============================
function showModal(title, message, type) {
    const modal = document.getElementById("customModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");

    modalTitle.textContent = title;
    modalMessage.textContent = message;

    modal.classList.remove("success", "error", "warning");
    modal.classList.add(type);

    modal.classList.add("active");
    setTimeout(() => modal.classList.remove("active"), 3000);
}

function showConfirm(message, onConfirm) {

    const modal = document.getElementById("customModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const modalActions = document.getElementById("modalActions");

    modalTitle.textContent = "Confirmar acción";
    modalMessage.textContent = message;

    modal.classList.remove("success", "error", "warning");
    modal.classList.add("warning");

    modalActions.innerHTML = `
        <button id="confirmYes" class="btn-primary">Aceptar</button>
        <button id="confirmNo" class="btn-secondary">Cancelar</button>
    `;

    modal.classList.add("active");

    document.getElementById("confirmYes").onclick = () => {
        modal.classList.remove("active");
        onConfirm(true);
    };

    document.getElementById("confirmNo").onclick = () => {
        modal.classList.remove("active");
        onConfirm(false);
    };
}