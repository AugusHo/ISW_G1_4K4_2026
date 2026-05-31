const nodemailer = require('nodemailer');

// Mailer "fake" para desarrollo/tests: loguea por consola y persiste en memoria.
// Se usa cuando no hay credenciales SMTP configuradas.
class ConsoleMailer {
  constructor() {
    this.sent = [];
  }
  async send(to, subject, body, opts = {}) {
    const adjuntos = (opts.attachments || []).map((a) => a.filename).join(', ');
    this.sent.push({ to, subject, body, attachments: opts.attachments || [], at: new Date().toISOString() });
    console.log(`[MAIL] -> ${to} | ${subject}${adjuntos ? ` | adjuntos: ${adjuntos}` : ''}`);
    console.log(body);
  }
}

// Mailer real basado en nodemailer. Por defecto usa el servicio Gmail con una
// "contraseña de aplicación" (MAIL_USER + MAIL_PASS). Si se define MAIL_HOST,
// usa ese SMTP en lugar de Gmail. Si MAIL_TO está configurado, todas las
// confirmaciones se envían a esa casilla (útil porque el usuario de la app es
// de prueba y su email no recibe correo).
class SmtpMailer {
  constructor({ user, pass, from, to, service, host, port, secure }) {
    this.transporter = nodemailer.createTransport(
      host
        ? { host, port: port || 587, secure: secure ?? port === 465, auth: { user, pass } }
        : { service: service || 'gmail', auth: { user, pass } }
    );
    this.from = from || user;
    this.to = to || null; // override del destinatario
    this.sent = [];
  }

  async send(to, subject, body, opts = {}) {
    const destino = this.to || to;
    const info = await this.transporter.sendMail({
      from: this.from,
      to: destino,
      subject,
      text: body,
      attachments: opts.attachments || [],
    });
    this.sent.push({ to: destino, subject, messageId: info.messageId });
    console.log(`[MAIL] -> ${destino} | ${subject} | id=${info.messageId}`);
    return info;
  }
}

module.exports = { ConsoleMailer, SmtpMailer };
