const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'help',
    aliases: ['h'],
    showHelp: false,
    description: '',
    utilisation: client.config.app.px + 'help',

    execute(client, message, args) {
        const embed = new MessageEmbed();

        embed.setColor('RED');
        embed.setAuthor(client.user.username, client.user.displayAvatarURL({ size: 1024, dynamic: true }));

        const commands = client.commands.filter(x => x.showHelp !== false);

        embed.setDescription('NO');
        embed.addField('Music Commands',commands.map(x => `${x.name} - ${x.description}` ).join('\n'));

        embed.setTimestamp();
        embed.setFooter('NO', message.author.avatarURL({ dynamic: true }));

        message.channel.send({ embeds: [embed] });
    },
};