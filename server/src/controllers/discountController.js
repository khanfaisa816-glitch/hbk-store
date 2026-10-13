const db = require('../db');
const { toDiscount, applyDiscount } = require('../models/discount');
const { AppError } = require('../utils/errors');

// Customer: "Apply" button at checkout
exports.check = (req, res) => {
  const { code, subtotal } = req.body;
  const result = applyDiscount(code, subtotal);
  res.json({ discount: result });
};

// ---------- admin ----------

exports.adminList = (req, res) => {
  const rows = db.prepare('SELECT * FROM discounts ORDER BY id DESC').all();
  res.json({ discounts: rows.map(toDiscount) });
};

function assertCodeFree(code, ignoreId = null) {
  if (db.prepare('SELECT id FROM discounts WHERE code = ? AND id IS NOT ?').get(code, ignoreId)) {
    throw new AppError(409, 'This discount code already exists');
  }
}

exports.create = (req, res) => {
  const d = req.body;
  assertCodeFree(d.code);
  const info = db
    .prepare(
      `INSERT INTO discounts (code, type, value, min_order, usage_limit, expires_at, active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(d.code, d.type, d.value, d.minOrder, d.usageLimit, d.expiresAt, d.active ? 1 : 0);
  const row = db.prepare('SELECT * FROM discounts WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ discount: toDiscount(row) });
};

exports.update = (req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare('SELECT id FROM discounts WHERE id = ?').get(id)) throw new AppError(404, 'Discount not found');
  const d = req.body;
  assertCodeFree(d.code, id);
  db.prepare(
    `UPDATE discounts SET code = ?, type = ?, value = ?, min_order = ?, usage_limit = ?, expires_at = ?, active = ?
     WHERE id = ?`
  ).run(d.code, d.type, d.value, d.minOrder, d.usageLimit, d.expiresAt, d.active ? 1 : 0, id);
  res.json({ discount: toDiscount(db.prepare('SELECT * FROM discounts WHERE id = ?').get(id)) });
};

exports.remove = (req, res) => {
  const info = db.prepare('DELETE FROM discounts WHERE id = ?').run(Number(req.params.id));
  if (!info.changes) throw new AppError(404, 'Discount not found');
  res.status(204).end();
};
