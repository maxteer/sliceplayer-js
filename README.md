# SlicePlayer

SlicePlayer is an audio player library written in JavaScript which can load audio tracks from YouTube and convert them into a stream for use with [Discord.js](https://discord.js.org/) music bots.

[![NPM](https://img.shields.io/npm/v/sliceplayer-js?style=for-the-badge)](https://npmjs.com/package/sliceplayer-js)
[![License](https://img.shields.io/npm/l/sliceplayer-js?style=for-the-badge)](LICENSE)

## Features

- Load YouTube musics and playlists.
- Load Spotify tracks, top 10 from an artist, playlists, and albums.

## Installation

```bash
# yarn
$ yarn add sliceplayer-js

# npm
$ npm install sliceplayer-js
```

## Usage

### Creating a player instance.

```javascript
# ES Modules
import SlicePlayer from 'sliceplayer-js';
# CommonJS
const SlicePlayer = require('sliceplayer-js').default;

const player = new SlicePlayer({
  spotifyConfig: {
    clientId: 'client_id',
    clientSecret: 'client_secret',
    splitSongsInParallel: 1,
  },
});
```

#### Loading musics and playlists

```javascript
// Valid URLs
const ytVideo = 'https://www.youtube.com/watch?v=DYcUt0DGK6w';
const ytMusicVideo = 'https://music.youtube.com/watch?v=DYcUt0DGK6w';
const ytPlaylist =
  'https://youtube.com/playlist?list=PL40m373_h6Fk52Q9Ih0zkA9zk9XcCziXT';
const ytMusicPlaylist =
  'https://music.youtube.com/playlist?list=PL40m373_h6Fk52Q9Ih0zkA9zk9XcCziXT';
const spfTrack = 'https://open.spotify.com/track/2HrXRO1Z8xOpirCjqfqoKr';
const spfArtist = 'https://open.spotify.com/artist/1GfHpetDFhvqfm5pceDTrX';
const spfAlbum = 'https://open.spotify.com/album/02pWrAza7AhDJyIdrLSJoI';
const spfPlaylist = 'https://open.spotify.com/playlist/4RYqald16pnbRfcz6gkLeP';

async function load() {
  try {
    // By default the player doesn't search for a music in YouTube, if you want to search a music set the second parameter to true: loadItem('my search', true);
    const item = await player.loadItem(ytVideo);
    // Result: YoutubeVideo
    console.log(JSON.stringify(item, null, 4));
  } catch (error) {
    // Handle errors
    console.error(error);
  }
}
```

#### Converting a `YoutubeVideo` to `OpusStream`

```javascript
const item = await player.loadItem(
  'https://www.youtube.com/watch?v=DYcUt0DGK6w',
);
const opusStream = player.videoToStream(item);
```

#### You can find more examples right [here](examples/).

## API

## SlicePlayer

```javascript
new SlicePlayer(playerOptions);
```

#### `playerOptions`

SlicePlayer options.

| Name          | Type   | Default | Description                                    |
| ------------- | ------ | ------- | ---------------------------------------------- |
| spotifyConfig | object | null    | Spotify credentials and config for the player. |

#### `spotifyConfig`

Spotify configuration.

| Name                 | Type   | Default      | Description                                                              |
| -------------------- | ------ | ------------ | ------------------------------------------------------------------------ |
| clientId             | string | **Required** | Spotify Web API Client ID.                                               |
| clientSecret         | string | **Required** | Spotify Web API Client Secret.                                           |
| splitSongsInParallel | number | 20           | The number of songs per list loaded in parallel when loading a playlist. |

### Members

| Name    | Type       | Information               |
| ------- | ---------- | ------------------------- |
| youtube | YoutubeAPI | YoutubeAPI instance used. |
| spotify | SpotifyAPI | SpotifyAPI instance used. |

### Functions

#### `loadItem(arg, search)`

Load a item from URL or Search string.

| Param  | Type    | Default      | Description                                |
| ------ | ------- | ------------ | ------------------------------------------ |
| arg    | string  | **Required** | URL or Search string if search is enabled. |
| search | boolean | false        | Enable or disable YouTube search.          |

**throws** `Error` if nothing has found.\
**returns** `Promise<SliceItem>`.

#### `videoToStream(video)`

Convert a video into a Stream.

| Param | Type         | Default      | Description                         |
| ----- | ------------ | ------------ | ----------------------------------- |
| video | YoutubeVideo | **Required** | The Video to convert into a Stream. |

**throws** `Error` if the video doesn't have formats or suitable audio formats.\
**returns** `OpusStream`.

## YoutubeAPI

### Functions

#### `searchVideos(search, limit)`

Load search videos using https://www.youtube.com/results

| Param  | Type   | Default      | Description            |
| ------ | ------ | ------------ | ---------------------- |
| search | string | **Required** | Video title to search. |
| limit  | number | 5            | Results parsed limit.  |

**throws** `Error` if unexpected error occurred while parsing data.\
**returns** `Promise<YoutubeSearch>`.

#### `searchPlaylists(search, limit)`

Load search playlists using https://www.youtube.com/results

| Param  | Type   | Default      | Description               |
| ------ | ------ | ------------ | ------------------------- |
| search | string | **Required** | Playlist title to search. |
| limit  | number | 5            | Results parsed limit.     |

**throws** `Error` if unexpected error occurred while parsing data.\
**returns** `Promise<YoutubeSearch>`.

#### `getVideo(videoId)`

Get a Youtube Video data from videoId

| Param   | Type   | Default      | Description                          |
| ------- | ------ | ------------ | ------------------------------------ |
| videoId | string | **Required** | Youtube Video ID. e.G: `DYcUt0DGK6w` |

**throws** `Error` if unexpected error occurred while parsing data.\
**returns** `Promise<YoutubeVideo>`.

#### `getPlaylist(playlistId)`

Get a Youtube Playlist data from playlistId

| Param      | Type   | Default      | Description                                                    |
| ---------- | ------ | ------------ | -------------------------------------------------------------- |
| playlistId | string | **Required** | Youtube Playlist ID. e.G: `PL40m373_h6Fk52Q9Ih0zkA9zk9XcCziXT` |

**throws** `Error` if unexpected error occurred while parsing data.\
**returns** `Promise<YoutubePlaylist>`.

## SpotifyAPI

### Functions

#### `getTrack(trackId)`

Load a track from Spotify using [Spotify Web API](https://developer.spotify.com/dashboard/).

| Param   | Type   | Default      | Description                                     |
| ------- | ------ | ------------ | ----------------------------------------------- |
| trackId | string | **Required** | Spotify Track ID. e.G: `2HrXRO1Z8xOpirCjqfqoKr` |

**throws** `Error` if unexpected error occurred while parsing data.\
**returns** `Promise<SpotifyTrack>`.

#### `getArtist(artistId)`

Load top 10 musics from a Spotify artist using [Spotify Web API](https://developer.spotify.com/dashboard/).

| Param    | Type   | Default      | Description                                      |
| -------- | ------ | ------------ | ------------------------------------------------ |
| artistId | string | **Required** | Spotify Artist ID. e.G: `1GfHpetDFhvqfm5pceDTrX` |

**throws** `Error` if unexpected error occurred while parsing data.\
**returns** `Promise<SpotifyArtist>`.

#### `getAlbum(albumId)`

Load musics from a Spotify album using [Spotify Web API](https://developer.spotify.com/dashboard/).

| Param   | Type   | Default      | Description                                     |
| ------- | ------ | ------------ | ----------------------------------------------- |
| albumId | string | **Required** | Spotify Album ID. e.G: `02pWrAza7AhDJyIdrLSJoI` |

**throws** `Error` if unexpected error occurred while parsing data.\
**returns** `Promise<SpotifyAlbum>`.

#### `getPlaylist(playlistId)`

Load musics from a Spotify playlist using [Spotify Web API](https://developer.spotify.com/dashboard/).

| Param      | Type   | Default      | Description                                        |
| ---------- | ------ | ------------ | -------------------------------------------------- |
| playlistId | string | **Required** | Spotify Playlist ID. e.G: `4RYqald16pnbRfcz6gkLeP` |

**throws** `Error` if unexpected error occurred while parsing data.\
**returns** `Promise<SpotifyPlaylist>`.

## YoutubeVideo

### Members

| Name    | Type                 | Default | Description           |
| ------- | -------------------- | ------- | --------------------- |
| type    | string               | video   | The type of SliceItem |
| details | YoutubeVideoDetails  |         | Video details         |
| formats | YoutubeVideoFormat[] |         | Video formats         |

## YoutubePlaylist

### Members

| Name    | Type                   | Default  | Description           |
| ------- | ---------------------- | -------- | --------------------- |
| type    | string                 | playlist | The type of SliceItem |
| details | YoutubePlaylistDetails |          | Playlist details      |
| formats | YoutubePlaylistVideo[] |          | Playlist videos       |

## YoutubeVideoDetails

### Members

| Name             | Type               |
| ---------------- | ------------------ |
| videoId          | string             |
| url              | string             |
| lengthSeconds    | number             |
| thumbnails       | YoutubeThumbnail[] |
| title            | string             |
| author           | string             |
| keywords         | string             |
| shortDescription | string             |
| averageRating    | number             |
| viewCount        | number             |
| isLive           | boolean            |
| isLiveContent    | boolean            |
| liveUrl          | string or null     |

## YoutubeVideoFormat

### Members

| Name         | Type           |
| ------------ | -------------- |
| mimeType     | string         |
| qualityLabel | string or null |
| bitrate      | number         |
| audioBitrate | number or null |
| url          | string         |
| isAdaptive   | boolean        |
| hasVideo     | boolean        |
| hasAudio     | boolean        |
| container    | number         |
| codecs       | string         |
| isLive       | boolean        |
| isHLS        | boolean        |
| isDashMPD    | boolean        |
| liveUrl      | string or null |
| videoInfo    | object         |
| audioInfo    | object         |

## YoutubePlaylistDetails

### Members

| Name       | Type               |
| ---------- | ------------------ |
| id         | string             |
| url        | string             |
| thumbnails | YoutubeThumbnail[] |
| title      | string             |
| author     | string             |
| videoCount | number             |
| viewCount  | number             |

## YoutubePlaylistVideo

### Members

| Name          | Type               |
| ------------- | ------------------ |
| id            | string             |
| url           | string             |
| author        | string             |
| title         | string             |
| lengthSeconds | number             |
| thumbnails    | YoutubeThumbnail[] |
| isLive        | boolean            |
| isPlayable    | boolean            |

## FAQ

#### How can i get my Spotify credentials?

You need to create a Spotify Application right [here](https://developer.spotify.com/dashboard/).

#### The YoutubeVideo from a playlist doesn't have formats, how i can play that?

You need to call the method `player.youtube.getVideo(playlistVideo.details.id)` to get a video with formats, youtube doesn't provide video formats until the watch page.

## Authors

- [@Maxteer](https://www.github.com/maxteer)

## License

SlicePlayer is [MIT licensed](LICENSE).
