const db = require('../db');
const Order = require('../models/order');
const User = require('../models/user');
const { AppError } = require('../utils/errors');

const LOW_STOCK_LIMIT = 10; // products with this many or fewer items are "low stock"

// Sales per day (last N days) or per month (last N months). Cancelled orders are not counted.
// Days/months with no sales are filled with zeros so charts have no gaps.
function salesSeries(period, count) {
  const fmt = period === 'day' ? '%Y-%m-%d' : '%Y-%m';
  const rows = db
    .prepare(
      `SELECT strftime('${fmt}', created_at) AS label, COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
       FROM orders WHERE status != 'Cancelled' GROUP BY label`
    )
    .all();
  const byLabel = new Map(rows.map((r) => [r.label, r]));

  const now = new Date();
  const out = [];
  for (let i = count - 1; i >= 0; i--) {
    const d =
      period === 'day'
        ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i))
        : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const label = d.toISOString().slice(0, period === 'day' ? 10 : 7);
    const r = byLabel.get(label);
    out.push({ label, orders: r ? r.orders : 0, revenue: r ? r.revenue : 0 });
  }
  return out;
}

exports.stats = (req, res) => {
  const sales = db
    .prepare(`SELECT COALESCE(SUM(total), 0) AS revenue FROM orders WHERE status != 'Cancelled'`)
    .get();
  const count = (sql) => db.prepare(sql).get().n;

  const lowStock = db
    .prepare(
      `SELECT id, name, emoji, image, stock FROM products
       WHERE active = 1 AND stock <= ? ORDER BY stock ASC, name LIMIT 10`
    )
    .all(LOW_STOCK_LIMIT);

  const recentOrders = db
    .prepare(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o LEFT JOIN users u ON u.id = o.user_id ORDER BY o.id DESC LIMIT 6`
    )
    .all()
    .map(Order.toOrder);

  res.json({
    totalSales: sales.revenue,
    totalOrders: count('SELECT COUNT(*) AS n FROM orders'),
    pendingOrders: count(`SELECT COUNT(*) AS n FROM orders WHERE status = 'Pending'`),
    totalCustomers: count(`SELECT COUNT(*) AS n FROM users WHERE role = 'customer'`),
    totalProducts: count('SELECT COUNT(*) AS n FROM products WHERE active = 1'),
    lowStockLimit: LOW_STOCK_LIMIT,
    lowStock,
    recentOrders,
    ordersByStatus: db.prepare('SELECT status, COUNT(*) AS count FROM orders GROUP BY status').all(),
    salesLast7Days: salesSeries('day', 7),
  });
};

exports.salesReport = (req, res) => {
  const { period } = req.query;
  const data = salesSeries(period, period === 'day' ? 30 : 12);
  const from = period === 'day' ? data[0].label : `${data[0].label}-01`;

  const revenue = data.reduce((s, d) => s + d.revenue, 0);
  const orders = data.reduce((s, d) => s + d.orders, 0);

  const topProducts = db
    .prepare(
      `SELECT oi.name, SUM(oi.quantity) AS units, SUM(oi.quantity * oi.price) AS revenue
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE o.status != 'Cancelled' AND date(o.created_at) >= ?
       GROUP BY oi.name ORDER BY units DESC LIMIT 5`
    )
    .all(from);

  const byCategory = db
    .prepare(
      `SELECT c.name AS name, SUM(oi.quantity * oi.price) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       JOIN categories c ON c.id = p.category_id
       WHERE o.status != 'Cancelled' AND date(o.created_at) >= ?
       GROUP BY c.id ORDER BY revenue DESC`
    )
    .all(from);

  res.json({
    period,
    data,
    summary: { revenue, orders, avgOrder: orders ? Math.round(revenue / orders) : 0 },
    topProducts,
    byCategory,
  });
};

exports.customers = (req, res) => {
  const { search } = req.query;
  const params = [];
  let filter = '';
  if (search) {
    filter = 'AND (u.name LIKE ? OR u.email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  const rows = db
    .prepare(
      `SELECT u.*,
         (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders_count,
         (SELECT COALESCE(SUM(total), 0) FROM orders o WHERE o.user_id = u.id AND o.status != 'Cancelled') AS total_spent
       FROM users u WHERE u.role = 'customer' ${filter} ORDER BY u.id DESC`
    )
    .all(...params);
  res.json({
    customers: rows.map((r) => ({ ...User.toUser(r), ordersCount: r.orders_count, totalSpent: r.total_spent })),
  });
};

exports.setCustomerStatus = (req, res) => {
  const user = User.findById(Number(req.params.id));
  if (!user || user.role !== 'customer') throw new AppError(404, 'Customer not found');
  db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(req.body.isActive ? 1 : 0, user.id);
  res.json({ customer: User.toUser(User.findById(user.id)) });
};
