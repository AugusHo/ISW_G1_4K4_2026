const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function authRoutes({ db, secret }) {
  const router = express.Router();

  router.post('/register', (req, res) => {
    const { email, contrasena, nombre } = req.body || {};
    if (!email || !contrasena || !nombre) {
      return res.status(400).json({ error: 'email, contrasena y nombre son requeridos' });
    }
    const exists = db.prepare('SELECT id FROM Usuarios WHERE email = ?').get(email);
    if (exists) return res.status(409).json({ error: 'El email ya está registrado' });
    const hash = bcrypt.hashSync(contrasena, 8);
    const { lastInsertRowid } = db
      .prepare('INSERT INTO Usuarios (email, contrasena, nombre) VALUES (?, ?, ?)')
      .run(email, hash, nombre);
    const token = jwt.sign({ id: lastInsertRowid, email }, secret, { expiresIn: '7d' });
    res.status(201).json({ token, usuario: { id: lastInsertRowid, email, nombre } });
  });

  router.post('/login', (req, res) => {
    const { email, contrasena } = req.body || {};
    const user = db.prepare('SELECT * FROM Usuarios WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(contrasena || '', user.contrasena)) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '7d' });
    res.json({ token, usuario: { id: user.id, email: user.email, nombre: user.nombre } });
  });

  return router;
}

module.exports = { authRoutes };
