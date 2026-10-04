const express = require('express');
const router = express.Router();

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';

// GET /api/lookup/search?q=...&category=movie|tv|game
router.get('/search', async (req, res) => {
  const { q, category = 'movie' } = req.query;

  if (!q || !q.trim()) {
    return res.json({ results: [] });
  }

  const queryTerm = q.trim();

  try {
    if (category === 'tv') {
      const tvResults = await searchTVMedia(queryTerm);
      return res.json({ results: tvResults });
    } else if (category === 'movie') {
      const movieResults = await searchMovieMedia(queryTerm);
      return res.json({ results: movieResults });
    } else if (category === 'game') {
      const gameResults = await searchGameMedia(queryTerm);
      return res.json({ results: gameResults });
    } else {
      const movieResults = await searchMovieMedia(queryTerm);
      return res.json({ results: movieResults });
    }
  } catch (err) {
    console.error('Error during media lookup:', err);
    return res.json({ results: [] });
  }
});

// GET /api/lookup/details?id=tt...&category=movie|tv
router.get('/details', async (req, res) => {
  const { id, category = 'movie' } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    const metaType = category === 'tv' ? 'series' : 'movie';
    const detailRes = await fetch(`https://v3-cinemeta.strem.io/meta/${metaType}/${encodeURIComponent(id)}.json`);
    if (detailRes.ok) {
      const detData = await detailRes.json();
      if (detData.meta) {
        const meta = detData.meta;
        return res.json({
          title: meta.name,
          release_year: meta.year ? parseInt(meta.year, 10) : (meta.releaseInfo ? parseInt(meta.releaseInfo.slice(0, 4), 10) : null),
          creator: Array.isArray(meta.director) ? meta.director.join(', ') : (meta.director || (Array.isArray(meta.writer) ? meta.writer.join(', ') : meta.writer) || null),
          runtime: meta.runtime || null,
          synopsis: meta.description || null,
          rating: meta.imdbRating ? parseFloat(meta.imdbRating) : 0,
          genres: meta.genres || [],
          poster_url: meta.poster || null,
          backdrop_url: meta.background || null,
          imdb_id: meta.imdb_id || id,
          tmdb_id: meta.moviedb_id || null,
          source: 'IMDb & The Movie Database (TMDb)'
        });
      }
    }
    return res.status(404).json({ error: 'Title details not found' });
  } catch (err) {
    console.error('Error fetching title details:', err);
    return res.status(500).json({ error: 'Failed to fetch title details' });
  }
});

/**
 * Searches Movies using The Movie Database (TMDb) and IMDb
 */
async function searchMovieMedia(query) {
  const seenIds = new Set();
  const candidates = [];

  // 1. Direct TMDb search if user configured TMDB_API_KEY
  if (TMDB_API_KEY) {
    try {
      const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`;
      const tmdbRes = await fetch(tmdbUrl);
      if (tmdbRes.ok) {
        const tmdbData = await tmdbRes.json();
        for (const m of (tmdbData.results || []).slice(0, 6)) {
          const key = `tmdb-${m.id}`;
          if (seenIds.has(key)) continue;
          seenIds.add(key);
          candidates.push({
            tmdb_id: m.id,
            title: m.title,
            release_year: m.release_date ? parseInt(m.release_date.slice(0, 4), 10) : null,
            synopsis: m.overview || null,
            rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : 0,
            poster_url: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
            backdrop_url: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : null,
            source: 'The Movie Database (TMDb)'
          });
        }
      }
    } catch (e) {
      console.error('TMDb direct search error:', e.message);
    }
  }

  // 2. Cinemeta (Unified TMDb & IMDb catalog)
  try {
    const cineUrl = `https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURIComponent(query)}.json`;
    const cineRes = await fetch(cineUrl);
    if (cineRes.ok) {
      const cineData = await cineRes.json();
      for (const m of (cineData.metas || []).slice(0, 8)) {
        if (!m.id || seenIds.has(m.id)) continue;
        seenIds.add(m.id);
        candidates.push({
          id: m.id,
          imdb_id: m.imdb_id || m.id,
          title: m.name,
          release_year: m.year ? parseInt(m.year, 10) : (m.releaseInfo ? parseInt(m.releaseInfo.slice(0, 4), 10) : null),
          poster_url: m.poster || null,
          backdrop_url: m.background || null,
          source: 'IMDb & The Movie Database'
        });
      }
    }
  } catch (e) {
    console.error('Cinemeta search error:', e.message);
  }

  // 3. Official IMDb Suggestion API for any titles missed
  try {
    const imdbUrl = `https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(query)}.json`;
    const imdbRes = await fetch(imdbUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (imdbRes.ok) {
      const imdbData = await imdbRes.json();
      for (const d of (imdbData.d || []).slice(0, 6)) {
        if (!d.id || seenIds.has(d.id)) continue;
        if (d.qid && d.qid !== 'movie' && d.qid !== 'feature') continue;
        seenIds.add(d.id);
        candidates.push({
          id: d.id,
          imdb_id: d.id,
          title: d.l,
          release_year: d.y || null,
          poster_url: d.i?.imageUrl || null,
          backdrop_url: null,
          creator: d.s || null,
          source: 'IMDb'
        });
      }
    }
  } catch (e) {
    console.error('IMDb suggestion search error:', e.message);
  }

  // If no candidates from IMDb/TMDb, fallback to Wikipedia OpenSearch
  if (candidates.length === 0) {
    return await searchWikipediaMedia(query, 'film');
  }

  // Enrich top candidates with director, runtime, synopsis, and rating
  const topCandidates = candidates.slice(0, 8);
  const enriched = await Promise.all(
    topCandidates.map(async (c, idx) => {
      if (idx < 5 && c.id && c.id.startsWith('tt')) {
        try {
          const detRes = await fetch(`https://v3-cinemeta.strem.io/meta/movie/${c.id}.json`);
          if (detRes.ok) {
            const detData = await detRes.json();
            const meta = detData.meta;
            if (meta) {
              return {
                ...c,
                category: 'movie',
                creator: Array.isArray(meta.director) ? meta.director.join(', ') : (meta.director || c.creator || null),
                runtime: meta.runtime || null,
                synopsis: meta.description || null,
                rating: meta.imdbRating ? parseFloat(meta.imdbRating) : (c.rating || 0),
                genres: meta.genres || [],
                poster_url: meta.poster || c.poster_url,
                backdrop_url: meta.background || c.backdrop_url,
                suggested_format: '4K UHD'
              };
            }
          }
        } catch (e) {}
      }

      return {
        ...c,
        category: 'movie',
        creator: c.creator || null,
        runtime: null,
        synopsis: c.synopsis || null,
        rating: c.rating || 0,
        genres: c.genres || [],
        suggested_format: '4K UHD'
      };
    })
  );

  return enriched;
}

