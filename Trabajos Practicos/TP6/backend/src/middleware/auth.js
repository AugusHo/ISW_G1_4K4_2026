const jwt = require('jsonwebtoken');

function authMiddleware(secret) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Token requerido' });
    try {
      req.user = jwt.verify(token, secret);
      next();
    } catch (e) {
      res.status(401).json({ error: 'Token inválido' });
    }
  };
}

module.exports = { authMiddleware };
