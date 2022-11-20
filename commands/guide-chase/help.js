const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'help',
    aliases: ['h'],
    showHelp: false,
    description: '',
    type: 'gc',
    utilisation: client.config.app.gc + 'help',

    execute(client, message, args) {
        const embed = new MessageEmbed();

        embed.setColor('RED');
        embed.setAuthor('GUIDE-CHASE COMMANDS', client.user.displayAvatarURL({ size: 1024, dynamic: true }));

        const commands = client.commands.filter(x => x.showHelp !== false && x.type == 'gc');

        const prefix = client.config.app.gc
        
        commands.forEach(cmd => {
            embed.addField(
                `${prefix}${cmd.name}${cmd.aliases[0] ? ` (${cmd.aliases.map(y => y).join(', ')})` : ''}`, 
                `${cmd.args ? '`args: <' + cmd.args.join('> <') + '>`\n': ''}${cmd.description}\n \`Ex. ${cmd.utilisation}\``, 
                true
            )
        })
        embed.addField('Website: ', ' https://disguised-mari.web.app/', true);
        embed.addField('Server: ', ' https://discord.gg/H9WseZZ3W9', true);
        // embed.addField('Music Commands', '```yaml\n' + commands.map(x => 
        //     `${client.config.app.px}${x.name}${x.aliases[0] ? ` (${x.aliases.map(y => y).join(', ')})` : ''} - ${x.description}\n
        //           [ ${x.utilisation ? x.utilisation: ''} ]` 
        // ).join('\n') + '```');

        embed.setTimestamp();
        //embed.setFooter('I am not Mari', client.user.avatarURL({ dynamic: true }));
        embed.setFooter(`Credits to the following : 
Ezwa#3117 | Aonyx#7851 | FallenTaco#0120 | Forest Skirt#0994 | QBey𓆏#8190
 シャイロ#2182 | Mille#0773 | jocker#2022 | QueenBot
`);

        message.reply({ embeds: [embed] });
    },
};