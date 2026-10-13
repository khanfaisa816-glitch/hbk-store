// Fills the database with dummy data. WARNING: this deletes all existing data first.
// Run with:  npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');
const { dropSql, schemaSql } = require('./schema');
const { slugify, toSql } = require('./utils/helpers');

// Small random generator with a fixed seed, so every run creates the same data.
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(2026);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (a, b) => a + Math.floor(rand() * (b - a + 1));
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const ago = (days, extraHours = 0) => new Date(Date.now() - days * 86400000 - extraHours * 3600000);
const plusDays = (date, days) => new Date(date.getTime() + days * 86400000);

// ---------------------------------------------------------------- data

const ADMIN = { name: 'HBK Admin', email: 'admin@hbk.example', password: 'Admin@123' };
const CUSTOMER_PASSWORD = 'Customer@123';

const CUSTOMERS = [
  ['Demo Customer', 'customer@hbk.example', 'Lahore'],
  ['Ayesha Malik', 'ayesha.malik@example.com', 'Karachi'],
  ['Bilal Hussain', 'bilal.hussain@example.com', 'Islamabad'],
  ['Fatima Noor', 'fatima.noor@example.com', 'Rawalpindi'],
  ['Hamza Ali', 'hamza.ali@example.com', 'Faisalabad'],
  ['Sara Iqbal', 'sara.iqbal@example.com', 'Lahore'],
  ['Usman Tariq', 'usman.tariq@example.com', 'Multan'],
  ['Zainab Shah', 'zainab.shah@example.com', 'Peshawar'],
  ['Omar Farooq', 'omar.farooq@example.com', 'Karachi'],
  ['Hira Aslam', 'hira.aslam@example.com', 'Lahore'],
];
const STREETS = ['Street 5, Block B', 'House 21, Main Road', 'Flat 7, Garden Town', 'Plot 14, Phase 2', 'Street 12, Model Town'];

const SETTINGS = {
  name: 'HBK',
  tagline: 'Everything you need, under one roof',
  address: 'Shop 12, Liberty Market, Gulberg III',
  city: 'Lahore, Pakistan',
  phone: '+92 300 1234567',
  whatsapp: '+92 300 1234567',
  email: 'hello@hbk.example',
  hours: [
    { day: 'Monday - Thursday', time: '10:00 AM - 9:00 PM' },
    { day: 'Friday', time: '2:30 PM - 10:00 PM' },
    { day: 'Saturday', time: '10:00 AM - 10:00 PM' },
    { day: 'Sunday', time: '12:00 PM - 8:00 PM' },
  ],
  currency: 'Rs',
  freeShippingMin: 3000,
  shippingFee: 250,
  mapQuery: 'Liberty Market, Gulberg III, Lahore, Pakistan',
};

const CATEGORIES = [
  ['Groceries', '🛒', 'Daily essentials and pantry staples'],
  ['Electronics', '📱', 'Gadgets, accessories and smart devices'],
  ['Clothing', '👕', 'Everyday fashion for men and women'],
  ['Home & Kitchen', '🏠', 'Cookware, appliances and home essentials'],
  ['Beauty & Care', '💄', 'Skincare, haircare and grooming'],
];

