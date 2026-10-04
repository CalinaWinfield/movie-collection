const express = require('express');
const router = express.Router();
const { dbHelper } = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/backup/export/json
router.get('/export/json', requireAuth, (req, res) => {
  const userId = req.userId;
  const user = dbHelper.get('SELECT username, display_name FROM users WHERE id = ?', [userId]);
  const shelves = dbHelper.query('SELECT * FROM shelves WHERE user_id = ?', [userId]);
  const items = dbHelper.query('SELECT * FROM items WHERE user_id = ?', [userId]);
  
  const itemIds = items.map(i => i.id);
  let editions = [];
  let loans = [];

  if (itemIds.length > 0) {
    const placeholders = itemIds.map(() => '?').join(',');
    editions = dbHelper.query(`SELECT * FROM editions WHERE item_id IN (${placeholders})`, itemIds);
    loans = dbHelper.query(`SELECT * FROM loans WHERE item_id IN (${placeholders})`, itemIds);
  }

  const exportData = {
    exported_at: new Date().toISOString(),
    version: '1.0',
    user: user?.username,
    shelves,
    items,
    editions,
    loans
  };

  res.setHeader('Content-Disposition', `attachment; filename="kolekino_backup_${user?.username || 'collection'}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(exportData, null, 2));
});

// GET /api/backup/export/csv
router.get('/export/csv', requireAuth, (req, res) => {
  const userId = req.userId;
  const items = dbHelper.query(
    `SELECT i.title, i.category, i.release_year, i.creator, i.status, i.rating,
            e.format, e.packaging, e.slipcover, e.condition, e.purchase_price,
            s.name as shelf_name
     FROM items i
     LEFT JOIN editions e ON e.item_id = i.id
     LEFT JOIN shelves s ON i.shelf_id = s.id
     WHERE i.user_id = ?
     ORDER BY i.id ASC`,
    [userId]
  );

  const headers = ['Title', 'Category', 'Year', 'Creator/Director', 'Status', 'Rating', 'Format', 'Packaging', 'Slipcover', 'Condition', 'Price', 'Shelf'];
  const rows = items.map(item => [
    `"${(item.title || '').replace(/"/g, '""')}"`,
    item.category || '',
    item.release_year || '',
    `"${(item.creator || '').replace(/"/g, '""')}"`,
    item.status || '',
    item.rating || '',
    item.format || '',
    item.packaging || '',
    item.slipcover ? 'Yes' : 'No',
    item.condition || '',
    item.purchase_price || '',
    `"${(item.shelf_name || '').replace(/"/g, '""')}"`
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Disposition', 'attachment; filename="collection_export.csv"');
  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);
});

// POST /api/backup/import - import JSON
router.post('/import', requireAuth, (req, res) => {
  const { data } = req.body;
  if (!data || !Array.isArray(data.items)) {
    return res.status(400).json({ error: 'Invalid backup format. Expected data.items array.' });
  }

  let importedCount = 0;
  for (const item of data.items) {
    if (!item.title || !item.category) continue;

    const { lastInsertRowid: itemId } = dbHelper.run(
      `INSERT INTO items (
        user_id, category, title, original_title, release_year, creator,
        genres, runtime, synopsis, poster_url, backdrop_url,
        status, rating, user_notes, tags, barcode, is_favorite
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId,
        item.category,
        item.title,
        item.original_title || null,
        item.release_year || null,
        item.creator || null,
        typeof item.genres === 'string' ? item.genres : JSON.stringify(item.genres || []),
        item.runtime || null,
        item.synopsis || null,
        item.poster_url || null,
        item.backdrop_url || null,
        item.status || 'owned',
        item.rating || 0,
        item.user_notes || null,
        typeof item.tags === 'string' ? item.tags : JSON.stringify(item.tags || []),
        item.barcode || null,
        item.is_favorite ? 1 : 0
      ]
    );

    // If backup had matching editions
    const matchingEditions = (data.editions || []).filter(e => e.item_id === item.id);
    if (matchingEditions.length > 0) {
      for (const ed of matchingEditions) {
        dbHelper.run(
          `INSERT INTO editions (
            item_id, format, edition_name, packaging, slipcover, disc_count,
            region, condition, purchase_price, purchase_date, retailer,
            storage_location, barcode, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId,
            ed.format || 'Standard',
            ed.edition_name || 'Standard Edition',
            ed.packaging || 'Standard Case',
            ed.slipcover ? 1 : 0,
            ed.disc_count || 1,
            ed.region || 'Region Free',
            ed.condition || 'Mint',
            ed.purchase_price || 0.0,
            ed.purchase_date || null,
            ed.retailer || null,
            ed.storage_location || null,
            ed.barcode || null,
            ed.notes || null
          ]
        );
      }
    } else {
      // Default single edition
      dbHelper.run(
        `INSERT INTO editions (item_id, format, edition_name, packaging) VALUES (?, ?, ?, ?)`,
        [itemId, item.category === 'game' ? 'Nintendo Switch' : '4K UHD', 'Standard Edition', 'Standard Case']
      );
    }
    importedCount++;
  }

  res.json({ success: true, importedCount });
});

