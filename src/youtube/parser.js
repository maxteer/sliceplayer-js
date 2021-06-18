import * as utils from '../utils';
import { createCipher } from '../utils/cipher';
import formats from '../utils/formats';
import extractor from './extractor';

const EMBED_ASSETS_REGEX = /"jsUrl":\s*"([^"]+)"/;
const ASSETS_REGEX = /"assets":.+?"js":\s*"([^"]+)"/;

export async function getPlayerConfig(url, attempts = 2) {
  let reason;
  let playerConfig;
  let matcher;
  while (attempts-- > 0 && !playerConfig) {
    try {
      let html = await utils.loadURL(url);
      const json = JSON.parse(extractor.extractYtPlayerConfig(html));
      let playabilityStatus;
      if (json.args) {
        if (!json.args['player_response']) {
          throw Error('Player response not found.');
        }

        json.args['player_response'] = JSON.parse(json.args['player_response']);
        playabilityStatus = json.args['player_response'].playabilityStatus;
      } else {
        playabilityStatus = json.playabilityStatus;
      }

      const error = parsePlayabilityStatus(playabilityStatus);
      if (error) {
        attempts = 0;
        throw Error(error);
      }

      if (!json.args) json.args = { player_response: json };

      if (!json.assets) {
        const videoDetails = json.args['player_response'].videoDetails;
        if (videoDetails) {
          const { videoId } = videoDetails;
          html = await utils.loadURL(
            `https://www.youtube.com/embed/${videoId}`,
          );
          matcher = html.match(ASSETS_REGEX);
          if (!matcher) {
            matcher = html.match(EMBED_ASSETS_REGEX);
          }
        }

        if (matcher) {
          json.assets = {
            js: matcher[1],
          };
        }
      }

      playerConfig = json;
    } catch (error) {
      reason = error;
    }
  }

  if (playerConfig) {
    return playerConfig;
  }

  throw reason;
}

export function getVideoDetails(config) {
  const playerResponse = config.args['player_response'];

  if (playerResponse.videoDetails) {
    const videoDetails = playerResponse.videoDetails;
    let liveHLSUrl = null;
    if (videoDetails.isLive) {
      if (playerResponse.streamingData) {
        liveHLSUrl = playerResponse.streamingData.hlsManifestUrl;
      }
    }
    return {
      videoId: videoDetails.videoId,
      url: `https://www.youtube.com/watch?v=${videoDetails.videoId}`,
      lengthSeconds: parseInt(videoDetails.lengthSeconds),
      thumbnails: videoDetails.thumbnail.thumbnails,
      title: videoDetails.title,
      author: videoDetails.author,
      keywords: videoDetails.keywords,
      shortDescription: videoDetails.shortDescription,
      averageRating: videoDetails.averageRating,
      viewCount: parseInt(videoDetails.viewCount),
      isLive: !!videoDetails.isLive,
      isLiveContent: videoDetails.isLiveContent,
      liveUrl: liveHLSUrl,
    };
  }

  return {};
}

export async function parseFormats(config) {
  const playerResponse = config.args['player_response'];
  if (!playerResponse.streamingData) {
    throw Error('Video streaming data not found.');
  }

  const streamingData = playerResponse.streamingData;
  const formats = [];
  if (streamingData.formats) {
    await populateFormats(formats, streamingData.formats, config, false);
  }
  if (streamingData.adaptiveFormats) {
    await populateFormats(
      formats,
      streamingData.adaptiveFormats,
      config,
      false,
    );
  }
  formats.sort(utils.sortFormats);
  return formats;
}

