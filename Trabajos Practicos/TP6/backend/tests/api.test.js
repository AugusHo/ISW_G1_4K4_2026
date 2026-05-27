const request = require('supertest');
const { createDb, seedReferenceData } = require('../src/db');
const { createApp } = require('../src/app');

function setup() {
  const db = createDb(':memory:');
  seedReferenceData(db);
  const mailer = { sent: [], async send(to, subject, body) { this.sent.push({ to, subject, body }); } };
  const app = createApp({ db, secret: 'test-secret', mailer });
  return { db, app, mailer };
}

async function registerAndLogin(app) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'u@test.com', contrasena: '1234', nombre: 'Usu' });
  return res.body.token;
}

describe('API EcoHarmony', () => {
  test('GET /api/tipos-ticket lista los tipos sembrados', async () => {
    const { app } = setup();
    const res = await request(app).get('/api/tipos-ticket');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((t) => t.pase).sort()).toEqual(['VIP', 'regular']);
  });

  test('POST /api/compras requiere autenticación', async () => {
    const { app } = setup();
    const res = await request(app).post('/api/compras').send({});
    expect(res.status).toBe(401);
  });

  test('POST /api/compras crea una compra con tarjeta y devuelve redirectUrl', async () => {
    const { app, mailer } = setup();
    const token = await registerAndLogin(app);
    const hoy = new Date();
    // Buscar próximo martes para asegurar día abierto
    while (hoy.getDay() !== 2) hoy.setDate(hoy.getDate() + 1);
    const fecha = hoy.toISOString().slice(0, 10);

    const res = await request(app)
      .post('/api/compras')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fechaVisita: fecha,
        metodoPago: 'tarjeta',
        tickets: [{ tipoTicketId: 1, edad: 30 }],
      });
    expect(res.status).toBe(201);
    expect(res.body.redirectUrl).toMatch(/mercadopago/);
    expect(mailer.sent).toHaveLength(1);
  });

  test('POST /api/compras rechaza más de 10 entradas', async () => {
    const { app } = setup();
    const token = await registerAndLogin(app);
    const hoy = new Date();
    while (hoy.getDay() !== 2) hoy.setDate(hoy.getDate() + 1);
    const fecha = hoy.toISOString().slice(0, 10);
    const tickets = Array.from({ length: 11 }, () => ({ tipoTicketId: 2, edad: 20 }));

    const res = await request(app)
      .post('/api/compras')
      .set('Authorization', `Bearer ${token}`)
      .send({ fechaVisita: fecha, metodoPago: 'efectivo', tickets });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/10/);
  });

  test('POST /api/compras rechaza día cerrado (lunes)', async () => {
    const { app } = setup();
    const token = await registerAndLogin(app);
    const hoy = new Date();
    while (hoy.getDay() !== 1) hoy.setDate(hoy.getDate() + 1);
    const fecha = hoy.toISOString().slice(0, 10);

    const res = await request(app)
      .post('/api/compras')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fechaVisita: fecha,
        metodoPago: 'efectivo',
        tickets: [{ tipoTicketId: 2, edad: 20 }],
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cerrado/i);
  });

  test('POST /api/compras rechaza sin método de pago', async () => {
    const { app } = setup();
    const token = await registerAndLogin(app);
    const hoy = new Date();
    while (hoy.getDay() !== 2) hoy.setDate(hoy.getDate() + 1);
    const fecha = hoy.toISOString().slice(0, 10);

    const res = await request(app)
      .post('/api/compras')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fechaVisita: fecha,
        metodoPago: '',
        tickets: [{ tipoTicketId: 2, edad: 20 }],
      });
    expect(res.status).toBe(400);
  });
});
