const db = require('../db');
const { AppError } = require('../utils/errors');
const { iso } = require('../utils/helpers');
const { getSettings } = require('./settings');
const { applyDiscount } = require('./discount');

// Which status can follow which. Delivered and Cancelled are final.
const TRANSITIONS = {
  Pending: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: [],
};

const toOrder = (r) =>
  r && {
    id: r.id,
    userId: r.user_id,
    status: r.status,
    subtotal: r.subtotal,
    discountAmount: r.discount_amount,
    discountCode: r.discount_code,
    shippingFee: r.shipping_fee,
    total: r.total,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    cardLast4: r.card_last4,
    shipping: { name: r.ship_name, phone: r.ship_phone, address: r.ship_address, city: r.ship_city },
    notes: r.notes,
    createdAt: iso(r.created_at),
    ...(r.customer_name !== undefined
      ? { customer: { name: r.customer_name, email: r.customer_email } }
      : {}),
  };

const itemsOf = (orderId) =>
  db
    .prepare('SELECT id, product_id, name, emoji, price, quantity FROM order_items WHERE order_id = ?')
    .all(orderId)
    .map((i) => ({ id: i.id, productId: i.product_id, name: i.name, emoji: i.emoji, price: i.price, quantity: i.quantity }));

const eventsOf = (orderId) =>
  db
    .prepare('SELECT status, note, created_at FROM order_events WHERE order_id = ? ORDER BY id')
    .all(orderId)
    .map((e) => ({ status: e.status, note: e.note, createdAt: iso(e.created_at) }));

const addEvent = (orderId, status, note = '') =>
  db.prepare('INSERT INTO order_events (order_id, status, note) VALUES (?, ?, ?)').run(orderId, status, note);

// One order with its items and tracking events
function getFull(orderId) {
  const row = db
    .prepare(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = ?`
    )
    .get(orderId);
  if (!row) return null;
  return { ...toOrder(row), items: itemsOf(orderId), events: eventsOf(orderId) };
}

// Creates an order. Prices always come from the database, never from the browser.
function create(userId, input) {
  const settings = getSettings();

  const run = db.transaction(() => {
    // Same product twice in the cart -> one line
    const wanted = new Map();
    for (const it of input.items) wanted.set(it.productId, (wanted.get(it.productId) || 0) + it.quantity);

    const lines = [];
    let subtotal = 0;
    for (const [productId, qty] of wanted) {
      const p = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(productId);
      if (!p) throw new AppError(400, 'A product in your cart is no longer available');
      if (p.stock < qty) {
        throw new AppError(409, p.stock === 0 ? `${p.name} is out of stock` : `Only ${p.stock} left of ${p.name}`);
      }
      lines.push({ p, qty });
      subtotal += p.price * qty;
    }

    const discount = input.discountCode ? applyDiscount(input.discountCode, subtotal) : null;
    const discountAmount = discount ? discount.amount : 0;
    const shippingFee = subtotal >= settings.freeShippingMin ? 0 : settings.shippingFee;
    const total = subtotal - discountAmount + shippingFee;

    const isCard = input.paymentMethod === 'card';
    const info = db
      .prepare(
        `INSERT INTO orders (user_id, subtotal, discount_amount, discount_code, shipping_fee, total,
           payment_method, payment_status, card_last4, ship_name, ship_phone, ship_address, ship_city, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        userId,
        subtotal,
        discountAmount,
        discount ? discount.code : null,
        shippingFee,
        total,
        input.paymentMethod,
        isCard ? 'paid' : 'unpaid',
        // Only the last 4 digits are kept. The full card number is never stored.
        isCard ? input.card.number.slice(-4) : null,
        input.shipping.name,
        input.shipping.phone,
        input.shipping.address,
        input.shipping.city,
        input.notes || ''
      );
    const orderId = info.lastInsertRowid;

    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, name, emoji, price, quantity) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const takeStock = db.prepare('UPDATE products SET stock = stock - ?, sold = sold + ? WHERE id = ?');
    for (const { p, qty } of lines) {
      insertItem.run(orderId, p.id, p.name, p.emoji, p.price, qty);
      takeStock.run(qty, qty, p.id);
    }
    if (discount) db.prepare('UPDATE discounts SET used_count = used_count + 1 WHERE code = ?').run(discount.code);

    addEvent(orderId, 'Pending', 'Order placed');
    return orderId;
  });

  return getFull(run());
}

// Moves an order to a new status (used by admin and by customer cancel).
function setStatus(orderId, newStatus, note = '') {
  const run = db.transaction(() => {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) throw new AppError(404, 'Order not found');
    if (!TRANSITIONS[order.status].includes(newStatus)) {
      throw new AppError(
        400,
        TRANSITIONS[order.status].length
          ? `A ${order.status} order can only change to: ${TRANSITIONS[order.status].join(', ')}`
          : `A ${order.status} order cannot be changed`
      );
    }

    let paymentStatus = order.payment_status;
    if (newStatus === 'Delivered' && order.payment_method === 'cod') paymentStatus = 'paid';

    if (newStatus === 'Cancelled') {
      // Put the items back in stock and free the discount use
      for (const it of db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(orderId)) {
        if (it.product_id) {
          db.prepare('UPDATE products SET stock = stock + ?, sold = MAX(0, sold - ?) WHERE id = ?').run(
            it.quantity,
            it.quantity,
            it.product_id
          );
        }
      }
      if (order.discount_code) {
        db.prepare('UPDATE discounts SET used_count = MAX(0, used_count - 1) WHERE code = ?').run(order.discount_code);
      }
      if (order.payment_status === 'paid') paymentStatus = 'refunded';
    }

    db.prepare('UPDATE orders SET status = ?, payment_status = ? WHERE id = ?').run(newStatus, paymentStatus, orderId);
    addEvent(orderId, newStatus, note);
  });
  run();
  return getFull(orderId);
}

module.exports = { toOrder, itemsOf, getFull, create, setStatus, TRANSITIONS };
