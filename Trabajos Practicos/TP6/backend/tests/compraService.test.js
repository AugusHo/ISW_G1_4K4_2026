const { createDb, seedReferenceData } = require('../src/db');
const { CompraService } = require('../src/services/compraService');

function buildContext({ today = '2026-06-02' } = {}) {
  const db = createDb(':memory:');
  seedReferenceData(db); // siembra horarios, tipos y el usuario hardcodeado id=1
  const usuario = { lastInsertRowid: 1 };
  const mailer = { sent: [], async send(to, subject, body) { this.sent.push({ to, subject, body }); } };
  const mp = {
    created: [],
    async createPreference(compra) {
      this.created.push(compra);
      return { id: `pref_${compra.id}`, init_point: `https://mp.test/checkout/${compra.id}` };
    },
  };
  const clock = () => new Date(today + 'T10:00:00');
  const service = new CompraService({ db, mailer, mp, clock });
  return { db, service, mailer, mp, usuarioId: usuario.lastInsertRowid };
}

const VIP = 1;
const REGULAR = 2;

describe('CompraService - Comprar entradas (TDD)', () => {
  test('compra válida con tarjeta retorna init_point de Mercado Pago y envía mail', async () => {
    // martes 2026-06-02 (parque abierto), fecha futura
    const { service, mailer } = buildContext({ today: '2026-06-01' });
    const result = await service.comprar({
      usuarioId: 1,
      fechaVisita: '2026-06-02',
      metodoPago: 'tarjeta',
      tickets: [
        { tipoTicketId: VIP, edad: 30 },
        { tipoTicketId: REGULAR, edad: 8 },
      ],
    });

    expect(result.estado).toBe('pendiente');
    expect(result.cantidad).toBe(2);
    expect(result.fechaVisita).toBe('2026-06-02');
    expect(result.montoTotal).toBe(3200 + 1800);
    expect(result.redirectUrl).toMatch(/^https:\/\/mp\.test\/checkout\//);
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0].to).toBe('visitante@ecoharmony.com');
    expect(mailer.sent[0].subject).toMatch(/confirmaci/i);
  });

  test('compra con efectivo no genera redirect a MP pero confirma e informa total y fecha', async () => {
    const { service, mailer, mp } = buildContext({ today: '2026-06-01' });
    const result = await service.comprar({
      usuarioId: 1,
      fechaVisita: '2026-06-02',
      metodoPago: 'efectivo',
      tickets: [{ tipoTicketId: REGULAR, edad: 25 }],
    });

    expect(result.redirectUrl).toBeNull();
    expect(result.cantidad).toBe(1);
    expect(result.montoTotal).toBe(1800);
    expect(result.fechaVisita).toBe('2026-06-02');
    expect(mp.created).toHaveLength(0);
    expect(mailer.sent).toHaveLength(1);
  });

  test('falla si no se selecciona forma de pago', async () => {
    const { service } = buildContext();
    await expect(
      service.comprar({
        usuarioId: 1,
        fechaVisita: '2026-06-02',
        metodoPago: '',
        tickets: [{ tipoTicketId: REGULAR, edad: 25 }],
      })
    ).rejects.toThrow(/forma de pago/i);
  });

  test('falla si el método de pago no es válido', async () => {
    const { service } = buildContext();
    await expect(
      service.comprar({
        usuarioId: 1,
        fechaVisita: '2026-06-02',
        metodoPago: 'cripto',
        tickets: [{ tipoTicketId: REGULAR, edad: 25 }],
      })
    ).rejects.toThrow(/forma de pago/i);
  });

  test('falla si la fecha de visita es un día en el que el parque está cerrado (lunes)', async () => {
    const { service } = buildContext({ today: '2026-06-01' });
    await expect(
      service.comprar({
        usuarioId: 1,
        fechaVisita: '2026-06-08', // lunes
        metodoPago: 'efectivo',
        tickets: [{ tipoTicketId: REGULAR, edad: 25 }],
      })
    ).rejects.toThrow(/cerrado/i);
  });

  test('falla si la fecha de visita es anterior al día actual', async () => {
    const { service } = buildContext({ today: '2026-06-10' });
    await expect(
      service.comprar({
        usuarioId: 1,
        fechaVisita: '2026-06-02',
        metodoPago: 'efectivo',
        tickets: [{ tipoTicketId: REGULAR, edad: 25 }],
      })
    ).rejects.toThrow(/fecha/i);
  });

  test('permite compra con fecha de visita igual al día actual', async () => {
    const { service } = buildContext({ today: '2026-06-02' });
    const result = await service.comprar({
      usuarioId: 1,
      fechaVisita: '2026-06-02',
      metodoPago: 'efectivo',
      tickets: [{ tipoTicketId: REGULAR, edad: 25 }],
    });
    expect(result.cantidad).toBe(1);
  });

  test('falla si la cantidad de entradas es mayor a 10', async () => {
    const { service } = buildContext({ today: '2026-06-01' });
    const tickets = Array.from({ length: 11 }, () => ({ tipoTicketId: REGULAR, edad: 30 }));
    await expect(
      service.comprar({ usuarioId: 1, fechaVisita: '2026-06-02', metodoPago: 'efectivo', tickets })
    ).rejects.toThrow(/10/);
  });

  test('falla si no se ingresan entradas', async () => {
    const { service } = buildContext({ today: '2026-06-01' });
    await expect(
      service.comprar({ usuarioId: 1, fechaVisita: '2026-06-02', metodoPago: 'efectivo', tickets: [] })
    ).rejects.toThrow(/al menos una/i);
  });

  test('falla si falta la edad de algún visitante', async () => {
    const { service } = buildContext({ today: '2026-06-01' });
    await expect(
      service.comprar({
        usuarioId: 1,
        fechaVisita: '2026-06-02',
        metodoPago: 'efectivo',
        tickets: [{ tipoTicketId: REGULAR }],
      })
    ).rejects.toThrow(/edad/i);
  });

  test('falla si el usuario no está registrado', async () => {
    const { service } = buildContext({ today: '2026-06-01' });
    await expect(
      service.comprar({
        usuarioId: 9999,
        fechaVisita: '2026-06-02',
        metodoPago: 'efectivo',
        tickets: [{ tipoTicketId: REGULAR, edad: 25 }],
      })
    ).rejects.toThrow(/usuario/i);
  });

  test('persiste la compra y los tickets en la base de datos', async () => {
    const { service, db } = buildContext({ today: '2026-06-01' });
    const result = await service.comprar({
      usuarioId: 1,
      fechaVisita: '2026-06-02',
      metodoPago: 'efectivo',
      tickets: [
        { tipoTicketId: VIP, edad: 40 },
        { tipoTicketId: REGULAR, edad: 12 },
      ],
    });
    const compra = db.prepare('SELECT * FROM Compras WHERE id = ?').get(result.compraId);
    const tickets = db.prepare('SELECT * FROM Tickets WHERE compra_id = ?').all(result.compraId);
    expect(compra.monto_total).toBe(5000);
    expect(tickets).toHaveLength(2);
    expect(tickets.every((t) => t.codigo_qr)).toBe(true);
  });
});
