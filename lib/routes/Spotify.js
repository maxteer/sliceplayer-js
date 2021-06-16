"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }var _utils = require('../utils');
var _youtube = require('../youtube'); var youtube = _interopRequireWildcard(_youtube);

const REGEX =
  /^(?:http:\/\/|https:\/\/|)(open.spotify.com\/(track|artist|album|playlist)\/)([a-zA-Z0-9]+)(.*)$/;

 class Spotify {
  constructor(api) {;Spotify.prototype.__init.call(this);Spotify.prototype.__init2.call(this);
    this.api = api;
  }

  __init() {this.match = link => link.match(REGEX)}

  __init2() {this.get = async link => {
    const { [2]: type, [3]: id } = link.match(REGEX);

    let playlist;
    switch (type) {
      case 'track':
        const track = await this.api.getTrack(id);
        const details = (
          await youtube.searchVideos(track.search, 1)
        ).searchResults.find(r => !r.details.isLiveContent).details;
        return await youtube.getVideo(details.videoId);
      case 'artist':
        playlist = await this.api.getArtist(id);
        break;
      case 'album':
        playlist = await this.api.getAlbum(id);
        break;
      default:
        playlist = await this.api.getPlaylist(id);
        break;
    }

    const splittedTracks = _utils.splitArray.call(void 0, 
      playlist.tracks,
      this.api.splitSongsInParallel,
    );
    delete playlist.tracks;

    const result = {
      details: playlist,
      videos: [],
    };

    await Promise.all(
      splittedTracks.map(async tracks => {
        for (const track of tracks) {
          try {
            const details = (
              await youtube.searchVideos(track.search, 1)
            ).searchResults.find(r => !r.details.isLiveContent).details;
            result.videos.push({
              order: track.order,
              id: details.videoId,
              url: details.url,
              author: details.author,
              title: details.title,
              lengthSeconds: details.lengthSeconds,
              thumbnails: details.thumbnails,
              isLive: false,
              isPlayable: true,
            });
          } catch (ignore) {}
        }
      }),
    );

    result.videos.sort((a, b) => a.order - b.order);
    result.videos.forEach(video => delete video.order);

    return { type: 'playlist', ...result };
  }}
} exports.default = Spotify;

exports. default = Spotify;