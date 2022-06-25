const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'progress',
    aliases: ['pbar'],
    utilisation: client.config.app.px + 'progress',
    description: 'Shows the current song\'s progress',
    type: 'music',
    voiceChannel: true,

    async execute(client, message) {
        const queue = player.getQueue(message.guild.id);

        if (!queue || !queue.playing) return message.channel.send(`No music currently playing ${message.author}... try again ? ❌`);

        const progress = queue.createProgressBar();
        const timestamp = queue.getPlayerTimestamp();

        if (timestamp.progress == 'Infinity') return message.channel.send(`Playing a live, no data to display 🎧`);

        message.channel.send({ embeds: [
            new MessageEmbed({
                color: 'RED',
                description: `${progress} (**${timestamp.progress}**%)`
            })
        ]});
    },
};