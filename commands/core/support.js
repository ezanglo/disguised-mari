const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("support")
    .setDescription("Show how you can support Disguised Mari"),
  async execute(interaction) {

    const embed = new EmbedBuilder()
      .setTitle("Support Disguised Mari")
      .setThumbnail(client.user.displayAvatarURL({ size: 1024, dynamic: true }))
      .addFields([
        {
          name: "\u200b",
          value: `> *Hey there! Thanks a lot for considering supporting Disguised Mari! Your contribution will go a long way in helping the bot continue to provide valuable guides and information to chasers! We really appreciate your help and want to let you know that it means a lot to us. Every little bit counts, and your support will help Disguised Mari keep growing and improving. Thanks again for considering this opportunity to help us out!*`,
        },
        {
          name: "\u200b",
          value: "☕ https://ko-fi.com/disguisedmari",
        },
      ])
      .setImage(
        `https://media.discordapp.net/attachments/857764145298145291/1104517767262126171/image.png`
      );
    interaction.editReply({ embeds: [embed] });
  },
};
