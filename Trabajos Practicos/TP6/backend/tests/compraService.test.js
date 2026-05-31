const { createDb, seedReferenceData } = require('../src/db');
const { CompraService } = require('../src/services/compraService');

// Contexto de dominio: base en memoria + dependencias simuladas (mailer, mp, clock)
// para probar la lógica de negocio de "Comprar entradas" en aislamiento.
function buildContext({ today = '2026-06-01' } = {}) {
  const db = createDb(':memory:');
  seedReferenceData(db); // siembra horarios, tipos y el usuario hardcodeado id=1
  const mailer = {
    sent: [],
    async send(to, subject, body, opts = {}) {
      this.sent.push({ to, subject, body, attachments: opts.attachments || [] });
    },
  };
  const mp = {
    created: [],
    estadoPago: null, // estado que devolverá buscarEstadoPorReferencia (simula MP)
    async createPreference(compra) {
      this.created.push(compra);
      return { id: `pref_${compra.id}`, init_point: `https://mp.test/checkout/${compra.id}` };
    },
    async buscarEstadoPorReferencia() {
      return this.estadoPago;
    },
  };
  const clock = () => new Date(today + 'T10:00:00');
  const service = new CompraService({ db, mailer, mp, clock });
  return { db, service, mailer, mp };
}

const VIP = 1;
const REGULAR = 2;

describe('Dominio - Comprar entradas', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // Caso de Prueba 1: comprar una entrada con fecha disponible, cantidad < 10,
  // edad de todos los visitantes, tipo de pase, pago con tarjeta vía Mercado
  // Pago y recepción del mail de confirmación. (PASA)
  // ──────────────────────────────────────────────────────────────────────────
  test('Caso de Prueba 1: compra válida con tarjeta redirige a Mercado Pago y, al aprobarse el pago, envía el mail de confirmación', async () => {
    const { service, mailer, mp } = buildContext({ today: '2026-06-01' });

    const result = await service.comprar({
      usuarioId: 1,
      fechaVisita: '2026-06-02', // martes: parque abierto, fecha futura
      metodoPago: 'tarjeta',
      tickets: [
        { tipoTicketId: VIP, edad: 30 },
        { tipoTicketId: REGULAR, edad: 8 },
      ],
    });

    // Informa cantidad y fecha al finalizar la compra.
    expect(result.cantidad).toBe(2);
    expect(result.fechaVisita).toBe('2026-06-02');
    expect(result.montoTotal).toBe(20000 + 10000);
    // Redirige a Mercado Pago por ser pago con tarjeta.
    expect(result.redirectUrl).toMatch(/^https:\/\/mp\.test\/checkout\//);
    // Con tarjeta, el mail se envía recién cuando MP aprueba el pago.
    expect(mailer.sent).toHaveLength(0);

    // Mercado Pago aprueba el pago -> se envía la confirmación con comprobante PDF.
    mp.estadoPago = 'approved';
    const estado = await service.consultarEstado(result.compraId);
    expect(estado.estado).toBe('confirmado');
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0].subject).toMatch(/confirmaci/i);
    expect(mailer.sent[0].attachments[0].filename).toMatch(/\.pdf$/);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Caso de Prueba 2: comprar entradas sin seleccionar forma de pago. (FALLA)
  // ──────────────────────────────────────────────────────────────────────────
  test('Caso de Prueba 2: falla si no se selecciona forma de pago', async () => {
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

  // ──────────────────────────────────────────────────────────────────────────
  // Caso de Prueba 3: comprar entradas con fecha en la que el parque está
  // cerrado (lunes). (FALLA)
  // ──────────────────────────────────────────────────────────────────────────
  test('Caso de Prueba 3: falla si la fecha de visita cae en un día que el parque está cerrado', async () => {
    const { service } = buildContext({ today: '2026-06-01' });
    await expect(
      service.comprar({
        usuarioId: 1,
        fechaVisita: '2026-06-08', // lunes: parque cerrado
        metodoPago: 'efectivo',
        tickets: [{ tipoTicketId: REGULAR, edad: 25 }],
      })
    ).rejects.toThrow(/cerrado/i);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Caso de Prueba 4: comprar una cantidad de entradas mayor a 10. (FALLA)
  // ──────────────────────────────────────────────────────────────────────────
  test('Caso de Prueba 4: falla si la cantidad de entradas es mayor a 10', async () => {
    const { service } = buildContext({ today: '2026-06-01' });
    const tickets = Array.from({ length: 11 }, () => ({ tipoTicketId: REGULAR, edad: 30 }));
    await expect(
      service.comprar({
        usuarioId: 1,
        fechaVisita: '2026-06-02',
        metodoPago: 'efectivo',
        tickets,
      })
    ).rejects.toThrow(/10/);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Caso de Prueba 5 (extra): comprar con efectivo (pago en boletería). No
  // redirige a Mercado Pago, envía el mail de confirmación con el comprobante
  // e informa la cantidad y la fecha. (PASA)
  // ──────────────────────────────────────────────────────────────────────────
  test('Caso de Prueba 5: compra válida con efectivo no redirige a Mercado Pago y envía el mail de confirmación', async () => {
    const { service, mailer, mp } = buildContext({ today: '2026-06-01' });

    const result = await service.comprar({
      usuarioId: 1,
      fechaVisita: '2026-06-02',
      metodoPago: 'efectivo',
      tickets: [{ tipoTicketId: REGULAR, edad: 25 }],
    });

    expect(result.redirectUrl).toBeNull();
    expect(mp.created).toHaveLength(0); // no se crea preferencia en Mercado Pago
    expect(result.cantidad).toBe(1);
    expect(result.fechaVisita).toBe('2026-06-02');
    // Con efectivo la compra queda confirmada y el mail se envía al instante.
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0].attachments[0].filename).toMatch(/\.pdf$/);
  });
});
