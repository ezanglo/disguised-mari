const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'skip',
    aliases: ['sk'],
    utilisation: client.config.app.px + 'skip',
    description: 'Skips the current song',
    type: 'music',
    voiceChannel: true,

    execute(client, message, args) {
        const queue = player.getQueue(message.guild.id);

        if (!queue || !queue.playing) return message.channel.send(`No music currently playing ${message.author}... try again ? ❌`);

        const DJ = client.config.opt.DJ;
        const roleDJ = message.guild.roles.cache.find(x => x.name === DJ.roleName);
        if(args.length > 0){
            if(!message.member._roles.includes(roleDJ.id)){
                return message.channel.send({ embeds: [
                    new MessageEmbed({
                        color: 'RED',
                        description: `This command is reserved for members with the ${DJ.roleName} role on the server ${message.author}... try again ? ❌`
                    })
                ]});
            }
            else if(args[0].includes('force')){
                const success = queue.skip();
    
                let embedMessage = `Something went wrong ${message.author}... try again ? ❌`
                if(success){
                    embedMessage = [
                        `Title **[${queue.current.title}](${queue.current.url})**`,
                        `Force skipped by **[${message.author}]**`,
                    ].join('\n')
                }
    
                const embed = new MessageEmbed({
                    color: 'RED',
                    description: embedMessage
                });
                embed.setAuthor(`SKIPPED`, client.user.displayAvatarURL({ size: 1024, dynamic: true }));
                return message.channel.send({ embeds: [embed]});
            }
        }

        const channelSize = message.member.voice.channel.members.size - 1;

        const voteskips = queue.current.skipVotes;
        if(!voteskips.find(id => id == message.author.id)){
            queue.current.skipVotes.push(message.author.id);
        }

        message.reply({ embeds: [
            new MessageEmbed({
                color: 'RED',
                description: `${message.author} voted to skip - ${queue.current.skipVotes.length}/${channelSize}`
            })
        ], ephemeral: true});
        
        if(channelSize == 1 || queue.current.skipVotes.length > Math.ceil(channelSize/2)){
            const success = queue.skip();

            let embedMessage = `Something went wrong ${message.author}... try again ? ❌`
            if(success){
                const skippers = (queue.current.skipVotes.length > 0) ? `Skipped by ${queue.current.skipVotes.map(id => queue.guild.members.cache.get(id)).join(' ')}` : ''
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

            return message.reply({ embeds: [embed], ephemeral: true});
        }
    },
};