const { MessageEmbed, MessageButton, MessageActionRow, MessageSelectMenu } = require('discord.js');

module.exports = {
    name: "limitbreak",
    aliases: ['lb'],
    args: ['hero', 'content'],
    description: 'Shows the limitbreaks recommanded for the selected content',
    type: 'gc',
    utilisation: client.config.app.gc + 'lb mari'
}