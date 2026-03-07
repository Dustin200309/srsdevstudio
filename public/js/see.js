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
                themeToggle.textContent = " ☀️";
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

});