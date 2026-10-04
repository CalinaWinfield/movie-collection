const express = require('express');
const router = express.Router();
const { dbHelper } = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/items - list items with filters
router.get('/', requireAuth, (req, res) => {
  const userId = req.userId;
  const { category, shelf_id, format, status, ownership_status, progress_status, search, sort } = req.query;

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

  if (ownership_status && ownership_status !== 'all') {
    query += ` AND i.ownership_status = ?`;
    params.push(ownership_status);
  }

  if (progress_status && progress_status !== 'all') {
    query += ` AND i.progress_status = ?`;
    params.push(progress_status);
  }

  if (status && status !== 'all') {
    if (['owned', 'borrowed', 'wishlist'].includes(status)) {
      query += ` AND i.ownership_status = ?`;
      params.push(status);
    } else if (['in_progress', 'completed', 'not_started'].includes(status)) {
      query += ` AND i.progress_status = ?`;
      params.push(status);
    } else {
      query += ` AND i.status = ?`;
      params.push(status);
    }
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
    ownership_status,
    progress_status,
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

  const resolvedOwnership = ownership_status || (status === 'borrowed' ? 'borrowed' : (status === 'wishlist' ? 'wishlist' : 'owned'));
  const resolvedProgress = progress_status || (status === 'in_progress' ? 'in_progress' : (status === 'completed' ? 'completed' : 'not_started'));
  const legacyStatus = resolvedOwnership === 'wishlist' ? 'wishlist' : (resolvedProgress === 'completed' ? 'completed' : (resolvedProgress === 'in_progress' ? 'in_progress' : 'owned'));

  const { lastInsertRowid: itemId } = dbHelper.run(
    `INSERT INTO items (
      user_id, category, title, original_title, release_year, creator,
      genres, runtime, synopsis, poster_url, backdrop_url,
      status, ownership_status, progress_status, rating, user_notes, tags, shelf_id, barcode, is_favorite
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      legacyStatus,
      resolvedOwnership,
      resolvedProgress,
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
  const existing = dbHelper.get('SELECT * FROM items WHERE id = ? AND user_id = ?', [itemId, req.userId]);
  if (!existing) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const updates = [];
  const params = [];

  const allowedFields = [
    'category', 'title', 'original_title', 'release_year', 'creator',
    'genres', 'runtime', 'synopsis', 'poster_url', 'backdrop_url',
    'status', 'ownership_status', 'progress_status', 'rating', 'user_notes', 'tags', 'shelf_id', 'barcode', 'is_favorite'
  ];

  const body = { ...req.body };
  if (body.status !== undefined) {
    if (['owned', 'borrowed', 'wishlist'].includes(body.status)) {
      body.ownership_status = body.status;
    } else if (['in_progress', 'completed', 'not_started'].includes(body.status)) {
      body.progress_status = body.status;
    }
  }

  // Keep legacy status column in sync with valid enum values ('owned', 'wishlist', 'in_progress', 'completed')
  if (body.ownership_status !== undefined || body.progress_status !== undefined) {
    const effOwnership = body.ownership_status !== undefined ? body.ownership_status : existing.ownership_status;
    const effProgress = body.progress_status !== undefined ? body.progress_status : existing.progress_status;
    if (effOwnership === 'wishlist') {
      body.status = 'wishlist';
    } else if (effProgress === 'completed') {
      body.status = 'completed';
    } else if (effProgress === 'in_progress') {
      body.status = 'in_progress';
    } else {
      body.status = 'owned';
    }
  }

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);
      let val = body[field];
      if (field === 'title') val = typeof val === 'string' ? (val.trim() || existing.title) : existing.title;
      else if (field === 'category') val = typeof val === 'string' ? (val.trim() || existing.category) : existing.category;
      else if (field === 'release_year') val = val ? parseInt(val, 10) : null;
      else if (field === 'rating') val = val !== null && val !== '' ? parseFloat(val) : 0;
      else if (field === 'shelf_id') val = val ? parseInt(val, 10) : null;
      else if (field === 'is_favorite') val = val ? 1 : 0;
      else if (field === 'genres') val = Array.isArray(val) ? JSON.stringify(val) : (typeof val === 'string' ? val : null);
      else if (field === 'tags') val = Array.isArray(val) ? JSON.stringify(val) : (typeof val === 'string' ? val : null);
      else if (typeof val === 'string') val = val.trim() || null;
      params.push(val === undefined ? null : val);
    }
  }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(itemId, req.userId);
    dbHelper.run(
      `UPDATE items SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );
  }

  // Update edition details if provided in payload
  if (body.edition) {
    const ed = body.edition;
    let targetEditionId = ed.id;
    if (!targetEditionId) {
      const firstEd = dbHelper.get('SELECT id FROM editions WHERE item_id = ? ORDER BY id ASC LIMIT 1', [itemId]);
      targetEditionId = firstEd ? firstEd.id : null;
    }

    if (targetEditionId) {
      const edUpdates = [];
      const edParams = [];
      const edFields = [
        'format', 'edition_name', 'packaging', 'slipcover', 'disc_count',
        'region', 'condition', 'purchase_price', 'purchase_date', 'retailer',
        'storage_location', 'barcode', 'notes'
      ];
      for (const f of edFields) {
        if (ed[f] !== undefined) {
          edUpdates.push(`${f} = ?`);
          let val = ed[f];
          if (f === 'slipcover') val = val ? 1 : 0;
          else if (f === 'purchase_price') val = parseFloat(val) || 0.0;
          else if (f === 'disc_count') val = parseInt(val, 10) || 1;
          else if (typeof val === 'string') val = val.trim() || null;
          edParams.push(val === undefined ? null : val);
        }
      }
      if (edUpdates.length > 0) {
        edParams.push(targetEditionId, itemId);
        dbHelper.run(`UPDATE editions SET ${edUpdates.join(', ')} WHERE id = ? AND item_id = ?`, edParams);
      }
    } else if (ed.format) {
      dbHelper.run(
        `INSERT INTO editions (item_id, format, edition_name, packaging, slipcover, condition, purchase_price, storage_location)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          ed.format,
          ed.edition_name || 'Standard Edition',
          ed.packaging || 'Standard Case',
          ed.slipcover ? 1 : 0,
          ed.condition || 'Mint',
          parseFloat(ed.purchase_price) || 0.0,
          ed.storage_location || null
        ]
      );
    }
  }

  const updated = dbHelper.get('SELECT * FROM items WHERE id = ?', [itemId]);
  const editions = dbHelper.query('SELECT * FROM editions WHERE item_id = ? ORDER BY id ASC', [itemId]);

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

  const updates = [];
  const params = [];

  const allowedFields = [
    'format', 'edition_name', 'packaging', 'slipcover', 'disc_count',
    'region', 'condition', 'purchase_price', 'purchase_date', 'retailer',
    'storage_location', 'barcode', 'notes'
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      let val = req.body[field];
      if (field === 'slipcover') val = val ? 1 : 0;
      else if (field === 'disc_count') val = parseInt(val, 10) || 1;
      else if (field === 'purchase_price') val = parseFloat(val) || 0.0;
      else if (typeof val === 'string') val = val.trim() || null;
      params.push(val === undefined ? null : val);
    }
  }

  if (updates.length > 0) {
    params.push(editionId);
    dbHelper.run(
      `UPDATE editions SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
  }

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
