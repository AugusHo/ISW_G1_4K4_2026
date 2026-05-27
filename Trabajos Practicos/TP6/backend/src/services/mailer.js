// Mailer "fake" para desarrollo: loguea por consola y persiste en memoria.
// En producción se reemplaza por nodemailer / SendGrid / Resend.
class ConsoleMailer {
  constructor() {
    this.sent = [];
  }
  async send(to, subject, body) {
    this.sent.push({ to, subject, body, at: new Date().toISOString() });
    console.log(`[MAIL] -> ${to} | ${subject}`);
    console.log(body);
  }
}

module.exports = { ConsoleMailer };
