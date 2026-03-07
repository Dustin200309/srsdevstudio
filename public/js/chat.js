document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "/login";
        return;
    }

    /* =========================
       LEER TOKEN (JWT)
    ========================== */

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

    const nombreUsuario = datos.nombre || "Usuario";

    /* =========================
       ELEMENTOS
    ========================== */

    const chatBox = document.getElementById("chat-box");
    const input = document.getElementById("chat-mensaje");
    const btn = document.getElementById("btn-enviar-chat");

    /* =========================
       FETCH GENERICO
    ========================== */

    async function apiFetch(url, options = {}) {
        const config = {
            ...options,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                ...(options.headers || {})
            }
        };
        const res = await fetch(url, config);
        if (!res.ok) {
            console.error("Error API:", res.status);
            throw new Error("Error API");
        }
        return res.json();
    }

    /* =========================
       CARGAR CHAT
    ========================== */

    async function cargarChat() {
        try {
            // Cambia la ruta según si es admin o cliente
            const endpoint = datos.rol === "admin" ? "/api/chat/admin" : "/api/chat/usuario";
            const mensajes = await apiFetch(endpoint);

            chatBox.innerHTML = "";

            mensajes.forEach(m => {
                const div = document.createElement("div");
                div.classList.add("mensaje");

                if (m.remitente === "usuario") {
                    div.classList.add("usuario");
                } else {
                    div.classList.add("admin");
                }

                // Mostrar el nombre real del remitente
                const nombre = m.remitente === "admin" ? "admin" : m.usuario || nombreUsuario;

                div.innerHTML = `
                    <strong>@${nombre}</strong>
                    <p>${m.mensaje}</p>
                    <span>${new Date(m.fecha).toLocaleTimeString()}</span>
                `;

                chatBox.appendChild(div);
            });

            chatBox.scrollTop = chatBox.scrollHeight;

        } catch (error) {
            console.error("Error cargando chat:", error);
        }
    }

    /* =========================
       ENVIAR MENSAJE
    ========================== */

    async function enviarMensaje() {
        const mensaje = input.value.trim();
        if (!mensaje) return;

        try {
            const endpoint = datos.rol === "admin" ? "/api/chat/admin" : "/api/chat/usuario";
            let body = { mensaje };

            // Si admin envía mensaje, debe indicar el usuario_id
            if (datos.rol === "admin") {
                // Aquí debes seleccionar el usuario al que responde
                // body.usuario_id = ID_DEL_CLIENTE_SELECCIONADO;
            }

            await apiFetch(endpoint, {
                method: "POST",
                body: JSON.stringify(body)
            });

            input.value = "";
            cargarChat();

        } catch (error) {
            console.error("Error enviando mensaje:", error);
        }
    }

    /* =========================
       EVENTOS
    ========================== */

    if (btn) btn.addEventListener("click", enviarMensaje);

    if (input) {
        input.addEventListener("keypress", e => {
            if (e.key === "Enter") enviarMensaje();
        });
    }

    /* =========================
       AUTO REFRESH CHAT
    ========================== */

    setInterval(cargarChat, 3000);

    /* =========================
       INIT
    ========================== */

    cargarChat();

});