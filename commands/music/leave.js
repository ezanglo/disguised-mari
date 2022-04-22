const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'leave',
    aliases: ['dc', 'l'],
    utilisation: client.config.app.px + 'leave',
    description: 'Stops the songs and leave the voice channel',
    voiceChannel: true,

    execute(client, message) {
        const queue = player.getQueue(message.guild.id);

        if (!queue || !queue.playing) return message.channel.send(`No music currently playing ${message.author}... try again ? ❌`);

        queue.destroy();

        message.channel.send({ embeds: [
            new MessageEmbed({
                color: 'RED',
                description: `Music stopped into this server, see you next time ✅`
            })
        ]});
    },
};