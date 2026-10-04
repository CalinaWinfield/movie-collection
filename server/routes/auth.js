const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbHelper } = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, email, password, display_name } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  // Check if exists
  const existing = dbHelper.get(
    'SELECT id FROM users WHERE username = ? OR email = ?',
    [cleanUsername, cleanEmail]
  );
  if (existing) {
    return res.status(409).json({ error: 'Username or email already in use' });
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);

  const { lastInsertRowid: newUserId } = dbHelper.run(
    `INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)`,
    [cleanUsername, cleanEmail, password_hash, display_name?.trim() || cleanUsername]
  );

  // Create default starter shelves for the user
  const defaultShelves = [
    { name: 'Favorites', icon: 'heart', color: '#ef4444' },
    { name: '4K Steelbooks', icon: 'disc', color: '#f59e0b' },
    { name: 'Criterion Collection', icon: 'film', color: '#6366f1' },
    { name: 'Watchlist / Backlog', icon: 'clock', color: '#10b981' },
  ];

  for (const s of defaultShelves) {
    dbHelper.run(
      `INSERT INTO shelves (user_id, name, icon, color) VALUES (?, ?, ?, ?)`,
      [newUserId, s.name, s.icon, s.color]
    );
  }

  const user = dbHelper.get(
    'SELECT id, username, email, display_name, bio, is_public, created_at FROM users WHERE id = ?',
    [newUserId]
  );

  const token = generateToken(user);
  res.json({ token, user });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { login, password } = req.body; // login can be username or email

  if (!login || !password) {
    return res.status(400).json({ error: 'Username/email and password are required' });
  }

  const cleanLogin = login.trim().toLowerCase();
  const user = dbHelper.get(
    'SELECT * FROM users WHERE username = ? OR email = ?',
    [cleanLogin, cleanLogin]
  );

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username/email or password' });
  }

  const userPublic = {
    id: user.id,
    username: user.username,
    email: user.email,
    display_name: user.display_name,
    bio: user.bio,
    is_public: user.is_public,
    created_at: user.created_at
  };

  const token = generateToken(userPublic);
  res.json({ token, user: userPublic });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = dbHelper.get(
    'SELECT id, username, email, display_name, bio, is_public, created_at FROM users WHERE id = ?',
    [req.userId]
  );
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Get quick stats
  const itemsCount = dbHelper.get('SELECT COUNT(*) as count FROM items WHERE user_id = ?', [user.id])?.count || 0;
  const shelvesCount = dbHelper.get('SELECT COUNT(*) as count FROM shelves WHERE user_id = ?', [user.id])?.count || 0;

  res.json({ user, stats: { itemsCount, shelvesCount } });
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, (req, res) => {
  const { display_name, bio, is_public } = req.body;
  dbHelper.run(
    `UPDATE users SET display_name = ?, bio = ?, is_public = ? WHERE id = ?`,
    [display_name, bio, is_public ? 1 : 0, req.userId]
  );

  const user = dbHelper.get(
    'SELECT id, username, email, display_name, bio, is_public, created_at FROM users WHERE id = ?',
    [req.userId]
  );
  res.json({ user });
});

module.exports = router;
