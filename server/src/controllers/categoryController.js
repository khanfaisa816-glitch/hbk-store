const db = require('../db');
const { AppError } = require('../utils/errors');
const { uniqueSlug } = require('../utils/helpers');

const toCategory = (r) => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  description: r.description,
  emoji: r.emoji,
  productCount: r.product_count,
});

const selectOne = (id) =>
  db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
       FROM categories c WHERE c.id = ?`
    )
    .get(id);

// Public list only counts products that customers can see
exports.list = (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, COUNT(p.id) AS product_count
       FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.active = 1
       GROUP BY c.id ORDER BY c.name`
    )
    .all();
  res.json({ categories: rows.map(toCategory) });
};

exports.adminList = (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
       FROM categories c ORDER BY c.name`
    )
    .all();
  res.json({ categories: rows.map(toCategory) });
};

function assertNameFree(name, ignoreId = null) {
  const clash = db.prepare('SELECT id FROM categories WHERE name = ? COLLATE NOCASE AND id IS NOT ?').get(name, ignoreId);
  if (clash) throw new AppError(409, 'A category with this name already exists');
}

exports.create = (req, res) => {
  const { name, description, emoji } = req.body;
  assertNameFree(name);
  const info = db
    .prepare('INSERT INTO categories (name, slug, description, emoji) VALUES (?, ?, ?, ?)')
    .run(name, uniqueSlug(db, 'categories', name), description, emoji);
  res.status(201).json({ category: toCategory(selectOne(info.lastInsertRowid)) });
};

exports.update = (req, res) => {
  const id = Number(req.params.id);
  if (!selectOne(id)) throw new AppError(404, 'Category not found');
  const { name, description, emoji } = req.body;
  assertNameFree(name, id);
  db.prepare('UPDATE categories SET name = ?, description = ?, emoji = ? WHERE id = ?').run(name, description, emoji, id);
  res.json({ category: toCategory(selectOne(id)) });
};

exports.remove = (req, res) => {
  const id = Number(req.params.id);
  const cat = selectOne(id);
  if (!cat) throw new AppError(404, 'Category not found');
  if (cat.product_count > 0) {
    throw new AppError(409, `This category still has ${cat.product_count} product(s). Move or delete them first.`);
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.status(204).end();
};
