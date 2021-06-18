import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.spotify.com/v1/',
});

const defaultConfig = {
  splitSongsInParallel: 20,
};

export default class SpotifyAPI {
  constructor(config) {
    const { clientId, clientSecret, splitSongsInParallel } = {
      ...defaultConfig,
      ...config,
    };
    if (!clientId) throw Error('Spotify clientId not provided.');
    if (!clientSecret) throw Error('Spotify clientSecret not provided.');
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.splitSongsInParallel = splitSongsInParallel;
    this.expiration = 0;
  }

  async getTrack(trackId) {
    await this.getToken();
    const { name, artists } = (await this.api(`tracks?ids=${trackId}`)).data
      .tracks[0];

    return {
      id: trackId,
      url: `https://open.spotify.com/track/${trackId}`,
      search: `${name} ${artists.map(x => x.name).join(', ')}`,
    };
  }

  async getArtist(artistId) {
    await this.getToken();
    const {
      data: { name, images },
    } = await this.api(`artists/${artistId}`);
    const {
      data: { tracks: items },
    } = await this.api(`artists/${artistId}/top-tracks`, {
      params: {
        market: 'US',
      },
    });

    let order = 1;
    return {
      id: artistId,
      url: `https://open.spotify.com/artist/${artistId}`,
      thumbnails: images,
      title: name,
      author: 'Spotify',
      tracks: items
        .filter(item => item.type === 'track')
        .map(item => ({
          order: order++,
          id: item.id,
          url: `https://open.spotify.com/track/${item.id}`,
          search: `${item.name} ${item.artists.map(x => x.name).join(', ')}`,
        })),
    };
  }

  async getAlbum(albumId) {
    await this.getToken();
    const {
      data: { name, artists, tracks, images },
    } = await this.api(`albums/${albumId}`);
    const owner = artists[0].name;
    const items = tracks.items.concat(await this.loadTracks(tracks.next));

    return {
      id: albumId,
      url: `https://open.spotify.com/album/${albumId}`,
      thumbnails: images,
      title: `${owner} - ${name}`,
      author: owner,
      tracks: items
        .filter(item => item.type === 'track')
        .map(item => ({
          order: item.track_number,
          id: item.id,
          url: `https://open.spotify.com/track/${item.id}`,
          search: `${item.name} ${item.artists.map(x => x.name).join(', ')}`,
        })),
    };
  }

  async getPlaylist(playlistId) {
    await this.getToken();
    const {
      data: {
        name,
        owner: { display_name: owner },
        tracks,
        images,
      },
    } = await this.api(`playlists/${playlistId}`);
    const items = tracks.items.concat(await this.loadTracks(tracks.next));

    let order = 1;
    return {
      id: playlistId,
      url: `https://open.spotify.com/playlist/${playlistId}`,
      thumbnails: images,
      title: name,
      author: owner,
      tracks: items.map(item => ({
        order: order++,
        id: item.id,
        url: `https://open.spotify.com/track/${item.id}`,
        search: `${item.track.name} ${item.track.artists
          .map(x => x.name)
          .join(', ')}`,
      })),
    };
  }

  async loadTracks(nextPage) {
    let items = [];
    while (nextPage) {
      await this.getToken();
      const { data } = await this.api(nextPage);
      items = items.concat(data.items);
      nextPage = data.next;
    }

    return items;
  }

  async api(endpoint, options = {}) {
    return await api.get(endpoint, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
      ...options,
    });
  }

  async getToken() {
    if (Date.now() + 5000 > this.expiration) {
      const auth = Buffer.from(
        `${this.clientId}:${this.clientSecret}`,
      ).toString('base64');
      const response = await axios('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          authorization: `Basic ${auth}`,
          'content-type': 'application/x-www-form-urlencoded',
        },
        data: `grant_type=client_credentials`,
      });

      const { access_token, expires_in } = response.data;
      this.accessToken = access_token;
      this.expiration = Date.now() + expires_in * 1000;
    }
  }
}
