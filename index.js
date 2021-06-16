const prism = require('prism-media');
const SpotifyAPI = require('./lib/spotify').default;
const YoutubeAPI = require('./lib/youtube');

const YoutubeRoute = require('./lib/routes/Youtube');
const SpotifyRoute = require('./lib/routes/Spotify').default;

const defaultOptions = {
  spotifyConfig: null,
};

class SlicePlayer {
  constructor(options) {
    const { spotifyConfig } = { ...defaultOptions, ...options };

    this.youtube = YoutubeAPI;
    this.routes = [YoutubeRoute];
    if (spotifyConfig !== null) {
      this.routes = [
        ...this.routes,
        new SpotifyRoute(new SpotifyAPI(spotifyConfig)),
      ];
    }
  }

  loadItem = async (arg, search = false) => {
    if (!Array.isArray(arg)) {
      arg = arg.split(' ');
    }

    const link = arg[0];
    let item;
    const route = this.routes.find(route => route.match(link));
    if (route) {
      const result = await route.get(link);
      if (result) return result;
    }

    if (search) {
      const items = await this.youtube.search(arg.join(' '), '', 5);
      if (items) return { type: 'search', ...items };
    }

    throw Error(`Nothing has found.`);
  };

  videoToStream = video => {
    if (!video.formats) throw Error(`The video doesn't contains formats.`);
    let filter = format => format.audioBitrate;
    if (video.details.isLiveContent)
      filter = format => format.audioBitrate && format.isHLS;
    const formats = video.formats
      .filter(filter)
      .sort((a, b) => b.audioBitrate - a.audioBitrate);
    const bestFormat = formats.find(format => !format.bitrate) || formats[0];
    if (!bestFormat) throw Error('No suitable audio format found.');
    const transcoder = new prism.FFmpeg({
      args: [
        '-reconnect',
        '1',
        '-reconnect_streamed',
        '1',
        '-reconnect_delay_max',
        '5',
        '-i',
        bestFormat.url,
        '-analyzeduration',
        '0',
        '-loglevel',
        '0',
        '-f',
        's16le',
        '-ar',
        '48000',
        '-ac',
        '2',
      ],
    });
    const opus = new prism.opus.Encoder({
      rate: 48000,
      channels: 2,
      frameSize: 960,
    });
    const stream = transcoder.pipe(opus);
    stream.on('close', () => {
      transcoder.destroy();
      opus.destroy();
    });
    return stream;
  };
}

module.exports = SlicePlayer;
