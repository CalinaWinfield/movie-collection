const express = require('express');
const router = express.Router();
const { dbHelper } = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/loans - list all loans for user (active & history)
router.get('/', requireAuth, (req, res) => {
  const { active_only } = req.query;

  let query = `
    SELECT l.*,
      i.title as item_title, i.category as item_category, i.poster_url as item_poster,
      e.format as edition_format, e.edition_name
    FROM loans l
    JOIN items i ON l.item_id = i.id
    LEFT JOIN editions e ON l.edition_id = e.id
    WHERE l.user_id = ?
  `;
  const params = [req.userId];

  if (active_only === 'true' || active_only === '1') {
    query += ` AND l.is_returned = 0`;
  }

  query += ` ORDER BY l.is_returned ASC, l.loan_date DESC`;

  const loans = dbHelper.query(query, params);
  res.json({ loans });
});

// POST /api/loans - record a new loan
router.post('/', requireAuth, (req, res) => {
  const { item_id, edition_id, borrower_name, borrower_contact, loan_date, due_date, notes } = req.body;

  if (!item_id || !borrower_name) {
    return res.status(400).json({ error: 'Item ID and borrower name are required' });
  }

  // Ensure item belongs to user
  const item = dbHelper.get('SELECT id FROM items WHERE id = ? AND user_id = ?', [item_id, req.userId]);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const today = new Date().toISOString().split('T')[0];

  const { lastInsertRowid: loanId } = dbHelper.run(
    `INSERT INTO loans (
      user_id, item_id, edition_id, borrower_name, borrower_contact,
      loan_date, due_date, notes, is_returned
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      req.userId,
      item_id,
      edition_id ? parseInt(edition_id, 10) : null,
      borrower_name.trim(),
      borrower_contact?.trim() || null,
      loan_date || today,
      due_date || null,
      notes?.trim() || null
    ]
  );

  const newLoan = dbHelper.get(
    `SELECT l.*, i.title as item_title, i.poster_url as item_poster
     FROM loans l
     JOIN items i ON l.item_id = i.id
     WHERE l.id = ?`,
    [loanId]
  );

  res.status(201).json({ loan: newLoan });
});

// PUT /api/loans/:id/return - mark as returned
router.put('/:id/return', requireAuth, (req, res) => {
  const loan = dbHelper.get('SELECT * FROM loans WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  if (!loan) {
    return res.status(404).json({ error: 'Loan record not found' });
  }

  const today = new Date().toISOString().split('T')[0];
  dbHelper.run(
    `UPDATE loans SET is_returned = 1, returned_date = ? WHERE id = ?`,
    [today, req.params.id]
  );

  const updated = dbHelper.get('SELECT * FROM loans WHERE id = ?', [req.params.id]);
  res.json({ loan: updated });
});

// DELETE /api/loans/:id - remove loan record
router.delete('/:id', requireAuth, (req, res) => {
  const loan = dbHelper.get('SELECT id FROM loans WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  if (!loan) {
    return res.status(404).json({ error: 'Loan record not found' });
  }

  dbHelper.run('DELETE FROM loans WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
