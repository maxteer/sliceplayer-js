"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _utils = require('../utils'); var utils = _interopRequireWildcard(_utils);
var _ = require('./'); var _2 = _interopRequireDefault(_);
var _extractor = require('./extractor'); var _extractor2 = _interopRequireDefault(_extractor);

 async function getInitialData(url, attempts = 2) {
  let reason;
  let initialData;
  while (attempts-- > 0 && !initialData) {
    try {
      const html = await utils.loadURL(url);
      const json = JSON.parse(_extractor2.default.extractYtInitialData(html));

      const reason = parseResultsStatus(json);
      if (reason) {
        attempts = 0;
        throw Error(reason);
      }

      if (!json.contents) throw Error('Content not found');

      initialData = json;
    } catch (error) {
      reason = error;
    }
  }

  if (initialData) {
    return initialData;
  }

  throw reason;
} exports.getInitialData = getInitialData;

 async function parseResults(initialData, limit) {
  let contents = null;
  try {
    contents =
      initialData.contents.twoColumnSearchResultsRenderer.primaryContents
        .sectionListRenderer.contents[0].itemSectionRenderer.contents;
  } catch (error) {
    throw Error(`Results inital data not found: ${error}`);
  }

  const results = [];
  for (const content of contents) {
    if (results.length >= limit) break;

    if (content.videoRenderer) {
      const video = await parseVideo(content.videoRenderer);
      results.push(video);
    } else if (content.playlistRenderer) {
      const playlist = await _2.default.getPlaylist(
        content.playlistRenderer.playlistId,
      );
      results.push({ type: 'playlist', ...playlist });
    }
  }

  return results;
} exports.parseResults = parseResults;

const parseResultsStatus = json => {
  if ((parseInt(json.estimatedResults) || 0) === 0) return 'No results found.';
};

const parseVideo = async videoRenderer => {
  const lengthSeconds = extractVideoLength(videoRenderer);
  const thumbnails = videoRenderer.thumbnail.thumbnails;
  const title = extractTitle(videoRenderer);
  const author = extractAuthor(videoRenderer);
  const shortDescription = extractVideoDescription(videoRenderer);
  let viewCount = NaN;
  const viewCountText = extractVideoViewCount(videoRenderer);
  if (viewCountText) viewCount = extractNumber(viewCountText);

  const isLive = lengthSeconds === -1;

  return {
    type: 'video',
    details: {
      videoId: videoRenderer.videoId,
      url: `https://www.youtube.com/watch?v=${videoRenderer.videoId}`,
      lengthSeconds: lengthSeconds,
      thumbnails,
      title,
      author,
      shortDescription,
      viewCount,
      isLive,
    },
  };
};

const convertHMStoSeconds = hms => {
  const split = hms.split(':');
  let seconds = 0;
  let minutes = 1;

  while (split.length > 0) {
    seconds += minutes * parseInt(split.pop(), 10);
    minutes *= 60;
  }

  return seconds;
};

const extractNumber = text => {
  const matcher = text.match(/[0-9, ']+/g);
  if (matcher) return parseInt(matcher[0].replace(/[\, \']/g, ''));
  return 0;
};

const extractVideoLength = videoRenderer => {
  if (videoRenderer.lengthText) {
    return convertHMStoSeconds(videoRenderer.lengthText.simpleText);
  }

  return -1;
};

const extractTitle = renderer => {
  let title = 'N/A';
  if (renderer.title.simpleText) {
    title = renderer.title.simpleText;
  } else if (renderer.title.runs) {
    title = '';
    for (const s of renderer.title.runs) {
      title += s.text;
    }
  }

  return title;
};

const extractAuthor = renderer => {
  let author = 'N/A';
  if (renderer.ownerText) {
    const ownerText = renderer.ownerText;

    if (ownerText.simpleText) {
      author = ownerText.simpleText;
    } else if (ownerText.runs) {
      author = '';
      for (const s of ownerText.runs) {
        author += s.text;
      }
    }
  } else if (renderer.shortBylineText) {
    const shortBylineText = renderer.shortBylineText;

    if (shortBylineText.simpleText) {
      author = shortBylineText.simpleText;
    } else if (shortBylineText.runs) {
      author = '';
      for (const s of shortBylineText.runs) {
        author += s.text;
      }
    }
  }

  return author;
};

const extractVideoDescription = videoRenderer => {
  let shortDescription = '';
  if (videoRenderer.descriptionSnippet) {
    for (const s of videoRenderer.descriptionSnippet.runs) {
      shortDescription += s.text;
    }
  }

  return shortDescription;
};

const extractVideoViewCount = videoRenderer => {
  let result;
  const viewCountText = videoRenderer.viewCountText;
  if (viewCountText) {
    if (viewCountText.simpleText) {
      result = viewCountText.simpleText.split(' ')[0];
    } else if (viewCountText.runs) {
      result = '';
      for (const s of viewCountText.runs) {
        result += s.text;
      }
    }
  }

  return result;
};
