const { MessageEmbed, MessageButton, MessageActionRow, MessageSelectMenu } = require('discord.js');

module.exports = {
    name: 'lineup',
    aliases: ['lu'],
    args: ['content', 'phase'],
    description: 'Shows the lineup for the selected content',
    type: 'gc',
    utilisation: client.config.app.gc + 'lu wb p1',

    async execute(client, message, args) {

        return message.reply({ embeds: [
            new MessageEmbed({
                color: 'RED',
                description: `Coming Soon™️ :)`
            })
        ]});
        
    }
};