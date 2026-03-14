const sql = require('../config/db');

exports.obtenerRentabilidad = async (req, res) => {
  try {
    const { inicio, fin } = req.query;
    const usuarioId = req.user.id;

    // Validar rango
    if (inicio && fin && inicio > fin) {
      return res.status(400).json({
        message: "La fecha inicio no puede ser mayor que la fecha fin"
      });
    }

    const pool = await sql.connect();

    // ======================
    // FILTRO FECHAS (ZONA PERÚ)
    // ======================

    let filtroFechas = "";
    if (inicio && fin) {
      filtroFechas = "AND fecha BETWEEN @desde AND @hasta";
    }

    // ======================
    // KPIs
    // ======================

    const requestKpi = pool.request()
      .input("usuario_id", sql.Int, usuarioId);

    if (inicio && fin) {
      requestKpi.input("desde", sql.Date, inicio);
      requestKpi.input("hasta", sql.Date, fin);
    }

    // Obtener ventas totales y otros KPIs
    const kpis = await requestKpi.query(`
      SELECT 
        ISNULL(SUM(monto), 0) AS ventas,
        COUNT(*) AS cantidad,
        ISNULL(AVG(monto), 0) AS ticket
      FROM compras
      WHERE usuario_id = @usuario_id
      ${filtroFechas}
    `);

    const row = kpis.recordset[0] || {
      ventas: 0,
      cantidad: 0,
      ticket: 0
    };

    // ======================
    // OBTENER GASTOS TOTALES
    // ======================

    const requestGastos = pool.request()
      .input("usuario_id", sql.Int, usuarioId);

    if (inicio && fin) {
      requestGastos.input("desde", sql.Date, inicio);
      requestGastos.input("hasta", sql.Date, fin);
    }

    // Obtener los gastos totales durante el período
    const gastos = await requestGastos.query(`
      SELECT 
        ISNULL(SUM(monto), 0) AS gastos_totales
      FROM gastos
      WHERE usuario_id = @usuario_id
      ${filtroFechas}
    `);

    const gastosTotales = gastos.recordset[0]?.gastos_totales || 0;

    // ======================
    // VENTAS POR DIA
    // ======================

    const requestGrafico = pool.request()
      .input("usuario_id", sql.Int, usuarioId);

    if (inicio && fin) {
      requestGrafico.input("desde", sql.Date, inicio);
      requestGrafico.input("hasta", sql.Date, fin);
    }

    const ventasDia = await requestGrafico.query(`
      SELECT 
        fecha,
        SUM(monto) AS total
      FROM compras
      WHERE usuario_id = @usuario_id
      ${filtroFechas}
      GROUP BY fecha
      ORDER BY fecha
    `);

    // ======================
    // TOP CLIENTES
    // ======================

    const requestTop = pool.request()
      .input("usuario_id", sql.Int, usuarioId);

    if (inicio && fin) {
      requestTop.input("desde", sql.Date, inicio);
      requestTop.input("hasta", sql.Date, fin);
    }

    const topClientes = await requestTop.query(`
      SELECT TOP 3
        c.nombre,
        SUM(v.monto) AS total
      FROM compras v
      JOIN clientes c ON c.id = v.cliente_id
      WHERE v.usuario_id = @usuario_id
      ${filtroFechas.replace(/fecha/g, "v.fecha")}
      GROUP BY c.nombre
      ORDER BY total DESC
    `);

    // ======================
    // CALCULAR GANANCIA NETA
    // ======================

    const ventasTotales = row.ventas || 0;
    const gananciaNeta = ventasTotales - gastosTotales;

    // ======================
    // RESPUESTAz
    // ======================

    res.json({
      ventas_totales: ventasTotales,
      cantidad_ventas: row.cantidad,
      ticket_promedio: row.ticket,
      gastos_totales: gastosTotales,  // Incluir los gastos
      ganancia_neta: gananciaNeta,    // Incluir la ganancia neta
      ventas_por_dia: ventasDia.recordset,
      top_clientes: topClientes.recordset
    });

  } catch (error) {
    console.error("Error rentabilidad:", error);
    res.status(500).json({
      message: "Error calculando rentabilidad"
    });
  }
};