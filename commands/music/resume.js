module.exports = {
    name: 'resume',
    aliases: ['rs'],
    utilisation: client.config.app.px + 'resume',
    description: 'Resume the current song',
    voiceChannel: true,

    execute(client, message) {
        const queue = player.getQueue(message.guild.id);

        if (!queue) return message.channel.send(`No music currently playing ${message.author}... try again ? ❌`);

        const success = queue.setPaused(false);

        return message.channel.send(success ? `Current music ${queue.current.title} resumed ✅` : `Something went wrong ${message.author}... try again ? ❌`);
    },
};