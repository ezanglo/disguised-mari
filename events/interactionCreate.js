/* eslint-disable no-case-declarations */
const { MessageEmbed } = require('discord.js');

module.exports = (client, int) => {

    try {

    if (!int.isButton()) return;

        const queue = player.getQueue(int.guildId);

        switch (int.customId) {
            case 'saveTrack': 
                if (!queue || !queue.playing) return int.reply({ content: `No music currently playing... try again ? ❌`, ephemeral: true, components: [] });

                int.member.send(`You saved the track ${queue.current.title} | ${queue.current.author} from the server ${int.member.guild.name} ✅`).then(() => {
                    return int.reply({ content: `I have sent you the title of the music by private messages ✅`, ephemeral: true, components: [] });
                }).catch(error => {
                    return int.reply({ content: `Unable to send you a private message... try again ? ❌`, ephemeral: true, components: [] });
                });
            break;
            case 'skipTrack': 
                if (!queue || !queue.playing) return int.reply({ content: `No music currently playing... try again ? ❌`, ephemeral: true, components: [] });
                
                const member = int.guild.members.cache.get(int.member.user.id);

                if (!member.voice.channel) return int.reply({ content: `You're not in a voice channel ${int.member}... try again ? ❌`, ephemeral: true });

                const channelSize = member.voice.channel.members.size - 1;

                const voteskips = queue.current.skipVotes;
                if(!voteskips.find(id=>id == int.member.user.id)){
                    queue.current.skipVotes.push(int.member.user.id);
                }

                int.reply({ embeds: [
                    new MessageEmbed({
                        color: 'RED',
                        description: `${int.member} voted to skip - ${queue.current.skipVotes.length}/${channelSize}`
                    })
                ], ephemeral: true});
                
                if(queue.current.skipVotes.length > Math.ceil(channelSize/2)){
                    const success = queue.skip();
        
                    const skippers = (queue.current.skipVotes.length > 0) ? `Skipped by ${queue.current.skipVotes.map(id => queue.guild.members.cache.get(id)).join(' ')}` : ''

                    let embedMessage = `Something went wrong ${int.member}... try again ? ❌`
                    if(success){
                        embedMessage = [
                            `Title **[${queue.current.title}](${queue.current.url})**`,
                            `${skippers}`,
                        ].join('\n')
                    }

                    const embed = new MessageEmbed({
                        color: 'RED',
                        description: embedMessage
                    });
                    embed.setAuthor(`SKIPPED`, client.user.displayAvatarURL({ size: 1024, dynamic: true }));
                    return int.channel.send({ embeds: [embed], ephemeral: true});
                }
            break;
        }
    }
    catch(e){
        int.reply(`An Error has occured ${int.member}... try again ? ❌`);
    }
};