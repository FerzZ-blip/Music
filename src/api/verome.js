const BASE = 'https://verome-api.deno.dev';

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Verome error: ${res.status}`);
  return res.json();
}

export async function searchTracks(query, filter = 'songs') {
  return fetchJSON(`${BASE}/api/search?q=${encodeURIComponent(query)}&filter=${filter}`);
}

export async function searchSuggestions(query) {
  return fetchJSON(`${BASE}/api/search/suggestions?q=${encodeURIComponent(query)}`);
}

export async function getSong(videoId) {
  return fetchJSON(`${BASE}/api/songs/${videoId}`);
}

export async function getTrending(country = 'US') {
  return fetchJSON(`${BASE}/api/trending?country=${country}`);
}

export async function getCharts(country = 'US') {
  return fetchJSON(`${BASE}/api/charts?country=${country}`);
}

export async function getTopTracks(country = 'US') {
  return fetchJSON(`${BASE}/api/top/tracks?country=${country}`);
}

export async function getRadio(videoId) {
  return fetchJSON(`${BASE}/api/radio?videoId=${videoId}`);
}

export async function getRelated(videoId) {
  return fetchJSON(`${BASE}/api/related/${videoId}`);
}

export async function getLyrics(title, artist) {
  return fetchJSON(`${BASE}/api/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
}

export async function getStream(id) {
  return fetchJSON(`${BASE}/api/stream?id=${id}`);
}

export async function getArtist(browseId) {
  return fetchJSON(`${BASE}/api/artists/${browseId}`);
}

export async function getAlbum(browseId) {
  return fetchJSON(`${BASE}/api/albums/${browseId}`);
}

export async function getPlaylist(playlistId) {
  return fetchJSON(`${BASE}/api/playlists/${playlistId}`);
}

export async function getMoods() {
  return fetchJSON(`${BASE}/api/moods`);
}
