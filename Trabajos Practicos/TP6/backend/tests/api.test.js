const request = require('supertest');
const { createDb, seedReferenceData, HARDCODED_USER } = require('../src/db');
const { createApp } = require('../src/app');

function setup() {
  const db = createDb(':memory:');
  seedReferenceData(db);
  const mailer = {
    sent: [],
    async send(to, subject, body, opts = {}) {
      this.sent.push({ to, subject, body, attachments: opts.attachments || [] });
    },
  };
  const app = createApp({ db, mailer });
  return { db, app, mailer };
}

describe('API EcoHarmony', () => {
  test('GET /api/me devuelve el usuario hardcodeado', async () => {
    const { app } = setup();
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(HARDCODED_USER.id);
    expect(res.body.email).toBe(HARDCODED_USER.email);
    expect(res.body.nombre).toBe(HARDCODED_USER.nombre);
  });

  test('GET /api/tipos-ticket lista los tipos sembrados', async () => {
    const { app } = setup();
    const res = await request(app).get('/api/tipos-ticket');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('POST /api/compras crea compra para el usuario hardcodeado y devuelve redirectUrl con tarjeta', async () => {
    const { app, db, mailer } = setup();
    const hoy = new Date();
    while (hoy.getDay() !== 2) hoy.setDate(hoy.getDate() + 1);
    const fecha = hoy.toISOString().slice(0, 10);

    const res = await request(app).post('/api/compras').send({
      fechaVisita: fecha,
      metodoPago: 'tarjeta',
      tickets: [{ tipoTicketId: 1, edad: 30 }],
    });
    expect(res.status).toBe(201);
    expect(res.body.redirectUrl).toMatch(/mercadopago/);
    // Con tarjeta el correo se envía recién al confirmarse el pago en MP.
    expect(mailer.sent).toHaveLength(0);

    const compra = db.prepare('SELECT usuario_id FROM Compras WHERE id = ?').get(res.body.compraId);
    expect(compra.usuario_id).toBe(HARDCODED_USER.id);
  });

  test('POST /api/compras rechaza más de 10 entradas', async () => {
    const { app } = setup();
    const hoy = new Date();
    while (hoy.getDay() !== 2) hoy.setDate(hoy.getDate() + 1);
    const fecha = hoy.toISOString().slice(0, 10);
    const tickets = Array.from({ length: 11 }, () => ({ tipoTicketId: 2, edad: 20 }));

    const res = await request(app).post('/api/compras').send({
      fechaVisita: fecha, metodoPago: 'efectivo', tickets,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/10/);
  });

  test('POST /api/compras rechaza día cerrado (lunes)', async () => {
    const { app } = setup();
    const hoy = new Date();
    while (hoy.getDay() !== 1) hoy.setDate(hoy.getDate() + 1);
    const fecha = hoy.toISOString().slice(0, 10);

    const res = await request(app).post('/api/compras').send({
      fechaVisita: fecha,
      metodoPago: 'efectivo',
      tickets: [{ tipoTicketId: 2, edad: 20 }],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cerrado/i);
  });

  test('POST /api/compras rechaza sin método de pago', async () => {
    const { app } = setup();
    const hoy = new Date();
    while (hoy.getDay() !== 2) hoy.setDate(hoy.getDate() + 1);
    const fecha = hoy.toISOString().slice(0, 10);

    const res = await request(app).post('/api/compras').send({
      fechaVisita: fecha,
      metodoPago: '',
      tickets: [{ tipoTicketId: 2, edad: 20 }],
    });
    expect(res.status).toBe(400);
  });
});
