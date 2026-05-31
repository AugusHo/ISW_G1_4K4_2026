const express = require('express');

function catalogoRoutes({ db }) {
  const router = express.Router();

  router.get('/tipos-ticket', (_req, res) => {
    const rows = db.prepare('SELECT id, nombre, pase, precio, descripcion FROM TiposTicket').all();
    res.json(rows);
  });

  router.get('/horarios', (_req, res) => {
    const rows = db
      .prepare('SELECT dia_semana, hora_apertura, hora_cierre FROM Horarios WHERE activo = 1')
      .all();
    res.json(rows);
  });

  return router;
}

module.exports = { catalogoRoutes };
