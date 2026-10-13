const db = require('../db');
const { AppError } = require('../utils/errors');
const { toSql, iso } = require('../utils/helpers');

const toDiscount = (r) =>
  r && {
    id: r.id,
    code: r.code,
    type: r.type,
    value: r.value,
    minOrder: r.min_order,
    usageLimit: r.usage_limit,
    usedCount: r.used_count,
    expiresAt: r.expires_at,
    active: !!r.active,
    expired: !!r.expires_at && r.expires_at < toSql().slice(0, 10),
    createdAt: iso(r.created_at),
  };

// Checks a code against an order subtotal. Throws a friendly error if it cannot be used.
// Returns { code, type, value, amount } where amount is the discount in rupees.
function applyDiscount(code, subtotal) {
  const d = db.prepare('SELECT * FROM discounts WHERE code = ?').get(String(code).trim());
  if (!d || !d.active) throw new AppError(400, 'This discount code is not valid');
  if (d.expires_at && d.expires_at < toSql().slice(0, 10)) {
    throw new AppError(400, 'This discount code has expired');
  }
  if (d.usage_limit != null && d.used_count >= d.usage_limit) {
    throw new AppError(400, 'This discount code has been fully used');
  }
  if (subtotal < d.min_order) {
    throw new AppError(400, `Minimum order for this code is Rs ${d.min_order.toLocaleString('en-PK')}`);
  }
  const amount =
    d.type === 'percent' ? Math.round((subtotal * d.value) / 100) : Math.min(d.value, subtotal);
  return { code: d.code, type: d.type, value: d.value, amount };
}

module.exports = { toDiscount, applyDiscount };
