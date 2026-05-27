// Cliente Mercado Pago "fake" para desarrollo. Devuelve una URL simulada.
// Para producción reemplazar por el SDK oficial (mercadopago).
class FakeMercadoPago {
  async createPreference(compra) {
    const id = `pref_${compra.id}_${Date.now()}`;
    return {
      id,
      init_point: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${id}`,
    };
  }
}

module.exports = { FakeMercadoPago };