// POST /api/backup/seed-sample - load curated starter collection
router.post('/seed-sample', requireAuth, (req, res) => {
  const userId = req.userId;

  // Make sure user has basic shelves
  let shelf4k = dbHelper.get('SELECT id FROM shelves WHERE user_id = ? AND name = ?', [userId, '4K Steelbooks']);
  if (!shelf4k) {
    const { lastInsertRowid } = dbHelper.run('INSERT INTO shelves (user_id, name, icon, color) VALUES (?, ?, ?, ?)', [userId, '4K Steelbooks', 'disc', '#f59e0b']);
    shelf4k = { id: lastInsertRowid };
  }

  let shelfFavs = dbHelper.get('SELECT id FROM shelves WHERE user_id = ? AND name = ?', [userId, 'Favorites']);
  if (!shelfFavs) {
    const { lastInsertRowid } = dbHelper.run('INSERT INTO shelves (user_id, name, icon, color) VALUES (?, ?, ?, ?)', [userId, 'Favorites', 'heart', '#ef4444']);
    shelfFavs = { id: lastInsertRowid };
  }

  let shelfCriterion = dbHelper.get('SELECT id FROM shelves WHERE user_id = ? AND name = ?', [userId, 'Criterion Collection']);
  if (!shelfCriterion) {
    const { lastInsertRowid } = dbHelper.run('INSERT INTO shelves (user_id, name, icon, color) VALUES (?, ?, ?, ?)', [userId, 'Criterion Collection', 'film', '#6366f1']);
    shelfCriterion = { id: lastInsertRowid };
  }

  const sampleItems = [
    {
      category: 'movie',
      title: 'Dune: Part Two',
      release_year: 2024,
      creator: 'Denis Villeneuve',
      genres: ['Sci-Fi', 'Adventure', 'Action'],
      runtime: '166 min',
      synopsis: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
      poster_url: 'https://upload.wikimedia.org/wikipedia/en/5/52/Dune_Part_Two_poster.jpeg',
      status: 'owned',
      rating: 9.5,
      shelf_id: shelf4k.id,
      is_favorite: 1,
      editions: [
        {
          format: '4K UHD',
          edition_name: 'Limited Edition Steelbook',
          packaging: 'Steelbook',
          slipcover: 0,
          disc_count: 2,
          region: 'Region Free',
          condition: 'Mint',
          purchase_price: 34.99,
          retailer: 'Gruv / Warner Bros',
          storage_location: 'Display Cabinet - Shelf 1'
        }
      ]
    },
    {
      category: 'movie',
      title: 'Oppenheimer',
      release_year: 2023,
      creator: 'Christopher Nolan',
      genres: ['Biography', 'Drama', 'History'],
      runtime: '180 min',
      synopsis: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
      poster_url: 'https://upload.wikimedia.org/wikipedia/en/4/4a/Oppenheimer_%28film%29.jpg',
      status: 'owned',
      rating: 9.2,
      shelf_id: shelf4k.id,
      is_favorite: 1,
      editions: [
        {
          format: '4K UHD',
          edition_name: 'Iconic 3-Disc Collector Set with Slipcover',
          packaging: 'Slipcover',
          slipcover: 1,
          disc_count: 3,
          region: 'Region Free',
          condition: 'Mint',
          purchase_price: 29.99,
          retailer: 'Best Buy',
          storage_location: 'Living Room Shelf A'
        }
      ]
    },
    {
      category: 'movie',
      title: 'Seven Samurai',
      release_year: 1954,
      creator: 'Akira Kurosawa',
      genres: ['Action', 'Drama'],
      runtime: '207 min',
      synopsis: 'Farmers in a village hire seven ronin to protect their crops from bandits.',
      poster_url: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Seven_Samurai_poster.jpg',
      status: 'owned',
      rating: 10.0,
      shelf_id: shelfCriterion.id,
      is_favorite: 1,
      editions: [
        {
          format: 'Criterion',
          edition_name: 'Criterion Collection #2 (4K Remastered Digipak)',
          packaging: 'Digibook',
          slipcover: 1,
          disc_count: 3,
          region: 'Region A',
          condition: 'New/Sealed',
          purchase_price: 39.95,
          retailer: 'Criterion Store B&N 50% Sale',
          storage_location: 'Criterion Showcase'
        }
      ]
    },
    {
      category: 'movie',
      title: 'Blade Runner 2049',
      release_year: 2017,
      creator: 'Denis Villeneuve',
      genres: ['Sci-Fi', 'Mystery', 'Thriller'],
      runtime: '164 min',
      synopsis: 'Young Blade Runner K unearths a long-buried secret that leads him to track down former Blade Runner Rick Deckard.',
      poster_url: 'https://upload.wikimedia.org/wikipedia/en/9/9b/Blade_Runner_2049_logo.png',
      status: 'owned',
      rating: 9.6,
      shelf_id: shelfFavs.id,
      is_favorite: 1,
      editions: [
        {
          format: '4K UHD',
          edition_name: 'Titan of Pop Culture Steelbook',
          packaging: 'Steelbook',
          slipcover: 0,
          disc_count: 2,
          region: 'Region Free',
          condition: 'Mint',
          purchase_price: 32.50,
          retailer: 'Amazon UK',
          storage_location: 'Living Room Shelf A'
        }
      ]
    },
    {
      category: 'tv',
      title: 'Breaking Bad',
      release_year: 2008,
      creator: 'Vince Gilligan (AMC)',
      genres: ['Crime', 'Drama', 'Thriller'],
      runtime: '5 Seasons (62 eps)',
      synopsis: 'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine.',
      poster_url: 'https://upload.wikimedia.org/wikipedia/en/6/61/Breaking_Bad_title_card.png',
      status: 'completed',
      rating: 9.9,
      shelf_id: shelfFavs.id,
      is_favorite: 1,
      editions: [
        {
          format: 'Blu-ray',
          edition_name: 'Complete Series Barrel Collector Box Set',
          packaging: 'Box Set',
          slipcover: 0,
          disc_count: 16,
          region: 'Region Free',
          condition: 'Mint',
          purchase_price: 119.99,
          retailer: 'Amazon',
          storage_location: 'TV Box Sets Shelf'
        }
      ]
    },
    {
      category: 'tv',
      title: 'Chernobyl',
      release_year: 2019,
      creator: 'Craig Mazin (HBO)',
      genres: ['Drama', 'History', 'Thriller'],
      runtime: 'Miniseries (5 eps)',
      synopsis: 'In April 1986, an explosion at the Chernobyl nuclear power station in the USSR becomes one of the world\'s worst man-made catastrophes.',
      poster_url: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Chernobyl_2019_Miniseries.jpg',
      status: 'completed',
      rating: 9.7,
      shelf_id: shelf4k.id,
      is_favorite: 1,
      editions: [
        {
          format: '4K UHD',
          edition_name: 'HBO Steelbook Edition 4K UHD',
          packaging: 'Steelbook',
          slipcover: 0,
          disc_count: 2,
          region: 'Region Free',
          condition: 'Mint',
          purchase_price: 27.99,
          retailer: 'Zavvi',
          storage_location: 'Living Room Shelf A'
        }
      ]
    },
    {
      category: 'game',
      title: 'The Legend of Zelda: Tears of the Kingdom',
      release_year: 2023,
      creator: 'Nintendo EPD',
      genres: ['Action-Adventure', 'Open World'],
      runtime: '120+ hrs',
      synopsis: 'An epic adventure across the land and skies of Hyrule awaits in The Legend of Zelda: Tears of the Kingdom for Nintendo Switch.',
      poster_url: 'https://upload.wikimedia.org/wikipedia/en/f/fb/The_Legend_of_Zelda_Tears_of_the_Kingdom_cover.jpg',
      status: 'in_progress',
      rating: 9.8,
      shelf_id: shelfFavs.id,
      is_favorite: 1,
      editions: [
        {
          format: 'Nintendo Switch',
          edition_name: 'Collector’s Edition Box Set with SteelBook & Artbook',
          packaging: 'Box Set',
          slipcover: 1,
          disc_count: 1,
          region: 'Region Free',
          condition: 'Mint',
          purchase_price: 129.99,
          retailer: 'Nintendo Store',
          storage_location: 'Switch Games Shelf'
        }
      ]
    },
    {
      category: 'game',
      title: 'Elden Ring',
      release_year: 2022,
      creator: 'FromSoftware / Bandai Namco',
      genres: ['Action RPG', 'Dark Fantasy'],
      runtime: '95 hrs',
      synopsis: 'Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between.',
      poster_url: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Elden_Ring_Box_art.jpg',
      status: 'completed',
      rating: 9.8,
      shelf_id: shelfFavs.id,
      is_favorite: 1,
      editions: [
        {
          format: 'PlayStation 5',
          edition_name: 'Launch Edition Physical Disc with Art Cards',
          packaging: 'Slipcover',
          slipcover: 1,
          disc_count: 1,
          region: 'Region Free',
          condition: 'Mint',
          purchase_price: 69.99,
          retailer: 'GameStop',
          storage_location: 'PS5 Games Shelf'
        }
      ]
    }
  ];

  let added = 0;
  for (const item of sampleItems) {
    const { lastInsertRowid: itemId } = dbHelper.run(
      `INSERT INTO items (
        user_id, category, title, release_year, creator, genres,
        runtime, synopsis, poster_url, status, rating, shelf_id, is_favorite
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        item.category,
        item.title,
        item.release_year,
        item.creator,
        JSON.stringify(item.genres),
        item.runtime,
        item.synopsis,
        item.poster_url,
        item.status,
        item.rating,
        item.shelf_id,
        item.is_favorite
      ]
    );

    for (const ed of item.editions) {
      dbHelper.run(
        `INSERT INTO editions (
          item_id, format, edition_name, packaging, slipcover, disc_count,
          region, condition, purchase_price, retailer, storage_location
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          ed.format,
          ed.edition_name,
          ed.packaging,
          ed.slipcover,
          ed.disc_count,
          ed.region,
          ed.condition,
          ed.purchase_price,
          ed.retailer,
          ed.storage_location
        ]
      );
    }
    added++;
  }

  // Also add 1 active loan so the user can test the Lent Out feature
  const duneItem = dbHelper.get('SELECT id FROM items WHERE user_id = ? AND title = ?', [userId, 'Dune: Part Two']);
  if (duneItem) {
    dbHelper.run(
      `INSERT INTO loans (user_id, item_id, borrower_name, borrower_contact, loan_date, due_date, notes, is_returned)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        userId,
        duneItem.id,
        'Marcus Vance (Friend)',
        'marcus@example.com / 555-0142',
        new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
        new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        'Borrowed the 4K Steelbook for movie night, handles discs carefully.'
      ]
    );
  }

  res.json({ success: true, count: added });
});

module.exports = router;
