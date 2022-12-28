const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

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
        .setAutocomplete(true)
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
            description: `Content not found ${interaction.user}... try again ? ❌`,
          }),
        ],
      });
    }

    let phaseCode = interaction.options.getString("phase") ?? '';

    const lineUpCode = ["lu", contentCode, phaseCode].join(".");

    await api
      .get(
        `ContentLineup?where=(Code,like,${lineUpCode}%)` +
        "&nested[Heroes][fields]=Id,DisplayName,Code,AttributeTypeRead,HeroClassRead,DiscordEmote" +
        "&nested[ContentTypeRead][fields]=Id,Name,Code,Image,Icon" +
        "&nested[ContentPhaseRead][fields]=Id,Name,Code,Description,Image,AttributeTypeRead,HeroClassRead,Enemies" +
        "&nested[HeroPetRead][fields]=Id,Name,Code,Image,HeroRead" +
        "&nested[PartySkills][fields]=Name,Code,Image,DiscordEmote"
      )
      .then(async (response) => {
        const data = response.data;

        if (data.pageInfo.totalRows > 1) {

          if (contentCode == 'hf' && data.list[0].Code == lineUpCode) {
            const lineup = await this.getContentLineup(data.list[0], interaction);
            if (!lineup) {
              return interaction.editReply({
                embeds: [
                  new EmbedBuilder({
                    color: 0xed4245,
                    description: `Lineup not found ${interaction.user}... try again ? ❌`,
                  }),
                ],
              });
            }

            await interaction.editReply({
              embeds: lineup.embeds,
              components: lineup.components ? lineup.components : [],
            });
          } else {
            const lineup = await this.getContentOverall(data.list, interaction);

            await interaction.editReply({
              embeds: lineup
            });
          }
        } else if (data.pageInfo.totalRows == 1) {

          const lineup = await this.getContentLineup(data.list[0], interaction);
          if (!lineup) {
            return interaction.editReply({
              embeds: [
                new EmbedBuilder({
                  color: 0xed4245,
                  description: `Lineup not found ${interaction.user}... try again ? ❌`,
                }),
              ],
            });
          }

          await interaction.editReply({
            embeds: lineup.embeds,
            components: lineup.components ? lineup.components : [],
          });
        } else {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder({
                color: 0xed4245,
                description: `Lineup not found ${interaction.user}... try again ? ❌`,
              }),
            ],
          });
        }
      })
      .catch((e) => {
        interaction.editReply({
          embeds: [
            new EmbedBuilder({
              color: 0xed4245,
              description: `An Error has occured ${interaction.user}... try again ? ❌`
            }),
          ],
        });

        interaction.client.errorLog(e, interaction);
      });
  },
  async getContentOverall(data, interaction) {
    const embed = new EmbedBuilder()
      .setThumbnail(data[0].ContentTypeRead.Icon)
      .setTitle(data[0].ContentTypeRead.Name)

    for (var i = 0; i < data.length; i++) {

      if (data[i].PartySkills.length != 1) {
        embed.addFields([
          {
            name: `Phase ${i + 1} ${data[i].ContentPhaseRead.AttributeTypeRead.DiscordEmote}`,
            value: data[i].Heroes.map(
              (h) =>
                `${h.DiscordEmote}`
            )
              .join("") + " " + data[i].PartySkills.map(x => x.DiscordEmote).join("/") + " " + data[i].HeroPetRead.Name
          }
        ]);
      } else {
        embed.addFields([
          {
            name: `Phase ${i + 1} ${data[i].ContentPhaseRead.AttributeTypeRead.DiscordEmote}`,
            value: data[i].Heroes.map(
              (h) =>
                `${h.DiscordEmote}`
            )
              .join("") + " " + data[i].PartySkills[0].DiscordEmote + " " + data[i].HeroPetRead.Name
          }
        ]);
      }
    }
    let embeds = [];
    embeds.push(embed);

    return embeds;
  },
  async getContentLineup(data, interaction, refreshImage) {
    const content = data.ContentTypeRead.Name;
    const phase = data.ContentPhaseRead.Name;
    const lineupDate = data.UpdatedAt ? data.UpdatedAt : data.CreatedAt;

    const embed = new EmbedBuilder()
      .setThumbnail(data.ContentTypeRead.Icon)
      .setFooter({
        text: `Last updated ${new Date(lineupDate).toLocaleDateString()}`,
      })
      .addFields([
        {
          name: `${content} - ${phase}`,
          value: `${data.ContentPhaseRead.AttributeTypeRead.DiscordEmote} ${data.ContentPhaseRead.Description}`,
          inline: true,
        },
      ]);

    if (data.ContentPhaseRead.Enemies) {
      let value = data.ContentPhaseRead.Enemies.value.join(", ");
      if (data.ContentPhaseRead.Enemies.type == "heroes") {
        value = client.heroes
          .filter((h) => data.ContentPhaseRead.Enemies.value.includes(h.Code))
          .map((x) => x.DiscordEmote)
          .join(" ");
      }
      embed.addFields([{ name: "Enemies", value: value, inline: true }]);
    }

    // if(data.Video){
    //   const videoParts = data.Video.split('/');
    //   const videoId = videoParts[videoParts.length -1];
    //   embed.setImage(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
    // }
    embed.addFields([
      { name: "Gameplay", value: data.Video ? data.Video : "*placeholder*" },
    ]);

    const attributes = {
      red: { count: 0 },
      green: { count: 0 },
      blue: { count: 0 },
      light: { count: 0 },
      dark: { count: 0 },
    };

    data.Heroes.forEach((hero) => {
      if (hero.AttributeTypeRead.Code in attributes) {
        attributes[hero.AttributeTypeRead.Code].count += 1;
        attributes[hero.AttributeTypeRead.Code].emote =
          hero.AttributeTypeRead.DiscordEmote;
      }
    });

    const bonuses = [];
    for (const key in attributes) {
      if (attributes[key].count >= 2) {
        bonuses.push(
          `${attributes[key].emote} ${(attributes[key].count - 1) * 10}%`
        );
      }
    }

    const halfIndex = Math.ceil(data.Heroes.length / 2);
    embed.addFields([
      {
        name: "Heroes",
        value: data.Heroes.slice(0, halfIndex)
          .map(
            (h) =>
              `${h.HeroClassRead.DiscordEmote}${h.AttributeTypeRead.DiscordEmote} ${h.DiscordEmote} ${h.DisplayName}`
          )
          .join("\n"),
        inline: true,
      },
      {
        name: "\u200b",
        value: data.Heroes.slice(halfIndex)
          .map(
            (h) =>
              `${h.HeroClassRead.DiscordEmote}${h.AttributeTypeRead.DiscordEmote} ${h.DiscordEmote} ${h.DisplayName}`
          )
          .join("\n"),
        inline: true,
      },
      {
        name: "Bonus",
        value: bonuses.length > 0 ? bonuses.join(" ") : "None",
        inline: true,
      },
      {
        name: "Pet",
        value: data.HeroPetRead.Name ? data.HeroPetRead.Name : "None",
        inline: true,
      },
    ]);

    if (data.PartySkills) {
      embed.addFields([
        {
          name: "Party Skill(s)",
          value: data.PartySkills.map(x => x.DiscordEmote).join(" "),
          inline: true,
        }
      ]);
    }

    embed.addFields([{name: "\u200b", value: "\u200b"}]);

    if (data.Frequency) {
      const numbers = [
        "one",
        "two",
        "three",
        "four",
        "five",
        "six",
        "seven",
        "eight",
      ];
      const rows = [];
      let i = 0;
      data.Frequency.Skills.forEach((skill) => {
        const skillInfo = skill.Code.split(".");
        const heroEmote = data.Heroes.find(
          (h) => h.Code == skillInfo[0]
        ).DiscordEmote;
        let skillEmote = "";
        switch (skillInfo[1]) {
          case "s1":
            skillEmote =
              skill.Frequency != 0
                ? "<:s1:1044371160168661032>"
                : "<:s1_disabled:1044373922042347560>";
            if (skillInfo[2] == "lb") {
              skillEmote =
                skill.Frequency != 0
                  ? "<:s1lb:1044371161334677544>"
                  : "<:s1lb_disabled:1044373921211879424>";
            }
            break;
          case "s2":
            skillEmote =
              skill.Frequency != 0
                ? "<:s2:1044371163113074779>"
                : " <:s2_disabled:1044373918867263508>";
            if (skillInfo[2] == "lb") {
              skillEmote =
                skill.Frequency != 0
                  ? "<:s2lb:1044371162299367464>"
                  : "<:s2lb_disabled:1044373920217833572>";
            }
            break;
        }
        skill.Frequency = parseFloat(skill.Frequency).toFixed(1);
        if (skill.Heal) {
          skill.Frequency = `${skill.Frequency * 100}%`;
        }

        rows.push([`:${numbers[i]}:`, heroEmote, skillEmote, skill.Frequency]);
        i++;
      });

      const halfIndex = Math.ceil(rows.length / 2);
      embed.addFields([
        {
          name: "Frequency",
          value: rows
            .slice(0, halfIndex)
            .map((row) => `` + row.join(" "))
            .join("\n"),
          inline: true,
        },
        {
          name: "\u200b",
          value: rows
            .slice(halfIndex)
            .map((row) => `` + row.join(" "))
            .join("\n"),
          inline: true,
          
        },
      ]);
    }

    if (data.Formation) {
      const rows = [];
      for (var y = 0; y < 5; y++) {
        rows[y] = [];
        for (var x = 0; x < 5; x++) {
          rows[y][x] = "<:blanksquare:1044298072940875816>";
        }
      }
      const keys = Object.keys(data.Formation);
      keys.map((key) => {
        const hero = data.Heroes.filter((hero) => {
          return hero.Code === key;
        });
        rows[data.Formation[key][0]][data.Formation[key][1]] =
          hero[0].DiscordEmote;
      });
      embed.addFields([
        {
          name: "Formation",
          value: rows.map((row) => `` + row.join(" ")).join("\n"),
          inline: true,
        },
      ]);
    }

    if (data.Notes) {
      embed.addFields([
        {
          name: "Notes:",
          value: `\`\`\`${data.Notes}\`\`\``
        }
      ]);
    }

    let embeds = [];

    if (!refreshImage) {
      embeds.push(embed);
      return {
        embeds: embeds,
      };
    }

    embeds.push(embed);
    return {
      embeds: embeds,
    };
  },
};
