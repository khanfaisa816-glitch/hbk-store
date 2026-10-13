const db = require('../db');
const Product = require('../models/product');
const { AppError } = require('../utils/errors');

function send(res, userId) {
  const ids = db
    .prepare('SELECT product_id FROM wishlist WHERE user_id = ? ORDER BY created_at DESC, rowid DESC')
    .all(userId)
    .map((r) => r.product_id);
  const items = ids.map((id) => Product.find(id)).filter(Boolean); // hides products that were deactivated
  res.json({ items, productIds: items.map((p) => p.id) });
}

exports.list = (req, res) => send(res, req.user.id);

exports.add = (req, res) => {
  const product = Product.find(req.params.productId);
  if (!product) throw new AppError(404, 'Product not found');
  db.prepare('INSERT OR IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)').run(req.user.id, product.id);
  send(res, req.user.id);
};

exports.remove = (req, res) => {
  db.prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?').run(req.user.id, Number(req.params.productId));
  send(res, req.user.id);
};
