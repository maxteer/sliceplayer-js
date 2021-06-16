import 'dotenv/config';
import Discord from 'discord.js';

import playCommand from './discord/playCommand';

const client = new Discord.Client({
  ws: {
    intents: [
      'GUILDS',
      'GUILD_MEMBERS',
      'GUILD_PRESENCES',
      'GUILD_MESSAGES',
      'GUILD_MESSAGE_REACTIONS',
      'GUILD_MESSAGE_TYPING',
      'GUILD_VOICE_STATES',
    ],
  },
});

client.on('ready', () => console.log('Bot connected.'));

client.on('message', async message => {
  if (message.author.bot) return;

  const prefix = '!';
  if (message.guild) {
    if (message.content.startsWith(prefix)) {
      const args = message.content.slice(prefix.length).trim().split(' ');
      const name = args.shift().toLowerCase();
      if (name === 'play') {
        message.channel.startTyping();
        playCommand(message, args);
      }
    }
  }
});

client.login(process.env.BOT_TOKEN);
