const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  SelectMenuBuilder,
  SlashCommandBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lineup")
    .setDescription("Show content line up recommendations")
    .addStringOption((option) =>
      option
        .setName("content")
        .setDescription("Select a content")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("phase")
        .setDescription("Select a phase")
    ),
  async execute(interaction) {
    const contentCode = interaction.options.get("content").value;
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

    let phaseCode = interaction.options.getString("phase");
    if (!phaseCode) {
      phaseCode = "p1";
    }

    const lineUpCode = ["lu", contentCode, phaseCode].join(".");

    await api
      .get(
        `ContentLineup?where=(Code,eq,${lineUpCode})` +
          "&nested[Heroes][fields]=Id,DisplayName,Code,AttributeTypeRead,HeroClassRead" +
          "&nested[ContentTypeRead][fields]=Id,Name,Code,Image,Icon" +
          "&nested[ContentPhaseRead][fields]=Id,Name,Code,Description,Image,AttributeTypeRead,HeroClassRead" +
          "&nested[HeroPetRead][fields]=Id,Name,Code,Image,HeroRead"
      )
      .then(async (response) => {
        const data = response.data;

        if (data.pageInfo.totalRows != 1) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder({
                color: 0xed4245,
                description: `Content not found ${interaction.author}... try again ? ❌`,
              }),
            ],
          });
        }

        const lineup = await this.getContentLineup(data.list[0], interaction);
        if (!lineup) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder({
                color: 0xed4245,
                description: `Lineup not found ${interaction.author}... try again ? ❌`,
              }),
            ],
          });
        }

        await interaction.editReply({
          embeds: lineup.embeds,
          components: lineup.components ? lineup.components : [],
        });
      })
      .catch((e) => {
        interaction.editReply(
          `An Error has occured ${interaction.author}... try again ? ❌`
        );

        interaction.client.errorLog(e, interaction);
      });

    // return interaction.editReply({ embeds: [
    //     new EmbedBuilder({
    //         color: 0xED4245,
    //         description: `Coming Soon™️ :)`
    //     })
    // ]});
  },
  async getContentLineup(data, interaction, refreshImage) {
    const content = data.ContentTypeRead.Name;
    const phase = data.ContentPhaseRead.Name;
    let lineupDate = data.UpdatedAt ? data.UpdatedAt : data.CreatedAt;

    const embed = new EmbedBuilder()
      .setThumbnail(data.ContentTypeRead.Icon)
      .setAuthor({ name: `${content} - ${phase}` })
      .setFooter({
        text: `Last updated ${new Date(lineupDate).toLocaleDateString()}`,
      })
      .addFields([
        {
          name: "Heroes",
          value: data.Heroes.map(
            (h) =>
              `${h.HeroClassRead.DiscordEmote}${h.AttributeTypeRead.DiscordEmote} ${h.DisplayName}`
          ).join("\n"),
          inline: true,
        },
        {
            name: 'Pet',
            value: data.HeroPetRead.Name,
            inline: true
        }
      ]);

    if (data.Video) {
        embed.addFields([
          { name: "Gameplay", value: data.Video },
        ]);
    }

    if (data.Formation) {
      const rows = [];
      for(var y = 0; y < 5; y++){
        rows[y] = [];
        for(var x = 0; x < 5; x++){
          rows[y][x] = '<:blanksquare:1044298072940875816>'
        }
      }
      const keys = Object.keys(data.Formation);
      keys.map( (key) => {
        const hero = data.Heroes.filter( (hero) => {
          return hero.Code === key;
        });
        rows[data.Formation[key][0]][data.Formation[key][1]] = hero[0].HeroClassRead.DiscordEmote
      })
      embed.addFields([
        { name: "Formation", value: rows.map((row) => `` + row.join(" ")).join("\n") },
      ]);
    }

    let embeds = [];

    if (!refreshImage) {
      embeds.push(embed);
      return {
        embeds: embeds
      };
    }

    embeds.push(embed);
    return {
      embeds: embeds
    };
  },
};
