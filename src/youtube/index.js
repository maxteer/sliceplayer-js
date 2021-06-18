import * as parser from './parser';
import * as searcher from './search-parser';

const VIDEO_FILTER = 'EgIQAQ==';
const PLAYLIST_FILTER = 'EgIQAw==';
const RESULTS_URL = 'https://www.youtube.com/results';

export const search = async (search, filter, limit) => {
  const ytInitialData = await searcher.getInitialData(
    `${RESULTS_URL}?search_query=${encodeURIComponent(search)}${
      filter ? `&sp=${filter}` : ''
    }`,
  );
  return {
    type: 'search',
    searchResults: await searcher.parseResults(ytInitialData, limit),
  };
};

export const searchVideos = async (search, limit = 5) =>
  await module.exports.search(search, VIDEO_FILTER, limit);

export const searchPlaylist = async (search, limit = 5) =>
  await module.exports.search(search, PLAYLIST_FILTER, limit);

export const getVideo = async videoId => {
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
};

export const getPlaylist = async playlistId => {
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
};
