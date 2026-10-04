const express = require('express');
const router = express.Router();

// GET /api/lookup/search?q=...&category=movie|tv|game
router.get('/search', async (req, res) => {
  const { q, category = 'movie' } = req.query;

  if (!q || !q.trim()) {
    return res.json({ results: [] });
  }

  const queryTerm = q.trim();

  try {
    if (category === 'tv') {
      const tvResults = await searchTVMaze(queryTerm);
      return res.json({ results: tvResults });
    } else if (category === 'movie') {
      const movieResults = await searchWikipediaMedia(queryTerm, 'film');
      return res.json({ results: movieResults });
    } else if (category === 'game') {
      const gameResults = await searchWikipediaMedia(queryTerm, 'video game');
      return res.json({ results: gameResults });
    } else {
      // General search across both
      const movieResults = await searchWikipediaMedia(queryTerm, 'film');
      return res.json({ results: movieResults });
    }
  } catch (err) {
    console.error('Error during media lookup:', err);
    return res.json({ results: [] });
  }
});

async function searchTVMaze(query) {
  try {
    const url = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'ShelfmarkMediaTracker/1.0' } });
    if (!response.ok) return [];

    const data = await response.json();
    return data.slice(0, 8).map(item => {
      const show = item.show;
      const year = show.premiered ? parseInt(show.premiered.split('-')[0], 10) : null;
      const cleanSummary = show.summary ? show.summary.replace(/<[^>]+>/g, '').trim() : '';

      return {
        category: 'tv',
        title: show.name,
        release_year: year,
        creator: show.network?.name || show.webChannel?.name || 'TV Series',
        genres: show.genres || [],
        runtime: show.averageRuntime ? `${show.averageRuntime} min/ep` : null,
        synopsis: cleanSummary,
        poster_url: show.image?.original || show.image?.medium || null,
        backdrop_url: show.image?.original || null,
        status: 'owned',
        suggested_format: 'Blu-ray'
      };
    });
  } catch (err) {
    console.error('TVMaze search error:', err.message);
    return [];
  }
}

async function searchWikipediaMedia(query, typeKeyword) {
  try {
    // 1. Search Wikipedia articles
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query + ' ' + typeKeyword)}&limit=6&namespace=0&format=json`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'ShelfmarkMediaTracker/1.0 (contact: info@shelfmark.app)' }
    });
    if (!searchRes.ok) return [];

    const searchData = await searchRes.json();
    const titles = searchData[1] || [];

    const results = [];

    // 2. Fetch page summary for the top 4 candidates in parallel
    const summaryPromises = titles.slice(0, 4).map(async title => {
      try {
        const slug = encodeURIComponent(title.replace(/ /g, '_'));
        const sumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`;
        const sumRes = await fetch(sumUrl, {
          headers: { 'User-Agent': 'ShelfmarkMediaTracker/1.0' }
        });
        if (!sumRes.ok) return null;
        const sumData = await sumRes.json();

        // Parse year and creator/director from description or extract
        let year = null;
        const yearMatch = sumData.description?.match(/\b(19\d{2}|20\d{2})\b/) || sumData.extract?.match(/\b(19\d{2}|20\d{2})\b/);
        if (yearMatch) {
          year = parseInt(yearMatch[1], 10);
        }

        // Clean cleanTitle
        let cleanTitle = sumData.title.replace(/\s*\([^)]*\)$/, '');

        let creator = null;
        if (typeKeyword === 'film') {
          const dirMatch = sumData.description?.match(/by\s+([^,.]+)/i);
          if (dirMatch) creator = dirMatch[1].trim();
        } else if (typeKeyword === 'video game') {
          const devMatch = sumData.extract?.match(/developed by\s+([^,.]+)/i);
          if (devMatch) creator = devMatch[1].trim();
        }

        return {
          category: typeKeyword === 'film' ? 'movie' : 'game',
          title: cleanTitle,
          release_year: year,
          creator: creator || sumData.description || null,
          genres: [],
          runtime: null,
          synopsis: sumData.extract || null,
          poster_url: sumData.thumbnail?.source || null,
          backdrop_url: sumData.originalimage?.source || sumData.thumbnail?.source || null,
          status: 'owned',
          suggested_format: typeKeyword === 'film' ? '4K UHD' : 'Nintendo Switch'
        };
      } catch (e) {
        return null;
      }
    });

    const settled = await Promise.all(summaryPromises);
    return settled.filter(Boolean);
  } catch (err) {
    console.error('Wikipedia media search error:', err.message);
    return [];
  }
}

module.exports = router;
