const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("support")
    .setDescription("Show how you can support Disguised Mari"),
  async execute(interaction) {

      const embed = new EmbedBuilder()
          .setTitle("Disguised Mari is shutting down...")
          .setThumbnail(client.user.displayAvatarURL({ size: 1024, dynamic: true }))
          .addFields([
              {
                  name: "\u200b",
                  value: `> *
              Hey there! Thanks a lot for using Disguised Mari! 
              If you want to know more, please read this announcement https://discord.com/channels/857706068292665394/857768768029458432/1359745226478059550
              *
              `,
              },
              // {
              //     name: "\u200b",
              //     value: "I have open-sourced the project, if you want to learn how it's made or if you want to make your own" +
              //         "Here is the actual bot's code\n" +
              //         "https://github.com/ezanglo/disguised-mari\n" +
              //         "Here is the new admin portal that I was working on\n" +
              //         "https://github.com/ezanglo/disguised-mari-bot",
              // },
              {
                  name: "\u200b",
                  value: "if you have any questions, you can DM me or contact me via https://ezraanglo.com",
              },
              {
                  name: "\u200b",
                  value: "You can refer to this GCDC Community Spreadsheet for all the information you need going forward. https://docs.google.com/spreadsheets/d/1FU4RI2MMvSQkO0k4c4IxgwY-hx2YFKNBIfhsXT4uC-I/",
              },
          ])
          .setImage(
              `https://media.discordapp.net/attachments/857764145298145291/1359768122147733524/bye.png?ex=67f8ae3f&is=67f75cbf&hm=7d650241b1e931ae693acab041b4dbc024c3fc593c09f72975c3b29bd00cfc52&=&format=webp&quality=lossless`
          );

    // const embed = new EmbedBuilder()
    //   .setTitle("Support Disguised Mari")
    //   .setThumbnail(client.user.displayAvatarURL({ size: 1024, dynamic: true }))
    //   .addFields([
    //     {
    //       name: "\u200b",
    //       value: `> *Hey there! Thanks a lot for considering supporting Disguised Mari! Your contribution will go a long way in helping the bot continue to provide valuable guides and information to chasers! We really appreciate your help and want to let you know that it means a lot to us. Every little bit counts, and your support will help Disguised Mari keep growing and improving. Thanks again for considering this opportunity to help us out!*`,
    //     },
    //     {
    //       name: "\u200b",
    //       value: "☕ https://ko-fi.com/disguisedmari",
    //     },
    //   ])
    //   .setImage(
    //     `https://media.discordapp.net/attachments/857764145298145291/1104517767262126171/image.png`
    //   );
    interaction.editReply({ embeds: [embed] });
  },
};
