const db = require('../db');
const { iso } = require('../utils/helpers');

const BASE = `
  SELECT p.*, c.name AS category_name, c.slug AS category_slug
  FROM products p
  JOIN categories c ON c.id = p.category_id`;

const toProduct = (r) =>
  r && {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    price: r.price,
    oldPrice: r.old_price,
    stock: r.stock,
    emoji: r.emoji,
    image: r.image,
    featured: !!r.featured,
    active: !!r.active,
    ratingAvg: Math.round(r.rating_avg * 10) / 10,
    ratingCount: r.rating_count,
    sold: r.sold,
    createdAt: iso(r.created_at),
    category: { id: r.category_id, name: r.category_name, slug: r.category_slug },
  };

const SORTS = {
  newest: 'p.created_at DESC, p.id DESC',
  price_asc: 'p.price ASC, p.id ASC',
  price_desc: 'p.price DESC, p.id ASC',
  rating: 'p.rating_avg DESC, p.rating_count DESC, p.id ASC',
  popular: 'p.sold DESC, p.id ASC',
};

// Filtered, sorted, paged product list.
// Customers only see active products; admins (admin: true) see everything.
function list(q, { admin = false } = {}) {
  const where = [];
  const params = [];
  if (!admin) where.push('p.active = 1');
  if (q.search) {
    where.push('(p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)');
    const like = `%${q.search}%`;
    params.push(like, like, like);
  }
  if (q.category) {
    where.push('c.slug = ?');
    params.push(q.category);
  }
  if (q.minPrice != null) {
    where.push('p.price >= ?');
    params.push(q.minPrice);
  }
  if (q.maxPrice != null) {
    where.push('p.price <= ?');
    params.push(q.maxPrice);
  }
  if (q.minRating) {
    where.push('p.rating_avg >= ?');
    params.push(q.minRating);
  }
  if (q.featured) where.push('p.featured = 1');
  if (q.inStock) where.push('p.stock > 0');

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = db
    .prepare(`SELECT COUNT(*) AS n FROM products p JOIN categories c ON c.id = p.category_id ${whereSql}`)
    .get(...params).n;

  const limit = q.limit;
  const page = q.page;
  const rows = db
    .prepare(`${BASE} ${whereSql} ORDER BY ${SORTS[q.sort] || SORTS.newest} LIMIT ? OFFSET ?`)
    .all(...params, limit, (page - 1) * limit);

  return { items: rows.map(toProduct), total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

// Find by numeric id or by slug
function find(idOrSlug, { admin = false } = {}) {
  const isId = /^\d+$/.test(String(idOrSlug));
  const row = db
    .prepare(`${BASE} WHERE ${isId ? 'p.id' : 'p.slug'} = ? ${admin ? '' : 'AND p.active = 1'}`)
    .get(isId ? Number(idOrSlug) : idOrSlug);
  return toProduct(row);
}

function reviewsFor(productId) {
  return db
    .prepare(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name, r.user_id
       FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ? ORDER BY r.created_at DESC, r.id DESC`
    )
    .all(productId)
    .map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      userId: r.user_id,
      userName: r.user_name,
      createdAt: iso(r.created_at),
    }));
}

// Recalculates the stored average rating after a review changes
function recalcRating(productId) {
  const s = db
    .prepare('SELECT COALESCE(AVG(rating), 0) AS avg, COUNT(*) AS n FROM reviews WHERE product_id = ?')
    .get(productId);
  db.prepare('UPDATE products SET rating_avg = ?, rating_count = ? WHERE id = ?').run(s.avg, s.n, productId);
}

module.exports = { toProduct, list, find, reviewsFor, recalcRating };
