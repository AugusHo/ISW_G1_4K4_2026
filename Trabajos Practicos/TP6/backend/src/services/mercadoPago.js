// Clientes de Mercado Pago para el flujo de "Comprar entradas".
//
//  - MercadoPagoClient: integración REAL contra el entorno de PRUEBA/TEST de
//    Mercado Pago (Checkout Pro). Crea una preferencia de pago y devuelve el
//    `init_point` al que se redirige al comprador. Requiere un Access Token de
//    PRUEBA (TEST-...) en la variable de entorno MP_ACCESS_TOKEN.
//  - FakeMercadoPago: doble usado en tests y como fallback cuando no hay token
//    configurado, para que la app siga corriendo en dev sin credenciales.

const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

class MercadoPagoClient {
  constructor({ accessToken, frontendUrl, notificationUrl }) {
    if (!accessToken) throw new Error('Falta MP_ACCESS_TOKEN para Mercado Pago');
    this.config = new MercadoPagoConfig({ accessToken });
    this.frontendUrl = (frontendUrl || 'http://localhost:5173').replace(/\/$/, '');
    this.notificationUrl = notificationUrl || null;
  }

  async createPreference({ id, items, payer, fechaVisita }) {
    const preference = new Preference(this.config);
    const body = {
      items: items.map((it, i) => ({
        id: String(it.id ?? i + 1),
        title: it.title,
        description: it.description,
        quantity: it.quantity ?? 1,
        currency_id: 'ARS',
        unit_price: Number(it.unit_price),
      })),
      external_reference: String(id),
      statement_descriptor: 'EcoHarmony Park',
      back_urls: {
        success: `${this.frontendUrl}/pago/exito`,
        failure: `${this.frontendUrl}/pago/error`,
        pending: `${this.frontendUrl}/pago/pendiente`,
      },
      metadata: { fecha_visita: fechaVisita, compra_id: id },
    };
    // auto_return solo funciona con back_urls públicas (https). En localhost,
    // Mercado Pago lo rechaza ("back_url.success must be defined"), así que el
    // usuario vuelve con el botón "Volver al sitio" del checkout.
    if (/^https:\/\//.test(this.frontendUrl) && !/localhost|127\.0\.0\.1/.test(this.frontendUrl)) {
      body.auto_return = 'approved';
    }
    if (payer?.email) body.payer = { email: payer.email, name: payer.nombre };
    if (this.notificationUrl) body.notification_url = this.notificationUrl;

    const res = await preference.create({ body });
    return { id: res.id, init_point: res.init_point, sandbox_init_point: res.sandbox_init_point };
  }

  // Devuelve el estado del último pago asociado a la compra (external_reference),
  // o null si todavía no hay pagos. Estados de MP: approved | pending | rejected | ...
  async buscarEstadoPorReferencia(externalReference) {
    const payment = new Payment(this.config);
    const res = await payment.search({
      options: { external_reference: String(externalReference), sort: 'date_created', criteria: 'desc' },
    });
    const results = res.results || [];
    if (results.length === 0) return null;
    return results[0].status;
  }
}

class FakeMercadoPago {
  async createPreference(compra) {
    const id = `pref_${compra.id}_${Date.now()}`;
    return {
      id,
      init_point: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${id}`,
    };
  }
}

module.exports = { MercadoPagoClient, FakeMercadoPago };
