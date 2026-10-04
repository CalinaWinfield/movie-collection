const express = require('express');
const router = express.Router();
const { dbHelper } = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/items - list items with filters
router.get('/', requireAuth, (req, res) => {
  const userId = req.userId;
  const { category, shelf_id, format, status, search, sort } = req.query;

  let query = `
    SELECT i.*, 
      s.name as shelf_name, s.color as shelf_color,
      (SELECT COUNT(*) FROM editions WHERE item_id = i.id) as edition_count,
      (SELECT format FROM editions WHERE item_id = i.id ORDER BY id ASC LIMIT 1) as primary_format,
      (SELECT packaging FROM editions WHERE item_id = i.id ORDER BY id ASC LIMIT 1) as primary_packaging,
      (SELECT slipcover FROM editions WHERE item_id = i.id ORDER BY id ASC LIMIT 1) as primary_slipcover
    FROM items i
    LEFT JOIN shelves s ON i.shelf_id = s.id
    WHERE i.user_id = ?
  `;
  const params = [userId];

  if (category && category !== 'all') {
    query += ` AND i.category = ?`;
    params.push(category);
  }

  if (shelf_id) {
    query += ` AND i.shelf_id = ?`;
    params.push(shelf_id);
  }

  if (status && status !== 'all') {
    query += ` AND i.status = ?`;
    params.push(status);
  }

  if (format && format !== 'all') {
    query += ` AND EXISTS (SELECT 1 FROM editions e WHERE e.item_id = i.id AND (e.format = ? OR e.packaging = ?))`;
    params.push(format, format);
  }

  if (search && search.trim() !== '') {
    const term = `%${search.trim().toLowerCase()}%`;
    query += ` AND (
      LOWER(i.title) LIKE ? 
      OR LOWER(COALESCE(i.creator, '')) LIKE ? 
      OR LOWER(COALESCE(i.synopsis, '')) LIKE ? 
      OR LOWER(COALESCE(i.tags, '')) LIKE ?
      OR LOWER(COALESCE(i.barcode, '')) LIKE ?
      OR EXISTS (SELECT 1 FROM editions e WHERE e.item_id = i.id AND (LOWER(e.format) LIKE ? OR LOWER(COALESCE(e.edition_name, '')) LIKE ?))
    )`;
    params.push(term, term, term, term, term, term, term);
  }

  // Sorting
  switch (sort) {
    case 'title_asc':
      query += ` ORDER BY LOWER(i.title) ASC`;
      break;
    case 'title_desc':
      query += ` ORDER BY LOWER(i.title) DESC`;
      break;
    case 'year_desc':
      query += ` ORDER BY i.release_year DESC NULLS LAST, i.id DESC`;
      break;
    case 'year_asc':
      query += ` ORDER BY i.release_year ASC NULLS LAST, i.id ASC`;
      break;
    case 'rating_desc':
      query += ` ORDER BY i.rating DESC, i.id DESC`;
      break;
    case 'recent':
    default:
      query += ` ORDER BY i.id DESC`;
      break;
  }

  const items = dbHelper.query(query, params);

  // Fetch all editions for these items to attach them
  const itemIds = items.map(item => item.id);
  let editionsByItem = {};
  if (itemIds.length > 0) {
    const placeholders = itemIds.map(() => '?').join(',');
    const allEditions = dbHelper.query(
      `SELECT * FROM editions WHERE item_id IN (${placeholders}) ORDER BY id ASC`,
      itemIds
    );
    for (const ed of allEditions) {
      if (!editionsByItem[ed.item_id]) editionsByItem[ed.item_id] = [];
      editionsByItem[ed.item_id].push(ed);
    }
  }

  const result = items.map(item => ({
    ...item,
    genres: item.genres ? tryParseJson(item.genres) : [],
    tags: item.tags ? tryParseJson(item.tags) : [],
    editions: editionsByItem[item.id] || []
  }));

  res.json({ items: result });
});

// GET /api/items/:id - single item details with all editions & loans
router.get('/:id', requireAuth, (req, res) => {
  const item = dbHelper.get(
    `SELECT i.*, s.name as shelf_name, s.color as shelf_color
     FROM items i
     LEFT JOIN shelves s ON i.shelf_id = s.id
     WHERE i.id = ? AND i.user_id = ?`,
    [req.params.id, req.userId]
  );

  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const editions = dbHelper.query(
    `SELECT * FROM editions WHERE item_id = ? ORDER BY id ASC`,
    [item.id]
  );

  res.json({
    item: {
      ...item,
      genres: item.genres ? tryParseJson(item.genres) : [],
      tags: item.tags ? tryParseJson(item.tags) : [],
      editions
    }
  });
});

