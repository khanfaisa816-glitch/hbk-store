const db = require('../db');
const { iso } = require('../utils/helpers');

// Never send password_hash to the browser
const toUser = (r) =>
  r && {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    address: r.address,
    city: r.city,
    role: r.role,
    isActive: !!r.is_active,
    createdAt: iso(r.created_at),
  };

const findByEmail = (email) => db.prepare('SELECT * FROM users WHERE email = ?').get(email);
const findById = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id);

module.exports = { toUser, findByEmail, findById };
