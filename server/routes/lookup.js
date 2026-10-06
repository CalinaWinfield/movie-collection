const express = require('express');
const router = express.Router();

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const RAWG_API_KEY = process.env.RAWG_API_KEY || '';

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

// GET /api/lookup/details?id=...&category=movie|tv|game
router.get('/details', async (req, res) => {
  const { id, category = 'movie' } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    if (category === 'game') {
      const gameDetails = await getGameDetails(id);
      if (gameDetails) {
        return res.json(gameDetails);
      }
      return res.status(404).json({ error: 'Game details not found' });
    }

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
 * Maps IGDB platform IDs to shelfmark format labels
 */
function mapIGDBPlatformToFormat(platforms = []) {
  const pSet = new Set(platforms);
  if (pSet.has(167)) return 'PlayStation 5';
  if (pSet.has(130)) return 'Nintendo Switch';
  if (pSet.has(48)) return 'PlayStation 4';
  if (pSet.has(169)) return 'Xbox Series X';
  if (pSet.has(49)) return 'Xbox One';
  if (pSet.has(9)) return 'PlayStation 3';
  if (pSet.has(8)) return 'PlayStation 2';
  if (pSet.has(7)) return 'PlayStation 1';
  if (pSet.has(12)) return 'Xbox 360';
  if (pSet.has(37) || pSet.has(20)) return 'Nintendo 3DS / DS';
  if (pSet.has(5) || pSet.has(41)) return 'Nintendo Wii / Wii U';
  if (pSet.has(18) || pSet.has(19) || pSet.has(4) || pSet.has(24) || pSet.has(33) || pSet.has(29)) return 'Retro Cartridge';
  if (pSet.has(6)) return 'PC Steam';
  return 'Nintendo Switch';
}

/**
 * Searches Video Games using official Steam Store API
 */
async function searchSteamGames(query) {
  try {
    const searchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`;
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'ShelfmarkMediaTracker/1.0 (contact@shelfmark.app)' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.items || !data.items.length) return [];

    const topItems = data.items.slice(0, 5);
    const enriched = await Promise.all(
      topItems.map(async (item) => {
        try {
          const detRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${item.id}&l=english`);
          if (!detRes.ok) return null;
          const detData = await detRes.json();
          const app = detData[item.id]?.data;
          if (!app) return null;

          let year = null;
          if (app.release_date?.date) {
            const m = app.release_date.date.match(/\b(19\d{2}|20\d{2})\b/);
            if (m) year = parseInt(m[1], 10);
          }

          const developers = app.developers?.join(', ') || '';
          const publishers = app.publishers?.join(', ') || '';
          const creator = developers || publishers || 'Steam';

          const metascore = app.metacritic?.score ? Math.round(app.metacritic.score / 10 * 10) / 10 : 0;
          const poster = `https://cdn.akamai.steamstatic.com/steam/apps/${item.id}/library_600x900_2x.jpg`;
          const backdrop = app.screenshots?.[0]?.path_full || app.header_image || null;
          const genres = (app.genres || []).map(g => g.description);

          return {
            id: `steam-${item.id}`,
            steam_id: item.id,
            category: 'game',
            title: app.name,
            release_year: year,
            creator,
            synopsis: (app.short_description || app.detailed_description || '').replace(/<[^>]+>/g, '').trim() || null,
            rating: metascore,
            genres,
            poster_url: poster,
            backdrop_url: backdrop,
            source: 'Steam',
            suggested_format: 'PC Steam'
          };
        } catch (e) {
          return null;
        }
      })
    );

    return enriched.filter(Boolean);
  } catch (err) {
    console.error('Steam search error:', err.message);
    return [];
  }
}

/**
 * Searches Video Games using IGDB (Internet Game Database)
 */
