require("dotenv").config();

const AWS = require('aws-sdk');


const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const  axios  = require('axios');

global.client = new Client({
    intents: [
        GatewayIntentBits.Guilds
        // GatewayIntentBits.GuildMembers
        // GatewayIntentBits.GuildMessages
    ],
    disableMentions: 'everyone',
});

client.config = require('./config');

global.api = axios.create({
    baseURL: process.env.API_BASE_URL,
    headers: {'xc-auth': process.env.API_TOKEN}
});

global.s3 = new AWS.S3({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
})

require('./src/loader');
require('./src/events.js');

client.login(client.config.app.token);


client.errorLog = (e, interaction) => {
    if(client.config.app.debug_mode){
        const channel = client.channels.cache.get(client.config.app.error_log_channel)
        const embed = new EmbedBuilder()
        embed.setColor(0xED4245);
        embed.setAuthor({ name: `❌ An error has occured` })
        embed.setThumbnail(client.user.displayAvatarURL({ size: 1024, dynamic: true }))
        embed.addFields([
            { name: 'User', value: `${interaction.user.tag}`, inline: true},
            { name: 'Server', value: `${interaction.channel.guild}`, inline: true},
            { name: 'Channel', value: `${interaction.channel}`, inline: true},
            { name: 'Command', value: `\`${interaction.content}\``, inline: true},
        ])
        let stackTrace = e.stack;
        if(e.stack.length > 1024){
            stackTrace = e.stack.substring(0, 1000);
        }
        embed.addFields([
            { name: 'Stack Trace', value: '```' + stackTrace + '```'}
        ])
        
        channel.send({
            embeds: [embed]
        });
    }
}