// POST /api/items - create new item
router.post('/', requireAuth, (req, res) => {
  const {
    category,
    title,
    original_title,
    release_year,
    creator,
    genres,
    runtime,
    synopsis,
    poster_url,
    backdrop_url,
    status = 'owned',
    rating = 0,
    user_notes,
    tags,
    shelf_id,
    barcode,
    is_favorite = 0,
    edition // initial edition details if provided
  } = req.body;

  if (!category || !title) {
    return res.status(400).json({ error: 'Category and title are required' });
  }

  const genresStr = Array.isArray(genres) ? JSON.stringify(genres) : (genres || '');
  const tagsStr = Array.isArray(tags) ? JSON.stringify(tags) : (tags || '');

  const { lastInsertRowid: itemId } = dbHelper.run(
    `INSERT INTO items (
      user_id, category, title, original_title, release_year, creator,
      genres, runtime, synopsis, poster_url, backdrop_url,
      status, rating, user_notes, tags, shelf_id, barcode, is_favorite
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.userId,
      category,
      title.trim(),
      original_title?.trim() || null,
      release_year ? parseInt(release_year, 10) : null,
      creator?.trim() || null,
      genresStr,
      runtime?.trim() || null,
      synopsis?.trim() || null,
      poster_url?.trim() || null,
      backdrop_url?.trim() || null,
      status,
      parseFloat(rating) || 0,
      user_notes?.trim() || null,
      tagsStr,
      shelf_id ? parseInt(shelf_id, 10) : null,
      barcode?.trim() || null,
      is_favorite ? 1 : 0
    ]
  );

  // Add initial edition if specified or sensible default based on category
  const defaultFormat = category === 'game' ? 'Nintendo Switch' : (category === 'tv' ? 'Blu-ray' : '4K UHD');
  const editionFormat = edition?.format || defaultFormat;

  dbHelper.run(
    `INSERT INTO editions (
      item_id, format, edition_name, packaging, slipcover, disc_count,
      region, condition, purchase_price, purchase_date, retailer,
      storage_location, barcode, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      itemId,
      editionFormat,
      edition?.edition_name || 'Standard Edition',
      edition?.packaging || 'Standard Case',
      edition?.slipcover ? 1 : 0,
      edition?.disc_count ? parseInt(edition?.disc_count, 10) : 1,
      edition?.region || 'Region Free',
      edition?.condition || 'Mint',
      edition?.purchase_price ? parseFloat(edition?.purchase_price) : 0.0,
      edition?.purchase_date || null,
      edition?.retailer || null,
      edition?.storage_location || null,
      edition?.barcode || barcode || null,
      edition?.notes || null
    ]
  );

  // Fetch and return the created item
  const item = dbHelper.get('SELECT * FROM items WHERE id = ?', [itemId]);
  const editions = dbHelper.query('SELECT * FROM editions WHERE item_id = ?', [itemId]);

  res.status(201).json({
    item: {
      ...item,
      genres: item.genres ? tryParseJson(item.genres) : [],
      tags: item.tags ? tryParseJson(item.tags) : [],
      editions
    }
  });
});

// PUT /api/items/:id - update item
router.put('/:id', requireAuth, (req, res) => {
  const itemId = req.params.id;
  const existing = dbHelper.get('SELECT id FROM items WHERE id = ? AND user_id = ?', [itemId, req.userId]);
  if (!existing) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const {
    category,
    title,
    original_title,
    release_year,
    creator,
    genres,
    runtime,
    synopsis,
    poster_url,
    backdrop_url,
    status,
    rating,
    user_notes,
    tags,
    shelf_id,
    barcode,
    is_favorite
  } = req.body;

  const genresStr = Array.isArray(genres) ? JSON.stringify(genres) : (genres || '');
  const tagsStr = Array.isArray(tags) ? JSON.stringify(tags) : (tags || '');

  dbHelper.run(
    `UPDATE items SET
      category = COALESCE(?, category),
      title = COALESCE(?, title),
      original_title = ?,
      release_year = ?,
      creator = ?,
      genres = ?,
      runtime = ?,
      synopsis = ?,
      poster_url = ?,
      backdrop_url = ?,
      status = COALESCE(?, status),
      rating = COALESCE(?, rating),
      user_notes = ?,
      tags = ?,
      shelf_id = ?,
      barcode = ?,
      is_favorite = COALESCE(?, is_favorite),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?`,
    [
      category,
      title?.trim(),
      original_title?.trim() || null,
      release_year ? parseInt(release_year, 10) : null,
      creator?.trim() || null,
      genresStr,
      runtime?.trim() || null,
      synopsis?.trim() || null,
      poster_url?.trim() || null,
      backdrop_url?.trim() || null,
      status,
      rating !== undefined ? parseFloat(rating) : undefined,
      user_notes?.trim() || null,
      tagsStr,
      shelf_id !== undefined ? (shelf_id ? parseInt(shelf_id, 10) : null) : undefined,
      barcode?.trim() || null,
      is_favorite !== undefined ? (is_favorite ? 1 : 0) : undefined,
      itemId,
      req.userId
    ]
  );

  const updated = dbHelper.get('SELECT * FROM items WHERE id = ?', [itemId]);
  const editions = dbHelper.query('SELECT * FROM editions WHERE item_id = ?', [itemId]);

  res.json({
    item: {
      ...updated,
      genres: updated.genres ? tryParseJson(updated.genres) : [],
      tags: updated.tags ? tryParseJson(updated.tags) : [],
      editions
    }
  });
});

