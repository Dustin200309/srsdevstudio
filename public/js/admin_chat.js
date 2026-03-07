let usuarioSeleccionado = null

const usuariosList = document.getElementById("usuariosList")
const chatMensajes = document.getElementById("chatMensajes")
const formMensaje = document.getElementById("formMensaje")
const mensajeInput = document.getElementById("mensajeInput")
const usuarioActivo = document.getElementById("usuarioActivo")


async function apiFetch(url, options = {}){

    const token = localStorage.getItem("token")

    const res = await fetch(url,{
        ...options,
        headers:{
            "Content-Type":"application/json",
            "Authorization":`Bearer ${token}`,
            ...options.headers
        }
    })

    return res.json()
}



async function cargarUsuarios(){

    const usuarios = await apiFetch("/api/chat/usuarios")

    usuariosList.innerHTML = ""

    usuarios.forEach(u=>{

        const div = document.createElement("div")
        div.className="usuario"
        div.textContent = u.nombre

        div.onclick=()=>{
            usuarioSeleccionado = u.id
            usuarioActivo.textContent = u.nombre
            cargarMensajes()
        }

        usuariosList.appendChild(div)

    })

}



async function cargarMensajes(){

    if(!usuarioSeleccionado) return

    const mensajes = await apiFetch(`/api/chat/${usuarioSeleccionado}`)

    chatMensajes.innerHTML=""

    mensajes.forEach(m=>{

        const div = document.createElement("div")

        div.className = m.remitente === "admin"
        ? "mensaje admin"
        : "mensaje usuario"

        div.textContent = m.mensaje

        chatMensajes.appendChild(div)

    })

}



formMensaje.addEventListener("submit", async e=>{

    e.preventDefault()

    if(!usuarioSeleccionado) return

    const mensaje = mensajeInput.value.trim()

    if(!mensaje) return

    await apiFetch(`/api/chat/${usuarioSeleccionado}`,{
        method:"POST",
        body:JSON.stringify({mensaje})
    })

    mensajeInput.value=""

    cargarMensajes()

})



setInterval(()=>{

    if(usuarioSeleccionado){
        cargarMensajes()
    }

},3000)



cargarUsuarios()