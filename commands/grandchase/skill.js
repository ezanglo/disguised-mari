const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  SelectMenuBuilder,
  SlashCommandBuilder,
  ButtonStyle,
  Collection,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("skill")
    .setDescription("Show hero skill information")
    .addStringOption((option) =>
      option
        .setName("hero")
        .setDescription("Select a hero")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("skill")
        .setDescription("Select a skill")
        .addChoices(
          { name: "s1", value: "s1" },
          { name: "s2", value: "s2" },
          { name: "pass", value: "pass" },
          { name: "cs", value: "cs" },
          { name: "ss", value: "ss" },
        )
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Select an Upgrade Type") //["base", "lb", "si"];
        .addChoices(
          { name: "base", value: "base" },
          { name: "lb", value: "lb" },
          { name: "si", value: "si" },
        )
    ),
  async execute(interaction) {
    const heroCode = interaction.options.get("hero").value;

    let selectedHero = client.heroes.filter((x) =>
      x.Code.startsWith(heroCode.toLowerCase())
    );
    if (selectedHero.length == 0) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder({
            color: 0xed4245,
            description: `Hero not found ${interaction.user}... try again ? ❌`,
          }),
        ],
      });
    } else if (selectedHero.length > 1) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder({
            color: 0xed4245,
            description: `Multiple heroes found!\nplease select: [${selectedHero
              .map((x) => {
                return x.Code;
              })
              .join(", ")}]`,
          }),
        ],
      });
    }

    selectedHero = selectedHero.shift();

    await api
      .get(
        "Hero/" +
          selectedHero.Id +
          "?nested[Upgrades][fields]=Id,Name,Code" +
          "&nested[Skills][fields]=Id,Name,Code,Image,SP,Description," +
          "Cooldown,UpgradeTypeRead,SkillTypeRead,CreatedAt,UpdatedAt,Gif"
      )
      .then(async (response) => {
        const hero = response.data;

        const skill = this.getHeroSkill(hero, interaction);
        if (!skill) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder({
                color: 0xed4245,
                description: `Skill not found ${interaction.user}... try again ? ❌`,
              }),
            ],
          });
        }

        const reply = await interaction.editReply({
          embeds: [skill.embed],
          components: skill.components ? skill.components : [],
        });

        reply
          .awaitMessageComponent({
            time: 60000,
          })
          .then(async (int) => {
            
            console.log(int.customId);
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

            const skill = args.shift();
            if (skill) {
              int.options.set("skill", {
                name: "skill",
                value: skill,
              });
            }

            const upgradeType = args.shift();
            if (upgradeType) {
              int.options.set("type", {
                name: "type",
                value: upgradeType,
              });
            }

            if (int.isSelectMenu()) {
              int.options.set("type", {
                name: "type",
                value: int.values[0],
              });
            }

            await this.execute(int);
          })
          .catch((err) => {
            interaction.editReply({ components: [] });
          });
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
        client.errorLog(e, interaction);
      });
  },
  getHeroSkill(hero, interaction) {
    hero.Skills.sort(
      (a, b) =>
        a.SkillTypeRead.OrderBy - b.SkillTypeRead.OrderBy ||
        a.UpgradeTypeRead.OrderBy.localeCompare(b.UpgradeTypeRead.OrderBy)
    );

    let heroCode = hero.Code;
    let skillTypeCode = "s1";
    let upgradeTypeCode = "base";
    if (hero.Skills.length > 0) {
      skillTypeCode = hero.Skills[0].SkillTypeRead.Code;
      upgradeTypeCode = hero.Skills[0].UpgradeTypeRead.Code;
    }

    if (interaction.options.get("skill")) {
      skillTypeCode = interaction.options.get("skill").value;
    }

    if (interaction.options.get("type")) {
      upgradeTypeCode = interaction.options.get("type").value;
    }

    let skill = hero.Skills.find(
      (x) =>
        x.Code ==
        [heroCode, skillTypeCode, upgradeTypeCode].join(".").toLowerCase()
    );
    if (skill) {
      let authorLabel = skill.Name;
      if (skill.SP) {
        authorLabel += ` | ${skill.SP} SP`;
      }

      const embed = new EmbedBuilder()
        .setColor(hero.Color)
        .setThumbnail(skill.Image)
        .setAuthor({ name: authorLabel, iconURL: hero.Image });

      if (skill.Gif) {
        embed.setImage(skill.Gif);
      }

      const buttonsRow = new ActionRowBuilder();
      const selectMenu = new SelectMenuBuilder();
      const customId = [hero.Code, skill.SkillTypeRead.Code].join("_");
      selectMenu.setCustomId(customId);
      hero.Skills.forEach((s) => {
        if (upgradeTypeCode == s.UpgradeTypeRead.Code) {
          const isCurrentSkill =
            s.SkillTypeRead.Code == skill.SkillTypeRead.Code;
          const customButtonId = [
            hero.Code,
            s.SkillTypeRead.Code,
            s.UpgradeTypeRead.Code,
          ].join("_");
          buttonsRow.addComponents(
            new ButtonBuilder({
              label: s.SkillTypeRead.Name,
              customId: customButtonId,
              style: isCurrentSkill
                ? ButtonStyle.Secondary
                : ButtonStyle.Primary,
              disabled: isCurrentSkill,
            })
          );
        }

        if (skillTypeCode == s.SkillTypeRead.Code) {
          const isCurrentUpgradeType =
            s.UpgradeTypeRead.Code == skill.UpgradeTypeRead.Code;
          selectMenu.addOptions({
            label: s.UpgradeTypeRead.Name,
            value: s.UpgradeTypeRead.Code,
            default: isCurrentUpgradeType,
          });
        }
      });

      const menuRow = new ActionRowBuilder().addComponents(selectMenu);

      if (skill.UpgradeTypeRead) {
        embed.addFields([
          {
            name: "Upgrade Type",
            value: skill.UpgradeTypeRead.Name,
            inline: true,
          },
        ]);
      }
      if (skill.Cooldown) {
        embed.addFields([
          { name: "Cooldown", value: `${skill.Cooldown}s`, inline: true },
        ]);
      }
      const description = skill.Description.split("[Title]");

      for (let x = 0; x < description.length; x++) {
        const desc = description[x];
        if (x == 0) {
          embed.addFields([
            { name: "Skill Description", value: desc.substring(0, 1024) },
          ]);
        } else {
          const descSplit = desc.split("\n");
          const title = descSplit.shift();

          embed.addFields([
            { name: title, value: descSplit.join("\n").substring(0, 1024) },
          ]);
          if (descSplit.join("\n").length > 1024) {
            embed.addFields([
              { name: "Cont...", value: descSplit.join("\n").substring(1024) },
            ]);
          }
        }
      }

      let skillDate = skill.UpdatedAt ? skill.UpdatedAt : skill.CreatedAt;

      embed.setFooter({
        text: `Last updated ${new Date(skillDate).toLocaleDateString()}`,
      });

      return {
        embed: embed,
        components: [menuRow, buttonsRow],
      };
    }
  },
};
