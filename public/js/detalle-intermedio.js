// ===============================
// 🔐 VALIDAR TOKEN
// ===============================
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}


// ===============================
// 📌 OBTENER ID DESDE URL
// ===============================
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
    alert("ID no válido");
    window.location.href = "intermedios.html";
}


// ===============================
// 🚀 INICIALIZAR AL CARGAR DOM
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    configurarBotonVolver();
    cargarDetalle();
});


// ===============================
// 🔙 BOTÓN VOLVER
// ===============================
function configurarBotonVolver() {
    const btnVolver = document.getElementById("btnVolver");

    if (btnVolver) {
        btnVolver.addEventListener("click", () => {
            window.location.href = "intermedios.html";
        });
    }
}


// ===============================
// 📡 CARGAR DETALLE
// ===============================
async function cargarDetalle() {

    const loader = document.getElementById("loader");
    const contenedor = document.getElementById("detalleContainer");

    try {

        const response = await fetch(`/api/intermedios/${id}/detalle`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) {
            throw new Error("Error obteniendo detalle");
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            throw new Error("No se encontraron datos");
        }

        renderDetalle(data);

        loader.style.display = "none";
        contenedor.classList.remove("hidden");

    } catch (error) {

        console.error(error);

        loader.style.display = "none";

        contenedor.innerHTML = `
            <p style="color:red; text-align:center;">
                Error cargando el detalle
            </p>
        `;
    }
}


// ===============================
// 🎨 RENDERIZAR DETALLE
// ===============================
function renderDetalle(data) {

    const contenedor = document.getElementById("detalleContainer");
    const info = data[0];

    let html = `
        <h2>${info.nombre}</h2>

        <div class="detalle-info">
            <p><strong>Cantidad producida:</strong> ${info.cantidad_producida}</p>
            <p><strong>Costo total:</strong> S/ ${Number(info.costo_total).toFixed(2)}</p>
            <p><strong>Costo unitario:</strong> S/ ${Number(info.costo_unitario).toFixed(2)}</p>
        </div>

        <h3>Insumos utilizados</h3>

        <table>
            <thead>
                <tr>
                    <th>Insumo</th>
                    <th>Cantidad</th>
                    <th>Unidad</th>
                    <th>Costo</th>
                </tr>
            </thead>
            <tbody>
    `;

    // 🔥 SIN IF — siempre renderiza
    data.forEach(item => {
        html += `
            <tr>
                <td>${item.nombre_insumo || "—"}</td>
                <td>${item.cantidad ?? 0}</td>
                <td>${item.unidad_usada || "-"}</td>
                <td>S/ ${item.costo ? Number(item.costo).toFixed(2) : "0.00"}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    contenedor.innerHTML = html;
}