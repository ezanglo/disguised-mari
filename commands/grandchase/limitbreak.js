const {
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  Collection,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("limitbreak")
    .setDescription("Show hero lb skills recommendation for said content")
    .addStringOption((option) =>
      option
        .setName("hero")
        .setDescription("Select a hero")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("content")
        .setDescription("Select a content")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async execute(interaction) {
    const heroCode = interaction.options.get("hero").value;
    let selectedHero = client.heroes.filter((x) =>
      x.Code.startsWith(heroCode.toLowerCase())
    );
    if (selectedHero.length != 1) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder({
            color: 0xed4245,
            description: `Hero not found ${interaction.author}... try again ? ❌`,
          }),
        ],
      });
    }

    let contentCode = interaction.options.get("content").value;
    let selectedContent = client.contentTypes.filter((x) =>
      x.Code.startsWith(contentCode.toLowerCase())
    );
    if (selectedContent.length != 1) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder({
            color: 0xed4245,
            description: `Content not found ${interaction.author}... try again ? ❌`,
          }),
        ],
      });
    }

    selectedHero = selectedHero.shift();
    await api
      .get(
        "Hero/" +
          selectedHero.Id +
          "?nested[HeroClassRead][fields]=Id,Name,Image,DiscordEmote" +
          "&nested[AttributeTypeRead][fields]=Id,Name,Code,Image,DiscordEmote" +
          "&nested[SkillUpgrade][fields]=Code,Skills,ContentTypeRead,CreatedAt,UpdatedAt"
      )
      .then(async (response) => {
        const hero = response.data;
        if (!hero) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder({
                color: 0xed4245,
                description: `Content not found ${interaction.user}... try again ? ❌`,
              }),
            ],
          });
        }

        const limitbreak = await this.getLimitBreak(
          hero,
          interaction,
          heroCode,
          contentCode
        );
        if (!limitbreak) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder({
                color: 0xed4245,
                description: `Limitbreaks not found ${interaction.user}... try again ? ❌`,
              }),
            ],
          });
        }

        await interaction.editReply({
          embeds: limitbreak.embeds,
          components: limitbreak.components ? limitbreak.components : [],
        });

        const reply = await interaction.editReply({
          embeds: limitbreak.embeds,
          components: limitbreak.components ? limitbreak.components : [],
        });

        reply
          .awaitMessageComponent({
            componentType: ComponentType.Button,
            time: 60000,
          })
          .then(async (int) => {
            if (int.user.id !== interaction.user.id) {
              return int.reply({
                content: `You don't have access to this interaction ${int.user}... ❌`,
                ephemeral: true,
              });
            }

            await int.deferUpdate();

            const args = int.customId.split("_");

            int.options = new Collection();
            int.options.set("hero", { name: "hero", value: args.shift() });
            int.options.set("content", {
              name: "content",
              value: args.shift(),
            });

            await this.execute(int);
          })
          .catch((err) => {
            interaction.editReply({ components: [] });
          });
      })
      .catch((e) => {
        interaction.editReply(
          `An Error has occured ${interaction.user}... try again ? ❌`
        );
        interaction.client.errorLog(e, interaction);
      });
  },
  async getLimitBreak(hero, interaction, refreshImage) {
    const heroCode = interaction.options.get("hero").value;
    const contentCode = interaction.options.get("content").value;
    const skillUpgrade = hero.SkillUpgrade.find(
      (x) => x.Code === [heroCode, contentCode].join(".")
    );
    if (skillUpgrade) {
      const skillEmoteMap = {
        s1: "<:s1:1044371160168661032>",
        s2: "<:s2:1044371163113074779>",
        pass: "<:regional_indicator_p:1044690283419422771>",
      };

      const skillContents = skillUpgrade.Skills.map(
        (x) => `${skillEmoteMap[x.Code.split('.')[1]]} - ${x.Name}`
      );

      let skillUpgradeDate = skillUpgrade.UpdatedAt ? skillUpgrade.UpdatedAt : skillUpgrade.CreatedAt;

      const embed = new EmbedBuilder()
        .setThumbnail(hero.Image)
        .setFooter({
          text: `Last updated ${new Date(skillUpgradeDate).toLocaleDateString()}`
        })
        .addFields([
          {
            name: "Hero Name",
            value: `${hero.DisplayName} ${hero.HeroClassRead.DiscordEmote} ${hero.AttributeTypeRead.DiscordEmote}`,
          },
          {
            name: "Content",
            value: skillUpgrade.ContentTypeRead.Name,
          },
          {
            name: "Recommended Skills to Limitbreak",
            value: skillContents.join("\n"),
          },
        ]);

      const row = new ActionRowBuilder();
      const ContentTypeButtons = [
        ...new Map(
          hero.SkillUpgrade.map((item) => [
            item["ContentTypeRead"]["Code"],
            item.ContentTypeRead,
          ])
        ).values(),
      ];

      for (const content of ContentTypeButtons) {
        const isCurrentContent = content.Code == contentCode;
        const customId = [hero.Code, content.Code];
        row.addComponents(
          new ButtonBuilder({
            label: content.Name,
            customId: customId.join("_"),
            style: isCurrentContent
              ? ButtonStyle.Secondary
              : ButtonStyle.Primary,
            disabled: isCurrentContent,
          })
        );
      }

      let embeds = [];

      if (!refreshImage) {
        embeds.push(embed);
        return {
          embeds: embeds,
          components: [row],
        };
      }
      embeds.push(embed);
      return {
        embeds: embeds,
        components: [row],
        refreshImage: true,
      };
    }
  },
};
