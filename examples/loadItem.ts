import 'dotenv/config';
import SlicePlayer, { YoutubeVideo } from '..';

const player = new SlicePlayer({
  spotifyConfig: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    splitSongsInParallel: 1,
  },
});

// Valid URLs
const ytVideo = 'https://www.youtube.com/watch?v=DYcUt0DGK6w';
const ytMusicVideo = 'https://music.youtube.com/watch?v=DYcUt0DGK6w';
const ytPlaylist =
  'https://youtube.com/playlist?list=PL40m373_h6Fk52Q9Ih0zkA9zk9XcCziXT';
const ytMusicPlaylist =
  'https://music.youtube.com/playlist?list=PL40m373_h6Fk52Q9Ih0zkA9zk9XcCziXT';
const spfTrack = 'https://open.spotify.com/track/2HrXRO1Z8xOpirCjqfqoKr';
const spfArtist = 'https://open.spotify.com/artist/1GfHpetDFhvqfm5pceDTrX';
const spfAlbum = 'https://open.spotify.com/album/02pWrAza7AhDJyIdrLSJoI';
const spfPlaylist = 'https://open.spotify.com/playlist/4RYqald16pnbRfcz6gkLeP';

async function load() {
  try {
    // By default the player doesn't search for a music in YouTube, if you want to search a music set the second parameter to true: loadItem('my search', true);
    const item = (await player.loadItem(ytVideo)) as YoutubeVideo;
    // Result: YoutubeVideo
    console.log(JSON.stringify(item.details, null, 4));
  } catch (error) {
    // Handle errors
    console.error(error);
  }
}

load();
