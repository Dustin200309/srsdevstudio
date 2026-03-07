const token = localStorage.getItem("token");

if (!token) {
    alert("No estás autenticado");
    window.location.href = "/login.html";
}

// Helper para hacer fetch autenticado
async function apiFetch(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Authorization": "Bearer " + token,
            ...options.headers
        }
    });

    if (!response.ok) {
        throw new Error("Error en servidor");
    }

    return response;
}
// ===============================
// 📄 GENERAR PDF
// ===============================

document.getElementById('pdf-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const nombreProducto = document.getElementById('nombreProducto').value.trim();
        const costoTotal = parseFloat(document.getElementById('costoTotal').value);
        const precioUnitario = parseFloat(document.getElementById('precioSugerido').value);

        if (!nombreProducto || isNaN(costoTotal) || isNaN(precioUnitario)) {
            alert("Complete los datos correctamente");
            return;
        }

        const response = await apiFetch('/api/pdf/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombreProducto,
                costoTotal,
                precioUnitario
            })
        });

        const blob = await response.blob();
        const fileURL = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = fileURL;
        link.download = `reporte_${nombreProducto}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(fileURL);

    } catch (error) {
        console.error(error);
        alert("Error al generar PDF");
    }
});