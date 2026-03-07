document.getElementById("btnSubir").addEventListener("click", async () => {

    const fileInput = document.getElementById("logoInput");
    const file = fileInput.files[0];

    if (!file) {
        alert("Selecciona un archivo");
        return;
    }

    const formData = new FormData();    
    formData.append("logo", file);

    const token = localStorage.getItem("token");

    const response = await fetch("/upload-logo", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + token
        },
        body: formData
    });

    const data = await response.json();
    console.log(data);
    alert("Logo subido correctamente");
});