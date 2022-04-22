const { QueryType } = require('discord-player');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'play',
    aliases: ['p'],
    utilisation: client.config.app.px + 'play [song name/URL]',
    description: 'Plays a song or a URL',
    voiceChannel: true,

    async execute(client, message, args) {
        if (!args[0]) return message.channel.send(`Please enter a valid search ${message.author}... try again ? ❌`);

        const res = await player.search(args.join(' '), {
            requestedBy: message.member,
            searchEngine: QueryType.AUTO
        });

        if (!res || !res.tracks.length) return message.channel.send(`No results found ${message.author}... try again ? ❌`);

        const queue = await player.createQueue(message.guild, {
            metadata: message.channel
        });

        try {
            if (!queue.connection) await queue.connect(message.member.voice.channel);
        } catch {
            await player.deleteQueue(message.guild.id);
            return message.channel.send(`I can't join the voice channel ${message.author}... try again ? ❌`);
        }

        if(res.playlist){
            await message.channel.send(`Loading your playlist... 🎧`);

            queue.addTracks(res.tracks)

            const playlist = res.playlist

            const embed = new MessageEmbed();
            embed.setColor('RED');
            embed.setThumbnail(playlist.thumbnail);
            embed.setAuthor(`ADDED TO QUEUE`, client.user.displayAvatarURL({ size: 1024, dynamic: true }));

            embed.setDescription([
                `Title **[${playlist.title}](${playlist.url})**`,
                `Tracks **${playlist.tracks.length}**`,
                `Requested by ${message.author}`,
            ].join('\n'));
            message.channel.send({ embeds: [embed] });
            if (!queue.playing) await queue.play();
        }
        else if(res.tracks.length === 1) {
            await message.channel.send(`Loading your track... 🎧`);
            queue.addTrack(res.tracks[0]);
            if (!queue.playing) await queue.play();
        }
        else {
            const embed = new MessageEmbed();

            embed.setColor('RED');
            embed.setAuthor(`Results for ${args.join(' ')}`, client.user.displayAvatarURL({ size: 1024, dynamic: true }));
    
            const maxTracks = res.tracks.slice(0, 10);
    
            embed.setDescription(`${maxTracks.map((track, i) => `**${i + 1}**. ${track.title} | ${track.author}`).join('\n')}\n\nSelect choice between **1** and **${maxTracks.length}** or **cancel** ⬇️`);
    
            embed.setTimestamp();
            embed.setFooter('NO', message.author.avatarURL({ dynamic: true }));
    
            const searchResult = await message.channel.send({ embeds: [embed] });
    
            const collector = message.channel.createMessageCollector({
                time: 15000,
                errors: ['time'],
                filter: m => m.author.id === message.author.id
            });
    
            collector.on('collect', async (query) => {
                if (query.content.toLowerCase() === 'c'){
                    searchResult.delete({ timeout: 10 });
                    collector.stop();
                    return message.channel.send(`Search cancelled ✅`);
                } 
    
                const value = parseInt(query.content);
    
                if (!value || value <= 0 || value > maxTracks.length) return message.channel.send(`Invalid response, try a value between **1** and **${maxTracks.length}** or **cancel**... try again ? ❌`);
    
                collector.stop();
    
                try {
                    if (!queue.connection) await queue.connect(message.member.voice.channel);
                } catch {
                    await player.deleteQueue(message.guild.id);
                    return message.channel.send(`I can't join the voice channel ${message.author}... try again ? ❌`);
                }
    
                queue.addTrack(res.tracks[query.content - 1]);

                if(args.length > 2 && args[args.length-2].includes('pos')){
                    const addedTrack = queue.tracks.splice(queue.tracks.length - 1, 1)[0];
                    let position = parseInt(args[args.length-1]);
                    if(position > queue.tracks.length){
                        position = queue.tracks.length;
                    }
                    queue.tracks.splice(position - 1, 0, addedTrack);
                }

    
                if (!queue.playing) await queue.play();
                
                searchResult.delete({ timeout: 10 });

            });
    
            collector.on('end', (msg, reason) => {
                if (reason === 'time') return message.channel.send(`Search timed out ${message.author}... try again ? ❌`);
            });
        }
    },
};