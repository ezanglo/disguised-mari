const { Player } = require('discord-player');
const { Client, Intents } = require('discord.js');
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