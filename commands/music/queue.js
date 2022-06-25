const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js');

module.exports = {
    name: 'queue',
    aliases: ['q'],
    utilisation: client.config.app.px + 'queue',
    description: 'List the songs in Queue',
    type: 'music',
    voiceChannel: true,
    maxPageItems: 5,

    execute(client, message, args) {
        const queue = player.getQueue(message.guild.id);

        if (!queue || !queue.current) return message.channel.send(`No music currently playing ${message.author}... try again ? ❌`);

        if (!queue.tracks[0] || !queue.current) return message.channel.send(`No music in the queue after the current one ${message.author}... try again ? ❌`);

        const embed = new MessageEmbed();
        const methods = ['⛔', '🔂', '🔁'];

        embed.setColor('RED');
        embed.setThumbnail(message.guild.iconURL({ size: 2048, dynamic: true }));
        embed.setAuthor(`Server queue - ${message.guild.name}`, client.user.displayAvatarURL({ size: 1024, dynamic: true }));

        const tracks = queue.tracks.map((track, i) => `**${i + 1}** - [${track.title} - ${track.author}](${track.url}) | ${track.duration} (requested by : ${queue.current.requestedBy.tag})`);

        const songs = queue.tracks.length;

        const timestamp = queue.getPlayerTimestamp();

        if (timestamp.progress == 'Infinity') return message.channel.send(`Playing a live, no data to display 🎧`);

        let page = 0;
        if(args[0]){
            page = parseInt(args[0]) - 1;
        }

        embed.setDescription([
            `__Now Playing:__`,
            `[${queue.current.title} - ${queue.current.author}](${queue.current.url})`,
            `Requested by: [${queue.current.requestedBy}]`,
            ``,
            `__Up Next:__`,
            `${tracks.slice(page * this.maxPageItems, (page * this.maxPageItems) + this.maxPageItems).join('\n')}`,
            ``,
            `***${songs} songs in queue | ${secondsToHms(queue.totalTime)} total length***`,
        ].join('\n'));

        const pageCount = Math.ceil(songs/this.maxPageItems);

        embed.setTimestamp();
        embed.setFooter(`Page ${page + 1}/${[pageCount]} | Loop Mode: ${methods[queue.repeatMode]}`, client.user.displayAvatarURL({ size: 1024, dynamic: true }));

        message.channel.send({ embeds: [embed] });
        // const row = new MessageActionRow();

        // if(page + 1 > pageCount){
        //     const prevButton = new MessageButton({
        //         label: 'Previous',
        //         customId: 'previousPage',
        //         style: 'SUCCESS',
        //     });
        //     row.addComponents(prevButton);
        // }

        // if(page + 1 < pageCount){
        //     const nextButton = new MessageButton({
        //         label: 'Next',
        //         customId: 'nextPage',
        //         style: 'SUCCESS',
        //     });
        //     row.addComponents(nextButton);
        // }

        // message.channel.send({ embeds: [embed], components: [row] });
    }
}

function secondsToHms(milliseconds) {
    var day, hour, minute, seconds;
    seconds = Math.floor(milliseconds / 1000);
    minute = Math.floor(seconds / 60);
    seconds = seconds % 60;
    hour = Math.floor(minute / 60);
    minute = minute % 60;
    day = Math.floor(hour / 24);
    hour = hour % 24;

    return `${day}d ${hour}h ${minute}m ${seconds}s`; 
}