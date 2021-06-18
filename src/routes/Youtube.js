import { getURLInfo } from '../utils';
import * as youtube from '../youtube';

const YOUTU_BE = new RegExp('^(?:http://|https://|)(?:www\\.|)youtu\\.be/.*');
const YOUTUBE_COM = new RegExp(
  '^(?:http://|https://|)(?:www\\.|m\\.|music\\.|)youtube\\.com/.*',
);

export const match = link => link.match(YOUTU_BE) || link.match(YOUTUBE_COM);

export async function get(link) {
  let result;
  if (link.match(YOUTU_BE)) {
    const urlInfo = getURLInfo(link);
    const videoId = urlInfo.path.substring(0, Math.min(videoId.length, 11));
    result = await youtube.getVideo(videoId);
  } else if (link.match(YOUTUBE_COM)) {
    const urlInfo = getURLInfo(link);

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
}
