const express = require('express');
const { CompraError } = require('../services/compraService');

function comprasRoutes({ service, auth }) {
  const router = express.Router();

  router.post('/', auth, async (req, res) => {
    try {
      const { fechaVisita, metodoPago, tickets } = req.body || {};
      const result = await service.comprar({
        usuarioId: req.user.id,
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
