"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _axios = require('axios'); var _axios2 = _interopRequireDefault(_axios);

const audioEncodingRanks = ['mp4a', 'mp3', 'vorbis', 'aac', 'opus', 'flac'];
const videoEncodingRanks = [
  'mp4v',
  'avc1',
  'Sorenson H.283',
  'MPEG-4 Visual',
  'VP8',
  'VP9',
  'H.264',
];

const getBitrate = format => parseInt(format.bitrate) || 0;
const audioScore = format => {
  const abitrate = format.audioBitrate || 0;
  const aenc = audioEncodingRanks.findIndex(enc => format.codecs.includes(enc));
  return abitrate + aenc / 10;
};
const getResolution = format => {
  const result = /(\d+)p/.exec(format.qualityLabel);
  return result ? parseInt(result[1]) : 0;
};

 function between(haystack, left, right) {
  let position = haystack.indexOf(left);
  if (position === -1) return '';
  haystack = haystack.slice(position + left.length);
  position = haystack.indexOf(right);
  if (position === -1) return '';

  haystack = haystack.slice(0, position);
  return haystack;
} exports.between = between;

 async function loadURL(url, body = null, headers = {}) {
  try {
    headers['User-Agent'] =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36';
    headers['Accept-language'] = 'en-US,en;';

    const response = await _axios2.default.call(void 0, url, {
      method: body !== null ? 'POST' : 'GET',
      headers,
      data: body,
    });
    return response.data;
  } catch (error) {
    throw Error(`Couldn't load URL: ${error.message ? error.message : error}`);
  }
} exports.loadURL = loadURL;

 function splitArray(array, size = 20) {
  return array.reduce((resultArray, item, index) => {
    const currentChunk = Math.floor(index / size);
    if (!resultArray[currentChunk]) resultArray[currentChunk] = [];
    resultArray[currentChunk].push(item);
    return resultArray;
  }, []);
} exports.splitArray = splitArray;

 function getURLInfo(url) {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const params = {};

    const paramsIndex = url.indexOf('?');
    const pathIndex = url.split('/', 3).join('/').length;

    let path = url.substring(pathIndex + 1);
    if (paramsIndex != -1) {
      path = url.substring(pathIndex + 1, paramsIndex);
      for (const split of url.substring(paramsIndex + 1).split('&')) {
        const keyValue = split.split('=');
        params[keyValue[0]] = keyValue[1];
      }
    }

    const uri = {
      protocol: url.substring(0, url.split('/', 2).join('/').length + 1),
      domain: url.substring(url.indexOf('/') + 2, pathIndex),
      path: path,
      params,
    };

    return uri;
  } catch (error) {
    throw Error(`Not a valid URL: ${url}`);
  }
} exports.getURLInfo = getURLInfo;

 function sortFormats(a, b) {
  const aRes = getResolution(a);
  const bRes = getResolution(b);
  const aFeats = ~~!!aRes * 2 + ~~!!a.audioBitrate;
  const bFeats = ~~!!bRes * 2 + ~~!!b.audioBitrate;

  if (aFeats === bFeats) {
    if (aRes === bRes) {
      const aBitrate = getBitrate(a);
      const bBitrate = getBitrate(b);
      if (aBitrate === bBitrate) {
        const aScore = audioScore(a);
        const bScore = audioScore(b);
        if (aScore === bScore) {
          const aVenc = videoEncodingRanks.findIndex(
            enc => a.codecs && a.codecs.includes(enc),
          );
          const bVenc = videoEncodingRanks.findIndex(
            enc => b.codecs && b.codecs.includes(enc),
          );
          return bVenc - aVenc;
        } else {
          return bScore - aScore;
        }
      } else {
        return bBitrate - aBitrate;
      }
    } else {
      return bRes - aRes;
    }
  } else {
    return bFeats - aFeats;
  }
} exports.sortFormats = sortFormats;
