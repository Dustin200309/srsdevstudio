document.addEventListener("DOMContentLoaded", function () {

    const menuBtn = document.querySelector(".menu-btn");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    // Abrir / cerrar menú
    if (menuBtn && sidebar) {
        menuBtn.addEventListener("click", function () {
            sidebar.classList.toggle("active");

            if (overlay) {
                overlay.classList.toggle("active");
            }
        });
    }

    // Cerrar al hacer click en overlay
    if (overlay && sidebar) {
        overlay.addEventListener("click", function () {
            sidebar.classList.remove("active");
            overlay.classList.remove("active");
        });
    }
    document.getElementById('logoutBtn').addEventListener('click', function(event) {
    event.preventDefault(); // Evita que el enlace haga la acción por defecto 

    window.location.href = 'index.html'; // O cualquier página que maneje el cierre de sesión
});

});
