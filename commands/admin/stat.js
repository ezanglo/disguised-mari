const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    showHelp: false,
    type: 'admin',
    data: new SlashCommandBuilder()
      .setName('stat')
      .setDescription('Show bot stats')
    ,
    async execute(interaction) {

        interaction.editReply({ embeds: [
            new EmbedBuilder({
                color: 0xED4245,
                description: 
                    `Servers: ${client.guilds.cache.size}\n` +
                    `Commands: ${client.commands.size}`
            })
        ]});

    }
};