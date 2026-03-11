document.addEventListener("DOMContentLoaded", () => {

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/login";
    return;
}

/* =========================
   LEER TOKEN
========================= */

function obtenerDatosToken(token) {

    try {

        const payload = token.split(".")[1];
        return JSON.parse(atob(payload));

    } catch {

        return null;

    }

}

const datos = obtenerDatosToken(token);

if (!datos) {

    localStorage.removeItem("token");
    window.location.href = "/login";
    return;

}

/* =========================
   VERIFICAR EXPIRACIÓN
========================= */

if (datos.exp && datos.exp * 1000 < Date.now()) {

    localStorage.removeItem("token");
    window.location.href = "/login";
    return;

}

const nombreUsuario = datos.nombre || "Usuario";

/* =========================
   DOM
========================= */

const chatBox = document.getElementById("chat-box");
const input = document.getElementById("chat-mensaje");
const btn = document.getElementById("btn-enviar-chat");

let usuarioSeleccionado = null;

/* =========================
   SANITIZAR
========================= */

function escaparHTML(texto) {

    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;

}

/* =========================
   FETCH API
========================= */

async function apiFetch(url, options = {}) {

    const res = await fetch(url, {

        ...options,

        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...(options.headers || {})
        }

    });

    if (!res.ok) {
        throw new Error("Error API");
    }

    return res.json();

}

/* =========================
   FORMATO HORA
========================= */

function formatearHora(fecha) {

    return new Date(fecha).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

}

/* =========================
   RENDER MENSAJE
========================= */

function renderMensaje(m) {

    const div = document.createElement("div");

    div.className = `mensaje ${m.remitente}`;

    const nombre = m.remitente === "admin"
        ? "Admin"
        : nombreUsuario;

    div.innerHTML = `
        <strong>@${escaparHTML(nombre)}</strong>
        <p>${escaparHTML(m.mensaje)}</p>
        <span>${formatearHora(m.fecha)}</span>
    `;

    chatBox.appendChild(div);

}

/* =========================
   CARGAR CHAT
========================= */

async function cargarChat() {

    if (!chatBox) return;

    try {

        let endpoint = "/api/chat";

        if (datos.rol === "admin") {

            if (!usuarioSeleccionado) return;

            endpoint = `/api/chat/admin/${usuarioSeleccionado}`;

        }

        const mensajes = await apiFetch(endpoint);

        chatBox.innerHTML = "";

        mensajes.forEach(renderMensaje);

        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {

        console.error("Error cargando chat:", error);

    }

}

/* =========================
   ENVIAR MENSAJE
========================= */

async function enviarMensaje() {

    const mensaje = input.value.trim();

    if (!mensaje) return;

    try {

        let endpoint = "/api/chat";
        let body = { mensaje };

        if (datos.rol === "admin") {

            if (!usuarioSeleccionado) {
                alert("Selecciona un usuario");
                return;
            }

            endpoint = "/api/chat/admin/responder";

            body = {
                usuario_id: usuarioSeleccionado,
                mensaje
            };

        }

        await apiFetch(endpoint, {
            method: "POST",
            body: JSON.stringify(body)
        });

        input.value = "";

        await cargarChat();

    } catch (error) {

        console.error("Error enviando mensaje:", error);

    }

}

/* =========================
   EVENTOS
========================= */

btn?.addEventListener("click", enviarMensaje);

input?.addEventListener("keydown", e => {

    if (e.key === "Enter") {

        e.preventDefault();
        enviarMensaje();

    }

});

/* =========================
   AUTO REFRESH OPTIMIZADO
========================= */

let intervalo = setInterval(() => {

    if (document.hidden) return;

    if (datos.rol === "admin") {

        if (usuarioSeleccionado) {
            cargarChat();
        }

    } else {

        cargarChat();

    }

}, 3000);

/* =========================
   INIT
========================= */

cargarChat();

});