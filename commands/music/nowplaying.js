const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    name: 'nowplaying',
    aliases: ['np'],
    utilisation: client.config.app.px + 'nowplaying',
    description: 'Shows currently playing song',
    type: 'music',
    voiceChannel: true,

    execute(client, message) {
        const queue = player.getQueue(message.guild.id);

        if (!queue || !queue.playing) return message.channel.send(`No music currently playing ${message.author}... try again ? ❌`);
        
        const embed = this.getEmbed(client, queue);

        message.channel.send(embed);
    },
    getEmbed(client, queue){
        const track = queue.current;

        const embed = new MessageEmbed();

        embed.setColor('RED');
        embed.setThumbnail(track.thumbnail);
        embed.setAuthor(`NOW PLAYING`, client.user.displayAvatarURL({ size: 1024, dynamic: true }));

        const methods = ['⛔', '🔂', '🔁'];

        const timestamp = queue.getPlayerTimestamp();
        const trackDuration = timestamp.progress == 'Infinity' ? 'infinity (live)' : track.duration;
        
        let position = queue.tracks.findIndex(x => x.id == track.id) + 1;
        if(queue.current.id == track.id){
            position = 'Now Playing'
        }

        if(!track.skipVotes){
            track.skipVotes = []
        }

        const skippers = (track.skipVotes.length > 0) ? `Skippers ${track.skipVotes.map(id => queue.guild.members.cache.get(id)).join(' ')}` : ''

        embed.setDescription([
            `Title **[${track.title}](${track.url})**`,
            `Position **${position}**`,
            `Duration **${trackDuration}**`,
            `Loop mode **${methods[queue.repeatMode]}**`,
            `Requested by ${track.requestedBy}`,
            `${skippers}`,
        ].join('\n'));

        const saveButton = new MessageButton({
            label: 'Save this track',
            customId: 'saveTrack',
            style: 'SUCCESS',
        });

        const skipButton = new MessageButton({
            label: 'Skip',
            customId: 'skipTrack',
            style: 'SUCCESS',
        });
        
        return { embeds: [embed], components: [
            new MessageActionRow().addComponents(skipButton, saveButton)
        ]}
    }
};