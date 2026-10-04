const express = require('express');
const router = express.Router();
const { dbHelper } = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/shelves - get all user shelves with item counts
router.get('/', requireAuth, (req, res) => {
  const shelves = dbHelper.query(
    `SELECT s.*, 
      (SELECT COUNT(*) FROM items WHERE shelf_id = s.id AND user_id = s.user_id) as item_count,
      (SELECT poster_url FROM items WHERE shelf_id = s.id AND user_id = s.user_id AND poster_url IS NOT NULL ORDER BY id DESC LIMIT 4) as preview_posters
     FROM shelves s
     WHERE s.user_id = ?
     ORDER BY s.sort_order ASC, s.id ASC`,
    [req.userId]
  );

  res.json({ shelves });
});

// POST /api/shelves - create shelf
router.post('/', requireAuth, (req, res) => {
  const { name, description, icon = 'film', color = '#f59e0b' } = req.body;

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
  const { name, description, icon, color, sort_order } = req.body;
  const shelf = dbHelper.get('SELECT id FROM shelves WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);

  if (!shelf) {
    return res.status(404).json({ error: 'Shelf not found' });
  }

  dbHelper.run(
    `UPDATE shelves SET
      name = COALESCE(?, name),
      description = ?,
      icon = COALESCE(?, icon),
      color = COALESCE(?, color),
      sort_order = COALESCE(?, sort_order)
    WHERE id = ?`,
    [name?.trim(), description?.trim() || null, icon, color, sort_order, req.params.id]
  );

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
