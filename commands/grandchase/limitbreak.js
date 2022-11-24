const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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

        const limitbreakCode = [heroCode, contentCode].join(".");

        /*await api
            .get(`HeroSkillUpgrade?where=(Code,eq,${limitbreakCode})` +
            "&nested[HeroRead][fields]=Id,DisplayName,Code,AttributeTypeRead,HeroClassRead,Image,HeroEquips" +
            "&nested[Skills][fields]=Id,Name,Code,HeroRead,SkillTypeRead" +
            "&nested[ContentTypeRead][fields]=Id,Name,Code" +
            "&nested[HeroClassRead][fields]=Id,DiscordEmote" +
            "&nested[AttributeTypeRead][fields]=Id,DiscordEmote" +
            "&nested[HeroEquips][fields]=Id,Code,ContentTypeRead"
            )*/
        selectedHero = selectedHero.shift();
        await api
            .get(
              "Hero/" +
              selectedHero.Id +
              "?nested[HeroClassRead][fields]=Id,Name,Image,DiscordEmote" +
              "&nested[AttributeTypeRead][fields]=Id,Name,Code,Image,DiscordEmote" +
              "&nested[HeroEquips][fields]=Id,Code,ContentTypeRead" +
              "&nested[ContentTypeRead][fields]=Id,Name,Code" +
              "&nested[SkillUpgrade][fields]=Id,Skills,Code" +
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
                      description: `Content not found ${interaction.author}... try again ? ❌`,
                    }),
                  ],
                });
            }

            const limitbreak = await this.getLimitBreak(hero, interaction, limitbreakCode, contentCode);
            if (!limitbreak) {
                return interaction.editReply({
                  embeds: [
                    new EmbedBuilder({
                      color: 0xed4245,
                      description: `Limitbreaks not found ${interaction.author}... try again ? ❌`,
                    }),
                  ],
                });
            }
            
            await interaction.editReply({
                embeds: limitbreak.embeds,
                components: limitbreak.components ? limitbreak.components : [],
            });
        })
        .catch((e) => {
            interaction.editReply(
              `An Error has occured ${interaction.author}... try again ? ❌`
            );
            interaction.client.errorLog(e, interaction);
      });
    },
    async getLimitBreak(hero, interaction, limitbreakCode, contentCode, refreshImage) {
        const heroClass = hero.HeroClassRead;
        const attributeType = hero.AttributeTypeRead;
        const skills = hero.SkillUpgrade.find(
          (x) => x.Code === limitbreakCode
        );
        const s1 = "<:s1:1044371160168661032>";
        const s2 = "<:s2:1044371163113074779>";
        const pass = "<:regional_indicator_p:1044690283419422771>";
        const content = interaction.options.get("content").value;
        const contentName = hero.Contents.find(x => x.Code === contentCode).Name;
        let ContentTypeCode = this.getDefaultContent(
          content,
          contentName
        );
        

        const embed = new EmbedBuilder()
        .setThumbnail(hero.Image)
        .setFooter({
            text: `Last updated ${new Date().toLocaleDateString()}`
        })
        .addFields([
            {
                name: "Hero Name",
                value: `${hero.DisplayName} ${heroClass.DiscordEmote} ${attributeType.DiscordEmote}`
            },
            {
                name: "Content",
                value: `${contentName}`
            },
            {
                name: "Recommended Skills to Limitbreak",
                value: `${eval(skills.Skills[0].Code.split(".")[1])} - ${skills.Skills[0].Name} \n ${eval(skills.Skills[1].Code.split(".")[1])} - ${skills.Skills[1].Name}`,
                inline: true
            }
        ])

        const row = new ActionRowBuilder();
        /*const ContentTypeButtons = [
          ...new Map(
            hero.Contents.map((item) => [
              console.log(item),
              item.Code,
              item.Name,
            ])
          ).values(),
        ];*/
        for (const content of hero.Contents) {
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
          console.log(isCurrentContent);
          console.log(customId);
          console.log(content);
        }
        const filename = `lb-${hero.Code}-${contentName.split(' ').join('_')}.jpg`;
        const equipImage = `${
          process.env.AWS_S3_CLOUDFRONT_LINK
        }equips/${filename}?ts=${Date.now()}`;
  
        await api
          .get(equipImage)
          .then((response) => {
            if (response.status == 200) {
              embed.setImage(equipImage);
            }
          })
          .catch((error) => {
            console.log(error.response.status, equipImage);
            refreshImage = true;
          })
          .finally(() => {});
  
        if (!refreshImage) {
          return {
            embed: embed,
            components: [row],
            equip: equip,
          };
        }

        let embeds = [];

        if (!refreshImage) {
        embeds.push(embed);
        return {
            embeds: embeds
        };
        }
        embed.setImage(equipImage);
        embeds.push(embed);
        return {
            embeds: embeds,
            components: [row],
            refreshImage: true
        };
    },
    getDefaultContent(content, defaultContent) {
      const isPVP = ["pvp", "arena", "gw", "gt", "ht"];
      const isPVE = [
        "pve",
        "gb",
        "db",
        "hf",
        "dr",
        "wb",
        "dc",
        "bl",
        "ba",
        "aot",
        "ah",
        "nm",
        "tt",
      ];
  
      if (!content) {
        return defaultContent;
      } else if (
        isPVP.includes(content.toLowerCase()) ||
        isPVE.includes(content.toLowerCase())
      ) {
        return content;
      } else {
        return defaultContent;
      }
    }
}