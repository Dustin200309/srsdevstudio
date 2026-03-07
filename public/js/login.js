document.addEventListener("DOMContentLoaded", function () {

    // ================= MODAL =================

    const modal = document.getElementById("customModal");
    const modalBtn = document.getElementById("modalBtn");
    const modalText = document.querySelector(".modal-box p");

    function showModal(message) {
        if (!modal || !modalText) return;
        modalText.textContent = message;
        modal.style.display = "flex";
    }

    if (modalBtn) {
        modalBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }

    // ================= MOSTRAR / OCULTAR PASSWORD =================

    const togglePassword = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("password");

    if (togglePassword && passwordInput) {

        togglePassword.addEventListener("click", function () {

            const isPassword = passwordInput.type === "password";
            passwordInput.type = isPassword ? "text" : "password";

            this.classList.toggle("fa-eye");
            this.classList.toggle("fa-eye-slash");

        });

    }

    // ================= LOGIN =================

    const loginForm = document.getElementById("login-form");

    if (loginForm) {

        loginForm.addEventListener("submit", async function (e) {

            e.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = passwordInput.value.trim();
            const loginBtn = document.querySelector(".btn-login");

            if (!email || !password) {
                showModal("Por favor complete todos los campos.");
                return;
            }

            loginBtn.textContent = "Validando...";
            loginBtn.disabled = true;

            try {

                const response = await fetch("/api/auth/login", {

                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })

                });

                const data = await response.json();

                if (!response.ok) {

                    loginBtn.textContent = "Ingresar";
                    loginBtn.disabled = false;

                    showModal(data.error || "Error al iniciar sesión.");
                    return;

                }

                // Guardar token
                localStorage.setItem("token", data.token);

                // Guardar rol
                const rol = data.usuario?.rol || data.rol;
                localStorage.setItem("rol", rol);

                // Redirección según rol
                if (rol === "admin") {

                    window.location.href = "/admin.html";

                } else {

                    window.location.href = "/home.html";

                }

            } catch (error) {

                console.error("Error de conexión:", error);

                loginBtn.textContent = "Ingresar";
                loginBtn.disabled = false;

                showModal("Error al conectar con el servidor.");

            }

        });

    }

    // ================= WHATSAPP ADMIN =================

    const adminContact = document.querySelector(".admin-contact");

    if (adminContact) {

        adminContact.addEventListener("click", function (e) {

            e.preventDefault();

            const email = document.getElementById("email").value || "Sin correo ingresado";
            const mensaje = `Hola, quisiera cambiar mi contraseña del sistema. Mi correo es: ${email}`;

            const numero = "51934664074";
            const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

            window.open(url, "_blank");

        });

    }

});