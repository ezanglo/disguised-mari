const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Collection } = require('discord.js');

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
              "&nested[HeroEquips][fields]=Id,Code,ContentTypeRead" +
              "&nested[ContentTypeRead][fields]=Id,Name,Code" +
              "&nested[SkillUpgrade][fields]=Id,Skills,Code,ContentTypeRead" +
              "&nested[Skills][fields]=Id,SkillTypeRead,Name" +
              "&nested[Contents][fields]=Id,Name,Code" +
              "&nested[SkillTypeRead][fields]=Id,Name,Code"
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

            const limitbreak = await this.getLimitBreak(hero, interaction, heroCode, contentCode);
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
    async getLimitBreak(hero, interaction, heroCode, contentCode, refreshImage) {
        const limitbreakCode = [heroCode, contentCode].join(".");
        const heroClass = hero.HeroClassRead;
        const attributeType = hero.AttributeTypeRead;
        const skills = hero.SkillUpgrade.find(
          (x) => x.Code === limitbreakCode
        );
        const s1 = "<:s1:1044371160168661032>";
        const s2 = "<:s2:1044371163113074779>";
        const pass = "<:regional_indicator_p:1044690283419422771>";
        let contentName = "";
        let skillsValue = "";
        let nameValue = "";
        if (skills && hero.Contents.find(x => x.Code === contentCode)) {
          contentName = hero.Contents.find(x => x.Code === contentCode).Name;
          skillsValue = `${eval(skills.Skills[0].Code.split(".")[1])} - ${skills.Skills[0].Name} \n ${eval(skills.Skills[1].Code.split(".")[1])} - ${skills.Skills[1].Name}`;
          nameValue = `${hero.DisplayName} ${heroClass.DiscordEmote} ${attributeType.DiscordEmote}`;
        

        const embed = new EmbedBuilder()
        .setThumbnail(hero.Image)
        .setFooter({
            text: `Last updated ${new Date().toLocaleDateString()}`
        })
        .addFields([
            {
                name: "Hero Name",
                value: nameValue
            },
            {
                name: "Content",
                value: `${contentName}`
            },
            {
                name: "Recommended Skills to Limitbreak",
                value: skillsValue,
                inline: true
            }
        ])

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
            components: [row]
        };
        }
        embed.setImage(equipImage);
        embeds.push(embed);
        return {
            embeds: embeds,
            components: [row],
            refreshImage: true
        };
      }
    }
}