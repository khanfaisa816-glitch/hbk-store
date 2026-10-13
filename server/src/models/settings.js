const db = require('../db');

// Used when the settings table has no value for a key
const DEFAULTS = {
  name: 'HBK',
  tagline: 'Everything you need, under one roof',
  address: '',
  city: '',
  phone: '',
  whatsapp: '',
  email: '',
  hours: [],
  currency: 'Rs',
  freeShippingMin: 3000,
  shippingFee: 250,
  mapQuery: '',
};

function getSettings() {
  const out = { ...DEFAULTS };
  for (const row of db.prepare('SELECT key, value FROM settings').all()) {
    try {
      out[row.key] = JSON.parse(row.value);
    } catch {
      out[row.key] = row.value;
    }
  }
  return out;
}

module.exports = { getSettings };
