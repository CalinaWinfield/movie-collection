const express = require('express');
const router = express.Router();
const { dbHelper } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// GET /api/stats - collector insights
router.get('/', optionalAuth, (req, res) => {
  let userId = req.userId;
  if (!userId) {
    const demo = dbHelper.get("SELECT id FROM users WHERE username = 'cinephile' LIMIT 1") || dbHelper.get("SELECT id FROM users ORDER BY id ASC LIMIT 1");
    userId = demo ? demo.id : null;
  }
  if (!userId) {
    return res.json({
      totalItems: 0,
      slipcoverCount: 0,
      highestRating: 0,
      formats: [],
      genres: [],
      shelves: [],
      categoryCounts: { movie: 0, tv: 0, game: 0 },
      ownershipCounts: {},
      progressCounts: {}
    });
  }

  // Total items and category breakdown
  const categoryCounts = dbHelper.query(
    `SELECT category, COUNT(*) as count 
     FROM items 
     WHERE user_id = ? 
     GROUP BY category`,
    [userId]
  );

  const totalItems = categoryCounts.reduce((acc, row) => acc + row.count, 0);

  // Status breakdowns
  const ownershipCounts = dbHelper.query(
    `SELECT COALESCE(ownership_status, 'owned') as ownership_status, COUNT(*) as count 
     FROM items 
     WHERE user_id = ? 
     GROUP BY ownership_status`,
    [userId]
  );

  const progressCounts = dbHelper.query(
    `SELECT COALESCE(progress_status, 'not_started') as progress_status, COUNT(*) as count 
     FROM items 
     WHERE user_id = ? 
     GROUP BY progress_status`,
    [userId]
  );

  const statusCounts = dbHelper.query(
    `SELECT status, COUNT(*) as count 
     FROM items 
     WHERE user_id = ? 
     GROUP BY status`,
    [userId]
  );

  // Format breakdown (from editions)
  const formatCounts = dbHelper.query(
    `SELECT e.format, COUNT(*) as count 
     FROM editions e
     JOIN items i ON e.item_id = i.id
     WHERE i.user_id = ?
     GROUP BY e.format
     ORDER BY count DESC`,
    [userId]
  );

  // Packaging breakdown (Steelbook, Slipcover, Digibook, etc.)
  const packagingCounts = dbHelper.query(
    `SELECT e.packaging, COUNT(*) as count 
     FROM editions e
     JOIN items i ON e.item_id = i.id
     WHERE i.user_id = ? AND e.packaging IS NOT NULL AND e.packaging != ''
     GROUP BY e.packaging
     ORDER BY count DESC`,
    [userId]
  );

  // Slipcover count
  const slipcoverCount = dbHelper.get(
    `SELECT COUNT(*) as count 
     FROM editions e
     JOIN items i ON e.item_id = i.id
     WHERE i.user_id = ? AND e.slipcover = 1`,
    [userId]
  )?.count || 0;

  // Financial stats (Total valuation / spent)
  const financial = dbHelper.get(
    `SELECT 
      SUM(e.purchase_price) as total_spent,
      AVG(e.purchase_price) as avg_price,
      COUNT(CASE WHEN e.purchase_price > 0 THEN 1 END) as priced_items
     FROM editions e
     JOIN items i ON e.item_id = i.id
     WHERE i.user_id = ?`,
    [userId]
  );

  // Favorites count
  const favoritesCount = dbHelper.get(
    `SELECT COUNT(*) as count 
     FROM items 
     WHERE user_id = ? AND is_favorite = 1`,
    [userId]
  )?.count || 0;

  // Top shelves
  const shelfStats = dbHelper.query(
    `SELECT s.id, s.name, s.color, COUNT(i.id) as item_count
     FROM shelves s
     LEFT JOIN items i ON s.id = i.shelf_id
     WHERE s.user_id = ?
     GROUP BY s.id
     ORDER BY item_count DESC`,
    [userId]
  );

  // Ratings average
  const ratingStats = dbHelper.get(
    `SELECT AVG(rating) as avg_rating, COUNT(CASE WHEN rating > 0 THEN 1 END) as rated_count
     FROM items
     WHERE user_id = ? AND rating > 0`,
    [userId]
  );

  res.json({
    totalItems,
    categoryCounts: Object.fromEntries(categoryCounts.map(r => [r.category, r.count])),
    statusCounts: Object.fromEntries(statusCounts.map(r => [r.status, r.count])),
    ownershipCounts: Object.fromEntries(ownershipCounts.map(r => [r.ownership_status, r.count])),
    progressCounts: Object.fromEntries(progressCounts.map(r => [r.progress_status, r.count])),
    formatCounts,
    packagingCounts,
    slipcoverCount,
    totalSpent: Math.round((financial?.total_spent || 0) * 100) / 100,
    avgPrice: Math.round((financial?.avg_price || 0) * 100) / 100,
    favoritesCount,
    shelfStats,
    avgRating: ratingStats?.avg_rating ? Math.round(ratingStats.avg_rating * 10) / 10 : 0,
    ratedCount: ratingStats?.rated_count || 0
  });
});

module.exports = router;
