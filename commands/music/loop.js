const { QueueRepeatMode } = require('discord-player');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'loop',
    aliases: ['lp', 'repeat'],
    utilisation: client.config.app.px + 'loop <one|queue|off>',
    description: 'Loops the Queue',
    voiceChannel: true,

    execute(client, message, args) {
        const queue = player.getQueue(message.guild.id);

        if (!queue || !queue.playing) return message.channel.send(`No music currently playing ${message.author}... try again ? ❌`);

        let repeatMode = QueueRepeatMode.OFF;
        if(args.join('').toLowerCase() === 'queue'){
            repeatMode = QueueRepeatMode.QUEUE
        }
        else if(args.join('').toLowerCase() === 'one'){
            repeatMode = QueueRepeatMode.TRACK
        }

        const methods = ['⛔', '🔂', '🔁'];

        if(repeatMode == queue.repeatMode){
            return message.channel.send({ embeds: [
                new MessageEmbed({
                    color: 'RED',
                    description: `Repeat Mode has been set to: ${methods[queue.repeatMode]}`
                })
            ]});
        }
        
        const success = queue.setRepeatMode(repeatMode);

        return message.channel.send({ embeds: [
            new MessageEmbed({
                color: 'RED',
                description: success ? `Repeat Mode has been set to: ${methods[queue.repeatMode]}` : `Something went wrong ${message.author}... try again ? ❌`
            })
        ]});

        // if (args.join('').toLowerCase() === 'queue') {
        //     if (queue.repeatMode === 1) return message.channel.send(`You must first disable the current music in the loop mode (${client.config.app.px}loop) ${message.author}... try again ? ❌`);

        //     const success = queue.setRepeatMode(queue.repeatMode === 0 ? QueueRepeatMode.QUEUE : QueueRepeatMode.OFF);

        //     return message.channel.send(success ? `Repeat mode **${queue.repeatMode === 0 ? 'disabled' : 'enabled'}** the whole queue will be repeated endlessly 🔁` : `Something went wrong ${message.author}... try again ? ❌`);
        // } else {
        //     if (queue.repeatMode === 2) return message.channel.send(`You must first disable the current queue in the loop mode (${client.config.app.px}loop queue) ${message.author}... try again ? ❌`);

        //     const success = queue.setRepeatMode(queue.repeatMode === 0 ? QueueRepeatMode.TRACK : QueueRepeatMode.OFF);

        //     return message.channel.send(success ? `Repeat mode **${queue.repeatMode === 0 ? 'disabled' : 'enabled'}** the current music will be repeated endlessly (you can loop the queue with the <queue> option) 🔂` : `Something went wrong ${message.author}... try again ? ❌`);
        // };
    },
};