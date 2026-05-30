import { getLyrics as veromeLyrics } from './verome';

const GENIUS_TOKEN = import.meta.env.VITE_GENIUS_ACCESS_TOKEN;
const MUSIXMATCH_KEY = import.meta.env.VITE_MUSIXMATCH_API_KEY;
const CORS_PROXY = 'https://corsproxy.io/?';

function parseTimestamp(line) {
  const m = line.match(/^\[(\d+):(\d+\.?\d*)\]\s*(.*)/);
  if (m) {
    const seconds = parseInt(m[1]) * 60 + parseFloat(m[2]);
    return { text: m[3].trim(), time: seconds };
  }
  return null;
}

function parseVerome(data) {
  if (!data) return null;
  if (data?.syncedLyrics && typeof data.syncedLyrics === 'string') {
    const lines = data.syncedLyrics.split('\n').filter(Boolean);
    const parsed = lines.map(parseTimestamp).filter((l) => l && l.text);
    if (parsed.length > 0) return parsed;
  }
  if (data?.plainLyrics && typeof data.plainLyrics === 'string') {
    return data.plainLyrics.split('\n').filter(Boolean).map((l) => ({ text: l.trim() }));
  }
  return null;
}

function parseOvh(text) {
  if (!text) return null;
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return null;
  const parsed = lines.map((l) => {
    const t = parseTimestamp(l);
    return t || { text: l.trim() };
  });
  return parsed.some((l) => l.text) ? parsed : null;
}

function parseGeniusHTML(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const containers = doc.querySelectorAll('[data-lyrics-container="true"]');
  if (!containers.length) return null;

  let text = '';
  containers.forEach((el) => {
    const br = el.querySelectorAll('br');
    br.forEach((b) => b.replaceWith('\n'));
    text += el.textContent;
  });

  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return null;
  return lines.map((l) => ({ text: l.trim() }));
}

async function fetchVerome(title, artist) {
  const data = await veromeLyrics(title, artist);
  return parseVerome(data);
}

async function fetchOvh(title, artist) {
  const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data?.error || !data?.lyrics) return null;
  return parseOvh(data.lyrics);
}

function parseMusixmatch(data) {
  const body = data?.message?.body;
  if (!body?.lyrics?.lyrics_body) return null;
  const text = body.lyrics.lyrics_body;
  const lines = text.split('\n').filter((l) => l.trim() && !l.includes('*******'));
  if (lines.length === 0) return null;
  return lines.map((l) => ({ text: l.trim() }));
}

async function fetchMusixmatch(title, artist) {
  if (!MUSIXMATCH_KEY) return null;
  const url = `https://api.musixmatch.com/ws/1.1/matcher.lyrics.get?apikey=${MUSIXMATCH_KEY}&q_track=${encodeURIComponent(title)}&q_artist=${encodeURIComponent(artist)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data?.message?.header?.status_code !== 200) return null;
  return parseMusixmatch(data);
}

async function fetchGenius(title, artist) {
  if (!GENIUS_TOKEN) return null;
  const query = `${title} ${artist}`.trim();
  if (!query) return null;

  const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(query)}`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${GENIUS_TOKEN}` },
  });
  if (!searchRes.ok) return null;
  const searchData = await searchRes.json();
  const hit = searchData?.response?.hits?.[0]?.result;
  if (!hit?.url) return null;

  const pageRes = await fetch(CORS_PROXY + encodeURIComponent(hit.url));
  if (!pageRes.ok) return null;
  const html = await pageRes.text();
  return parseGeniusHTML(html);
}

const sources = [fetchVerome, fetchOvh, fetchMusixmatch, fetchGenius];

export async function fetchLyrics(title, artist) {
  if (!title && !artist) return null;

  for (const source of sources) {
    try {
      const result = await source(title, artist);
      if (result && result.length > 0) {
        return result;
      }
    } catch {}
  }

  return null;
}
