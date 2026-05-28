const express = require('express');
const { CompraError } = require('../services/compraService');
const { HARDCODED_USER } = require('../db');

function comprasRoutes({ service }) {
  const router = express.Router();

  router.post('/', async (req, res) => {
    try {
      const { fechaVisita, metodoPago, tickets } = req.body || {};
      const result = await service.comprar({
        usuarioId: HARDCODED_USER.id,
        fechaVisita,
        metodoPago,
        tickets,
      });
      res.status(201).json(result);
    } catch (e) {
      if (e instanceof CompraError) return res.status(e.status).json({ error: e.message });
      console.error(e);
      res.status(500).json({ error: 'Error interno' });
    }
  });

  // Estado del pago de una compra (usado por el frontend al volver de Mercado Pago).
  router.get('/:id/estado', async (req, res) => {
    try {
      const result = await service.consultarEstado(Number(req.params.id));
      res.json(result);
    } catch (e) {
      if (e instanceof CompraError) return res.status(e.status).json({ error: e.message });
      console.error(e);
      res.status(500).json({ error: 'Error interno' });
    }
  });

  // Webhook de notificaciones de Mercado Pago (opcional, requiere URL pública).
  // Respondemos 200 siempre para que MP no reintente; la sincronización real
  // ocurre vía GET /:id/estado cuando el usuario vuelve al sitio.
  router.post('/webhook', (_req, res) => res.sendStatus(200));

  return router;
}

module.exports = { comprasRoutes };