// DELETE /api/items/:id - delete item
router.delete('/:id', requireAuth, (req, res) => {
  const existing = dbHelper.get('SELECT id FROM items WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  if (!existing) {
    return res.status(404).json({ error: 'Item not found' });
  }

  dbHelper.run('DELETE FROM items WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Item deleted successfully' });
});

// POST /api/items/:id/editions - add a new edition to an item
router.post('/:id/editions', requireAuth, (req, res) => {
  const itemId = req.params.id;
  const item = dbHelper.get('SELECT id FROM items WHERE id = ? AND user_id = ?', [itemId, req.userId]);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const {
    format,
    edition_name,
    packaging,
    slipcover,
    disc_count,
    region,
    condition,
    purchase_price,
    purchase_date,
    retailer,
    storage_location,
    barcode,
    notes
  } = req.body;

  if (!format) {
    return res.status(400).json({ error: 'Format is required' });
  }

  const { lastInsertRowid: editionId } = dbHelper.run(
    `INSERT INTO editions (
      item_id, format, edition_name, packaging, slipcover, disc_count,
      region, condition, purchase_price, purchase_date, retailer,
      storage_location, barcode, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      itemId,
      format,
      edition_name?.trim() || 'Standard Edition',
      packaging?.trim() || 'Standard Case',
      slipcover ? 1 : 0,
      disc_count ? parseInt(disc_count, 10) : 1,
      region || 'Region Free',
      condition || 'Mint',
      purchase_price ? parseFloat(purchase_price) : 0.0,
      purchase_date || null,
      retailer?.trim() || null,
      storage_location?.trim() || null,
      barcode?.trim() || null,
      notes?.trim() || null
    ]
  );

  const newEdition = dbHelper.get('SELECT * FROM editions WHERE id = ?', [editionId]);
  res.status(201).json({ edition: newEdition });
});

// PUT /api/items/editions/:editionId - update an edition
router.put('/editions/:editionId', requireAuth, (req, res) => {
  const editionId = req.params.editionId;
  const edition = dbHelper.get(
    `SELECT e.* FROM editions e
     JOIN items i ON e.item_id = i.id
     WHERE e.id = ? AND i.user_id = ?`,
    [editionId, req.userId]
  );

  if (!edition) {
    return res.status(404).json({ error: 'Edition not found' });
  }

  const {
    format,
    edition_name,
    packaging,
    slipcover,
    disc_count,
    region,
    condition,
    purchase_price,
    purchase_date,
    retailer,
    storage_location,
    barcode,
    notes
  } = req.body;

  dbHelper.run(
    `UPDATE editions SET
      format = COALESCE(?, format),
      edition_name = COALESCE(?, edition_name),
      packaging = COALESCE(?, packaging),
      slipcover = COALESCE(?, slipcover),
      disc_count = COALESCE(?, disc_count),
      region = COALESCE(?, region),
      condition = COALESCE(?, condition),
      purchase_price = COALESCE(?, purchase_price),
      purchase_date = ?,
      retailer = ?,
      storage_location = ?,
      barcode = ?,
      notes = ?
    WHERE id = ?`,
    [
      format,
      edition_name,
      packaging,
      slipcover !== undefined ? (slipcover ? 1 : 0) : undefined,
      disc_count !== undefined ? parseInt(disc_count, 10) : undefined,
      region,
      condition,
      purchase_price !== undefined ? parseFloat(purchase_price) : undefined,
      purchase_date || null,
      retailer || null,
      storage_location || null,
      barcode || null,
      notes || null,
      editionId
    ]
  );

  const updated = dbHelper.get('SELECT * FROM editions WHERE id = ?', [editionId]);
  res.json({ edition: updated });
});

// DELETE /api/items/editions/:editionId - delete an edition
router.delete('/editions/:editionId', requireAuth, (req, res) => {
  const editionId = req.params.editionId;
  const edition = dbHelper.get(
    `SELECT e.* FROM editions e
     JOIN items i ON e.item_id = i.id
     WHERE e.id = ? AND i.user_id = ?`,
    [editionId, req.userId]
  );

  if (!edition) {
    return res.status(404).json({ error: 'Edition not found' });
  }

  dbHelper.run('DELETE FROM editions WHERE id = ?', [editionId]);
  res.json({ success: true });
});

// POST /api/items/:id/toggle-favorite
router.post('/:id/toggle-favorite', requireAuth, (req, res) => {
  const item = dbHelper.get('SELECT id, is_favorite FROM items WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const nextVal = item.is_favorite ? 0 : 1;
  dbHelper.run('UPDATE items SET is_favorite = ? WHERE id = ?', [nextVal, item.id]);
  res.json({ is_favorite: nextVal });
});

function tryParseJson(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str.split(',').map(s => s.trim()).filter(Boolean);
  }
}

module.exports = router;
