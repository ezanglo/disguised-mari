const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'pause',
    aliases: [],
    utilisation: client.config.app.px + 'pause',
    description: 'Pause the current song',
    voiceChannel: true,

    execute(client, message) {
        const queue = player.getQueue(message.guild.id);

        if (!queue) return message.channel.send(`No music currently playing ${message.author}... try again ? ❌`);

        const success = queue.setPaused(true);

        return message.channel.send({ embeds: [
            new MessageEmbed({
                color: 'RED',
                description: success ? `Current music ${queue.current.title} paused ✅` : `Something went wrong ${message.author}... try again ? ❌`
            })
        ]});
    },
};