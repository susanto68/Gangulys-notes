/**
 * Fetch all playlists and videos from the YouTube channel "Knowledge Boat"
 * and write a grouped JSON file consumable by the website's videos page.
 *
 * Usage:
 *   node fetch_knowledgeboat_videos.js --out public/videos.json --channel "Knowledge Boat"
 *   # or set YT_API_KEY via .env or environment
 *
 * Notes:
 *  - Uses only Node built-ins (https/url/fs) + a tiny .env reader below (no deps).
 *  - Groups by playlist; each playlist title is used as category header.
 */

const fs = require('fs');
const https = require('https');
const { URL } = require('url');
const path = require('path');

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

function loadDotEnv(dotenvPath = '.env') {
  try {
    if (!fs.existsSync(dotenvPath)) return;
    const txt = fs.readFileSync(dotenvPath, 'utf8');
    for (const rawLine of txt.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const idx = line.indexOf('=');
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (key && !(key in process.env)) process.env[key] = val;
    }
  } catch {}
}

loadDotEnv();

function httpGetJson(endpoint, params) {
  const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const status = res.statusCode || 0;
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        if (status < 200 || status >= 300) {
          let details = '';
          try { details = JSON.parse(body)?.error?.message || body; } catch { details = body; }
          const err = new Error(`HTTP ${status} for ${url} -> ${details}`);
          err.statusCode = status;
          err.responseBody = body;
          return reject(err);
        }
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function findChannelId(apiKey, channelName) {
  const search = await httpGetJson('search', {
    part: 'snippet',
    q: channelName,
    type: 'channel',
    maxResults: 5,
    key: apiKey,
  });
  const items = search.items || [];
  if (!items.length) throw new Error(`No channel results for query: ${channelName}`);
  const normalized = channelName.trim().toLowerCase();
  const exact = items.find((it) => (it.snippet?.title || '').trim().toLowerCase() === normalized);
  const target = exact || items[0];
  return target.snippet.channelId;
}

async function listPlaylists(apiKey, channelId) {
  const result = [];
  let pageToken = undefined;
  do {
    const payload = await httpGetJson('playlists', {
      part: 'snippet,contentDetails',
      channelId,
      maxResults: 50,
      pageToken,
      key: apiKey,
    });
    for (const it of payload.items || []) {
      result.push({
        id: it.id,
        title: it.snippet?.title || '',
        description: it.snippet?.description || '',
        itemCount: it.contentDetails?.itemCount,
      });
    }
    pageToken = payload.nextPageToken;
  } while (pageToken);
  return result;
}

async function listVideosInPlaylist(apiKey, playlistId) {
  const videos = [];
  let pageToken = undefined;
  do {
    const payload = await httpGetJson('playlistItems', {
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: 50,
      pageToken,
      key: apiKey,
    });
    for (const it of payload.items || []) {
      const snippet = it.snippet || {};
      const content = it.contentDetails || {};
      const videoId = content.videoId;
      if (!videoId) continue;
      const thumbs = snippet.thumbnails || {};
      const thumbUrl =
        thumbs.maxres?.url ||
        thumbs.standard?.url ||
        thumbs.high?.url ||
        thumbs.medium?.url ||
        thumbs.default?.url ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      videos.push({
        id: videoId,
        title: snippet.title || '',
        description: snippet.description || '',
        publishedAt: snippet.publishedAt,
        thumbnail: thumbUrl,
        position: snippet.position,
      });
    }
    pageToken = payload.nextPageToken;
  } while (pageToken);
  return videos;
}

function fetchBody(u) {
  return new Promise((resolve, reject) => {
    https.get(u, (res) => {
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }).on('error', reject);
  });
}

function extractChannelIdFromHtml(html) {
  const m1 = html.match(/"channelId":"(UC[0-9A-Za-z_-]{20,})"/);
  if (m1 && m1[1]) return m1[1];
  const m2 = html.match(/"externalId":"(UC[0-9A-Za-z_-]{20,})"/);
  if (m2 && m2[1]) return m2[1];
  const m3 = html.match(/\/[cC]hannel\/(UC[0-9A-Za-z_-]{20,})/);
  if (m3 && m3[1]) return m3[1];
  return '';
}

async function fetchChannelIdFromHandle(handle) {
  const handleClean = handle.startsWith('@') ? handle : `@${handle}`;
  const tryUrls = [
    `https://www.youtube.com/${handleClean}`,
    `https://www.youtube.com/${handleClean}/about`,
  ];
  for (const u of tryUrls) {
    const body = await fetchBody(u);
    const id = extractChannelIdFromHtml(body);
    if (id) return id;
  }
  throw new Error(`Could not resolve channelId from handle ${handleClean}`);
}

async function fetchChannelIdFromUrl(url) {
  const body = await fetchBody(url);
  const id = extractChannelIdFromHtml(body);
  if (id) return id;
  throw new Error(`Could not resolve channelId from url ${url}`);
}

async function buildChannelCatalog(apiKey, channelName, opts = {}) {
  let channelId = opts.channelId || '';
  // If user passed a UC* id via --channel, use it directly
  if (!channelId && /^UC[0-9A-Za-z_-]{20,}$/.test(channelName)) channelId = channelName;
  // If a handle was provided, resolve it without hitting the API search
  if (!channelId && opts.handle) {
    channelId = await fetchChannelIdFromHandle(opts.handle);
  }
  // If a full YouTube URL was provided, resolve from page source
  if (!channelId && opts.url) {
    channelId = await fetchChannelIdFromUrl(opts.url);
  }
  if (!channelId) channelId = await findChannelId(apiKey, channelName);
  const playlists = await listPlaylists(apiKey, channelId);
  const categories = [];
  for (const pl of playlists) {
    const vids = await listVideosInPlaylist(apiKey, pl.id);
    if (!vids.length) continue;
    const vidsSorted = [...vids].sort((a, b) => {
      const ap = a.publishedAt || '';
      const bp = b.publishedAt || '';
      if (ap === bp) return (b.position || 0) - (a.position || 0);
      return ap < bp ? 1 : -1;
    });
    categories.push({ id: pl.id, title: pl.title, videos: vidsSorted });
    await new Promise((r) => setTimeout(r, 150));
  }
  categories.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
  return {
    channel: { name: channelName, id: channelId },
    categories,
    generatedAt: new Date().toISOString().replace(/\..+/, 'Z'),
  };
}

async function main() {
  const argv = process.argv.slice(2);
  const outIdx = argv.indexOf('--out');
  const outPath = outIdx !== -1 ? argv[outIdx + 1] : path.join('public', 'videos.json');
  const chIdx = argv.indexOf('--channel');
  const channelName = chIdx !== -1 ? argv[chIdx + 1] : 'Knowledge Boat';
  const idIdx = argv.indexOf('--channelId');
  const channelId = idIdx !== -1 ? argv[idIdx + 1] : '';
  const handleIdx = argv.indexOf('--handle');
  const handle = handleIdx !== -1 ? argv[handleIdx + 1] : '';
  const urlIdx = argv.indexOf('--url');
  const url = urlIdx !== -1 ? argv[urlIdx + 1] : '';
  const apiKey = process.env.YT_API_KEY || '';
  if (!apiKey) {
    console.error('Missing API key. Set YT_API_KEY in .env or environment.');
    process.exit(2);
  }

  try {
    const catalog = await buildChannelCatalog(apiKey, channelName, { channelId, handle, url });
    const dir = path.dirname(outPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2), 'utf8');
    const total = catalog.categories.reduce((acc, c) => acc + (c.videos?.length || 0), 0);
    console.log(`Wrote ${outPath} with ${total} videos across ${catalog.categories.length} categories.`);
  } catch (e) {
    console.error('Error while fetching data:', e?.message || e);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}


