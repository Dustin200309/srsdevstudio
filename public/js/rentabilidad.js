const API_URL = "/api/rentabilidad";

let chart = null;
let carouselInterval = null;

/* =========================
INIT
========================= */

document.addEventListener("DOMContentLoaded", () => {

    if (!document.getElementById("ventasTotales")) return;

    document
        .getElementById("btnFiltrar")
        ?.addEventListener("click", cargarRentabilidad);

    cargarRentabilidad();
});

/* =========================
API FETCH
========================= */

async function apiFetch(url) {

    const token = localStorage.getItem("token");

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Error en la API");
    }

    return data;
}

/* =========================
CARGAR RENTABILIDAD
========================= */

async function cargarRentabilidad() {

    try {

        const inicio = document.getElementById("fechaInicio")?.value;
        const fin = document.getElementById("fechaFin")?.value;

        let url = API_URL;

        if (inicio && fin) {

            if (inicio > fin) {
                alert("La fecha inicio no puede ser mayor que la fecha fin");
                return;
            }

            url += `?inicio=${inicio}&fin=${fin}`;
        }

        const data = await apiFetch(url);

        console.log("Datos API:", data);

        mostrarKPIs(data);
        crearGrafico(data.ventas_por_dia);
        mostrarTopClientes(data.top_clientes);

    } catch (error) {

        console.error("Error cargando rentabilidad:", error);
        alert("No se pudo cargar la información");

    }

}

/* =========================
FORMATEAR MONEDA
========================= */

function formatearMoneda(valor) {

    const numero = Number(valor) || 0;

    return new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: "PEN"
    }).format(numero);

}

/* =========================
MOSTRAR KPIs
========================= */

function mostrarKPIs(data) {

    const ventas = Number(data?.ventas_totales) || 0;
    const cantidad = Number(data?.cantidad_ventas) || 0;
    const ticket = Number(data?.ticket_promedio) || 0;

    document.getElementById("ventasTotales").textContent = formatearMoneda(ventas);
    document.getElementById("cantidadVentas").textContent = cantidad;
    document.getElementById("ticketPromedio").textContent = formatearMoneda(ticket);

    const estado = document.getElementById("estadoRentabilidad");

    if (!estado) return;

    if (ventas > 0) {

        estado.textContent = "Negocio Activo 📈";
        estado.style.color = "#2e7d32";

    } else {

        estado.textContent = "Sin ventas";
        estado.style.color = "#b71c1c";

    }

}

/* =========================
TOP CLIENTES
========================= */

function mostrarTopClientes(clientes) {

    const track = document.getElementById("carouselClientes");

    if (!track) return;

    track.innerHTML = "";

    if (!Array.isArray(clientes) || clientes.length === 0) {

        track.innerHTML = `
        <div class="cliente-vacio">
            No hay clientes con compras aún
        </div>
        `;

        return;
    }

    const medallas = ["🥇", "🥈", "🥉"];
    const top = clientes.slice(0,3);

    top.forEach((cliente,i)=>{

        const card=document.createElement("div");

        card.className=`cliente-card rank-${i+1}`;

        card.innerHTML=`
            <span class="medalla">${medallas[i]}</span>
            <h3>${cliente.nombre}</h3>
            <p>${formatearMoneda(cliente.total)}</p>
        `;

        track.appendChild(card);

    });

    /* duplicar para infinito */

    top.forEach((cliente,i)=>{

        const card=document.createElement("div");

        card.className=`cliente-card rank-${i+1}`;

        card.innerHTML=`
            <span class="medalla">${medallas[i]}</span>
            <h3>${cliente.nombre}</h3>
            <p>${formatearMoneda(cliente.total)}</p>
        `;

        track.appendChild(card);

    });

    iniciarCarrusel(track);

}

/* =========================
CARRUSEL INFINITO REAL
========================= */

function iniciarCarrusel(track){

    if(carouselInterval){
        clearInterval(carouselInterval);
    }

    carouselInterval=setInterval(()=>{

        const firstCard=track.firstElementChild;

        if(!firstCard) return;

        const gap=18;

        const cardWidth=firstCard.offsetWidth+gap;

        track.style.transition="transform 0.6s ease";

        track.style.transform=`translateX(-${cardWidth}px)`;

        setTimeout(()=>{

            track.style.transition="none";

            track.appendChild(firstCard);

            track.style.transform="translateX(0)";

        },600);

    },3500);

}

/* =========================
CREAR GRAFICO
========================= */

function crearGrafico(datos) {

    const canvas = document.getElementById("graficoVentas");

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (chart) {
        chart.destroy();
        chart = null;
    }

    if (!Array.isArray(datos) || datos.length === 0) {

        chart = new Chart(ctx, {

            type: "bar",

            data: {
                labels: ["Sin datos"],
                datasets: [{
                    label: "Ventas",
                    data: [0],
                    backgroundColor: "#ddd"
                }]
            },

            options: {
                responsive:true,
                plugins:{legend:{display:false}}
            }

        });

        return;
    }

    const labels = datos.map(d => d.fecha.split("T")[0]);
    const valores = datos.map(d => Number(d.total) || 0);

    chart = new Chart(ctx, {

        type: "bar",

        data: {

            labels,

            datasets: [{
                label: "Ventas (S/)",
                data: valores,
                backgroundColor: "rgba(122,78,45,0.85)",
                borderColor: "#7a4e2d",
                borderWidth: 2,
                borderRadius: 8,
                barThickness: 42
            }]

        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            animation:{
                duration:900,
                easing:"easeOutQuart"
            },

            plugins: {

                legend:{display:false},

                tooltip:{
                    backgroundColor:"#2f1b12",
                    callbacks:{
                        label:ctx=>"Ventas: S/ "+ctx.raw
                    }
                }

            },

            scales:{

                x:{
                    grid:{display:false},
                    ticks:{color:"#5b4638"}
                },

                y:{
                    beginAtZero:true,
                    grid:{color:"#eee"},
                    ticks:{color:"#5b4638"}
                }

            }

        }

    });

}