async function searchIGDBGames(query) {
  try {
    const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const clean = norm(query);
    const words = clean.split(/\s+/).filter(Boolean);
    const prefixes = new Set();

    prefixes.add(clean.slice(0, 2));
    for (const w of words) {
      if (w.length >= 2) prefixes.add(w.slice(0, 2));
    }
    if (!clean.startsWith('th')) prefixes.add('th');

    const seenIds = new Set();
    const matches = [];

    const buckets = await Promise.all(
      Array.from(prefixes).map(async p => {
        try {
          const res = await fetch(`https://app.lizardbyte.dev/GameDB/buckets/${encodeURIComponent(p)}.json`);
          if (res.ok) return await res.json();
        } catch (e) {}
        return null;
      })
    );

    for (const bucket of buckets) {
      if (!bucket) continue;
      for (const [id, item] of Object.entries(bucket)) {
        if (seenIds.has(id)) continue;
        const nameNorm = norm(item.name);
        const matchesAll = words.every(w => nameNorm.includes(w));
        if (matchesAll) {
          seenIds.add(id);
          matches.push({ id, name: item.name });
        }
      }
    }

    matches.sort((a, b) => {
      const aNorm = norm(a.name);
      const bNorm = norm(b.name);
      const aExact = aNorm === clean || aNorm === 'the ' + clean;
      const bExact = bNorm === clean || bNorm === 'the ' + clean;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      const aStarts = aNorm.startsWith(clean) || aNorm.startsWith('the ' + clean);
      const bStarts = bNorm.startsWith(clean) || bNorm.startsWith('the ' + clean);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.name.length - b.name.length;
    });

    const topMatches = matches.slice(0, 5);

    const detailed = await Promise.all(
      topMatches.map(async (m) => {
        try {
          const dRes = await fetch(`https://app.lizardbyte.dev/GameDB/games/${m.id}.json`);
          if (!dRes.ok) return null;
          const g = await dRes.json();

          let year = null;
          if (Array.isArray(g.release_dates) && g.release_dates.length > 0) {
            const years = g.release_dates.map(rd => rd.y).filter(Boolean);
            if (years.length) year = Math.min(...years);
          }

          let creator = null;
          if (Array.isArray(g.involved_companies)) {
            const dev = g.involved_companies.find(c => c.developer);
            if (dev?.company?.name) {
              creator = dev.company.name;
            } else if (g.involved_companies[0]?.company?.name) {
              creator = g.involved_companies[0].company.name;
            }
          }

          let posterUrl = null;
          if (g.cover?.url) {
            posterUrl = (g.cover.url.startsWith('//') ? 'https:' : '') + g.cover.url.replace('/t_thumb/', '/t_1080p/');
          }

          let backdropUrl = null;
          if (g.artworks?.[0]?.url) {
            backdropUrl = (g.artworks[0].url.startsWith('//') ? 'https:' : '') + g.artworks[0].url.replace('/t_thumb/', '/t_1080p/');
          } else if (g.screenshots?.[0]?.url) {
            backdropUrl = (g.screenshots[0].url.startsWith('//') ? 'https:' : '') + g.screenshots[0].url.replace('/t_thumb/', '/t_1080p/');
          }

          const rating = g.rating ? Math.round(g.rating / 10 * 10) / 10 : 0;
          const genres = (g.genres || []).map(gn => gn.name);
          const suggestedFormat = mapIGDBPlatformToFormat(g.platforms || []);

          return {
            id: `igdb-${g.id}`,
            igdb_id: g.id,
            category: 'game',
            title: g.name,
            release_year: year,
            creator: creator || 'Video Game',
            synopsis: (g.summary || g.storyline || '').replace(/<[^>]+>/g, '').trim() || null,
            rating,
            genres,
            poster_url: posterUrl,
            backdrop_url: backdropUrl,
            source: 'IGDB',
            suggested_format: suggestedFormat
          };
        } catch (e) {
          return null;
        }
      })
    );

    return detailed.filter(Boolean);
  } catch (err) {
    console.error('IGDB search error:', err.message);
    return [];
  }
}

/**
 * Searches Video Games using RAWG if configured
 */
