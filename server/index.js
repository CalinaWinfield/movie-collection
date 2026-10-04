const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDb, dbHelper } = require('./db');
const bcrypt = require('bcryptjs');

const authRoutes = require('./routes/auth');
const itemsRoutes = require('./routes/items');
const shelvesRoutes = require('./routes/shelves');
const statsRoutes = require('./routes/stats');
const lookupRoutes = require('./routes/lookup');
const backupRoutes = require('./routes/backup');
const publicRoutes = require('./routes/public');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/shelves', shelvesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/lookup', lookupRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/public', publicRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'Shelfmark Media Collection API', time: new Date().toISOString() });
});

// Serve frontend build if exists
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Auto-seed demo collector if no users exist
async function ensureDemoData() {
  const users = dbHelper.query('SELECT id, username FROM users');
  if (users.length === 0) {
    console.log('No users found. Creating demo collector account...');
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync('demo1234', salt);

    const { lastInsertRowid: demoUserId } = dbHelper.run(
      `INSERT INTO users (username, email, password_hash, display_name, bio, is_public) 
       VALUES (?, ?, ?, ?, ?, 1)`,
      [
        'cinephile',
        'demo@kolekino.local',
        password_hash,
        'Alex Rivers',
        'Physical media enthusiast & boutique label collector. Loving 4K UHD Steelbooks and retro classics.'
      ]
    );

    // Call backup seed logic for demoUserId
    const dummyReq = { userId: demoUserId };
    const dummyRes = { json: () => {} };
    // We can directly call the seed logic or call the endpoint logic:
    const backupHandler = require('./routes/backup');
    // Seed sample items for demo user
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
        is_favorite: 1,
        editions: [
          {
            format: 'Nintendo Switch',
            edition_name: 'Collector’s Edition Box Set with SteelBook',
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
        synopsis: 'Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring.',
        poster_url: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Elden_Ring_Box_art.jpg',
        status: 'completed',
        rating: 9.8,
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

    const { lastInsertRowid: shelfFavsId } = dbHelper.run(
      'INSERT INTO shelves (user_id, name, icon, color) VALUES (?, ?, ?, ?)',
      [demoUserId, 'Favorites', 'heart', '#ef4444']
    );

    const { lastInsertRowid: shelf4kId } = dbHelper.run(
      'INSERT INTO shelves (user_id, name, icon, color) VALUES (?, ?, ?, ?)',
      [demoUserId, '4K Steelbooks', 'disc', '#2d6a4f']
    );

    for (const item of sampleItems) {
      const shelfId = item.category === 'movie' ? shelf4kId : shelfFavsId;
      const resolvedOwnership = item.ownership_status || (item.status === 'borrowed' ? 'borrowed' : (item.status === 'wishlist' ? 'wishlist' : 'owned'));
      const resolvedProgress = item.progress_status || (item.status === 'in_progress' ? 'in_progress' : (item.status === 'completed' ? 'completed' : 'not_started'));
      const legacyStatus = resolvedOwnership === 'wishlist' ? 'wishlist' : (resolvedProgress === 'completed' ? 'completed' : (resolvedProgress === 'in_progress' ? 'in_progress' : 'owned'));

      const { lastInsertRowid: itemId } = dbHelper.run(
        `INSERT INTO items (
          user_id, category, title, release_year, creator, genres,
          runtime, synopsis, poster_url, status, ownership_status, progress_status, rating, shelf_id, is_favorite
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          demoUserId,
          item.category,
          item.title,
          item.release_year,
          item.creator,
          JSON.stringify(item.genres),
          item.runtime,
          item.synopsis,
          item.poster_url,
          legacyStatus,
          resolvedOwnership,
          resolvedProgress,
          item.rating,
          shelfId,
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
    }

    console.log('Demo collector account seeded successfully! (user: cinephile, pass: demo1234)');
  }
}

async function startServer() {
  await initDb();
  await ensureDemoData();

  app.listen(PORT, () => {
    console.log(`🎬 Shelfmark Media API Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
