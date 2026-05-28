const crypto = require('crypto');

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const METODOS_PAGO = ['efectivo', 'tarjeta'];
const MAX_ENTRADAS = 10;

class CompraError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function parseFechaLocal(fechaISO) {
  // 'YYYY-MM-DD' -> Date a medianoche local
  const [y, m, d] = fechaISO.split('-').map(Number);
  if (!y || !m || !d) throw new CompraError('La fecha de visita es inválida');
  return new Date(y, m - 1, d);
}

function diaDelMes(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

class CompraService {
  constructor({ db, mailer, mp, clock = () => new Date() }) {
    this.db = db;
    this.mailer = mailer;
    this.mp = mp;
    this.clock = clock;
  }

  async comprar({ usuarioId, fechaVisita, metodoPago, tickets }) {
    this._validarMetodoPago(metodoPago);
    this._validarCantidad(tickets);
    this._validarEdades(tickets);
    this._validarFecha(fechaVisita);

    const usuario = this.db.prepare('SELECT * FROM Usuarios WHERE id = ?').get(usuarioId);
    if (!usuario) throw new CompraError('Usuario no registrado', 401);

    const tipos = this._cargarTipos(tickets);
    const montoTotal = tickets.reduce((acc, t) => acc + tipos[t.tipoTicketId].precio, 0);

    const trx = this.db.transaction(() => {
      const insertCompra = this.db.prepare(
        `INSERT INTO Compras (usuario_id, fecha_visita, estado, metodo_pago, monto_total)
         VALUES (?, ?, 'pendiente', ?, ?)`
      );
      const { lastInsertRowid: compraId } = insertCompra.run(usuarioId, fechaVisita, metodoPago, montoTotal);
      const insertTicket = this.db.prepare(
        `INSERT INTO Tickets (compra_id, tipo_ticket_id, edad_visitante, codigo_qr) VALUES (?, ?, ?, ?)`
      );
      for (const t of tickets) {
        insertTicket.run(compraId, t.tipoTicketId, t.edad, crypto.randomUUID());
      }
      return compraId;
    });
    const compraId = trx();

    let redirectUrl = null;
    if (metodoPago === 'tarjeta') {
      const items = tickets.map((t, i) => {
        const tipo = tipos[t.tipoTicketId];
        return {
          id: tipo.id,
          title: `Entrada ${tipo.nombre} - EcoHarmony Park`,
          description: `Visitante #${i + 1} (edad ${t.edad}) · visita ${fechaVisita}`,
          quantity: 1,
          unit_price: tipo.precio,
        };
      });
      const pref = await this.mp.createPreference({ id: compraId, montoTotal, items, payer: usuario, fechaVisita });
      this.db
        .prepare('UPDATE Compras SET mp_preferencia_id = ? WHERE id = ?')
        .run(pref.id, compraId);
      redirectUrl = pref.init_point;
    }

    await this.mailer.send(
      usuario.email,
      'Confirmación de compra - EcoHarmony Park',
      `Hola ${usuario.nombre}, recibimos tu compra de ${tickets.length} entrada(s) ` +
        `para el ${fechaVisita}. Monto total: $${montoTotal}.`
    );

    return {
      compraId,
      estado: 'pendiente',
      cantidad: tickets.length,
      fechaVisita,
      montoTotal,
      metodoPago,
      redirectUrl,
    };
  }

  // Consulta el estado de una compra. Para pagos con tarjeta, si el cliente MP
  // lo soporta, busca el pago real en Mercado Pago (entorno de prueba) y
  // sincroniza el estado de la compra en la base.
  async consultarEstado(compraId) {
    const compra = this.db.prepare('SELECT * FROM Compras WHERE id = ?').get(compraId);
    if (!compra) throw new CompraError('Compra no encontrada', 404);

    let estadoPago = null;
    if (compra.metodo_pago === 'tarjeta' && typeof this.mp.buscarEstadoPorReferencia === 'function') {
      estadoPago = await this.mp.buscarEstadoPorReferencia(compraId);
      if (estadoPago) {
        const nuevoEstado =
          estadoPago === 'approved' ? 'confirmado' :
          estadoPago === 'rejected' || estadoPago === 'cancelled' ? 'cancelado' :
          'pendiente';
        if (nuevoEstado !== compra.estado) {
          this.db.prepare('UPDATE Compras SET estado = ? WHERE id = ?').run(nuevoEstado, compraId);
          compra.estado = nuevoEstado;
        }
      }
    }

    return {
      compraId: compra.id,
      estado: compra.estado,
      estadoPago,
      cantidad: this.db.prepare('SELECT COUNT(*) AS c FROM Tickets WHERE compra_id = ?').get(compraId).c,
      fechaVisita: compra.fecha_visita,
      montoTotal: compra.monto_total,
      metodoPago: compra.metodo_pago,
    };
  }

  _validarMetodoPago(metodoPago) {
    if (!metodoPago) throw new CompraError('Debe seleccionar una forma de pago');
    if (!METODOS_PAGO.includes(metodoPago)) {
      throw new CompraError('Forma de pago inválida');
    }
  }

  _validarCantidad(tickets) {
    if (!Array.isArray(tickets) || tickets.length === 0) {
      throw new CompraError('Debe indicar al menos una entrada');
    }
    if (tickets.length > MAX_ENTRADAS) {
      throw new CompraError(`La cantidad de entradas no debe ser mayor a ${MAX_ENTRADAS}`);
    }
  }

  _validarEdades(tickets) {
    tickets.forEach((t, i) => {
      if (t.edad === undefined || t.edad === null || Number.isNaN(Number(t.edad))) {
        throw new CompraError(`Debe indicar la edad del visitante #${i + 1}`);
      }
      if (Number(t.edad) < 0 || Number(t.edad) > 120) {
        throw new CompraError(`La edad del visitante #${i + 1} es inválida`);
      }
    });
  }

  _validarFecha(fechaVisita) {
    if (!fechaVisita) throw new CompraError('Debe indicar la fecha de visita');
    const visita = diaDelMes(parseFechaLocal(fechaVisita));
    const hoy = diaDelMes(this.clock());
    if (visita < hoy) {
      throw new CompraError('La fecha de visita debe ser hoy o futura');
    }
    const dia = DIAS_SEMANA[visita.getDay()];
    const horario = this.db
      .prepare('SELECT * FROM Horarios WHERE dia_semana = ? AND activo = 1')
      .get(dia);
    if (!horario) {
      throw new CompraError('El parque se encuentra cerrado en la fecha seleccionada');
    }
  }

  _cargarTipos(tickets) {
    const ids = [...new Set(tickets.map((t) => t.tipoTicketId))];
    const placeholders = ids.map(() => '?').join(',');
    const rows = this.db
      .prepare(`SELECT * FROM TiposTicket WHERE id IN (${placeholders})`)
      .all(...ids);
    const map = Object.fromEntries(rows.map((r) => [r.id, r]));
    for (const t of tickets) {
      if (!map[t.tipoTicketId]) {
        throw new CompraError(`Tipo de entrada inválido: ${t.tipoTicketId}`);
      }
    }
    return map;
  }
}

module.exports = { CompraService, CompraError };
