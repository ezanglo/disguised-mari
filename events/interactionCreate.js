const { Collection } = require("discord.js");

module.exports = async (client, interaction) => {
  
  try {
    if (interaction.isCommand()) {
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
