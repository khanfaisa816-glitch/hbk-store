const db = require('../db');
const { getSettings } = require('../models/settings');
const { AppError } = require('../utils/errors');
const { iso } = require('../utils/helpers');

const toOffer = (r) => ({
  id: r.id,
  title: r.title,
  subtitle: r.subtitle,
  badge: r.badge,
  code: r.code,
  active: !!r.active,
});

// ---------- public ----------

// Store details (name, address, hours...) and the promo banners for the home page
exports.info = (req, res) => {
  const offers = db.prepare('SELECT * FROM offers WHERE active = 1 ORDER BY id DESC').all().map(toOffer);
  res.json({ store: getSettings(), offers });
};

exports.contact = (req, res) => {
  const { name, email, subject, message } = req.body;
  db.prepare('INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)').run(
    name,
    email,
    subject,
    message
  );
  res.status(201).json({ message: 'Thank you! We received your message and will reply soon.' });
};

// ---------- admin: promo banners ----------

exports.offerList = (req, res) => {
  res.json({ offers: db.prepare('SELECT * FROM offers ORDER BY id DESC').all().map(toOffer) });
};

exports.offerCreate = (req, res) => {
  const o = req.body;
  const info = db
    .prepare('INSERT INTO offers (title, subtitle, badge, code, active) VALUES (?, ?, ?, ?, ?)')
    .run(o.title, o.subtitle, o.badge, o.code, o.active ? 1 : 0);
  res.status(201).json({ offer: toOffer(db.prepare('SELECT * FROM offers WHERE id = ?').get(info.lastInsertRowid)) });
};

exports.offerUpdate = (req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare('SELECT id FROM offers WHERE id = ?').get(id)) throw new AppError(404, 'Offer not found');
  const o = req.body;
  db.prepare('UPDATE offers SET title = ?, subtitle = ?, badge = ?, code = ?, active = ? WHERE id = ?').run(
    o.title,
    o.subtitle,
    o.badge,
    o.code,
    o.active ? 1 : 0,
    id
  );
  res.json({ offer: toOffer(db.prepare('SELECT * FROM offers WHERE id = ?').get(id)) });
};

exports.offerRemove = (req, res) => {
  const info = db.prepare('DELETE FROM offers WHERE id = ?').run(Number(req.params.id));
  if (!info.changes) throw new AppError(404, 'Offer not found');
  res.status(204).end();
};

// ---------- admin: contact messages ----------

exports.messageList = (req, res) => {
  const rows = db.prepare('SELECT * FROM contact_messages ORDER BY id DESC LIMIT 200').all();
  res.json({
    messages: rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      subject: r.subject,
      message: r.message,
      createdAt: iso(r.created_at),
    })),
  });
};

exports.messageRemove = (req, res) => {
  const info = db.prepare('DELETE FROM contact_messages WHERE id = ?').run(Number(req.params.id));
  if (!info.changes) throw new AppError(404, 'Message not found');
  res.status(204).end();
};
