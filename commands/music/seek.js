const { MessageEmbed } = require('discord.js');
const ms = require('ms');

module.exports = {
    name: 'seek',
    aliases: [],
    utilisation: client.config.app.px + 'seek [time]',
    description: 'Jumps to specific time of song',
    type: 'music',
    voiceChannel: true,

    async execute(client, message, args) {
        const queue = player.getQueue(message.guild.id);

        if (!queue || !queue.playing) return message.channel.send(`No music currently playing ${message.author}... try again ? ❌`);

        const timeToMS = ms(args.join(' '));

        if (timeToMS >= queue.current.durationMS) return message.channel.send(`The indicated time is higher than the total time of the current song ${message.author}... try again ? ❌\n*Try for example a valid time like **5s, 10s, 20 seconds, 1m**...*`);

        await queue.seek(timeToMS);

        message.channel.send({ embeds: [
            new MessageEmbed({
                color: 'RED',
                description: `Time set on the current song **${ms(timeToMS, { long: true })}** ✅`
            })
        ]});
    },
};