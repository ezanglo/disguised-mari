const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("Show bot info"),
  async execute(interaction) {
    const developers = [
      "Ezwa#3117",
      "Aonyx#7851",
      "FallenTaco#0120",
      "jocker#2022",
      "シャイロ#2182",
    ];

    const embed = new EmbedBuilder()
      .setThumbnail(client.user.displayAvatarURL({ size: 1024, dynamic: true }))
      .setAuthor({
        name: "Disguised Mari",
        iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true }),
      })
      .addFields([
        { name: "Owner", value: `Ezwa#3117`, inline: true },
        { name: "Servers", value: `${client.guilds.cache.size}`, inline: true },
        { name: "Commands", value: `${client.commands.size}`, inline: true },
        { name: "Website", value: "https://disguised-mari.web.app/" },
        { name: "Server", value: "https://discord.gg/H9WseZZ3W9" },
        {
          name: "☕ Buy me a coffee!",
          value: "https://ko-fi.com/disguisedmari",
        },
      ])
      .setFooter({
        text: `Developers: ${developers.join(" | ")}`,
      });
    interaction.editReply({ embeds: [embed] });
  },
};
