const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
  showHelp: false,
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Receive a list of commands and utilities"),
  execute(interaction) {
    const embed = new EmbedBuilder().setColor(0xed4245).setAuthor({
      name: "Disguised Mari Commands",
      iconURL: interaction.client.user.displayAvatarURL({
        size: 1024,
        dynamic: true,
      }),
    });

    const commands = interaction.client.commands.filter(
      (x) => x.showHelp !== false
    );
    commands.forEach((cmd) => {
      embed.addFields([
        {
          name: `/${cmd.data.name}`,
          value: `${cmd.data.description}`,
          inline: true,
        },
      ]);
    });

    embed.addFields([
      { name: "Website", value: "https://disguised-mari.web.app/" },
      { name: "Server", value: "https://discord.gg/H9WseZZ3W9" },
    ]);

    const userCredits = [
      "Ezwa#3117",
      "Aonyx#7851",
      "Influx#3838",
      "FallenTaco#0120",
      "Forest Skirt#0994",
      "QBey𓆏#8190",
      "シャイロ#2182",
      "Mille#0773",
      "jocker#2022",
      "QueenBot",
      "Eri #3415",
    ];

    const otherCredits = [
      "Disguised Mari Hub",
      "Grand Chase for Kakao",
      "Grand Chase Official Discord",
      "Grand Chase Wiki",
    ];

    embed.setFooter({
      text: `Credits to the following :\n${userCredits.join(
        " | "
      )}\n${otherCredits.join(" | ")}`,
    });

    interaction.editReply({ embeds: [embed] });
  },
};
