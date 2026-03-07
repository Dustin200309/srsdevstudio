document.addEventListener("DOMContentLoaded", () => {

    /* ======================================================
       CONFIG
    ====================================================== */

    const API = {
        perfil: "/api/auth/me",
        noticias: "/api/noticias",
        notificaciones: "/api/notificaciones",
        chat: "/api/chat"
    };

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "/login";
        return;
    }

    let usuarioActual = "Usuario";

    /* ======================================================
       ELEMENTOS
    ====================================================== */

    const el = {
        bienvenidaNavbar: document.getElementById("bienvenidaNavbar"),
        noticiasLista: document.getElementById("noticias-lista"),
        notificacionesLista: document.getElementById("notificaciones-lista"),
        chatBox: document.getElementById("chat-box"),
        chatInput: document.getElementById("chat-mensaje"),
        btnEnviar: document.getElementById("btn-enviar-chat"),
        logoutBtn: document.getElementById("logoutBtn"),
        sidebar: document.getElementById("sidebar"),
        overlay: document.getElementById("overlay"),
        menuBtn: document.getElementById("menuBtn")
    };

    /* ======================================================
       UTILIDADES
    ====================================================== */

    const escapeHTML = (str) =>
        str.replace(/[&<>"']/g, (m) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[m]));

    const formatearFecha = (fecha) => {
        if (!fecha) return "";
        return new Date(fecha).toLocaleString();
    };

    const scrollChatAbajo = () => {
        if (el.chatBox) {
            el.chatBox.scrollTop = el.chatBox.scrollHeight;
        }
    };

    /* ======================================================
       FETCH API
    ====================================================== */

    async function apiFetch(url, options = {}) {

        try {

            const res = await fetch(url, {
                method: options.method || "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    ...(options.headers || {})
                },
                body: options.body || null
            });

            if (res.status === 401) {
                logout();
                return null;
            }

            if (!res.ok) {
                console.warn(`API Error ${res.status} en ${url}`);
                return null;
            }

            return await res.json();

        } catch (err) {
            console.error("Error API:", err);
            return null;
        }
    }

    /* ======================================================
       PERFIL
    ====================================================== */

    async function cargarPerfil() {

        const perfil = await apiFetch(API.perfil);
        if (!perfil) return;

        usuarioActual =
            perfil.nombre ||
            perfil.username ||
            perfil.usuario ||
            perfil.name ||
            (perfil.email ? perfil.email.split("@")[0] : "Usuario");

        if (el.bienvenidaNavbar) {
            el.bienvenidaNavbar.innerHTML =
                `<strong>${escapeHTML(usuarioActual)}</strong>`;
        }
    }

    /* ======================================================
       NOTICIAS
    ====================================================== */

    async function cargarNoticias() {

        const noticias = await apiFetch(API.noticias);

        if (!el.noticiasLista) return;

        if (!noticias || !noticias.length) {
            el.noticiasLista.innerHTML = `<p class="placeholder">No hay noticias disponibles</p>`;
            return;
        }

        el.noticiasLista.innerHTML = noticias.map(n => `
            <div class="noticia">
                <h4>${escapeHTML(n.titulo || "Sin título")}</h4>
                <p>${escapeHTML(n.contenido || "")}</p>
                <span>${formatearFecha(n.fecha_creacion)}</span>
            </div>
        `).join("");
    }

    /* ======================================================
       NOTIFICACIONES
    ====================================================== */

    async function cargarNotificaciones() {

        const notificaciones = await apiFetch(API.notificaciones);

        if (!el.notificacionesLista) return;

        if (!notificaciones || !notificaciones.length) {
            el.notificacionesLista.innerHTML =
                `<p class="placeholder">No hay notificaciones</p>`;
            return;
        }

        el.notificacionesLista.innerHTML = notificaciones.map(n => `
            <div class="notificacion">
                <p>${escapeHTML(n.mensaje)}</p>
                <span>${formatearFecha(n.fecha_creacion)}</span>
            </div>
        `).join("");
    }

    /* ======================================================
       CHAT
    ====================================================== */

   async function cargarChat() {
    const mensajes = await apiFetch(API.chat);

    if (!el.chatBox) return;

    if (!mensajes || !mensajes.length) {
        el.chatBox.innerHTML = `
            <div class="msg support">
                Bienvenido al soporte 👋
            </div>
        `;
        return;
    }

    el.chatBox.innerHTML = mensajes.map(m => {
        const nombre = m.usuario || m.username || m.remitente || "Admin";
        const esUsuario = nombre.toLowerCase() === usuarioActual.toLowerCase();

        return `
            <div class="msg ${esUsuario ? "user" : "support"}">
                <strong>${escapeHTML(nombre)}:</strong> ${escapeHTML(m.mensaje)}
            </div>
        `;
    }).join("");

    scrollChatAbajo();
}

    /* ======================================================
       ENVIAR MENSAJE
    ====================================================== */

    async function enviarMensaje() {

        if (!el.chatInput) return;

        const mensaje = el.chatInput.value.trim();

        if (!mensaje) return;

        await apiFetch(API.chat, {
            method: "POST",
            body: JSON.stringify({ mensaje })
        });

        el.chatInput.value = "";

        await cargarChat();
    }

    /* ======================================================
       SIDEBAR
    ====================================================== */

    function toggleSidebar() {

        if (!el.sidebar || !el.overlay) return;

        el.sidebar.classList.toggle("active");
        el.overlay.classList.toggle("active");
    }

    function cerrarSidebar() {

        el.sidebar?.classList.remove("active");
        el.overlay?.classList.remove("active");
    }

    /* ======================================================
       LOGOUT
    ====================================================== */

    function logout() {
        localStorage.removeItem("token");
        window.location.href = "/login";
    }

    /* ======================================================
       EVENTOS
    ====================================================== */

    el.btnEnviar?.addEventListener("click", enviarMensaje);

    el.chatInput?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") enviarMensaje();
    });

    el.logoutBtn?.addEventListener("click", logout);

    el.menuBtn?.addEventListener("click", toggleSidebar);

    el.overlay?.addEventListener("click", cerrarSidebar);

    document.addEventListener("click", (e) => {

        if (
            el.sidebar &&
            el.menuBtn &&
            !el.sidebar.contains(e.target) &&
            !el.menuBtn.contains(e.target)
        ) {
            cerrarSidebar();
        }
    });

    /* ======================================================
       AUTO REFRESH CHAT
    ====================================================== */

    setInterval(() => {
        cargarChat();
    }, 5000);

    /* ======================================================
       INIT
    ====================================================== */

    async function iniciar() {

        await cargarPerfil();
        await cargarNoticias();
        await cargarNotificaciones();
        await cargarChat();
    }

    iniciar();

});