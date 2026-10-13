const slugify = (text) =>
  String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';

// Makes a slug that is not used yet in `table` (adds -2, -3 ... if needed).
function uniqueSlug(db, table, name, ignoreId = null) {
  const base = slugify(name);
  const stmt = db.prepare(`SELECT id FROM ${table} WHERE slug = ? AND id IS NOT ?`);
  let slug = base;
  let i = 2;
  while (stmt.get(slug, ignoreId)) slug = `${base}-${i++}`;
  return slug;
}

// SQLite dates ("2026-10-07 12:00:00", UTC) -> ISO strings the browser understands.
const iso = (s) => (s ? (s.includes('T') ? s : `${s.replace(' ', 'T')}Z`) : null);

// Date -> SQLite date text (UTC)
const toSql = (d = new Date()) => d.toISOString().slice(0, 19).replace('T', ' ');

// Luhn check: used to validate the (fake) card number format.
function luhnValid(num) {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = Number(num[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

module.exports = { slugify, uniqueSlug, iso, toSql, luhnValid };
