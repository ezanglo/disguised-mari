const { Collection } = require("discord.js");

module.exports = async (client, interaction) => {
  try {
    if (interaction.isCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      await interaction.deferReply();
      // await interaction.deferReply({ ephemeral: true });
      await cmd.execute(interaction);
    } else if (interaction.isAutocomplete()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`
        );
        return;
      }

      let choices;
      const focusedOption = interaction.options.getFocused(true);
      switch (focusedOption.name) {
        case "hero":
          choices = interaction.client.heroes.map((x) => x.Code);
          break;
        case "content":
          choices = interaction.client.contentTypes.map((x) => x.Code);
          break;
        case "skill":
          choices = ["s1", "s2", "pass", "cs", "ss"];
          break;
        case "upgrade_type":
          choices = ["base", "lb", "si"];
          break;
        case "trait_type":
          choices = ["lvl", "cs", "si", "trans"];
          break;
      }

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
    client.errorLog(e, {
      user: interaction.member.user,
      channel: interaction.channel,
      content: `Interaction`,
    });
  }
};