// [category, name, description, price, old price, stock, emoji, featured]
const PRODUCTS = [
  ['Groceries', 'Basmati Rice 5kg', 'Long grain aged basmati rice. Fluffy, fragrant and perfect for biryani and pulao.', 1850, 2100, 120, '🍚', 0],
  ['Groceries', 'Cooking Oil 3L', 'Pure refined cooking oil, rich in vitamin A and E. Light taste for everyday cooking.', 2450, null, 80, '🫒', 0],
  ['Groceries', 'Green Tea 100 Bags', 'Refreshing green tea with natural antioxidants. Individually wrapped tea bags.', 690, null, 150, '🍵', 0],
  ['Groceries', 'Full Cream Milk 1L (Pack of 6)', 'Long life full cream milk. No need for a fridge until opened.', 1380, null, 60, '🥛', 0],
  ['Groceries', 'Premium Dates 1kg', 'Soft, sweet and juicy dates carefully selected and packed fresh.', 1200, 1400, 90, '🌴', 1],
  ['Groceries', 'Chocolate Cookies Family Pack', 'Crunchy cookies with chocolate chips. A perfect tea time snack for the whole family.', 320, null, 8, '🍪', 0],

  ['Electronics', 'Wireless Earbuds Pro', 'Bluetooth 5.3 earbuds with noise reduction, touch controls and 24 hour battery with the case.', 4999, 6499, 45, '🎧', 1],
  ['Electronics', 'Smart Watch Series X', 'AMOLED display, heart rate and sleep tracking, 7 day battery life and water resistance.', 8999, null, 25, '⌚', 1],
  ['Electronics', '20,000mAh Power Bank', 'High capacity power bank with dual USB output and fast charging support.', 3499, null, 60, '🔋', 0],
  ['Electronics', 'LED Desk Lamp', 'Adjustable LED lamp with 3 brightness levels and eye protection light. USB powered.', 1799, null, 70, '💡', 0],
  ['Electronics', 'Bluetooth Speaker', 'Portable speaker with deep bass, 12 hour playtime and splash proof body.', 3999, 4999, 7, '🔊', 0],
  ['Electronics', 'USB-C Fast Charger 65W', 'Compact 65W charger for phones, tablets and laptops. Includes a 1 meter cable.', 1499, null, 110, '🔌', 0],

  ['Clothing', "Men's Cotton T-Shirt", 'Soft 100% cotton t-shirt with a relaxed fit. Available in many colours.', 1199, null, 200, '👕', 0],
  ['Clothing', "Women's Lawn Suit 3-Piece", 'Printed lawn shirt with dyed trouser and chiffon dupatta. Light and comfortable for summer.', 3499, 4200, 40, '👗', 1],
  ['Clothing', 'Denim Jeans Slim Fit', 'Stretch denim jeans with a modern slim fit. Durable and easy to style.', 2899, null, 55, '👖', 0],
  ['Clothing', 'Winter Hoodie', 'Warm fleece hoodie with front pocket and adjustable hood.', 2799, null, 35, '🧥', 0],
  ['Clothing', 'Running Sneakers', 'Lightweight sneakers with cushioned sole and breathable mesh for daily running and walking.', 4599, 5400, 30, '👟', 1],
  ['Clothing', 'Wool Cap & Scarf Set', 'Cozy knitted cap and matching scarf for cold winter days.', 899, null, 5, '🧣', 0],

  ['Home & Kitchen', 'Non-Stick Fry Pan 28cm', 'Heavy base fry pan with a strong non-stick coating. Works on gas and electric stoves.', 1950, null, 45, '🍳', 0],
  ['Home & Kitchen', 'Electric Kettle 1.8L', 'Fast boiling stainless steel kettle with auto shut-off and boil-dry protection.', 2599, null, 38, '☕', 0],
  ['Home & Kitchen', 'Cotton Bed Sheet Set', 'Double bed sheet with 2 pillow covers. Soft, breathable cotton that stays fresh after washing.', 3299, null, 28, '🛏️', 1],
  ['Home & Kitchen', 'Stainless Steel Water Bottle', 'Double wall insulated bottle, keeps drinks hot for 12 hours and cold for 24 hours.', 1100, null, 90, '🧴', 0],
  ['Home & Kitchen', 'Air Fryer 4L', 'Cook crispy food with up to 80% less oil. Digital controls and 8 preset menus.', 11999, 14999, 12, '🍟', 1],
  ['Home & Kitchen', 'Dinner Set 24 Pieces', 'Elegant ceramic dinner set for 6 people. Microwave and dishwasher safe.', 4999, null, 20, '🍽️', 0],

  ['Beauty & Care', 'Herbal Face Wash', 'Gentle daily face wash with neem and aloe vera. Removes dirt without drying the skin.', 450, null, 140, '🧼', 0],
  ['Beauty & Care', 'Argan Hair Oil', 'Nourishing hair oil that reduces frizz and adds natural shine.', 780, null, 100, '💧', 0],
  ['Beauty & Care', "Men's Perfume 100ml", 'Long lasting woody fragrance with fresh citrus top notes.', 3200, 3800, 33, '🌸', 0],
  ['Beauty & Care', 'Electric Hair Trimmer', 'Rechargeable trimmer with 4 guide combs and stainless steel blades.', 2499, null, 42, '💈', 0],
  ['Beauty & Care', 'Moisturizing Cream', 'Light, non-greasy cream for 24 hour hydration. Suitable for all skin types.', 650, null, 85, '🧴', 0],
  ['Beauty & Care', 'Sunscreen SPF 50', 'Broad spectrum sun protection with a matte finish. Water resistant.', 990, null, 9, '☀️', 0],
];

const REVIEW_TEXT = {
  5: ['Excellent quality, totally worth the price!', 'Fast delivery and exactly as described.', 'Very happy with this purchase. Will buy again.', 'Great value for money.'],
  4: ['Good product, does the job well.', 'Nice quality. Delivery was a little late.', 'Satisfied overall, packaging could be better.'],
  3: ['It is okay for the price.', 'Average quality, nothing special.'],
  2: ['Not as good as I expected.'],
};

