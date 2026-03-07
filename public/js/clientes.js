const API_URL = "/api/clientes";

/* ======================================================
   INIT
====================================================== */
document.addEventListener("DOMContentLoaded", init);

function init() {

    cargarClientes();

    document.getElementById("registroCliente")
        ?.addEventListener("submit", registrarCliente);

    document.getElementById("registroCompra")
        ?.addEventListener("submit", registrarCompra);
}

/* ======================================================
   FETCH HELPER
====================================================== */
async function apiFetch(url, options = {}) {

    const token = localStorage.getItem("token");

    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...options.headers
        },
        ...options
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Error en la petición");
    }

    return data;
}

/* ======================================================
   CARGAR CLIENTES
====================================================== */
async function cargarClientes() {

    try {

        const data = await apiFetch(API_URL);

        renderClientes(data.clientes);

        llenarSelectClientes(data.clientes);

    } catch (error) {

        console.error(error);
        alert("No se pudieron cargar los clientes");

    }
}

/* ======================================================
   RENDER CLIENTES
====================================================== */
function renderClientes(clientes) {

    const lista = document.getElementById("clientesLista");

    if (!lista) return;

    lista.innerHTML = "";

    clientes.forEach(cliente => {

        const li = document.createElement("li");

        li.appendChild(crearClienteCard(cliente));

        lista.appendChild(li);

    });

}

function crearClienteCard(cliente) {

    const card = document.createElement("div");
    card.className = "cliente-card";
    card.style.cursor = "pointer";

    const info = document.createElement("div");
    info.className = "cliente-info";

    const nombre = document.createElement("strong");
    nombre.textContent = cliente.nombre;

    const telefono = document.createElement("p");
    telefono.textContent = `Tel: ${cliente.telefono}`;

    const total = document.createElement("p");
    total.textContent = `Total: S/${cliente.total_compras}`;

    info.append(nombre, telefono, total);

    const comprasContainer = document.createElement("div");
    comprasContainer.id = `compras-${cliente.id}`;
    comprasContainer.className = "compras-container hidden";

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "Eliminar Cliente";
    btnEliminar.className = "btn-eliminar";

    btnEliminar.addEventListener("click", (e) => {
        e.stopPropagation();
        eliminarCliente(cliente.id);
    });

    card.addEventListener("click", () => {
        toggleCompras(cliente.id);
    });

    card.append(info, comprasContainer, btnEliminar);

    return card;
}

/* ======================================================
   LLENAR SELECT CLIENTES
====================================================== */
function llenarSelectClientes(clientes) {

    const select = document.getElementById("clienteId");

    if (!select) return;

    select.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.textContent = "Selecciona un Cliente";
    defaultOption.disabled = true;
    defaultOption.selected = true;

    select.appendChild(defaultOption);

    clientes.forEach(cliente => {

        const option = document.createElement("option");

        option.value = cliente.id;
        option.textContent = `${cliente.nombre} - ${cliente.telefono}`;

        select.appendChild(option);

    });

}

/* ======================================================
   REGISTRAR CLIENTE
====================================================== */
async function registrarCliente(e) {

    e.preventDefault();

    const nombre = clienteNombre.value.trim();
    const telefono = clienteTelefono.value.trim();

    if (!nombre || !telefono) {
        return alert("Completa todos los campos");
    }

    try {

        await apiFetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ nombre, telefono })
        });

        e.target.reset();

        cargarClientes();

        alert("Cliente creado correctamente");

    } catch (error) {

        console.error(error);
        alert("Error al crear cliente");

    }
}

