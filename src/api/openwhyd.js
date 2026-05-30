const HOT_URL = 'https://openwhyd.org/hot?format=json&limit=20';

export async function getHotTracks() {
  const res = await fetch(HOT_URL);
  if (!res.ok) throw new Error(`OpenWhyd error: ${res.status}`);
  return res.json();
}

export async function getUserProfile(uid) {
  const res = await fetch(`https://openwhyd.org/u/${uid}?format=json&limit=20`);
  if (!res.ok) throw new Error(`OpenWhyd error: ${res.status}`);
  return res.json();
}

export async function getPlaylist(uid, pid) {
  const res = await fetch(`https://openwhyd.org/u/${uid}/playlist/${pid}?format=json&limit=50`);
  if (!res.ok) throw new Error(`OpenWhyd error: ${res.status}`);
  return res.json();
}

export function parseEid(eId) {
  if (eId.startsWith('/yt/')) {
    return { type: 'youtube', id: eId.slice(4) };
  }
  if (eId.startsWith('/sc/')) {
    const rest = eId.slice(4);
    const [uri] = rest.split('#');
    return { type: 'soundcloud', id: uri };
  }
  return { type: 'unknown', id: eId };
}
