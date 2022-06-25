const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'mhelp',
    aliases: ['mh'],
    showHelp: false,
    description: '',
    type: 'music',
    utilisation: client.config.app.px + 'help',

    execute(client, message, args) {
        const embed = new MessageEmbed();

        embed.setThumbnail(message.guild.iconURL({ size: 2048, dynamic: true }));
        embed.setColor('RED');
        embed.setAuthor('MUSIC COMMANDS', client.user.displayAvatarURL({ size: 1024, dynamic: true }));

        const commands = client.commands.filter(x => x.showHelp !== false && x.type == 'music');

        const prefix = client.config.app.px
        
        commands.forEach(cmd => {
            embed.addField(
                `${prefix}${cmd.name}${cmd.aliases[0] ? ` (${cmd.aliases.map(y => y).join(', ')})` : ''}`, 
                `${cmd.description}\n \`Ex. ${cmd.utilisation}\``, 
                true
            )
        })
        // embed.addField('Music Commands', '```yaml\n' + commands.map(x => 
        //     `${client.config.app.px}${x.name}${x.aliases[0] ? ` (${x.aliases.map(y => y).join(', ')})` : ''} - ${x.description}\n
        //           [ ${x.utilisation ? x.utilisation: ''} ]` 
        // ).join('\n') + '```');

        embed.setTimestamp();
        embed.setFooter('I am not Mari', client.user.avatarURL({ dynamic: true }));

        message.channel.send({ embeds: [embed] });
    },
};