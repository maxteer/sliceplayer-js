import Discord from 'discord.js';
import queue, { Song } from './queue';
import player from './player';
import {
  SliceItem,
  YoutubePlaylist,
  YoutubeSearch,
  YoutubeSearchItem,
  YoutubeVideo,
} from '../..';

const play = async (song: Song, message: Discord.Message) => {
  const { guild } = message;
  const serverQueue = queue.get(guild.id);
  if (!song) {
    return serverQueue.channel.leave();
  }

  try {
    const video = await player.youtube.getVideo(song.videoId);
    const stream = player.videoToStream(video);
    const dispatcher = serverQueue.connection
      .play(stream, { type: 'opus' })
      .on('finish', () => {
        serverQueue.songs.shift();
        play(serverQueue.songs[0], message);
      })
      .on('error', (error: any) => {
        console.error(error);
        serverQueue.songs.shift();
        play(serverQueue.songs[0], message);
      });
    dispatcher.setVolumeLogarithmic(1);

    message.channel.send(`🎶 Now playing: ${song.title}`);
  } catch (error) {
    console.error(error);
    if (serverQueue) {
      serverQueue.songs.shift();
      play(serverQueue.songs[0], message);
    }

    return message.channel.send(`❌ Unable to play ${song.url}: ${error}`);
  }
};

async function loadPlaylist(
  message: Discord.Message,
  playlist: YoutubePlaylist,
) {
  const { channel } = message.member.voice;
  const videos = playlist.videos.filter(video => video.isPlayable);

  const queueConstruct = {
    textChannel: message.channel,
    channel,
    connection: null,
    songs: [],
  };

  let time = 0;
  const serverQueue = queue.get(message.guild.id);
  videos.forEach(video => {
    const song = {
      videoId: video.id,
      url: video.url,
      title: video.title,
      duration: video.lengthSeconds,
      thumbnail: Object.values(video.thumbnails).pop(),
      author: video.author,
    };

    if (serverQueue) {
      serverQueue.songs.push(song);
    } else {
      queueConstruct.songs.push(song);
    }

    time += video.lengthSeconds;
  });

  message.channel.stopTyping(true);
  message.channel.send(
    `✅ ${videos.length} songs have been added to the queue.`,
  );

  if (!serverQueue) {
    queue.set(message.guild.id, queueConstruct);
    try {
      queueConstruct.connection = await channel.join();
      queueConstruct.connection.voice.setSelfDeaf(true);
      queueConstruct.connection.on('disconnect', () => {
        const serverQueue = queue.get(message.guild.id);
        if (serverQueue) {
          serverQueue.songs = [];
          if (serverQueue.connection.dispatcher) {
            serverQueue.connection.dispatcher.end();
          }
          queue.delete(message.guild.id);
        }
      });
      play(queueConstruct.songs[0], message);
    } catch (error) {
      console.error(error);
      queue.delete(message.guild.id);
      channel.leave();
      return message.channel.send(`❌ Unable to connect to channel: ${error}`);
    }
  }
}

export default async (message: Discord.Message, args: string[]) => {
  const { channel } = message.member.voice;
  if (!channel) return message.channel.send(`❌ You're not in a Voice channel`);

  const permissions = channel.permissionsFor(message.client.user);
  if (!permissions.has('CONNECT'))
    return message.channel.send(`❌ I can't connect to your Voice Channel.`);
  if (!permissions.has('SPEAK'))
    return message.channel.send(`❌ I can't speak in your Voice Channel.`);

  let song: Song;
  try {
    let item: SliceItem;
    try {
      item = await player.loadItem(args.join(' '), true);
    } catch (error) {
      if (error.message !== 'Nothing has found.') {
        throw error;
      }
      return message.channel.send(`❌ ${error.message}`);
    }

    if (item.type === 'search') {
      console.log('search');
      item = (item as YoutubeSearch<YoutubeSearchItem>).searchResults[0];
      if (item.type === 'playlist') {
        return loadPlaylist(message, item as YoutubePlaylist);
      }
    } else if (item.type === 'playlist') {
      console.log('playlist');
      return loadPlaylist(message, item as YoutubePlaylist);
    }

    const video = item as YoutubeVideo;
    song = {
      videoId: video.details.videoId,
      url: video.details.url,
      title: video.details.title,
      duration: video.details.lengthSeconds,
      thumbnail: video.details.thumbnails.pop(),
      author: video.details.author,
    };
  } catch (error) {
    console.error(error);
    message.channel.stopTyping(true);
    return message.channel.send(
      `❌ An error occurred while loading ${args.join(' ')}: ${error}`,
    );
  }

  message.channel.stopTyping(true);
  let serverQueue = queue.get(message.guild.id);
  if (serverQueue) {
    serverQueue.songs.push(song);
    return message.channel.send(`✅ ${song.title} added to queue!`);
  }

  const queueConstruct = {
    textChannel: message.channel,
    channel,
    connection: null,
    songs: [song],
  };

  queue.set(message.guild.id, queueConstruct);
  try {
    queueConstruct.connection = await channel.join();
    queueConstruct.connection.voice.setSelfDeaf(true);
    queueConstruct.connection.on('disconnect', () => {
      const serverQueue = queue.get(message.guild.id);
      if (serverQueue) {
        serverQueue.songs = [];
        if (serverQueue.connection.dispatcher) {
          serverQueue.connection.dispatcher.end();
        }
        queue.delete(message.guild.id);
      }
    });
    play(queueConstruct.songs[0], message);
  } catch (error) {
    console.error(error);
    queue.delete(message.guild.id);
    channel.leave();
    return message.channel.send(`❌ Unable to connect to channel: ${error}`);
  }
};
