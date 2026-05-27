const express = require('express');
const cors = require('cors');
const { CompraService } = require('./services/compraService');
const { ConsoleMailer } = require('./services/mailer');
const { FakeMercadoPago } = require('./services/mercadoPago');
const { authMiddleware } = require('./middleware/auth');
const { authRoutes } = require('./routes/auth');
const { catalogoRoutes } = require('./routes/catalogo');
const { comprasRoutes } = require('./routes/compras');

function createApp({ db, secret = 'dev-secret', mailer, mp }) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const _mailer = mailer || new ConsoleMailer();
  const _mp = mp || new FakeMercadoPago();
  const service = new CompraService({ db, mailer: _mailer, mp: _mp });
  const auth = authMiddleware(secret);

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes({ db, secret }));
  app.use('/api', catalogoRoutes({ db }));
  app.use('/api/compras', comprasRoutes({ service, auth }));

  app.locals.mailer = _mailer;
  return app;
}

module.exports = { createApp };
