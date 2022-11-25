const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  showHelp: false,
  type: "admin",
  data: new SlashCommandBuilder()
    .setName("update")
    .setDescription("Update configs(Admin Only)")
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("Select a command")
        .setRequired(true)
        .addChoices({ name: "trait", value: "trait" })
    )
    .addStringOption((option) =>
      option.setName("code").setDescription("command code").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("config").setDescription("update config").setRequired(true)
    ),
  async execute(interaction) {
    const GuideChaseBot = interaction.guild.roles.cache.find(x => x.name === 'GuideChaseBot');
    if (!interaction.member._roles.includes(GuideChaseBot.id)) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder({
            color: 0xed4245,
            description: `This command is reserved for members with the <@&${GuideChaseBot.id}> role on the server ${interaction.member}... try again ? ❌`,
          }),
        ],
      });
    }

    const commandName = interaction.options.getString("command");
    const commandCode = interaction.options.getString("code");
    const config = interaction.options.getString("config");

    const command = client.commands.get(commandName);
    if (command) {
      command.update(interaction, commandCode, config);
    }
  },
};
