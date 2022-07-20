const { Player } = require('discord-player');
const { Client, Intents, MessageEmbed } = require('discord.js');
const  axios  = require('axios');
const { api } = require('./config.json');

global.client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES
    ],
    disableMentions: 'everyone',
});

client.config = require('./config');

global.player = new Player(client, client.config.opt.discordPlayer);


global.api = axios.create({
    baseURL: api.base_url,
    headers: {'xc-auth': api.token}
});

require('./src/loader');
require('./src/events.js');

client.login(client.config.app.token);

client.errorLog = (e, message) => {
    if(client.config.app.debug_mode){
        const channel = client.channels.cache.get(client.config.app.error_log_channel)
        const embed = new MessageEmbed({
            color: 'RED'
        })
        embed.setAuthor(`❌ An error has occured`)
        embed.setThumbnail(client.user.displayAvatarURL({ size: 1024, dynamic: true }))
        embed.addField('User', `${message.author.tag}`, true)
        embed.addField('Server', `${message.channel.guild}`, true)
        embed.addField('Channel', `${message.channel}`, true)
        embed.addField('Command', `\`${message.content}\``, true)
        embed.addField('Stack Trace', '```' + e.stack + '```')
        
        channel.send({
            embeds: [embed]
        });
    }
}