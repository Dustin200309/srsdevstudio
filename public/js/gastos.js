const API = "/api/gastos";

// Evento de carga del documento
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("guardarGasto")?.addEventListener("click", registrarGasto); // Registrar nuevo gasto
    cargarGastos();  // Cargar los gastos existentes al inicio
});

/* =========================
FORMATEAR MONEDA
========================= */
function moneda(valor) {
    return new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: "PEN"
    }).format(valor || 0); // Formatea el valor como moneda en soles
}

/* =========================
REGISTRAR GASTO
========================= */
async function registrarGasto() {
    try {
        const token = localStorage.getItem("token");

        // Obtener valores del formulario
        const categoria = document.getElementById("categoria").value;
        const subcategoria = document.getElementById("subcategoria").value;
        const monto = parseFloat(document.getElementById("monto").value); // Convertir a número
        const descripcion = document.getElementById("descripcion").value;
        const fecha = document.getElementById("fecha").value;

        // Validar datos
        if (!monto || isNaN(monto)) {
            showAlert("Por favor ingresa un monto válido.", "error");
            return;
        }

        if (!categoria || !subcategoria || !fecha || !descripcion) {
            showAlert("Todos los campos deben ser llenados correctamente.", "error");
            return;
        }

        // Enviar los datos al backend
        const res = await fetch(API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                categoria,
                subcategoria,
                monto,
                descripcion,
                fecha
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Error al registrar el gasto");
        }

        showAlert("Gasto registrado correctamente", "success");
        limpiarFormulario(); // Limpiar el formulario
        cargarGastos(); // Recargar los gastos
    } catch (error) {
        console.error("Error:", error);
        showAlert("Hubo un problema registrando el gasto", "error");
    }
}

/* =========================
LIMPIAR FORMULARIO
========================= */
function limpiarFormulario() {
    document.getElementById("monto").value = "";
    document.getElementById("descripcion").value = "";
    document.getElementById("fecha").value = "";
    document.getElementById("categoria").value = "";
    document.getElementById("subcategoria").value = "";
}

/* =========================
CARGAR GASTOS
========================= */
async function cargarGastos() {
    try {
        const token = localStorage.getItem("token");

        // Solicitar los gastos al backend
        const res = await fetch(API, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const gastos = await res.json();

        if (!Array.isArray(gastos)) return;

        renderTabla(gastos);  // Renderizar la tabla de gastos
        calcularResumen(gastos);  // Calcular el resumen por categoría

    } catch (error) {
        console.error("Error cargando gastos", error);
        showAlert("No se pudieron cargar los gastos", "error");
    }
}

/* =========================
RENDER TABLA
========================= */
function renderTabla(gastos) {
    const tabla = document.getElementById("tablaGastos");

    if (!tabla) return;

    tabla.innerHTML = ""; // Limpiar la tabla antes de agregar los nuevos datos

    if (gastos.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="6">Sin gastos registrados</td>
            </tr>
        `;
        return;
    }

    // Renderizar cada fila con los datos de los gastos
    gastos.forEach(g => {
        const fila = document.createElement("tr");
        const fecha = g.fecha ? g.fecha.split("T")[0] : "";  // Formatear fecha

        fila.innerHTML = `
            <td>${fecha}</td>
            <td>${g.categoria || ""}</td>
            <td>${g.subcategoria || ""}</td>
            <td>${g.descripcion || ""}</td>
            <td>${moneda(g.monto)}</td>
            <td><button class="eliminar-btn" data-id="${g.id}">🗑</button></td>
        `;

        tabla.appendChild(fila);  // Agregar la fila a la tabla
    });

    // Agregar el event listener a los botones de eliminar
    agregarEventListenersEliminar();
}

/* =========================
AGREGAR EVENT LISTENER A LOS BOTONES DE ELIMINAR
========================= */
function agregarEventListenersEliminar() {
    const eliminarBtns = document.querySelectorAll(".eliminar-btn");
    eliminarBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            eliminarGasto(id);  // Llamar la función eliminarGasto
        });
    });
}

/* =========================
CALCULAR RESUMEN
========================= */
function calcularResumen(gastos) {
    let totalMes = 0;
    let insumos = 0;
    let servicios = 0;
    let manoObra = 0;

    const mesActual = new Date().getMonth();
    const añoActual = new Date().getFullYear();

    // Calcular los totales por categoría
    gastos.forEach(g => {
        const fecha = new Date(g.fecha);
        if (fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual) {
            totalMes += Number(g.monto) || 0;
        }

        if (g.categoria === "INSUMOS") {
            insumos += Number(g.monto) || 0;
        }

        if (g.categoria === "SERVICIOS") {
            servicios += Number(g.monto) || 0;
        }

        if (g.categoria === "MANO_DE_OBRA") {
            manoObra += Number(g.monto) || 0;
        }
    });

    // Actualizar el resumen en el DOM
    document.getElementById("gastosMes").textContent = moneda(totalMes);
    document.getElementById("gastosInsumos").textContent = moneda(insumos);
    document.getElementById("gastosServicios").textContent = moneda(servicios);
    document.getElementById("gastosManoObra").textContent = moneda(manoObra);
}

/* =========================
ELIMINAR GASTO
========================= */
async function eliminarGasto(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este gasto?")) return;

    try {
        const token = localStorage.getItem("token");

        // Enviar solicitud de eliminación al backend
        const res = await fetch(`/api/gastos/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Error eliminando gasto");
        }

        showAlert(data.message, "success");
        cargarGastos();  // Recargar la lista de gastos después de eliminar

    } catch (error) {
        console.error("Error:", error);
        showAlert("No se pudo eliminar el gasto", "error");
    }
}

/* =========================
SHOW ALERT (TOAST)
========================= */
function showAlert(message, type) {
    const alert = document.createElement("div");
    alert.className = `toast ${type}`;
    alert.textContent = message;
    document.body.appendChild(alert);
    setTimeout(() => {
        alert.classList.add("show");
    }, 100);
    setTimeout(() => {
        alert.classList.remove("show");
        document.body.removeChild(alert);
    }, 3000);
}