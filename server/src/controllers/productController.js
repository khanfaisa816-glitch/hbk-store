const db = require('../db');
const Product = require('../models/product');
const { schemas } = require('../validators');
const { AppError } = require('../utils/errors');
const { uniqueSlug } = require('../utils/helpers');
const { removeUpload } = require('../middleware/upload');

// ---------- public ----------

exports.list = (req, res) => {
  res.json(Product.list(req.query));
};

exports.get = (req, res) => {
  const product = Product.find(req.params.idOrSlug);
  if (!product) throw new AppError(404, 'Product not found');
  res.json({ product, reviews: Product.reviewsFor(product.id) });
};

// A logged-in customer adds (or edits) their review for a product
exports.addReview = (req, res) => {
  const product = Product.find(req.params.idOrSlug);
  if (!product) throw new AppError(404, 'Product not found');
  const { rating, comment } = req.body;

  db.prepare(
    `INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)
     ON CONFLICT (product_id, user_id)
     DO UPDATE SET rating = excluded.rating, comment = excluded.comment, created_at = datetime('now')`
  ).run(product.id, req.user.id, rating, comment);
  Product.recalcRating(product.id);

  res.status(201).json({ product: Product.find(product.id), reviews: Product.reviewsFor(product.id) });
};

// ---------- admin ----------

exports.adminList = (req, res) => {
  res.json(Product.list(req.query, { admin: true }));
};

// Validates the form and deletes the just-uploaded image if anything is wrong.
function parseProductForm(req) {
  try {
    const data = schemas.product.parse(req.body);
    if (!db.prepare('SELECT id FROM categories WHERE id = ?').get(data.categoryId)) {
      throw new AppError(400, 'Category does not exist');
    }
    return data;
  } catch (err) {
    if (req.file) removeUpload(`/uploads/${req.file.filename}`);
    throw err;
  }
}

exports.create = (req, res) => {
  const d = parseProductForm(req);
  const image = req.file ? `/uploads/${req.file.filename}` : null;
  const info = db
    .prepare(
      `INSERT INTO products (category_id, name, slug, description, price, old_price, stock, emoji, image, featured, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      d.categoryId,
      d.name,
      uniqueSlug(db, 'products', d.name),
      d.description,
      d.price,
      d.oldPrice,
      d.stock,
      d.emoji,
      image,
      d.featured ? 1 : 0,
      d.active ? 1 : 0
    );
  res.status(201).json({ product: Product.find(info.lastInsertRowid, { admin: true }) });
};

exports.update = (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) {
    if (req.file) removeUpload(`/uploads/${req.file.filename}`);
    throw new AppError(404, 'Product not found');
  }
  const d = parseProductForm(req);

  let image = existing.image;
  if (req.file) image = `/uploads/${req.file.filename}`;
  else if (req.body.removeImage === 'true' || req.body.removeImage === true) image = null;

  db.prepare(
    `UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, old_price = ?,
       stock = ?, emoji = ?, image = ?, featured = ?, active = ? WHERE id = ?`
  ).run(
    d.categoryId,
    d.name,
    d.description,
    d.price,
    d.oldPrice,
    d.stock,
    d.emoji,
    image,
    d.featured ? 1 : 0,
    d.active ? 1 : 0,
    id
  );
  if (image !== existing.image) removeUpload(existing.image);
  res.json({ product: Product.find(id, { admin: true }) });
};

exports.remove = (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(req.params.id));
  if (!existing) throw new AppError(404, 'Product not found');
  // Old orders keep their own copy of name and price, so deleting is safe
  db.prepare('DELETE FROM products WHERE id = ?').run(existing.id);
  removeUpload(existing.image);
  res.status(204).end();
};
