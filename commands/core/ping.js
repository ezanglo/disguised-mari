const ms = require('ms');

const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'ping',
    aliases: [],
    description: '',
    utilisation: client.config.app.px + 'ping',

    execute(client, message) {
        message.channel.send({ embeds: [
            new MessageEmbed({
                color: 'RED',
                description: `Last heartbeat calculated ${ms(Date.now() - client.ws.shards.first().lastPingTimestamp, { long: true })} ago **${client.ws.ping}ms** 🛰️`
            })
        ]});
    },
};