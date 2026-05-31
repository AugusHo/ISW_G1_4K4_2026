// Generación del comprobante de compra en PDF para EcoHarmony Park.
// Devuelve un Buffer con el PDF, listo para adjuntar en el correo de confirmación.
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const LOGO_PATH = path.join(__dirname, '..', 'assets', 'logo.png');

const VERDE = '#386641';
const VERDE_CLARO = '#6a994e';
const GRIS = '#5b6157';
const GRIS_CLARO = '#e8eae5';

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function formatearFecha(fechaISO) {
  const [y, m, d] = String(fechaISO).split('-').map(Number);
  if (!y || !m || !d) return String(fechaISO);
  const fecha = new Date(y, m - 1, d);
  return `${DIAS[fecha.getDay()]} ${d} de ${MESES[m - 1]} de ${y}`;
}

function formatearMonto(monto) {
  return `$ ${Number(monto).toLocaleString('es-AR')}`;
}

function etiquetaEstado(compra) {
  if (compra.estado === 'confirmado') {
    return compra.metodo_pago === 'tarjeta' ? 'PAGADA' : 'CONFIRMADA';
  }
  if (compra.estado === 'cancelado') return 'CANCELADA';
  return compra.metodo_pago === 'efectivo' ? 'A ABONAR EN BOLETERÍA' : 'PENDIENTE';
}

// Genera el PDF del comprobante. tickets debe incluir tipo_nombre y tipo_precio.
async function generarComprobantePDF({ compra, tickets, usuario }) {
  // Pre-generamos los QR (PNG) de cada entrada antes de escribir el PDF.
  const qrBuffers = await Promise.all(
    tickets.map((t) => QRCode.toBuffer(t.codigo_qr, { width: 110, margin: 1 }))
  );

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const terminado = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const width = right - left;

  // ---- Encabezado ----
  doc.rect(0, 0, doc.page.width, 110).fill(VERDE);

  // Logo: badge circular blanco con el emblema recortado al centro.
  let textoX = left;
  if (fs.existsSync(LOGO_PATH)) {
    const r = 30;
    const cx = left + r;
    const cy = 55;
    doc.circle(cx, cy, r + 3).fill('#ffffff');
    doc.save();
    doc.circle(cx, cy, r).clip();
    doc.image(LOGO_PATH, cx - r, cy - r, { cover: [r * 2, r * 2], align: 'center', valign: 'center' });
    doc.restore();
    textoX = cx + r + 16;
  }

  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22).text('EcoHarmony Park', textoX, 38);
  doc.font('Helvetica').fontSize(11).fillColor('#dfe7d8').text('Comprobante de compra de entradas', textoX, 68);

  let y = 140;
  doc.fillColor(VERDE).font('Helvetica-Bold').fontSize(16).text(`Compra #${compra.id}`, left, y);
  doc.font('Helvetica').fontSize(11).fillColor(GRIS)
    .text(etiquetaEstado(compra), left, y, { width, align: 'right' });

  y += 30;
  doc.moveTo(left, y).lineTo(right, y).strokeColor(GRIS_CLARO).lineWidth(1).stroke();
  y += 18;

  // ---- Datos de la compra ----
  const filas = [
    ['Visitante', usuario?.nombre || '-'],
    ['Correo', usuario?.email || '-'],
    ['Fecha de visita', formatearFecha(compra.fecha_visita)],
    ['Forma de pago', compra.metodo_pago === 'tarjeta' ? 'Tarjeta (Mercado Pago)' : 'Efectivo en boletería'],
    ['Cantidad de entradas', String(tickets.length)],
  ];
  doc.fontSize(11);
  for (const [label, valor] of filas) {
    doc.font('Helvetica').fillColor(GRIS).text(label, left, y, { width: 160 });
    doc.font('Helvetica-Bold').fillColor('#2b2f29').text(valor, left + 160, y, { width: width - 160 });
    y += 22;
  }

  y += 8;
  // ---- Total ----
  doc.rect(left, y, width, 40).fill(GRIS_CLARO);
  doc.fillColor(VERDE).font('Helvetica-Bold').fontSize(13).text('TOTAL', left + 16, y + 13);
  doc.fontSize(16).text(formatearMonto(compra.monto_total), left, y + 11, { width: width - 16, align: 'right' });
  y += 64;

  // ---- Entradas con QR ----
  doc.fillColor(VERDE).font('Helvetica-Bold').fontSize(14).text('Tus entradas', left, y);
  y += 26;

  tickets.forEach((t, i) => {
    const alto = 120;
    if (y + alto > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
    }
    doc.roundedRect(left, y, width, alto, 8).strokeColor(GRIS_CLARO).lineWidth(1).stroke();

    doc.image(qrBuffers[i], left + 12, y + 12, { width: 96, height: 96 });

    const tx = left + 130;
    doc.fillColor(VERDE_CLARO).font('Helvetica-Bold').fontSize(10).text(`ENTRADA ${i + 1}`, tx, y + 16);
    doc.fillColor('#2b2f29').font('Helvetica-Bold').fontSize(15).text(`Pase ${t.tipo_nombre}`, tx, y + 32);
    doc.fillColor(GRIS).font('Helvetica').fontSize(11)
      .text(`Edad del visitante: ${t.edad_visitante} años`, tx, y + 56)
      .text(`Precio: ${formatearMonto(t.tipo_precio)}`, tx, y + 74);
    doc.fillColor('#9aa097').fontSize(8).text(`Código: ${t.codigo_qr}`, tx, y + 96, { width: width - 140 });

    y += alto + 14;
  });

  // ---- Pie ----
  const pieY = doc.page.height - doc.page.margins.bottom - 30;
  doc.fillColor('#9aa097').font('Helvetica').fontSize(9)
    .text(
      'Presentá este comprobante (impreso o en tu celular) al ingresar al parque. ' +
        'Cada entrada tiene un código QR único e intransferible.',
      left, pieY, { width, align: 'center' }
    );

  doc.end();
  return terminado;
}

module.exports = { generarComprobantePDF, formatearFecha, formatearMonto };
