const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

console.log("Token encontrado:", token);  // Verifica que el token se haya recuperado correctamente

const form = document.getElementById("formIntermedio");
const mensajeDiv = document.getElementById("mensaje");

function mostrarMensaje(texto, tipo = "error") {
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `mensaje ${tipo}`;
    mensajeDiv.classList.remove("oculto");

    setTimeout(() => {
        mensajeDiv.classList.add("oculto");
    }, 3000);
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const unidad = document.getElementById("unidad").value.trim();
    const precio = parseFloat(document.getElementById("precio").value);

    console.log({ nombre, unidad, precio });  // Verifica los datos que se enviarán

    // Validación de los datos del formulario
    if (!nombre || !unidad || isNaN(precio) || precio <= 0) {
        mostrarMensaje("Por favor, completa todos los datos correctamente. Asegúrate de que el precio sea un número válido y mayor que 0.");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/api/intermedios/crear", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ nombre, unidad, precio })
        });

        if (!response.ok) {
            const responseData = await response.json();
            console.log("Respuesta de la API:", responseData);  // Verifica el contenido de la respuesta
            mostrarMensaje(responseData.error || "Error al guardar el intermedio.");
            return;
        }

        mostrarMensaje("Intermedio creado correctamente", "success");
        form.reset();  // Limpia el formulario
        window.location.href = "mis-intermedios.html";  // Redirige a la página de intermedios

    } catch (error) {
        console.error("Error al realizar la solicitud:", error);
        mostrarMensaje("Hubo un error al guardar el intermedio.");
    }
});