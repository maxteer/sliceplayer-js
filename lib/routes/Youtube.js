"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }var _utils = require('../utils');
var _youtube = require('../youtube'); var youtube = _interopRequireWildcard(_youtube);

const YOUTU_BE = new RegExp('^(?:http://|https://|)(?:www\\.|)youtu\\.be/.*');
const YOUTUBE_COM = new RegExp(
  '^(?:http://|https://|)(?:www\\.|m\\.|music\\.|)youtube\\.com/.*',
);

 const match = link => link.match(YOUTU_BE) || link.match(YOUTUBE_COM); exports.match = match;

 async function get(link) {
  let result;
  if (link.match(YOUTU_BE)) {
    const urlInfo = _utils.getURLInfo.call(void 0, link);
    const videoId = urlInfo.path.substring(0, Math.min(videoId.length, 11));
    result = await youtube.getVideo(videoId);
  } else if (link.match(YOUTUBE_COM)) {
    const urlInfo = _utils.getURLInfo.call(void 0, link);

    if (urlInfo) {
      const path = urlInfo.path;
      if (path === 'watch') {
        const videoId = urlInfo.params.v;
        if (videoId) {
          const result = await youtube.getVideo(videoId);
          if (result) return { type: 'video', ...result };
        }
      } else if (path === 'playlist') {
        const playlistId = urlInfo.params.list;
        if (playlistId) {
          const result = await youtube.getPlaylist(playlistId);
          if (result) return { type: 'playlist', ...result };
        }
      }
    }
  }

  if (result) return { type: 'video', ...result };
} exports.get = get;
