const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'clear',
    aliases: ['cq'],
    utilisation: client.config.app.px + 'clear',
    description: 'Clears the Queue',
    type: 'music',
    voiceChannel: true,

    async execute(client, message) {
        const queue = player.getQueue(message.guild.id);

        if (!queue || !queue.playing) return message.channel.send(`No music currently playing ${message.author}... try again ? ❌`);

        if (!queue.tracks[0]) return message.channel.send(`No music in the queue after the current one ${message.author}... try again ? ❌`);

        await queue.clear();

        message.channel.send({ embeds: [
            new MessageEmbed({
                color: 'RED',
                description: `The queue has just been cleared 🗑️`
            })
        ]});
    },
};