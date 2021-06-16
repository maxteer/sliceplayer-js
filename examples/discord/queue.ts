import Discord from 'discord.js';

export interface Song {
  videoId: string;
  url: string;
  title: string;
  duration: number;
  thumbnail?: {};
  author: string;
}

export interface Queue {
  textChannel: Discord.Channel;
  channel: Discord.VoiceChannel;
  connection: Discord.VoiceConnection;
  songs: Song[];
}

export default new Map<string, Queue>();
