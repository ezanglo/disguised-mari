const { MessageEmbed, MessageButton, MessageActionRow, MessageSelectMenu } = require('discord.js');

module.exports = {
    name: "limitbreak",
    aliases: ['lb'],
    args: ['hero', 'content'],
    description: 'Shows the limitbreaks recommended for the selected content',
    type: 'gc',
    utilisation: client.config.app.gc + 'lb mari wb',
    slashArgs: [
        { name: 'hero', description: 'Select a hero', required: true, type: 'StringOption' },
        { name: 'content', description: 'Select a content', required: true, type: 'StringOption', choices: 'contentTypes', choiceIdentifier: 'Code' }
    ],

    async execute(client, message, args) {

        if (!args[0]) return message.reply(`Hero name is required ${message.author}... try again ? ❌`);

        if (!args[1]) return message.reply(`Content name is required ${message.author}... try again ? ❌`);

        const heroName = args[0];

        const embed = new MessageEmbed();
        embed.addField('Hero', args[0], true);
        embed.addField('Content', args[1], true);
        message.channel.send({ embeds: [embed] });
    }
}