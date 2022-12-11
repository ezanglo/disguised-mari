const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    showHelp: false,
    type: 'admin',
    data: new SlashCommandBuilder()
      .setName('botinfo')
      .setDescription('Show bot info')
    ,
    async execute(interaction) {
        const descriptions = [
            `Servers: ${client.guilds.cache.size}`,
            `Commands: ${client.commands.size}`
        ]

        const embed = new EmbedBuilder()
            .setAuthor({ 
                name: "Disguised Mari",
                iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true })
            })
            .setDescription(descriptions.join('\n'))
            .setTimestamp()
        ;

        interaction.editReply({ embeds: [ embed ]});
    }
};