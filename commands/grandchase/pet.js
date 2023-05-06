const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pet")
    .setDescription("Show pet skill information")
    .addStringOption((option) =>
      option
        .setName("hero")
        .setDescription(
          "Select a hero. (For Job Change Heroes Example: exelesis)"
        )
        .setRequired(true)
        .setAutocomplete(true)
    ),
  async execute(interaction) {
    const heroCode = interaction.options.getString("hero");

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
          "?nested[Pet][fields]=Id,Name,BasicAttack,SkillName,SkillDescription,Image,Code,CreatedAt,UpdatedAt" +
          "&nested[HeroClassRead][fields]=DiscordEmote" +
          "&nested[AttributeTypeRead][fields]=DiscordEmote"
      )
      .then(async (response) => {
        const hero = response.data;

        let pet = hero.Pet.find((x) => x.Code == `${hero.Code}.pet`);
        if (pet) {
          const authorLabel = `${pet.Name} | ${hero.DisplayName} Pet`;

          let basicAttack = "*placeholder*";
          if (pet.BasicAttack) {
            basicAttack = pet.BasicAttack;
          }

          let skillDescription = "*placeholder*";
          if (pet.SkillDescription) {
            skillDescription = pet.SkillDescription;
          }

          let petDate = pet.UpdatedAt ? pet.UpdatedAt : pet.CreatedAt;

          const embed = new EmbedBuilder()
            .setColor(hero.Color)
            .setThumbnail(pet.Image)
            .setAuthor({ name: authorLabel, iconUrl: hero.Image })
            .addFields([
              {
                name: `Hero Name`,
                value: `${hero.DisplayName} ${hero.HeroClassRead.DiscordEmote} ${hero.AttributeTypeRead.DiscordEmote}`,
              },
              {
                name: "Basic Attack",
                value: basicAttack,
              },
              {
                name: "Skill - " + pet.SkillName,
                value: skillDescription,
              },
            ])
            .setFooter({
              text: `Last updated ${new Date(petDate).toLocaleDateString()}`,
            });

          client.attachSupportMessageToEmbed(embed);

          await interaction.editReply({
            embeds: [embed],
          });
        } else {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder({
                color: 0xed4245,
                description: `Pet not found ${interaction.user}... try again ? ❌`,
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
              description: `An Error has occured ${interaction.user}... try again ? ❌`,
            }),
          ],
        });
        client.errorLog(e, interaction);
      });
  },
};
