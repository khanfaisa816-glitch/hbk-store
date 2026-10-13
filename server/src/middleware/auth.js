const jwt = require('jsonwebtoken');
const db = require('../db');
const { AppError } = require('../utils/errors');

const SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  console.warn('[warn] JWT_SECRET is not set. Using an insecure dev secret.');
}

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '7d' });

// Reads the Bearer token and loads the user from the database (so deactivated users lose access).
function getUser(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), SECRET);
    const user = db
      .prepare('SELECT id, name, email, role, is_active FROM users WHERE id = ?')
      .get(payload.id);
    return user && user.is_active ? user : null;
  } catch {
    return null;
  }
}

function authRequired(req, res, next) {
  const user = getUser(req);
  if (!user) return next(new AppError(401, 'Please log in to continue'));
  req.user = user;
  next();
}

function adminRequired(req, res, next) {
  authRequired(req, res, (err) => {
    if (err) return next(err);
    if (req.user.role !== 'admin') return next(new AppError(403, 'Admin access only'));
    next();
  });
}

module.exports = { signToken, authRequired, adminRequired };
