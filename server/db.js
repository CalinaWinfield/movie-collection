const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'collection.db');

let db = null;
let SQL = null;

async function initDb() {
  if (db) return db;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables and schema
  createSchema();
  saveDb();
  return db;
}

function saveDb() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

function createSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      bio TEXT,
      is_public INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shelves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT 'film',
      color TEXT DEFAULT '#f59e0b',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('movie', 'tv', 'game')),
      title TEXT NOT NULL,
      original_title TEXT,
      release_year INTEGER,
      creator TEXT, -- Director for movies, Creator/Network for TV, Developer/Publisher for games
      genres TEXT,  -- JSON string array or comma-separated
      runtime TEXT, -- e.g. "148 min", "5 Seasons", "45 hrs"
      synopsis TEXT,
      poster_url TEXT,
      backdrop_url TEXT,
      status TEXT NOT NULL DEFAULT 'owned' CHECK(status IN ('owned', 'wishlist', 'in_progress', 'completed', 'dropped')),
      rating REAL DEFAULT 0, -- 0 to 10 rating
      user_notes TEXT,
      tags TEXT, -- JSON array of tags
      shelf_id INTEGER,
      barcode TEXT,
      is_favorite INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (shelf_id) REFERENCES shelves(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS editions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      format TEXT NOT NULL, -- '4K UHD', 'Blu-ray', 'DVD', 'Steelbook', 'Criterion', 'VHS', 'LaserDisc', 'Nintendo Switch', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X', 'PC Steam', 'Digital'
      edition_name TEXT,    -- 'Collector’s Edition', 'Standard', 'Limited Run #42', etc.
      packaging TEXT,       -- 'Steelbook', 'Digibook', 'Slipcover', 'Standard Case', 'Box Set', etc.
      slipcover INTEGER DEFAULT 0,
      disc_count INTEGER DEFAULT 1,
      region TEXT DEFAULT 'Region Free',
      condition TEXT DEFAULT 'Mint', -- 'New/Sealed', 'Mint', 'Very Good', 'Good', 'Fair'
      purchase_price REAL DEFAULT 0.0,
      purchase_date TEXT,
      retailer TEXT,
      storage_location TEXT, -- 'Living Room Shelf A', 'Display Cabinet'
      barcode TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      edition_id INTEGER,
      borrower_name TEXT NOT NULL,
      borrower_contact TEXT,
      loan_date TEXT NOT NULL,
      due_date TEXT,
      returned_date TEXT,
      is_returned INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY (edition_id) REFERENCES editions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_items_user_cat ON items(user_id, category);
    CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
    CREATE INDEX IF NOT EXISTS idx_editions_item ON editions(item_id);
    CREATE INDEX IF NOT EXISTS idx_loans_user ON loans(user_id, is_returned);
  `);
}

// Helper wrapper to execute queries like a traditional SQLite driver
const dbHelper = {
  async getDb() {
    if (!db) await initDb();
    return db;
  },

  query(sql, params = []) {
    if (!db) throw new Error('Database not initialized');
    const cleanParams = Array.isArray(params)
      ? params.map(val => (val === undefined ? null : val))
      : params;
    const stmt = db.prepare(sql);
    try {
      stmt.bind(cleanParams);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      return rows;
    } finally {
      stmt.free();
    }
  },

  get(sql, params = []) {
    const rows = this.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  },

  run(sql, params = []) {
    if (!db) throw new Error('Database not initialized');
    const cleanParams = Array.isArray(params)
      ? params.map(val => (val === undefined ? null : val))
      : params;
    const stmt = db.prepare(sql);
    try {
      stmt.bind(cleanParams);
      stmt.step();
      
      // Get last insert row id and changes
      const idRes = db.exec("SELECT last_insert_rowid() AS id, changes() AS changes");
      const lastInsertRowid = idRes[0]?.values[0]?.[0] || 0;
      const changes = idRes[0]?.values[0]?.[1] || 0;
      
      saveDb();
      return { lastInsertRowid, changes };
    } finally {
      stmt.free();
    }
  },

  exec(sql) {
    if (!db) throw new Error('Database not initialized');
    db.run(sql);
    saveDb();
  },

  save() {
    saveDb();
  }
};

module.exports = { initDb, dbHelper };
