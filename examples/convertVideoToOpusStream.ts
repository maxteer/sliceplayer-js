import 'dotenv/config';
import SlicePlayer, { YoutubeVideo } from '..';

const player = new SlicePlayer({
  spotifyConfig: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    splitSongsInParallel: 1,
  },
});

async function load() {
  try {
    const item = (await player.loadItem(
      'https://www.youtube.com/watch?v=DYcUt0DGK6w',
    )) as YoutubeVideo;
    const opusStream = player.videoToStream(item);
    console.log(opusStream);
  } catch (error) {
    // Handle errors
    console.error(error);
  }
}

load();