/* ======================================================
   REGISTRAR COMPRA
====================================================== */
async function registrarCompra(e) {

    e.preventDefault();

    const cliente_id = clienteId.value;
    const descripcion = descripcionCompra.value.trim();
    const monto = parseFloat(montoCompra.value);

    if (!cliente_id || !descripcion || !monto) {
        return alert("Completa todos los campos");
    }

    try {

        await apiFetch(`${API_URL}/compras`, {
            method: "POST",
            body: JSON.stringify({ cliente_id, descripcion, monto })
        });

        e.target.reset();

        cargarClientes();

        alert("Compra registrada");

    } catch (error) {

        console.error(error);
        alert("Error al registrar compra");

    }
}

/* ======================================================
   ELIMINAR CLIENTE
====================================================== */
async function eliminarCliente(clienteId) {

    if (!confirm("¿Seguro que deseas eliminar este cliente?")) return;

    try {

        await apiFetch(`${API_URL}/${clienteId}`, {
            method: "DELETE"
        });

        cargarClientes();

        alert("Cliente eliminado");

    } catch (error) {

        console.error(error);
        alert("Error al eliminar cliente");

    }
}

/* ======================================================
   TOGGLE COMPRAS
====================================================== */
async function toggleCompras(clienteId) {

    const container = document.getElementById(`compras-${clienteId}`);

    if (!container) return;

    const card = container.closest(".cliente-card");

    const estaActivo = card.classList.contains("activo");

    document.querySelectorAll(".cliente-card").forEach(c => {
        c.classList.remove("activo");
    });

    if (estaActivo) return;

    card.classList.add("activo");

    if (container.dataset.loaded === "true") return;

    try {

        const data = await apiFetch(`${API_URL}/compras/${clienteId}`);

        container.innerHTML = "";

        if (!data.compras.length) {

            container.innerHTML = "<p>Sin consumos.</p>";

        } else {

            data.compras.forEach(compra => {
                container.appendChild(crearCompraItem(compra));
            });

        }

        container.dataset.loaded = "true";

    } catch (error) {

        console.error(error);
        alert("Error al cargar compras");

    }
}

/* ======================================================
   ITEM COMPRA
====================================================== */
function crearCompraItem(compra) {

    const div = document.createElement("div");
    div.className = "compra-item";

    const descripcion = document.createElement("p");
    descripcion.innerHTML = `<strong>${compra.descripcion}</strong>`;

    const monto = document.createElement("p");
    monto.textContent = `Monto pagado: S/${compra.monto}`;

    const botones = document.createElement("div");
    botones.className = "compra-botones";

    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar";

    btnEditar.addEventListener("click", (e) => {
        e.stopPropagation();
        editarCompra(compra.id);
    });

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "Eliminar";

    btnEliminar.addEventListener("click", (e) => {
        e.stopPropagation();
        eliminarCompra(compra.id);
    });

    botones.append(btnEditar, btnEliminar);

    div.append(descripcion, monto, botones);

    return div;
}

/* ======================================================
   EDITAR COMPRA
====================================================== */
async function editarCompra(compraId) {

    const nuevaDescripcion = prompt("Nueva descripción:");

    if (nuevaDescripcion === null) return;

    const nuevoMonto = prompt("Nuevo monto:");

    if (nuevoMonto === null) return;

    if (isNaN(nuevoMonto)) {
        return alert("Monto inválido");
    }

    try {

        await apiFetch(`${API_URL}/compras/${compraId}`, {
            method: "PUT",
            body: JSON.stringify({
                descripcion: nuevaDescripcion.trim(),
                monto: parseFloat(nuevoMonto)
            })
        });

        alert("Compra actualizada correctamente");

        cargarClientes();

    } catch (error) {

        console.error(error);
        alert("Error al actualizar compra");

    }
}

/* ======================================================
   ELIMINAR COMPRA
====================================================== */
async function eliminarCompra(id) {

    if (!confirm("¿Eliminar esta compra?")) return;

    try {

        await apiFetch(`${API_URL}/compras/${id}`, {
            method: "DELETE"
        });

        cargarClientes();

        alert("Compra eliminada");

    } catch (error) {

        console.error(error);
        alert("Error al eliminar compra");

    }
}