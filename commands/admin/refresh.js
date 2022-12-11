const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  showHelp: false,
  type: "admin",
  data: new SlashCommandBuilder()
    .setName("refresh")
    .setDescription("refresh configs(Admin Only)")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Select a type")
        .setRequired(false)
        .addChoices(
          { name: "hero", value: "hero" },
          { name: "content", value: "content" },
          { name: "trait", value: "trait" },
          { name: "equip", value: "equip" },
          { name: "herogear", value: "herogear" },
          { name: "lineup", value: "lineup" }
        )
    ),
  async execute(interaction) {
    const GuideChaseBot = interaction.guild.roles.cache.find(
      (x) => x.name === "GuideChaseBot"
    );
    if (!interaction.member._roles.includes(GuideChaseBot.id)) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder({
            color: 0xed4245,
            description: `This command is reserved for members with the <@&${GuideChaseBot.id}> role on the server ${interaction.user}... try again ? ❌`,
          }),
        ],
      });
    }

    const type = interaction.options.get("type")?.value;
    const all = type ? false : true;

    if (all || type == "hero") {
      await api
        .get("Hero?limit=100&fields=Id,Code,DiscordEmote,HeroEquips,Traits")
        .then((response) => {
          if (response.status == 200) {
            client.heroes = response.data.list;
          }
        });
      interaction.editReply({
        embeds: [new EmbedBuilder({ description: "Updated Heroes" })],
      });
    }

    if (all || type == "content") {
      await api.get("ContentType?limit=100&fields=Id,Code").then((response) => {
        if (response.status == 200) {
          client.contentTypes = response.data.list;
        }
      });
      interaction.editReply({
        embeds: [new EmbedBuilder({ description: "Updated ContentTypes" })],
      });
    }

    if (all || type == "trait") {
      await api.get("TraitType?limit=100").then((response) => {
        if (response.status == 200) {
          client.traitTypes = response.data.list;
        }
      });
      interaction.editReply({
        embeds: [new EmbedBuilder({ description: "Updated TraitTypes" })],
      });
    }

    if (all || type == "herogear") {
      await api
        .get(
          "HeroGearType?limit=100&fields=Id,Name,Code,EquipTypeRead,HeroClassRead,Image,UpdatedAt,DiscordEmote"
        )
        .then((response) => {
          if (response.status == 200) {
            client.heroGearTypes = response.data.list;
          }
        });
      interaction.editReply({
        embeds: [new EmbedBuilder({ description: "Updated HeroGearTypes" })],
      });
    }

    if (all || type == "equip") {
      await api
        .get(
          "EquipConfig?limit=100&fields=Id,Code,EquipTypeRead,Config,UpdatedAt"
        )
        .then((response) => {
          if (response.status == 200) {
            client.EquipConfig = response.data.list;
          }
        });
      interaction.editReply({
        embeds: [new EmbedBuilder({ description: "Updated EquipConfigs" })],
      });
    }

    if (all || type == "lineup") {
      await api
        .get(
          "ContentLineup?limit=100&fields=Id,Code,ContentTypeRead,ContentPhaseRead,UpdatedAt"
        )
        .then((response) => {
          if (response.status == 200) {
            client.ContentLineups = response.data.list;
          }
        });
      interaction.editReply({
        embeds: [new EmbedBuilder({ description: "Updated ContentLineups" })],
      });
    }

    if (all) {
      setTimeout(() => {
        interaction.editReply({
          embeds: [new EmbedBuilder({ description: "Updates Done" })],
        });
      }, 2000);
    }
  },
};