/**
 * Searches TV Shows using The Movie Database (TMDb), IMDb, and TVMaze
 */
async function searchTVMedia(query) {
  const seenIds = new Set();
  const candidates = [];

  // 1. Direct TMDb search if user configured TMDB_API_KEY
  if (TMDB_API_KEY) {
    try {
      const tmdbUrl = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`;
      const tmdbRes = await fetch(tmdbUrl);
      if (tmdbRes.ok) {
        const tmdbData = await tmdbRes.json();
        for (const m of (tmdbData.results || []).slice(0, 6)) {
          const key = `tmdb-tv-${m.id}`;
          if (seenIds.has(key)) continue;
          seenIds.add(key);
          candidates.push({
            tmdb_id: m.id,
            title: m.name,
            release_year: m.first_air_date ? parseInt(m.first_air_date.slice(0, 4), 10) : null,
            synopsis: m.overview || null,
            rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : 0,
            poster_url: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
            backdrop_url: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : null,
            source: 'The Movie Database (TMDb)'
          });
        }
      }
    } catch (e) {
      console.error('TMDb TV search error:', e.message);
    }
  }

  // 2. Cinemeta Series (TMDb + IMDb series catalog)
  try {
    const cineUrl = `https://v3-cinemeta.strem.io/catalog/series/top/search=${encodeURIComponent(query)}.json`;
    const cineRes = await fetch(cineUrl);
    if (cineRes.ok) {
      const cineData = await cineRes.json();
      for (const m of (cineData.metas || []).slice(0, 8)) {
        if (!m.id || seenIds.has(m.id)) continue;
        seenIds.add(m.id);
        candidates.push({
          id: m.id,
          imdb_id: m.imdb_id || m.id,
          title: m.name,
          release_year: m.year ? parseInt(m.year, 10) : (m.releaseInfo ? parseInt(m.releaseInfo.slice(0, 4), 10) : null),
          poster_url: m.poster || null,
          backdrop_url: m.background || null,
          source: 'IMDb & The Movie Database'
        });
      }
    }
  } catch (e) {
    console.error('Cinemeta series search error:', e.message);
  }

  // 3. IMDb Suggestion for TV series
  try {
    const imdbUrl = `https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(query)}.json`;
    const imdbRes = await fetch(imdbUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (imdbRes.ok) {
      const imdbData = await imdbRes.json();
      for (const d of (imdbData.d || []).slice(0, 6)) {
        if (!d.id || seenIds.has(d.id)) continue;
        if (d.qid && d.qid !== 'tvSeries' && d.qid !== 'tvMiniSeries') continue;
        seenIds.add(d.id);
        candidates.push({
          id: d.id,
          imdb_id: d.id,
          title: d.l,
          release_year: d.y || null,
          poster_url: d.i?.imageUrl || null,
          backdrop_url: null,
          creator: d.s || null,
          source: 'IMDb'
        });
      }
    }
  } catch (e) {
    console.error('IMDb TV suggestion search error:', e.message);
  }

  // Fallback to TVMaze if empty
  if (candidates.length === 0) {
    return await searchTVMaze(query);
  }

  // Enrich top candidates
  const topCandidates = candidates.slice(0, 8);
  const enriched = await Promise.all(
    topCandidates.map(async (c, idx) => {
      if (idx < 5 && c.id && c.id.startsWith('tt')) {
        try {
          const detRes = await fetch(`https://v3-cinemeta.strem.io/meta/series/${c.id}.json`);
          if (detRes.ok) {
            const detData = await detRes.json();
            const meta = detData.meta;
            if (meta) {
              const creator = Array.isArray(meta.director) ? meta.director.join(', ') : (meta.director || (Array.isArray(meta.writer) ? meta.writer.join(', ') : meta.writer) || c.creator || null);
              return {
                ...c,
                category: 'tv',
                creator,
                runtime: meta.runtime || null,
                synopsis: meta.description || null,
                rating: meta.imdbRating ? parseFloat(meta.imdbRating) : (c.rating || 0),
                genres: meta.genres || [],
                poster_url: meta.poster || c.poster_url,
                backdrop_url: meta.background || c.backdrop_url,
                suggested_format: 'Blu-ray'
              };
            }
          }
        } catch (e) {}
      }

      return {
        ...c,
        category: 'tv',
        creator: c.creator || null,
        runtime: null,
        synopsis: c.synopsis || null,
        rating: c.rating || 0,
        genres: c.genres || [],
        suggested_format: 'Blu-ray'
      };
    })
  );

  return enriched;
}

/**
 * Searches Video Games using IMDb and Wikipedia
 */
async function searchGameMedia(query) {
  const seenIds = new Set();
  const candidates = [];

  // 1. IMDb Video Game suggestions
  try {
    const imdbUrl = `https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(query)}.json`;
    const imdbRes = await fetch(imdbUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (imdbRes.ok) {
      const imdbData = await imdbRes.json();
      for (const d of (imdbData.d || []).slice(0, 6)) {
        if (!d.id || seenIds.has(d.id)) continue;
        if (d.qid === 'videoGame' || d.q === 'video game') {
          seenIds.add(d.id);
          candidates.push({
            id: d.id,
            imdb_id: d.id,
            category: 'game',
            title: d.l,
            release_year: d.y || null,
            creator: d.s || 'Video Game',
            genres: [],
            runtime: null,
            synopsis: null,
            rating: 0,
            poster_url: d.i?.imageUrl || null,
            backdrop_url: null,
            source: 'IMDb',
            suggested_format: 'Nintendo Switch'
          });
        }
      }
    }
  } catch (e) {
    console.error('IMDb game search error:', e.message);
  }

  // 2. Wikipedia Video Game search to complement
  try {
    const wikiResults = await searchWikipediaMedia(query, 'video game');
    for (const w of wikiResults) {
      if (seenIds.has(w.title.toLowerCase())) continue;
      seenIds.add(w.title.toLowerCase());
      candidates.push({
        ...w,
        source: 'Wikipedia & Game Database'
      });
    }
  } catch (e) {
    console.error('Wikipedia game search error:', e.message);
  }

  return candidates.slice(0, 8);
}

/**
 * Fallback TVMaze
 */
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
        rating: show.rating?.average || 0,
        source: 'TVMaze & IMDb',
        suggested_format: 'Blu-ray'
      };
    });
  } catch (err) {
    console.error('TVMaze search error:', err.message);
    return [];
  }
}

