// 🔐 TOKEN
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/login.html";
}

let editandoId = null;

// INICIO
document.addEventListener("DOMContentLoaded", () => {
    cargarPacking();

    document.getElementById("btnGuardarPacking")
        .addEventListener("click", guardarPacking);

    document.getElementById("btnLimpiarPacking")
        .addEventListener("click", limpiarFormulario);

    document.getElementById("buscarPacking")
        .addEventListener("input", filtrarPacking);
});

// 🔄 CARGAR PACKING
async function cargarPacking() {
    try {
        const response = await fetch("/api/packing", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) {
            throw new Error("Error al obtener packing");
        }

        const data = await response.json();
        renderPacking(data);

    } catch (error) {
        console.error(error);
        showModal("Error", "Error al conectar con el servidor", "error");
    }
}

// 💾 GUARDAR / ACTUALIZAR
async function guardarPacking() {
    const btn = document.getElementById("btnGuardarPacking");

    const nombre = document.getElementById("packingNombre").value.trim();
    const unidad = document.getElementById("packingUnidad").value;
    const precio = parseFloat(document.getElementById("packingPrecio").value);
    const cantidad = parseInt(document.getElementById("packingCantidad").value);

    if (!nombre || isNaN(precio) || precio <= 0 ||
        isNaN(cantidad) || cantidad <= 0) {

        showModal("Advertencia",
            "Complete los campos correctamente",
            "warning"
        );
        return;
    }

    btn.disabled = true;
    btn.innerText = editandoId ? "Actualizando..." : "Guardando...";

    try {
        let url = "/api/packing";
        let method = "POST";

        if (editandoId) {
            url = `/api/packing/${editandoId}`;
            method = "PUT";
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                nombre,
                unidad_medida: unidad,
                precio_base: precio,
                cantidad_por_paquete: cantidad
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Error al guardar packing");
        }

        showModal(
            "Éxito",
            editandoId
                ? "Packing actualizado correctamente"
                : "Packing guardado correctamente",
            "success"
        );

        limpiarFormulario();
        cargarPacking();

    } catch (error) {
        console.error(error);
        showModal("Error", error.message, "error");
    }

    btn.disabled = false;
    btn.innerText = editandoId ? "Actualizar" : "Guardar";
}

// 🖼 RENDER LISTA
function renderPacking(items) {
    const lista = document.getElementById("listaPacking");
    const contador = document.getElementById("contadorPacking");

    lista.innerHTML = "";
    contador.innerText = items.length;

    items.forEach(item => {
        const cantidad = item.cantidad_por_paquete || 1;

        // Cálculo de costo unitario con dos decimales
        const costoUnitario = item.costo_unitario ?? calcularCostoUnitario(item.precio_base, cantidad);

        const card = document.createElement("div");
        card.classList.add("packing-item");

        card.innerHTML = `
            <div>
                <strong>${item.nombre}</strong><br>
                ${item.unidad_medida}<br>
                Precio paquete: S/ ${formatearMoneda(item.precio_base)}<br>
                Contiene: ${cantidad} unidades<br>
                <strong>
                    Costo unitario: S/ ${formatearMoneda(costoUnitario)}
                </strong>
            </div>

            <div class="packing-actions">
                <button class="btn-action btn-edit" data-id="${item.id}">
                    ✏️
                </button>
                <button class="btn-action btn-delete" data-id="${item.id}">
                    🗑
                </button>
            </div>
        `;

        lista.appendChild(card);
    });

    // Asignamos el evento de eliminar a cada botón de eliminar
    document.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", async () => {
            const packingId = btn.dataset.id;
            await eliminarPacking(packingId); // Llamamos a la función de eliminar
        });
    });

    // Asignamos evento para editar
    document.querySelectorAll(".btn-edit").forEach(btn => {
        btn.addEventListener("click", () => editarPacking(btn.dataset.id));
    });
}

// 📊 CALCULAR COSTO UNITARIO
function calcularCostoUnitario(precioBase, cantidad) {
    return (cantidad > 0 ? (precioBase / cantidad).toFixed(2) : 0);
}

// 💲 FORMATEAR MONEDA
function formatearMoneda(valor) {
    return parseFloat(valor).toFixed(2); // Asegura que siempre tenga 2 decimales
}

// ✏ EDITAR
async function editarPacking(id) {
    try {
        const response = await fetch(`/api/packing/${id}`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) {
            throw new Error("Error cargando packing");
        }

        const item = await response.json();

        document.getElementById("packingNombre").value = item.nombre;
        document.getElementById("packingUnidad").value = item.unidad_medida;
        document.getElementById("packingPrecio").value = item.precio_base;
        document.getElementById("packingCantidad").value =
            item.cantidad_por_paquete;

        editandoId = id;
        document.getElementById("btnGuardarPacking").innerText = "Actualizar";

        window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (error) {
        console.error(error);
        showModal("Error", error.message, "error");
    }
}

// 🗑 ELIMINAR
async function eliminarPacking(id) {
    showConfirm(
        "¿Estás seguro de que deseas eliminar este packing?",
        async (confirmado) => {
            if (!confirmado) return;

            try {
                const response = await fetch(`/api/packing/${id}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": "Bearer " + token
                    }
                });

                if (!response.ok) {
                    throw new Error("Error eliminando packing");
                }

                showModal("Éxito", "Packing eliminado correctamente", "success");

                // Recargar lista de packings
                cargarPacking();

            } catch (error) {
                console.error(error);
                showModal("Error", error.message, "error");
            }
        }
    );
}

// 🔍 FILTRAR
function filtrarPacking() {
    const filtro =
        document.getElementById("buscarPacking").value.toLowerCase();

    const cards = document.querySelectorAll(".packing-item");

    cards.forEach(card => {
        const texto = card.innerText.toLowerCase();
        card.style.display =
            texto.includes(filtro) ? "flex" : "none";
    });
}

// 🧹 LIMPIAR
function limpiarFormulario() {
    document.getElementById("packingNombre").value = "";
    document.getElementById("packingPrecio").value = "";
    document.getElementById("packingCantidad").value = "";

    editandoId = null;

    document.getElementById("btnGuardarPacking").innerText = "Guardar";
}

// 🟢 MODAL SIMPLE
function showModal(title, message, type) {
    const modal = document.getElementById("customModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const modalActions = document.getElementById("modalActions");

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalActions.innerHTML = "";

    modal.className = "modal " + type;
    modal.classList.add("active");

    setTimeout(() => {
        modal.classList.remove("active");
    }, 3000);
}

// 🔐 CONFIRM MODAL
function showConfirm(message, onConfirm) {
    const modal = document.getElementById("customModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const modalActions = document.getElementById("modalActions");

    modalTitle.textContent = "Confirmar acción";
    modalMessage.textContent = message;

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