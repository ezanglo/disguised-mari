const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'help',
    aliases: ['h'],
    showHelp: false,
    description: '',
    utilisation: client.config.app.gc + 'help',

    execute(client, message, args) {
        const embed = new MessageEmbed();

        embed.setColor('RED');
        embed.setAuthor('GUIDE-CHASE COMMANDS', client.user.displayAvatarURL({ size: 1024, dynamic: true }));

        const commands = client.commands.filter(x => x.showHelp !== false);

        const prefix = client.config.app.gc
        
        commands.forEach(cmd => {
            embed.addField(
                `${prefix}${cmd.name}${cmd.aliases[0] ? ` (${cmd.aliases.map(y => y).join(', ')})` : ''}`, 
                `${cmd.args ? '`args: <' + cmd.args.join('> <') + '>`\n': ''}${cmd.description}\n \`Ex. ${cmd.utilisation}\``, 
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