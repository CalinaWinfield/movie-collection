const express = require('express');
const router = express.Router();
const { dbHelper } = require('../db');

// GET /api/public/user/:username
router.get('/user/:username', (req, res) => {
  const username = req.params.username.toLowerCase();
  const user = dbHelper.get(
    'SELECT id, username, display_name, bio, created_at FROM users WHERE username = ? AND is_public = 1',
    [username]
  );

  if (!user) {
    return res.status(404).json({ error: 'Collector profile not found or is set to private' });
  }

  const shelves = dbHelper.query(
    `SELECT s.*, (SELECT COUNT(*) FROM items WHERE shelf_id = s.id) as item_count
     FROM shelves s
     WHERE s.user_id = ?
     ORDER BY s.sort_order ASC`,
    [user.id]
  );

  const items = dbHelper.query(
    `SELECT i.*, s.name as shelf_name, s.color as shelf_color,
      (SELECT format FROM editions WHERE item_id = i.id ORDER BY id ASC LIMIT 1) as primary_format,
      (SELECT packaging FROM editions WHERE item_id = i.id ORDER BY id ASC LIMIT 1) as primary_packaging
     FROM items i
     LEFT JOIN shelves s ON i.shelf_id = s.id
     WHERE i.user_id = ?
     ORDER BY i.id DESC`,
    [user.id]
  );

  res.json({
    user,
    shelves,
    items
  });
});

module.exports = router;
