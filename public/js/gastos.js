const API = "/api/gastos";

/* =========================
EVENTO CARGA DOCUMENTO
========================= */
document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("guardarGasto")?.addEventListener("click", registrarGasto);

    cargarGastos();

    // Botón QR ahora abre cámara
    document.getElementById("btnEscanearQR")?.addEventListener("click", iniciarEscanerQR);

    // Escaneo desde imagen
    document.getElementById("fileInput").addEventListener("change", procesarQR);
});


/* =========================
ESCANEAR QR DESDE IMAGEN
========================= */
function procesarQR(event) {

    const file = event.target.files[0];

    if (!file) {
        alert("No se seleccionó ningún archivo.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {

        const img = new Image();

        img.onload = function () {

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            const code = jsQR(imageData.data, canvas.width, canvas.height, {
                inversionAttempts: "attemptBoth"
            });

            if (!code) {
                alert("No se pudo leer el código QR.");
                return;
            }

            procesarContenidoQR(code.data);
        };

        img.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

function procesarContenidoQR(contenido) {

    contenido = contenido.trim();

    console.log("QR detectado:", contenido);

    /* =========================
    DETECTAR QR SUNAT
    ========================= */

    if (contenido.includes("|")) {

        const partes = contenido.split("|");

        if (partes.length >= 5) {

            const ruc = partes[0];
            const tipo = partes[1];
            const serie = partes[2];
            const monto = partes[3];
            const fecha = partes[4];

            document.getElementById("monto").value = parseFloat(monto) || "";
            document.getElementById("fecha").value = fecha || "";

            document.getElementById("descripcion").value =
                `Comprobante ${serie} - RUC ${ruc}`;

            // categoría automática sugerida
            const categoria = document.getElementById("categoria");
            if (categoria && !categoria.value) {
                categoria.value = "INSUMOS";
            }

            showAlert("Boleta o factura detectada correctamente", "success");

            return;
        }
    }

    /* =========================
    JSON
    ========================= */

    try {

        const datosQR = JSON.parse(contenido);

        document.getElementById("categoria").value = datosQR.categoria || "";
        document.getElementById("subcategoria").value = datosQR.subcategoria || "";
        document.getElementById("monto").value = datosQR.monto || "";
        document.getElementById("fecha").value = datosQR.fecha || "";
        document.getElementById("descripcion").value = datosQR.descripcion || "";

        showAlert("Datos cargados desde QR", "success");

        return;

    } catch (e) {}

    /* =========================
    URL
    ========================= */

    if (/^https?:\/\//i.test(contenido)) {

        if (confirm("El QR contiene un enlace. ¿Abrirlo?")) {
            window.open(contenido, "_blank");
        }

        return;
    }

    /* =========================
    DETECTAR MONTO
    ========================= */

    const numero = contenido.match(/\d+(?:\.\d{1,2})?/);

    if (numero) {
        document.getElementById("monto").value = numero[0];
    }

    document.getElementById("descripcion").value = contenido;

    showAlert("QR leído correctamente", "success");
}


/* =========================
ESCANER QR CON CAMARA
========================= */
function iniciarEscanerQR() {

    const reader = document.getElementById("reader");

    if (!reader) {
        console.error("No existe el contenedor reader");
        return;
    }

    reader.style.display = "block";

    const qr = new Html5Qrcode("reader");

    qr.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {

            console.log("QR detectado:", decodedText);

            await qr.stop();

            reader.style.display = "none";

            procesarContenidoQR(decodedText);

        },
        () => {}
    ).catch(err => {

        console.error("Error iniciando escáner:", err);

        showAlert("No se pudo iniciar la cámara", "error");

        reader.style.display = "none";

    });
}

/* =========================
FORMATEAR MONEDA
========================= */
function moneda(valor) {

    return new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: "PEN"
    }).format(valor || 0);

}


/* =========================
REGISTRAR GASTO
========================= */
async function registrarGasto() {

    try {

        const token = localStorage.getItem("token");

        const categoria = document.getElementById("categoria").value;
        const subcategoria = document.getElementById("subcategoria").value;
        const monto = parseFloat(document.getElementById("monto").value);
        const descripcion = document.getElementById("descripcion").value;
        const fecha = document.getElementById("fecha").value;

        if (!monto || isNaN(monto)) {

            showAlert("Por favor ingresa un monto válido.", "error");
            return;

        }

        if (!categoria || !subcategoria || !fecha || !descripcion) {

            showAlert("Todos los campos deben ser llenados correctamente.", "error");
            return;

        }

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

        limpiarFormulario();

        cargarGastos();

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

        const res = await fetch(API, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const gastos = await res.json();

        if (!Array.isArray(gastos)) return;

        renderTabla(gastos);

        calcularResumen(gastos);

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

    tabla.innerHTML = "";

    if (gastos.length === 0) {

        tabla.innerHTML = `
        <tr>
            <td colspan="6">Sin gastos registrados</td>
        </tr>
        `;

        return;
    }

    gastos.forEach(g => {

        const fila = document.createElement("tr");

        const fecha = g.fecha ? g.fecha.split("T")[0] : "";

        fila.innerHTML = `
        <td>${fecha}</td>
        <td>${g.categoria || ""}</td>
        <td>${g.subcategoria || ""}</td>
        <td>${g.descripcion || ""}</td>
        <td>${moneda(g.monto)}</td>
        <td><button class="eliminar-btn" data-id="${g.id}">🗑</button></td>
        `;

        tabla.appendChild(fila);

    });

    agregarEventListenersEliminar();

}


/* =========================
BOTONES ELIMINAR
========================= */
function agregarEventListenersEliminar() {

    const eliminarBtns = document.querySelectorAll(".eliminar-btn");

    eliminarBtns.forEach(btn => {

        btn.addEventListener("click", () => {

            const id = btn.getAttribute("data-id");

            eliminarGasto(id);

        });

    });

}


/* =========================
RESUMEN
========================= */
function calcularResumen(gastos) {

    let totalMes = 0;
    let insumos = 0;
    let servicios = 0;
    let manoObra = 0;

    const mesActual = new Date().getMonth();
    const añoActual = new Date().getFullYear();

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

        cargarGastos();

    } catch (error) {

        console.error("Error:", error);

        showAlert("No se pudo eliminar el gasto", "error");

    }

}


/* =========================
ALERTAS
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