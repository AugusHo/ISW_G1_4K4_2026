const express = require('express');
const cors = require('cors');
const { CompraService } = require('./services/compraService');
const { ConsoleMailer, SmtpMailer } = require('./services/mailer');
const { MercadoPagoClient, FakeMercadoPago } = require('./services/mercadoPago');
const { catalogoRoutes } = require('./routes/catalogo');
const { comprasRoutes } = require('./routes/compras');
const { HARDCODED_USER } = require('./db');

// Devuelve el cliente real de Mercado Pago si hay un Access Token configurado,
// o el doble fake en caso contrario (dev sin credenciales / tests).
function buildMercadoPago() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[MercadoPago] MP_ACCESS_TOKEN no configurado: usando cliente FAKE.');
    }
    return new FakeMercadoPago();
  }
  return new MercadoPagoClient({
    accessToken,
    frontendUrl: process.env.FRONTEND_URL,
    notificationUrl: process.env.MP_NOTIFICATION_URL,
  });
}

// Devuelve el mailer real (SMTP/Gmail) si hay credenciales configuradas
// (MAIL_USER + MAIL_PASS), o el ConsoleMailer en caso contrario.
function buildMailer() {
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  if (!user || !pass) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[Mailer] MAIL_USER/MAIL_PASS no configurados: usando ConsoleMailer (no se envían correos reales).');
    }
    return new ConsoleMailer();
  }
  return new SmtpMailer({
    user,
    pass,
    from: process.env.MAIL_FROM || `EcoHarmony Park <${user}>`,
    to: process.env.MAIL_TO || null,
    service: process.env.MAIL_SERVICE || 'gmail',
    host: process.env.MAIL_HOST || null,
    port: process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : null,
    secure: process.env.MAIL_SECURE === 'true',
  });
}

function createApp({ db, mailer, mp }) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const _mailer = mailer || buildMailer();
  const _mp = mp || buildMercadoPago();
  const service = new CompraService({ db, mailer: _mailer, mp: _mp });

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/me', (_req, res) => {
    const u = db.prepare('SELECT id, email, nombre FROM Usuarios WHERE id = ?').get(HARDCODED_USER.id);
    res.json(u);
  });
  app.use('/api', catalogoRoutes({ db }));
  app.use('/api/compras', comprasRoutes({ service }));

  app.locals.mailer = _mailer;
  return app;
}

module.exports = { createApp };
