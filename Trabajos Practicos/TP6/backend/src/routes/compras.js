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

  return router;
}

module.exports = { comprasRoutes };
