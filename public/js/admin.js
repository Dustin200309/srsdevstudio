document.addEventListener("DOMContentLoaded", () => {

/* =========================
   PROTECCIÓN ADMIN
========================= */

const token = localStorage.getItem("token");
const rol = localStorage.getItem("rol");

if (!token) {
    window.location.href = "/login";
    return;
}

if (rol !== "admin") {
    window.location.href = "/dashboard";
    return;
}

/* =========================
   VARIABLES
========================= */

let usuarioChatActivo = null;
let nombreUsuarioActivo = null;

const chatMensajes = document.getElementById("chat-mensajes");
const listaUsuariosChat = document.getElementById("lista-usuarios");
const chatTitulo = document.getElementById("chat-titulo");



/* =========================
   FETCH GENERICO
========================= */

async function apiFetch(url, options = {}) {

    const config = {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(options.headers || {})
        }
    };

    const res = await fetch(url, config);

    if (!res.ok) {
        console.error("API error:", res.status);
        throw new Error("Error API");
    }

    return res.json();
}



/* =========================
   USUARIOS
========================= */

async function cargarUsuarios() {

    try {

        const usuarios = await apiFetch("/api/admin/usuarios");

        const tabla = document.getElementById("tabla-usuarios");

        if (!tabla) return;

        tabla.innerHTML = "";

        let activos = 0;

        usuarios.forEach(u => {

            if (u.activo) activos++;

            const fila = document.createElement("tr");

            fila.innerHTML = `
            <td>${u.id}</td>
            <td>${u.nombre}</td>
            <td>${u.email}</td>
            <td>${u.rol}</td>
            <td>
                <span class="estado ${u.activo ? "activo" : "inactivo"}">
                ${u.activo ? "Activo" : "Inactivo"}
                </span>
            </td>
            <td>
                <button class="btn-toggle" data-id="${u.id}">
                ${u.activo ? "Desactivar" : "Activar"}
                </button>

                <button class="btn-reset" data-id="${u.id}">
                Reset clave
                </button>
            </td>
            `;

            tabla.appendChild(fila);

        });

        const activosBox = document.getElementById("usuarios-activos");

        if (activosBox) activosBox.textContent = activos;

        eventosUsuarios();

    } catch (err) {

        console.error("Error cargando usuarios:", err);

    }

}



/* =========================
   EVENTOS USUARIOS
========================= */

function eventosUsuarios() {

document.querySelectorAll(".btn-toggle").forEach(btn => {

btn.onclick = async () => {

const id = btn.dataset.id;

if (!confirm("¿Cambiar estado usuario?")) return;

try {

await apiFetch(`/api/admin/usuarios/${id}/toggle`, {
method: "PUT"
});

cargarUsuarios();

} catch {

alert("Error cambiando estado");

}

};

});



document.querySelectorAll(".btn-reset").forEach(btn => {

btn.onclick = async () => {

const id = btn.dataset.id;

const nueva = prompt("Nueva contraseña:");

if (!nueva) return;

try {

await apiFetch(`/api/admin/usuarios/${id}/password`, {
method: "PUT",
body: JSON.stringify({ newPassword: nueva })
});

alert("Contraseña actualizada");

} catch {

alert("Error cambiando contraseña");

}

};

});

}



/* =========================
   CREAR USUARIO
========================= */

const btnCrearUsuario = document.getElementById("btn-crear-usuario");

if (btnCrearUsuario) {

btnCrearUsuario.onclick = async () => {

const nombre = document.getElementById("nuevo-nombre").value.trim();
const email = document.getElementById("nuevo-email").value.trim();
const password = document.getElementById("nuevo-password").value.trim();
const rol = document.getElementById("nuevo-rol").value;

if (!nombre || !email || !password) {
alert("Completa todos los campos");
return;
}

try {

await apiFetch("/api/admin/usuarios", {
method: "POST",
body: JSON.stringify({ nombre, email, password, rol })
});

alert("Usuario creado");

document.getElementById("nuevo-nombre").value = "";
document.getElementById("nuevo-email").value = "";
document.getElementById("nuevo-password").value = "";

cargarUsuarios();

} catch {

alert("Error creando usuario");

}

};

}



/* =========================
   NOTIFICACIONES
========================= */

const btnNotificacion = document.getElementById("btn-enviar-notificacion");

if (btnNotificacion) {

btnNotificacion.onclick = async () => {

const mensaje = document.getElementById("mensaje-notificacion").value.trim();

if (!mensaje) {
alert("Escribe un mensaje");
return;
}

try {

await apiFetch("/api/admin/notificaciones", {
method: "POST",
body: JSON.stringify({ mensaje })
});

alert("Notificación enviada");

document.getElementById("mensaje-notificacion").value = "";

} catch {

alert("Error enviando notificación");

}

};

}



/* =========================
   LISTA USUARIOS CHAT
========================= */

async function cargarUsuariosChat() {

if (!listaUsuariosChat) return;

try {

const usuarios = await apiFetch("/api/chat/admin/usuarios");

listaUsuariosChat.innerHTML = "";

usuarios.forEach(u => {

const li = document.createElement("li");

li.textContent = u.nombre;

li.onclick = () => {

usuarioChatActivo = u.id;
nombreUsuarioActivo = u.nombre;

if (chatTitulo) {
chatTitulo.textContent = "Conversando con: " + u.nombre;
}

cargarMensajesChat();

};

listaUsuariosChat.appendChild(li);

});

} catch (error) {

console.error("Error cargando usuarios chat:", error);

}

}



/* =========================
   CARGAR MENSAJES CHAT
========================= */

async function cargarMensajesChat() {

if (!usuarioChatActivo || !chatMensajes) return;

try {

const mensajes = await apiFetch(`/api/chat/admin/${usuarioChatActivo}`);

chatMensajes.innerHTML = "";

mensajes.forEach(m => {

const div = document.createElement("div");

div.className = `mensaje ${m.remitente === "admin" ? "admin" : "usuario"}`;

div.innerHTML = `
<strong>@${m.remitente === "admin" ? "admin" : m.nombre}</strong>
<p>${m.mensaje}</p>
<span>${new Date(m.fecha).toLocaleTimeString()}</span>
`;

chatMensajes.appendChild(div);

});

chatMensajes.scrollTop = chatMensajes.scrollHeight;

} catch (error) {

console.error("Error cargando chat:", error);

}

}



/* =========================
   ENVIAR MENSAJE
========================= */

const btnEnviarChat = document.getElementById("btn-enviar-chat");

if (btnEnviarChat) {

btnEnviarChat.onclick = async () => {

const input = document.getElementById("chat-mensaje");

const mensaje = input.value.trim();

if (!mensaje) return;

if (!usuarioChatActivo) {
alert("Selecciona un usuario");
return;
}

try {

await apiFetch("/api/chat/admin/responder", {
method: "POST",
body: JSON.stringify({
usuario_id: usuarioChatActivo,
mensaje: mensaje
})
});

input.value = "";

cargarMensajesChat();

} catch {

alert("Error enviando mensaje");

}

};

}



/* =========================
   SIDEBAR
========================= */

const toggle = document.getElementById("menu-toggle");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

if (toggle) {

toggle.addEventListener("click", () => {

sidebar.classList.toggle("active");
overlay.classList.toggle("active");

});

}

if (overlay) {

overlay.addEventListener("click", () => {

sidebar.classList.remove("active");
overlay.classList.remove("active");

});

}

const nombre = localStorage.getItem("nombre");

if (nombre) {
    document.getElementById("bienvenida").textContent =
        "Bienvenido " + nombre;
}

/* =========================
   LOGOUT
========================= */

const logout = document.getElementById("logout-btn");

if (logout) {

logout.onclick = () => {

localStorage.removeItem("token");
localStorage.removeItem("rol");
localStorage.removeItem("nombre");

window.location.href = "/login";

};

}



/* =========================
   AUTO REFRESH CHAT
========================= */

setInterval(() => {

if (usuarioChatActivo) {

cargarMensajesChat();

}

}, 4000);



/* =========================
   INIT
========================= */

cargarUsuarios();
cargarUsuariosChat();

});