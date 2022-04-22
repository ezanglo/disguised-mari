const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'back',
    aliases: ['previous'],
    utilisation: client.config.app.px + 'back',
    description: 'go back smh',
    voiceChannel: true,

    async execute(client, message) {
        const queue = player.getQueue(message.guild.id);

        if (!queue || !queue.playing) return message.channel.send(`No music currently playing ${message.author}... try again ? ❌`);

        if (!queue.previousTracks[1]) return message.channel.send(`There was no music played before ${message.author}... try again ? ❌`);

        await queue.back();

        message.channel.send({ embeds: [
            new MessageEmbed({
                color: 'RED',
                description: `Playing the **previous** track ✅`
            })
        ]});
    },
};