const DISCOUNTS = [
  // code, type, value, minOrder, usageLimit, expiresInDays (null = never), active
  ['WELCOME10', 'percent', 10, 1000, null, null, 1],
  ['HBK200', 'fixed', 200, 2000, null, null, 1],
  ['SAVE15', 'percent', 15, 5000, 50, 90, 1],
  ['WEEKEND20', 'percent', 20, 3000, 100, 30, 1],
  ['OLDSALE5', 'percent', 5, 0, null, -10, 0], // expired and switched off, for testing
];

const OFFERS = [
  ['Welcome to HBK', 'Get 10% off your first order', 'NEW', 'WELCOME10'],
  ['Free delivery', 'Free delivery on all orders above Rs 3,000', 'FREE', ''],
  ['Weekend Sale', 'Save 20% on orders above Rs 3,000', '20% OFF', 'WEEKEND20'],
];

// ---------------------------------------------------------------- seed

function seed() {
  console.log('Resetting database...');
  db.pragma('foreign_keys = OFF');
  db.exec(dropSql);
  db.pragma('foreign_keys = ON');
  db.exec(schemaSql);

  const run = db.transaction(() => {
    // settings
    const setSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of Object.entries(SETTINGS)) setSetting.run(k, JSON.stringify(v));

    // users: 1 admin + 10 customers
    const insertUser = db.prepare(
      `INSERT INTO users (name, email, password_hash, phone, address, city, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    insertUser.run(ADMIN.name, ADMIN.email, bcrypt.hashSync(ADMIN.password, 10), '+92 300 0000000', '', 'Lahore', 'admin', toSql(ago(120)));
    const customerHash = bcrypt.hashSync(CUSTOMER_PASSWORD, 10);
    const customerIds = CUSTOMERS.map(([name, email, city], i) => {
      const phone = `03${between(0, 4)}${between(0, 9)}-${between(1000000, 9999999)}`;
      const info = insertUser.run(name, email, customerHash, phone, `${pick(STREETS)}, ${city}`, city, 'customer', toSql(ago(between(20, 100))));
      return Number(info.lastInsertRowid);
    });

    // categories
    const insertCat = db.prepare('INSERT INTO categories (name, slug, description, emoji) VALUES (?, ?, ?, ?)');
    const catId = {};
    for (const [name, emoji, description] of CATEGORIES) {
      catId[name] = Number(insertCat.run(name, slugify(name), description, emoji).lastInsertRowid);
    }

    // products
    const insertProduct = db.prepare(
      `INSERT INTO products (category_id, name, slug, description, price, old_price, stock, emoji, featured, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    PRODUCTS.forEach(([cat, name, description, price, oldPrice, stock, emoji, featured], i) => {
      insertProduct.run(catId[cat], name, slugify(name), description, price, oldPrice, stock, emoji, featured, toSql(ago(90 - i * 2)));
    });
    const products = db.prepare('SELECT * FROM products ORDER BY id').all();

    // discounts and offers
    const insertDiscount = db.prepare(
      `INSERT INTO discounts (code, type, value, min_order, usage_limit, expires_at, active) VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const [code, type, value, minOrder, limit, days, active] of DISCOUNTS) {
      const expires = days === null ? null : toSql(ago(-days)).slice(0, 10);
      insertDiscount.run(code, type, value, minOrder, limit, expires, active);
    }
    const insertOffer = db.prepare('INSERT INTO offers (title, subtitle, badge, code) VALUES (?, ?, ?, ?)');
    for (const o of OFFERS) insertOffer.run(...o);

    // orders: 20 spread over the last 2 months
    const insertOrder = db.prepare(
      `INSERT INTO orders (user_id, status, subtotal, discount_amount, discount_code, shipping_fee, total,
         payment_method, payment_status, card_last4, ship_name, ship_phone, ship_address, ship_city, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, name, emoji, price, quantity) VALUES (?, ?, ?, ?, ?, ?)');
    const insertEvent = db.prepare('INSERT INTO order_events (order_id, status, note, created_at) VALUES (?, ?, ?, ?)');
    const addSold = db.prepare('UPDATE products SET sold = sold + ? WHERE id = ?');
    const useDiscount = db.prepare('UPDATE discounts SET used_count = used_count + 1 WHERE code = ?');
    const userRow = db.prepare('SELECT * FROM users WHERE id = ?');

    const DAYS_AGO = [58, 55, 51, 47, 44, 40, 37, 33, 30, 26, 22, 19, 15, 12, 9, 7, 5, 3, 2, 0];
    const CANCELLED = new Set([4, 9]);
    DAYS_AGO.forEach((d, i) => {
      const createdAt = ago(d, d === 0 ? between(1, 5) : between(0, 10));
      const status = CANCELLED.has(i) ? 'Cancelled' : d >= 10 ? 'Delivered' : d >= 4 ? 'Shipped' : 'Pending';
      // The demo customer gets several orders in different states
      const userId = i % 4 === 1 || i === 15 ? customerIds[0] : pick(customerIds.slice(1));
      const user = userRow.get(userId);

      const lines = shuffle(products)
        .slice(0, between(1, 4))
        .map((p) => ({ p, qty: rand() < 0.75 ? 1 : between(2, 3) }));
      const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0);

      let code = null;
      let discountAmount = 0;
      if (subtotal >= 1000 && rand() < 0.3) {
        code = 'WELCOME10';
        discountAmount = Math.round(subtotal * 0.1);
      } else if (subtotal >= 2000 && rand() < 0.2) {
        code = 'HBK200';
        discountAmount = 200;
      }
      const shippingFee = subtotal >= SETTINGS.freeShippingMin ? 0 : SETTINGS.shippingFee;
      const total = subtotal - discountAmount + shippingFee;

      const method = rand() < 0.5 ? 'card' : 'cod';
      let paymentStatus = 'unpaid';
      if (method === 'card') paymentStatus = status === 'Cancelled' ? 'refunded' : 'paid';
      else if (status === 'Delivered') paymentStatus = 'paid';

      const orderId = Number(
        insertOrder.run(
          userId, status, subtotal, discountAmount, code, shippingFee, total, method, paymentStatus,
          method === 'card' ? String(between(1000, 9999)) : null,
          user.name, user.phone, user.address, user.city, '', toSql(createdAt)
        ).lastInsertRowid
      );

      for (const { p, qty } of lines) {
        insertItem.run(orderId, p.id, p.name, p.emoji, p.price, qty);
        if (status !== 'Cancelled') addSold.run(qty, p.id);
      }
      if (code && status !== 'Cancelled') useDiscount.run(code);

      // tracking timeline
      insertEvent.run(orderId, 'Pending', 'Order placed', toSql(createdAt));
      if (status === 'Shipped' || status === 'Delivered') insertEvent.run(orderId, 'Shipped', 'Order handed to the courier', toSql(plusDays(createdAt, 1)));
      if (status === 'Delivered') insertEvent.run(orderId, 'Delivered', 'Order delivered', toSql(plusDays(createdAt, 3)));
      if (status === 'Cancelled') insertEvent.run(orderId, 'Cancelled', 'Cancelled by customer', toSql(plusDays(createdAt, 0.5)));
    });

    // reviews: 1-4 per product
    const insertReview = db.prepare('INSERT INTO reviews (product_id, user_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?)');
    const WEIGHTED = [5, 5, 5, 5, 4, 4, 4, 3, 3, 2];
    for (const p of products) {
      for (const uid of shuffle(customerIds).slice(0, between(1, 4))) {
        const rating = pick(WEIGHTED);
        insertReview.run(p.id, uid, rating, pick(REVIEW_TEXT[rating]), toSql(ago(between(1, 80))));
      }
    }
    db.exec(`UPDATE products SET
      rating_avg = COALESCE((SELECT AVG(rating) FROM reviews r WHERE r.product_id = products.id), 0),
      rating_count = (SELECT COUNT(*) FROM reviews r WHERE r.product_id = products.id)`);

    // wishlist for the demo customer
    const insertWish = db.prepare('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)');
    for (const id of [7, 14, 23]) insertWish.run(customerIds[0], id);

    // a couple of contact messages for the admin inbox
    const insertMsg = db.prepare('INSERT INTO contact_messages (name, email, subject, message, created_at) VALUES (?, ?, ?, ?, ?)');
    insertMsg.run('Sara Iqbal', 'sara.iqbal@example.com', 'Bulk order', 'Hello, do you give a discount if I buy 10 dinner sets for a wedding gift?', toSql(ago(3)));
    insertMsg.run('Guest Visitor', 'guest@example.com', 'Store timing', 'What time do you open on Fridays?', toSql(ago(1)));
  });

  run();

  const n = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
  console.log(`Done: ${n('categories')} categories, ${n('products')} products, ${n('users')} users, ${n('orders')} orders, ${n('discounts')} discount codes.`);
  console.log('\nDemo logins');
  console.log(`  Admin    ${ADMIN.email} / ${ADMIN.password}   (log in at /admin/login)`);
  console.log(`  Customer ${CUSTOMERS[0][1]} / ${CUSTOMER_PASSWORD}`);
}

seed();
