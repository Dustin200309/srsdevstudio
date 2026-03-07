const sql = require('mssql');
const PDFDocument = require('pdfkit');
const path = require('path');

const generarPDFReceta = async (req, res) => {

    const recetaId = parseInt(req.params.id);
    const usuario_id = req.user?.id;

    if (!usuario_id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (!recetaId || isNaN(recetaId)) {
        return res.status(400).json({ error: "ID inválido" });
    }

    try {

        const recetaResult = await sql.query`
            SELECT r.*, u.nombre as usuario_nombre
            FROM dbo.recetas r
            INNER JOIN dbo.usuarios u ON r.usuario_id = u.id
            WHERE r.id = ${recetaId}
            AND r.usuario_id = ${usuario_id}
        `;

        if (recetaResult.recordset.length === 0) {
            return res.status(404).json({ error: "Receta no encontrada" });
        }

        const receta = recetaResult.recordset[0];

        const insumos = (await sql.query`
            SELECT ri.cantidad, ri.costo, i.nombre, i.unidad
            FROM dbo.RecetaInsumos ri
            INNER JOIN dbo.insumos i ON ri.insumo_id = i.id
            WHERE ri.receta_id = ${recetaId}
        `).recordset;

        const intermedios = (await sql.query`
            SELECT ri.cantidad, ri.costo, im.nombre
            FROM dbo.receta_intermedios ri
            INNER JOIN dbo.intermedios im ON ri.intermedio_id = im.id
            WHERE ri.receta_id = ${recetaId}
        `).recordset;

        const packing = (await sql.query`
            SELECT rp.cantidad, rp.costo, p.nombre
            FROM dbo.receta_packing rp
            INNER JOIN dbo.packing p ON rp.packing_id = p.id
            WHERE rp.receta_id = ${recetaId}
        `).recordset;

        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 40, bottom: 60, left: 60, right: 60 }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=costeo-${receta.nombre}.pdf`
        );

        doc.pipe(res);

        const primary = '#5c3a21';
        const lightLine = '#e8ded6';
        const beigeBox = '#f4ece6';
        const logoPath = path.join(__dirname, '../public/images/logo.png');

        // ================= WATERMARK =================
        const drawWatermark = () => {
            doc.save();
            doc.opacity(0.06);
            doc.image(
                logoPath,
                doc.page.width / 2 - 180,
                doc.page.height / 2 - 180,
                { width: 360 }
            );
            doc.restore();
            doc.opacity(1);
        };

        drawWatermark();
        doc.on('pageAdded', drawWatermark);

        // ================= FOOTER =================
        const drawFooter = () => {
            const footerY = doc.page.height - 60;

            doc.moveTo(doc.page.margins.left, footerY - 8)
                .lineTo(doc.page.width - doc.page.margins.right, footerY - 8)
                .strokeColor('#e6dbd2')
                .stroke();

            doc.fontSize(9)
                .fillColor('#a08b7c')
                .text(
                    "Desarrollado por srsdevstudio © 2026",
                    doc.page.margins.left,
                    footerY,
                    {
                        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                        align: 'center'
                    }
                );
        };

        const checkPageBreak = (space = 120) => {
            if (doc.y > doc.page.height - space) {
                doc.addPage();
            }
        };

        // ================= TÍTULO =================
        doc.font('Helvetica-Bold')
           .fontSize(24)
           .fillColor(primary)
           .text("REPORTE DE COSTEO", { align: 'center' });

        doc.moveDown(0.3);

        doc.moveTo(doc.page.margins.left, doc.y)
           .lineTo(doc.page.width - doc.page.margins.right, doc.y)
           .strokeColor('#d6c8bd')
           .stroke();

        doc.moveDown(1.2);

        doc.font('Helvetica-Bold')
           .fontSize(15)
           .fillColor('#000')
           .text(receta.nombre);

        doc.moveDown(0.5);

        doc.font('Helvetica')
           .fontSize(11)
           .fillColor('#555')
           .text(`Fecha: ${new Date(receta.fecha_creacion).toLocaleDateString()}`)
           .text(`Cantidad producida: ${Number(receta.cantidad_producida).toFixed(2)}`)
           .text(`Costeado por: ${receta.usuario_nombre}`);

        doc.moveDown(0.6);

        const tableX = doc.page.margins.left;
        const col1 = tableX;
        const col2 = tableX + 280;
        const col3 = tableX + 430;

        const drawTable = (title, rows, label) => {

            if (!rows || rows.length === 0) return;

            checkPageBreak(160);

            doc.moveDown(2);

            doc.font('Helvetica-Bold')
               .fontSize(13)
               .fillColor(primary)
               .text(title, tableX, doc.y, {
                   width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                   align: 'left',
                   lineBreak: false
               });

            doc.moveDown(0.5);

            doc.moveTo(tableX, doc.y)
               .lineTo(doc.page.width - doc.page.margins.right, doc.y)
               .strokeColor('#d6c8bd')
               .stroke();

            doc.moveDown(1);

            const headerY = doc.y;

            doc.rect(tableX - 10, headerY, 500, 26).fill(primary);

            doc.font('Helvetica-Bold')
               .fillColor('#ffffff')
               .fontSize(10)
               .text(label, col1, headerY + 7)
               .text("CANTIDAD", col2, headerY + 7)
               .text("PRECIO", col3, headerY + 7);

            doc.y = headerY + 32;

            rows.forEach(r => {

                checkPageBreak();

                const rowY = doc.y;

                doc.font('Helvetica')
                   .fillColor('#000')
                   .fontSize(10.5)
                   .text(r.nombre, col1, rowY)
                   .text(`${r.cantidad}`, col2, rowY)
                   .text(`S/ ${Number(r.costo).toFixed(2)}`, col3, rowY);

                doc.moveTo(tableX - 10, rowY + 20)
                   .lineTo(tableX + 490, rowY + 20)
                   .strokeColor(lightLine)
                   .stroke();

                doc.y = rowY + 26;
            });
        };

        drawTable("DETALLE DE INSUMOS",
            insumos.map(i => ({
                nombre: i.nombre,
                cantidad: `${Number(i.cantidad)} ${i.unidad}`,
                costo: i.costo
            })),
            "INSUMO"
        );

        drawTable("DETALLE DE INTERMEDIOS", intermedios, "INTERMEDIO");
        drawTable("DETALLE DE PACKING", packing, "PACKING");

        // ================= RESUMEN MÁS PEQUEÑO =================
        checkPageBreak();
        doc.moveDown(3);

        const costoTotal = Number(receta.costo_total);
        const precioVenta = Number(receta.precio_venta);
        const ganancia = precioVenta - costoTotal;

        const boxWidth = 320;   // 🔥 más pequeño
        const boxHeight = 90;   // 🔥 más compacto
        const resumenX = (doc.page.width - boxWidth) / 2;
        const resumenY = doc.y;

        doc.roundedRect(resumenX, resumenY, boxWidth, boxHeight, 12)
           .fill(beigeBox);

        let currentY = resumenY + 20;

        const drawLine = (label, value, bold = false, color = '#000') => {
            doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
               .fillColor('#333')
               .fontSize(10.5)
               .text(label, resumenX + 20, currentY);

            doc.fillColor(color)
               .text(`S/ ${value.toFixed(2)}`, resumenX + 190, currentY);

            currentY += 24;
        };

        drawLine("Costo Total", costoTotal, true);
        drawLine("Precio de Venta", precioVenta);
        drawLine("Ganancia", ganancia, true, ganancia >= 0 ? "#0a8f2f" : "#c0392b");

        doc.moveDown(5);

        drawFooter();
        doc.end();

    } catch (error) {
        console.error("Error generando PDF:", error);

        if (!res.headersSent) {
            res.status(500).json({ error: "Error generando PDF" });
        }
    }
};

module.exports = { generarPDFReceta };