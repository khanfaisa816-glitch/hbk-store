const db = require('../db');
const Order = require('../models/order');
const { AppError } = require('../utils/errors');

// ---------- customer ----------

exports.create = (req, res) => {
  const order = Order.create(req.user.id, req.body);
  res.status(201).json({ order });
};

exports.mine = (req, res) => {
  const rows = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC').all(req.user.id);
  res.json({ orders: rows.map((r) => ({ ...Order.toOrder(r), items: Order.itemsOf(r.id) })) });
};

exports.getMine = (req, res) => {
  const order = Order.getFull(Number(req.params.id));
  // Same message for "not found" and "not yours" so ids cannot be guessed
  if (!order || order.userId !== req.user.id) throw new AppError(404, 'Order not found');
  res.json({ order });
};

exports.cancelMine = (req, res) => {
  const existing = Order.getFull(Number(req.params.id));
  if (!existing || existing.userId !== req.user.id) throw new AppError(404, 'Order not found');
  if (existing.status !== 'Pending') {
    throw new AppError(400, 'Only pending orders can be cancelled. Please contact the store.');
  }
  res.json({ order: Order.setStatus(existing.id, 'Cancelled', 'Cancelled by customer') });
};

// ---------- admin ----------

exports.adminList = (req, res) => {
  const { status, search, page, limit } = req.query;
  const where = [];
  const params = [];
  if (status) {
    where.push('o.status = ?');
    params.push(status);
  }
  if (search) {
    const like = `%${search}%`;
    if (/^#?\d+$/.test(search)) {
      where.push('(o.id = ? OR u.name LIKE ? OR o.ship_name LIKE ?)');
      params.push(Number(search.replace('#', '')), like, like);
    } else {
      where.push('(u.name LIKE ? OR u.email LIKE ? OR o.ship_name LIKE ?)');
      params.push(like, like, like);
    }
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const from = `FROM orders o LEFT JOIN users u ON u.id = o.user_id ${whereSql}`;

  const total = db.prepare(`SELECT COUNT(*) AS n ${from}`).get(...params).n;
  const rows = db
    .prepare(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email,
         (SELECT COALESCE(SUM(quantity), 0) FROM order_items WHERE order_id = o.id) AS item_count
       ${from} ORDER BY o.id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, (page - 1) * limit);

  // Numbers for the status tabs
  const counts = Object.fromEntries(
    db.prepare('SELECT status, COUNT(*) AS n FROM orders GROUP BY status').all().map((r) => [r.status, r.n])
  );

  res.json({
    items: rows.map((r) => ({ ...Order.toOrder(r), itemCount: r.item_count })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    counts,
  });
};

exports.adminGet = (req, res) => {
  const order = Order.getFull(Number(req.params.id));
  if (!order) throw new AppError(404, 'Order not found');
  res.json({ order });
};

exports.adminSetStatus = (req, res) => {
  const { status, note } = req.body;
  res.json({ order: Order.setStatus(Number(req.params.id), status, note || `Status changed to ${status}`) });
};
