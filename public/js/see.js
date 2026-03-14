// =============================
// LOGIN REDIRECT
// =============================
function irLogin() {
    window.location.href = "/login";
}

// =============================
// LOGOUT
// =============================
const params = new URLSearchParams(window.location.search);

if (params.get("logout") === "true") {
    alert("Sesión cerrada correctamente");
}

// =============================
// ESPERAR DOM
// =============================
document.addEventListener("DOMContentLoaded", () => {

    // =============================
    // MODO OSCURO
    // =============================
    const themeToggle = document.getElementById("themeToggle");
    const logo = document.querySelector(".logo-img");

    if (themeToggle) {

        const savedTheme = localStorage.getItem("theme");

        if (savedTheme === "dark") {
            document.body.classList.add("dark-mode");
            themeToggle.textContent = "🌙";
            if (logo) logo.src = "images/negro.png";
        } else {
            themeToggle.textContent = "☀️";
            if (logo) logo.src = "images/blanco.png";
        }

        themeToggle.addEventListener("click", () => {

            document.body.classList.toggle("dark-mode");

            if (document.body.classList.contains("dark-mode")) {
                localStorage.setItem("theme", "dark");
                themeToggle.textContent = "🌙";
                if (logo) logo.src = "images/negro.png";
            } else {
                localStorage.setItem("theme", "light");
                themeToggle.textContent = "☀️";
                if (logo) logo.src = "images/blanco.png";
            }

        });
    }

    // =============================
    // MENÚ HAMBURGUESA
    // =============================
    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");

    if (menuToggle && navMenu) {

        menuToggle.addEventListener("click", () => {
            menuToggle.classList.toggle("active");
            navMenu.classList.toggle("active");
        });

        const links = navMenu.querySelectorAll("a");

        links.forEach(link => {
            link.addEventListener("click", () => {
                navMenu.classList.remove("active");
                menuToggle.classList.remove("active");
            });
        });
    }

    // =============================
    // HERO SLIDER AUTOMÁTICO
    // =============================
    const sliderTrack = document.querySelector(".slider-track");
    const slides = document.querySelectorAll(".slide");

    if (sliderTrack && slides.length > 0) {

        let slideIndex = 0;

        function updateSlider() {
            sliderTrack.style.transform = `translateX(-${slideIndex * 100}%)`;
        }

        setInterval(() => {
            slideIndex++;
            if (slideIndex >= slides.length) {
                slideIndex = 0;
            }
            updateSlider();
        }, 5000);
    }

    // =====================================================
    // CHATBOT MINI SAM (IA)
    // =====================================================

    const chatButton = document.getElementById("chatButton");
    const chatBox = document.getElementById("chatBox");
    const sendBtn = document.getElementById("sendBtn");
    const chatInput = document.getElementById("chatInput");
    const chatMessages = document.getElementById("chatMessages");

    // =============================
    // ABRIR / CERRAR CHAT
    // =============================
    if (chatButton && chatBox) {

        chatButton.addEventListener("click", () => {

            if (chatBox.style.display === "flex") {
                chatBox.style.display = "none";
            } else {
                chatBox.style.display = "flex";

                if (chatMessages.children.length === 0) {
                    agregarMensaje("Hola 👋 soy Mini Sam, el asistente del sistema de costeo. ¿En qué puedo ayudarte hoy?", "bot-message");
                }
            }

        });

    }

    // =============================
    // AGREGAR MENSAJE AL CHAT
    // =============================
    function agregarMensaje(texto, tipo) {

        const msg = document.createElement("div");
        msg.className = "chat-message " + tipo;

        const bubble = document.createElement("div");
        bubble.className = "bubble";
        bubble.textContent = texto;

        msg.appendChild(bubble);
        chatMessages.appendChild(msg);

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // =============================
    // RESPONDER CON IA
    // =============================
    async function responder() {

        let texto = chatInput.value.trim();

        if (!texto) return;

        agregarMensaje(texto, "user-message");

        chatInput.value = "";

        agregarMensaje("Mini Sam está pensando...", "bot-message");

        try {

            const res = await fetch("/api/assistant", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    mensaje: texto
                })
            });

            const data = await res.json();

            chatMessages.lastChild.remove();

            agregarMensaje(data.respuesta, "bot-message");

        } catch (error) {

            chatMessages.lastChild.remove();

            agregarMensaje("Mini Sam tuvo un problema pensando 🤖", "bot-message");

        }

    }

    // =============================
    // EVENTOS
    // =============================
    if (sendBtn) {
        sendBtn.addEventListener("click", responder);
    }

    if (chatInput) {

        chatInput.addEventListener("keypress", (e) => {

            if (e.key === "Enter") {
                responder();
            }

        });

    }
    // =============================
// BOTONES RÁPIDOS DEL CHAT
// =============================
const quickBtns = document.querySelectorAll(".quick-btn");

quickBtns.forEach(btn => {

    btn.addEventListener("click", () => {

        const texto = btn.textContent;

        chatInput.value = texto;

        responder();

    });

});
});