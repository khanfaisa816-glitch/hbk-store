const bcrypt = require('bcryptjs');
const db = require('../db');
const User = require('../models/user');
const { signToken } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../utils/errors');

// Compared when the email is unknown, so response time does not reveal which emails exist
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password-1', 10);

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (User.findByEmail(email)) throw new AppError(409, 'An account with this email already exists');

  const hash = await bcrypt.hash(password, 10);
  const info = db
    .prepare('INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)')
    .run(name, email, hash, phone || '');
  const user = User.findById(info.lastInsertRowid);
  res.status(201).json({ token: signToken(user), user: User.toUser(user) });
});

// Customer login and admin login are two separate endpoints.
const makeLogin = (adminOnly) =>
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = User.findByEmail(email);
    const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
    if (!user || !ok) throw new AppError(401, 'Invalid email or password');
    if (!user.is_active) throw new AppError(403, 'This account has been disabled. Please contact the store.');

    if (adminOnly && user.role !== 'admin') throw new AppError(401, 'Invalid email or password');
    if (!adminOnly && user.role === 'admin') {
      throw new AppError(403, 'Admin accounts must log in from the admin page');
    }
    res.json({ token: signToken(user), user: User.toUser(user) });
  });

exports.login = makeLogin(false);
exports.adminLogin = makeLogin(true);

exports.me = (req, res) => {
  res.json({ user: User.toUser(User.findById(req.user.id)) });
};

exports.updateMe = (req, res) => {
  const { name, phone, address, city } = req.body;
  db.prepare('UPDATE users SET name = ?, phone = ?, address = ?, city = ? WHERE id = ?').run(
    name,
    phone,
    address,
    city,
    req.user.id
  );
  res.json({ user: User.toUser(User.findById(req.user.id)) });
};

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = User.findById(req.user.id);
  if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
    throw new AppError(400, 'Current password is not correct');
  }
  const hash = await bcrypt.hash(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
  res.json({ message: 'Password updated' });
});