/**
 * Fallback Wikipedia
 */
async function searchWikipediaMedia(query, typeKeyword) {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query + ' ' + typeKeyword)}&limit=6&namespace=0&format=json`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'ShelfmarkMediaTracker/1.0 (contact: info@shelfmark.app)' }
    });
    if (!searchRes.ok) return [];

    const searchData = await searchRes.json();
    const titles = searchData[1] || [];

    const summaryPromises = titles.slice(0, 4).map(async title => {
      try {
        const slug = encodeURIComponent(title.replace(/ /g, '_'));
        const sumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`;
        const sumRes = await fetch(sumUrl, {
          headers: { 'User-Agent': 'ShelfmarkMediaTracker/1.0' }
        });
        if (!sumRes.ok) return null;
        const sumData = await sumRes.json();

        let year = null;
        const yearMatch = sumData.description?.match(/\b(19\d{2}|20\d{2})\b/) || sumData.extract?.match(/\b(19\d{2}|20\d{2})\b/);
        if (yearMatch) {
          year = parseInt(yearMatch[1], 10);
        }

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
          rating: 0,
          poster_url: sumData.thumbnail?.source || null,
          backdrop_url: sumData.originalimage?.source || sumData.thumbnail?.source || null,
          source: 'Wikipedia',
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
