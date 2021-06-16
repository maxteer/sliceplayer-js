import SlicePlayer from '../..';

const player = new SlicePlayer({
  spotifyConfig: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    splitSongsInParallel: 1,
  },
});

export default player;
