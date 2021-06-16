"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }var _parser = require('./parser'); var parser = _interopRequireWildcard(_parser);
var _searchparser = require('./search-parser'); var searcher = _interopRequireWildcard(_searchparser);

const VIDEO_FILTER = 'EgIQAQ==';
const PLAYLIST_FILTER = 'EgIQAw==';
const RESULTS_URL = 'https://www.youtube.com/results';

 const search = async (search, filter, limit) => {
  const ytInitialData = await searcher.getInitialData(
    `${RESULTS_URL}?search_query=${encodeURIComponent(search)}${
      filter ? `&sp=${filter}` : ''
    }`,
  );
  return {
    type: 'search',
    searchResults: await searcher.parseResults(ytInitialData, limit),
  };
}; exports.search = search;

 const searchVideos = async (search, limit = 5) =>
  await module.exports.search(search, VIDEO_FILTER, limit); exports.searchVideos = searchVideos;

 const searchPlaylist = async (search, limit = 5) =>
  await module.exports.search(search, PLAYLIST_FILTER, limit); exports.searchPlaylist = searchPlaylist;

 const getVideo = async videoId => {
  const ytPlayerConfig = await parser.getPlayerConfig(
    `https://www.youtube.com/watch?v=${videoId}`,
  );
  const videoDetails = parser.getVideoDetails(ytPlayerConfig);
  const formats = await parser.parseFormats(ytPlayerConfig);
  return {
    type: 'video',
    details: videoDetails,
    formats,
  };
}; exports.getVideo = getVideo;

 const getPlaylist = async playlistId => {
  const ytInitialData = await parser.getInitialData(
    `https://www.youtube.com/playlist?list=${playlistId}`,
  );
  const playlistDetails = parser.getPlaylistDetails(playlistId, ytInitialData);
  const videos = await parser.getPlaylistVideos(ytInitialData);
  return {
    type: 'playlist',
    details: playlistDetails,
    videos,
  };
}; exports.getPlaylist = getPlaylist;
