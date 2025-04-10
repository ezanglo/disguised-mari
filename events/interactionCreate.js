const { Collection } = require("discord.js");

module.exports = async (client, interaction) => {
  
  try {
    if (interaction.isCommand()) {

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
            {
              name: "\u200b",
              value: "I have open-sourced the project, if you want to learn how it's made or if you want to make your own" +
                  "Here is the actual bot's code\n" +
                  "https://github.com/ezanglo/disguised-mari\n" +
                  "Here is the new admin portal that I was working on\n" +
                  "https://github.com/ezanglo/disguised-mari-bot",
            },
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

      return interaction.editReply({ embeds: [embed] });

      const cmd = client.commands.get(interaction.commandName);
      await interaction.deferReply();
      // await interaction.deferReply({ ephemeral: true });
      await cmd.execute(interaction);

      await client.commandLog(interaction);

    } else if (interaction.isAutocomplete()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`
        );
        return;
      }

      let choices = [];
      const focusedOption = interaction.options.getFocused(true);

      if (focusedOption.name == "hero") {
        choices = interaction.client.heroes.map((x) => x.Code);
      } 
      else if (focusedOption.name == "content") {
        choices = interaction.client.contentTypes.map((x) => x.Code);
        let hero;
        if (interaction.options.get("hero")) {
          hero = interaction.client.heroes.find(
            (x) => x.Code == interaction.options.get("hero").value
          );
        }

        let contentTypeIds = [];
        switch (interaction.commandName) {
          case "equip":
            {
              if (hero) {
                contentTypeIds = hero.HeroEquips.map(
                  (x) => x.nc_16ql__content_type_id
                );
              }
            }
            break;
          case "trait":
            {
              if (hero) {
                contentTypeIds = hero.Traits.map(
                  (x) => x.nc_16ql__content_type_id
                );
              }
            }
            break;
          case "lineup":
            contentTypeIds = interaction.client.ContentLineups.map(
              (x) => x.ContentTypeRead.Id
            );
            contentTypeIds = [...new Set(contentTypeIds)];
            break;
        }

        if (contentTypeIds.length > 0) {
          choices = interaction.client.contentTypes
            .filter((x) => contentTypeIds.includes(x.Id))
            .map((x) => x.Code);
        }
      }
      else if (focusedOption.name == "phase") {
        choices = interaction.client.ContentLineups.filter(
          (x) => x.ContentTypeRead.Code == interaction.options.get("content")?.value
        ).map(x => x.ContentPhaseRead.Code.split('.')[1]);
      }

      choices = [...new Set(choices)];

      const filtered = choices.filter((choice) =>
        choice.startsWith(focusedOption.value.toLowerCase())
      );
      await interaction.respond(
        filtered.map((choice) => ({ name: choice, value: choice })).slice(0, 25)
      );
    }
  } catch (e) {
    interaction.channel.send({
      content: `An Error has occured ${interaction.member.user}... try again ? ❌`,
      ephemeral: true,
    });
    client.errorLog(e, interaction);
  }
};
