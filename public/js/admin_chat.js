let usuarioSeleccionado = null;

const usuariosList = document.getElementById("usuariosList");
const chatMensajes = document.getElementById("chatMensajes");
const formMensaje = document.getElementById("formMensaje");
const mensajeInput = document.getElementById("mensajeInput");
const usuarioActivo = document.getElementById("usuarioActivo");

/* =========================
   SANITIZAR TEXTO (XSS)
========================= */

function escaparHTML(texto){
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
}

/* =========================
   FETCH GENERICO
========================= */

async function apiFetch(url, options = {}){

    const token = localStorage.getItem("token");

    if(!token){
        window.location.href = "/login";
        return;
    }

    try{

        const res = await fetch(url,{
            ...options,
            headers:{
                "Content-Type":"application/json",
                "Authorization":`Bearer ${token}`,
                ...(options.headers || {})
            }
        });

        if(!res.ok){
            console.error("Error API:", res.status);
            throw new Error("Error en la API");
        }

        return await res.json();

    }catch(error){

        console.error("Error en fetch:", error);
        return [];

    }

}

/* =========================
   SCROLL CHAT
========================= */

function scrollChat(){
    if(chatMensajes){
        chatMensajes.scrollTop = chatMensajes.scrollHeight;
    }
}

/* =========================
   CARGAR USUARIOS
========================= */

async function cargarUsuarios(){

    if(!usuariosList) return;

    const usuarios = await apiFetch("/api/chat/usuarios");

    usuariosList.innerHTML = "";

    usuarios.forEach(u => {

        const div = document.createElement("div");
        div.className = "usuario";
        div.textContent = u.nombre;

        div.addEventListener("click", () => {

            usuarioSeleccionado = u.id;

            if(usuarioActivo){
                usuarioActivo.textContent = u.nombre;
            }

            cargarMensajes();

        });

        usuariosList.appendChild(div);

    });

}

/* =========================
   RENDER MENSAJE
========================= */

function renderMensaje(m){

    const div = document.createElement("div");

    div.className = m.remitente === "admin"
        ? "mensaje admin"
        : "mensaje usuario";

    div.innerHTML = `
        <p>${escaparHTML(m.mensaje)}</p>
        <span class="hora">
            ${new Date(m.fecha).toLocaleTimeString([],{
                hour:"2-digit",
                minute:"2-digit"
            })}
        </span>
    `;

    chatMensajes.appendChild(div);

}

/* =========================
   CARGAR MENSAJES
========================= */

async function cargarMensajes(){

    if(!usuarioSeleccionado || !chatMensajes) return;

    const mensajes = await apiFetch(`/api/chat/${usuarioSeleccionado}`);

    chatMensajes.innerHTML = "";

    mensajes.forEach(renderMensaje);

    scrollChat();

}

/* =========================
   ENVIAR MENSAJE
========================= */

if(formMensaje){

formMensaje.addEventListener("submit", async e => {

    e.preventDefault();

    if(!usuarioSeleccionado) return;

    const mensaje = mensajeInput.value.trim();

    if(!mensaje) return;

    await apiFetch(`/api/chat/${usuarioSeleccionado}`,{
        method:"POST",
        body:JSON.stringify({mensaje})
    });

    mensajeInput.value = "";

    await cargarMensajes();

});

}

/* =========================
   AUTO REFRESH
========================= */

setInterval(() => {

    if(usuarioSeleccionado){
        cargarMensajes();
    }

},3000);

/* =========================
   INIT
========================= */

cargarUsuarios();