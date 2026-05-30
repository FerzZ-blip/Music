export function hdThumb(url) {
  if (!url) return url;
  if (url.includes('yt3.googleusercontent.com') || url.includes('yt3.ggpht.com')) {
    return url.replace(/=w\d+-h\d+/, '=w800-h800');
  }
  return url;
}

export function getArtistName(track) {
  if (!track) return '';
  if (track.artistName) return track.artistName;
  if (typeof track.artist === 'string') return track.artist;
  if (track.artist?.name) return track.artist.name;
  if (Array.isArray(track.artists)) {
    const first = track.artists[0];
    if (typeof first === 'string') return first;
    if (first?.name) return first.name;
  }
  if (track.author) return track.author;
  if (track.uNm) return track.uNm;
  return '';
}

export function getArtistId(track) {
  if (!track) return null;
  if (track.artist?.id) return track.artist.id;
  if (Array.isArray(track.artists)) {
    const first = track.artists[0];
    if (first?.id) return first.id;
  }
  return null;
}

export function normalizeTrack(t) {
  if (!t) return t;

  if (!t.thumbnail && t.videoId) t.thumbnail = `https://i.ytimg.com/vi/${t.videoId}/maxresdefault.jpg`;
  if (t.thumbnail) t.thumbnail = hdThumb(t.thumbnail);
  if (!t.thumbnail && t.thumbnails?.[0]?.url) t.thumbnail = hdThumb(t.thumbnails[0].url);

  if (Array.isArray(t.artists) && !t.artist) {
    const first = t.artists[0];
    if (typeof first === 'object' && first?.name) {
      t.artist = { name: first.name, id: first.id || null };
      t.artistName = first.name;
    } else if (typeof first === 'string') {
      t.artistName = first;
    }
  } else if (typeof t.artist === 'object' && t.artist?.name) {
    t.artistName = t.artist.name;
  } else if (typeof t.artist === 'string') {
    t.artistName = t.artist;
  }

  if (t.album && typeof t.album === 'object' && t.album?.name) {
    if (t.album.thumbnail) t.album.thumbnail = hdThumb(t.album.thumbnail);
  }

  t.name = t.name || t.title || '';
  t.title = t.title || t.name || '';

  return t;
}

export function normalizeTracks(tracks) {
  if (!tracks) return tracks;
  return Array.isArray(tracks) ? tracks.map(normalizeTrack) : tracks;
}

export function normalizeAlbum(a) {
  if (!a) return a;
  if (a.thumbnail) a.thumbnail = hdThumb(a.thumbnail);
  else if (a.thumbnails?.[0]?.url) a.thumbnail = hdThumb(a.thumbnails[0].url);
  if (a.tracks) a.tracks = normalizeTracks(a.tracks);
  return a;
}