export async function getInitialData(url, attempts = 2) {
  let reason;
  let initialData;
  while (attempts-- > 0 && !initialData) {
    try {
      const html = await utils.loadURL(url);
      const json = JSON.parse(extractor.extractYtInitialData(html));
      if (json.alerts) {
        const reason = parsePlaylistStatus(json.alerts);
        if (reason) {
          attempts = 0;
          throw Error(reason);
        }
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
}

export function getPlaylistDetails(id, initialData) {
  const title = initialData.metadata.playlistMetadataRenderer.title;
  const sideBarItems = initialData.sidebar.playlistSidebarRenderer.items;
  let author = 'N/A';
  try {
    author =
      sideBarItems[1].playlistSidebarSecondaryInfoRenderer.videoOwner
        .videoOwnerRenderer.title.runs[0].text;
  } catch (ignore) {}

  const stats = sideBarItems[0].playlistSidebarPrimaryInfoRenderer.stats;
  const videoCount = extractNumber(stats[0].runs[0].text);
  let viewCount = 0;
  try {
    viewCount = extractNumber(stats[1].simpleText);
  } catch (error) {}
  const thumbnails =
    sideBarItems[0].playlistSidebarPrimaryInfoRenderer.thumbnailRenderer
      .playlistVideoThumbnailRenderer.thumbnail.thumbnails;
  return {
    id,
    url: `https://www.youtube.com/playlist?list=${id}`,
    thumbnails,
    title,
    author,
    videoCount,
    viewCount,
  };
}

export async function getPlaylistVideos(initialData) {
  let content = null;
  try {
    content =
      initialData.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer
        .content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0]
        .playlistVideoListRenderer;
  } catch (error) {
    throw Error(`Playlist inital data not found: ${error}`);
  }

  const videos = [];
  await populatePlaylist(
    content,
    videos,
    getClientVersionFromContext(initialData.responseContext),
  );
  return videos;
}

const populateFormats = async (formats, jsonFormats, config, isAdaptive) => {
  for (const json of jsonFormats) {
    if (json.type === 'FORMAT_STREAM_TYPE_OTF') {
      continue;
    }

    formats.push(await parseFormat(json, config, isAdaptive));
  }
};

const parseFormat = async (json, config, isAdaptive) => {
  if (json.signatureCipher) {
    const jsonCipher = {};
    const cipherData = json.signatureCipher.replace('\\u0026', '&').split('&');
    for (const data of cipherData) {
      const keyValue = data.split('=');
      jsonCipher[keyValue[0]] = keyValue[1];
    }
    if (!jsonCipher.url) {
      return;
    }

    const urlWithSig = decodeURIComponent(jsonCipher.url);
    const preSigned =
      urlWithSig.includes('signature') ||
      (!jsonCipher.s &&
        (urlWithSig.includes('&sig=') || urlWithSig.includes('&lsig=')));
    if (!preSigned) {
      if (!config.assets || !config.assets.js) {
        throw Error(`Decrypt JavaScript not found.`);
      }

      const jsUrl = `https://youtube.com${config.assets.js}`;
      const cipher = await createCipher(jsUrl);

      const signature = await cipher.getSignature(
        decodeURIComponent(jsonCipher.s),
      );
      json.url = `${urlWithSig}&sig=${signature}`;
    }
  }

  const format = Object.assign({}, formats[json.itag]);
  format.url = json.url;
  format.isAdaptive = isAdaptive;
  format.hasVideo = !!json.qualityLabel;
  format.hasAudio = !!json.audioSampleRate;
  format.container = json.mimeType
    ? json.mimeType.split(';')[0].split('/')[1]
    : null;
  format.codecs = json.mimeType
    ? utils.between(json.mimeType, 'codecs="', '"')
    : null;
  format.isLive = /\/source\/yt_live_broadcast\//.test(json.url);
  format.isHLS = /\/manifest\/hls_(variant|playlist)\//.test(json.url);
  format.isDashMPD = /\/manifest\/dash\//.test(json.url);
  if (format.hasVideo) {
    Object.assign(format, {
      videoInfo: {
        fps: json.fps,
        width: json.width,
        height: json.height,
        quality: json.qualityLabel,
      },
    });
  }
  if (format.hasAudio) {
    Object.assign(format, {
      audioInfo: {
        sampleRate: json.audioSampleRate,
        averageBitrate: json.averageBitrate,
        quality: json.audioQuality.replace('AUDIO_QUALITY_', '').toLowerCase(),
      },
    });
  }
  return format;
};

const populatePlaylist = async (content, videos, clientVersion) => {
  for (const video of content.contents) {
    const renderer = video.playlistVideoRenderer;
    if (renderer) {
      videos.push({
        id: renderer.videoId,
        url: `https://www.youtube.com/watch?v=${renderer.videoId}`,
        author: renderer.shortBylineText
          ? renderer.shortBylineText.runs[0].text
          : 'N/A',
        title: renderer.title.simpleText
          ? renderer.title.simpleText
          : renderer.title.runs[0].text,
        lengthSeconds: parseInt(renderer.lengthSeconds),
        thumbnails: renderer.thumbnail.thumbnails,
        isLive: renderer.thumbnail.thumbnails[0].url.includes(
          '/hqdefault_live.jpg?',
        ),
        isPlayable: renderer.isPlayable,
      });
    }

    const continuation = video.continuationItemRenderer;
    if (continuation) {
      await loadPlaylistContinuation(
        continuation.continuationEndpoint.continuationCommand.token,
        continuation.continuationEndpoint.clickTrackingParams,
        videos,
        clientVersion,
      );
    }
  }
};

const loadPlaylistContinuation = async (
  continuation,
  clickTrackingParams,
  videos,
  clientVersion,
) => {
  try {
    const response = await utils.loadURL(
      `https://www.youtube.com/youtubei/v1/browse?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`,
      {
        context: {
          clickTracking: {
            clickTrackingParams,
          },
          client: {
            clientName: 'WEB',
            clientVersion: '2.20201021.03.00',
          },
        },
        continuation,
      },
      {
        'X-YouTube-Client-Name': '1',
        'X-YouTube-Client-Version': clientVersion,
      },
    );

    let contents;
    if (response.onResponseReceivedActions) {
      contents =
        response.onResponseReceivedActions[0].appendContinuationItemsAction
          .continuationItems;
    } else {
      console.info(`Unknown playlist continuation format: ${response}`);
    }

    await populatePlaylist(
      {
        contents,
      },
      videos,
      clientVersion,
    );
  } catch (error) {
    throw Error(
      `An error occurred while parsing the continuation of the playlist: ${error}`,
    );
  }
};

const getClientVersionFromContext = context => {
  const trackingParams = context.serviceTrackingParams;
  if (!trackingParams) {
    return '2.20200720.00.02';
  }

  for (let ti = 0; ti < trackingParams.length; ti++) {
    const params = trackingParams[ti].params;
    for (let pi = 0; pi < params.length; pi++) {
      if (params[pi].key && params[pi].key === 'cver') {
        return params[pi].value;
      }
    }
  }

  return null;
};

const extractNumber = text => {
  const matcher = text.match(/[0-9, ']+/g);
  if (matcher) return parseInt(matcher[0].replace(/[\, \']/g, ''));
  return 0;
};

const parsePlayabilityStatus = playabilityStatus => {
  if (!playabilityStatus) {
    return 'This video is apparently unavailable.';
  }

  const status = playabilityStatus.status;
  if (status === 'ERROR') {
    return playabilityStatus.reason;
  } else if (status === 'UNPLAYABLE') {
    let reason = playabilityStatus.reason;
    if (playabilityStatus.errorScreen) {
      const errorScreen =
        playabilityStatus.errorScreen.playerErrorMessageRenderer;

      const subreason = errorScreen.subreason;
      if (subreason) {
        if (subreason.simpleText) {
          reason = subreason.simpleText;
        } else if (subreason.runs) {
          reason = '';
          for (const s of subreason.runs) {
            reason += s.text;
          }
        }
      }
    }

    return reason;
  } else if (status === 'LOGIN_REQUIRED') {
    if (playabilityStatus.errorScreen) {
      const reason =
        playabilityStatus.errorScreen.playerErrorMessageRenderer.reason
          .simpleText;
      if (reason === 'Private video') {
        return reason;
      } else if (reason === 'Sign in to confirm your age') {
        // Load from yt.com/embed?
        return 'This video cannot be played without a +18 account.';
      }
    }
  } else if (status !== 'OK') {
    return 'This video cannot be played.';
  }
};

const parsePlaylistStatus = alerts => {
  const alert = alerts[0];
  if (alert) {
    let renderer;
    if (alert.alertRenderer) {
      renderer = alert.alertRenderer;
    } else if (alert.alertWithButtonRenderer) {
      renderer = alert.alertWithButtonRenderer;
      if (renderer.type === 'INFO') return;
    }

    if (!renderer) return;
    if (renderer.text) {
      let reason = '';
      if (alertRenderer.text.simpleText) {
        reason = alertRenderer.text.simpleText;
      } else if (alertRenderer.text.runs) {
        for (const s of alertRenderer.text.runs) {
          reason += s.text;
        }
      }

      throw Error(reason);
    }
  }
};
