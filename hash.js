const bcrypt = require('bcryptjs');

(async () => {
    const password = "200309"; // ← tu contraseña real
    const hash = await bcrypt.hash(password, 10);
    console.log("HASH GENERADO:");
    console.log(hash);
})();