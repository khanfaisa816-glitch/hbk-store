// Database connection (SQLite).
// Uses the SQLite that is built into Node.js (node:sqlite), so there is nothing to compile
// and no Python or C++ build tools are needed. Requires Node.js 22.13 or newer.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const { schemaSql } = require('./schema');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'hbk.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const raw = new DatabaseSync(dbPath);

// A tiny wrapper so the rest of the code can use: db.prepare(), db.exec(), db.pragma(), db.transaction()
const db = {
  prepare: (sql) => raw.prepare(sql),
  exec: (sql) => raw.exec(sql),
  pragma: (setting) => raw.exec(`PRAGMA ${setting}`),
  // Runs fn inside a transaction. If fn throws, every change is rolled back.
  transaction: (fn) => (...args) => {
    raw.exec('BEGIN');
    try {
      const result = fn(...args);
      raw.exec('COMMIT');
      return result;
    } catch (err) {
      raw.exec('ROLLBACK');
      throw err;
    }
  },
};

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(schemaSql); // creates tables if they do not exist yet

module.exports = db;
