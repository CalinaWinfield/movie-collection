const express = require('express');
const router = express.Router();
const { dbHelper } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// GET /api/shelves - get all user shelves with item counts
router.get('/', optionalAuth, (req, res) => {
  let userId = req.userId;
  if (!userId) {
    const demo = dbHelper.get("SELECT id FROM users WHERE username = 'cinephile' LIMIT 1") || dbHelper.get("SELECT id FROM users ORDER BY id ASC LIMIT 1");
    userId = demo ? demo.id : null;
  }
  if (!userId) {
    return res.json({ shelves: [] });
  }

  const shelves = dbHelper.query(
    `SELECT s.*, 
      (SELECT COUNT(*) FROM items WHERE shelf_id = s.id AND user_id = s.user_id) as item_count,
      (SELECT poster_url FROM items WHERE shelf_id = s.id AND user_id = s.user_id AND poster_url IS NOT NULL ORDER BY id DESC LIMIT 4) as preview_posters
     FROM shelves s
     WHERE s.user_id = ?
     ORDER BY s.sort_order ASC, s.id ASC`,
    [userId]
  );

  res.json({ shelves });
});

// POST /api/shelves - create shelf
router.post('/', requireAuth, (req, res) => {
  const { name, description, icon = 'film', color = '#2d6a4f' } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Shelf name is required' });
  }

  const { lastInsertRowid: shelfId } = dbHelper.run(
    `INSERT INTO shelves (user_id, name, description, icon, color) VALUES (?, ?, ?, ?, ?)`,
    [req.userId, name.trim(), description?.trim() || null, icon, color]
  );

  const shelf = dbHelper.get('SELECT *, 0 as item_count FROM shelves WHERE id = ?', [shelfId]);
  res.status(201).json({ shelf });
});

// PUT /api/shelves/:id - update shelf
router.put('/:id', requireAuth, (req, res) => {
  const shelf = dbHelper.get('SELECT * FROM shelves WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);

  if (!shelf) {
    return res.status(404).json({ error: 'Shelf not found' });
  }

  const updates = [];
  const params = [];
  const allowed = ['name', 'description', 'icon', 'color', 'sort_order'];

  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      let val = req.body[field];
      if (field === 'sort_order') val = parseInt(val, 10) || 0;
      else if (typeof val === 'string') val = val.trim() || null;
      params.push(val === undefined ? null : val);
    }
  }

  if (updates.length > 0) {
    params.push(req.params.id);
    dbHelper.run(
      `UPDATE shelves SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
  }

  const updated = dbHelper.get('SELECT * FROM shelves WHERE id = ?', [req.params.id]);
  res.json({ shelf: updated });
});

// DELETE /api/shelves/:id - delete shelf
router.delete('/:id', requireAuth, (req, res) => {
  const shelf = dbHelper.get('SELECT id FROM shelves WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  if (!shelf) {
    return res.status(404).json({ error: 'Shelf not found' });
  }

  // Unlink items first (FOREIGN KEY SET NULL handles it, but let's be explicit)
  dbHelper.run('UPDATE items SET shelf_id = NULL WHERE shelf_id = ?', [req.params.id]);
  dbHelper.run('DELETE FROM shelves WHERE id = ?', [req.params.id]);

  res.json({ success: true, message: 'Shelf removed' });
});

module.exports = router;