async function searchRAWGGames(query) {
  if (!RAWG_API_KEY) return [];
  try {
    const rawgUrl = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=5`;
    const res = await fetch(rawgUrl);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(g => ({
      id: `rawg-${g.id}`,
      rawg_id: g.id,
      category: 'game',
      title: g.name,
      release_year: g.released ? parseInt(g.released.slice(0, 4), 10) : null,
      creator: g.publishers?.[0]?.name || g.developers?.[0]?.name || 'Video Game',
      synopsis: null,
      rating: g.rating ? Math.round(g.rating * 2 * 10) / 10 : 0,
      genres: (g.genres || []).map(gn => gn.name),
      poster_url: g.background_image || null,
      backdrop_url: g.background_image || null,
      source: 'RAWG',
      suggested_format: 'Nintendo Switch'
    }));
  } catch (err) {
    console.error('RAWG search error:', err.message);
    return [];
  }
}

/**
 * Fetches single game details by provider ID
 */
async function getGameDetails(id) {
  if (id.startsWith('steam-')) {
    const appId = id.replace('steam-', '');
    try {
      const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`);
      if (res.ok) {
        const data = await res.json();
        const app = data[appId]?.data;
        if (app) {
          let year = null;
          if (app.release_date?.date) {
            const m = app.release_date.date.match(/\b(19\d{2}|20\d{2})\b/);
            if (m) year = parseInt(m[1], 10);
          }
          const developers = app.developers?.join(', ') || '';
          const publishers = app.publishers?.join(', ') || '';
          const metascore = app.metacritic?.score ? Math.round(app.metacritic.score / 10 * 10) / 10 : 0;
          return {
            category: 'game',
            title: app.name,
            release_year: year,
            creator: developers || publishers || 'Steam',
            runtime: null,
            synopsis: (app.short_description || app.detailed_description || '').replace(/<[^>]+>/g, '').trim() || null,
            rating: metascore,
            genres: (app.genres || []).map(g => g.description),
            poster_url: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900_2x.jpg`,
            backdrop_url: app.screenshots?.[0]?.path_full || app.header_image || null,
            source: 'Steam',
            suggested_format: 'PC Steam'
          };
        }
      }
    } catch (e) {}
  } else if (id.startsWith('igdb-')) {
    const igdbId = id.replace('igdb-', '');
    try {
      const res = await fetch(`https://app.lizardbyte.dev/GameDB/games/${igdbId}.json`);
      if (res.ok) {
        const g = await res.json();
        let year = null;
        if (Array.isArray(g.release_dates) && g.release_dates.length > 0) {
          const years = g.release_dates.map(rd => rd.y).filter(Boolean);
          if (years.length) year = Math.min(...years);
        }
        let creator = null;
        if (Array.isArray(g.involved_companies)) {
          const dev = g.involved_companies.find(c => c.developer);
          if (dev?.company?.name) creator = dev.company.name;
          else if (g.involved_companies[0]?.company?.name) creator = g.involved_companies[0].company.name;
        }
        let posterUrl = null;
        if (g.cover?.url) {
          posterUrl = (g.cover.url.startsWith('//') ? 'https:' : '') + g.cover.url.replace('/t_thumb/', '/t_1080p/');
        }
        let backdropUrl = null;
        if (g.artworks?.[0]?.url) {
          backdropUrl = (g.artworks[0].url.startsWith('//') ? 'https:' : '') + g.artworks[0].url.replace('/t_thumb/', '/t_1080p/');
        } else if (g.screenshots?.[0]?.url) {
          backdropUrl = (g.screenshots[0].url.startsWith('//') ? 'https:' : '') + g.screenshots[0].url.replace('/t_thumb/', '/t_1080p/');
        }
        return {
          category: 'game',
          title: g.name,
          release_year: year,
          creator: creator || 'Video Game',
          runtime: null,
          synopsis: (g.summary || g.storyline || '').replace(/<[^>]+>/g, '').trim() || null,
          rating: g.rating ? Math.round(g.rating / 10 * 10) / 10 : 0,
          genres: (g.genres || []).map(gn => gn.name),
          poster_url: posterUrl,
          backdrop_url: backdropUrl,
          source: 'IGDB',
          suggested_format: mapIGDBPlatformToFormat(g.platforms || [])
        };
      }
    } catch (e) {}
  }
  return null;
}

/**
 * Searches Video Games using Steam and IGDB (Internet Game Database)
 */
async function searchGameMedia(query) {
  const [steamRes, igdbRes, rawgRes] = await Promise.allSettled([
    searchSteamGames(query),
    searchIGDBGames(query),
    searchRAWGGames(query)
  ]);

  const steamGames = steamRes.status === 'fulfilled' ? steamRes.value : [];
  const igdbGames = igdbRes.status === 'fulfilled' ? igdbRes.value : [];
  const rawgGames = rawgRes.status === 'fulfilled' ? rawgRes.value : [];

  const seenIds = new Set();
  const results = [];
  const maxLen = Math.max(igdbGames.length, steamGames.length, rawgGames.length);

  for (let i = 0; i < maxLen; i++) {
    if (i < igdbGames.length) {
      const g = igdbGames[i];
      if (!seenIds.has(g.id)) {
        seenIds.add(g.id);
        results.push(g);
      }
    }
    if (i < steamGames.length) {
      const s = steamGames[i];
      if (!seenIds.has(s.id)) {
        seenIds.add(s.id);
        results.push(s);
      }
    }
    if (i < rawgGames.length) {
      const r = rawgGames[i];
      if (!seenIds.has(r.id)) {
        seenIds.add(r.id);
        results.push(r);
      }
    }
  }

  // Fallback to Wikipedia if no results from Steam or IGDB
  if (results.length === 0) {
    const wiki = await searchWikipediaMedia(query, 'video game');
    return wiki.map(w => ({
      ...w,
      source: 'Wikipedia & Game Database'
    }));
  }

  return results.slice(0, 10);
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
