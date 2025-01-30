const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("calc")
    .setDescription("A calculator for all your needs")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Displays all the available calculators")
        .addChoices(
          { name: "Pets", value: "pets" },
          { name: "Hero Training", value: "ht" },
          { name: "Chaser", value: "cs" },
          { name: "Soul Imprint", value: "si" }
        )
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("start")
        .setDescription("Provide the start level")
        .setMinValue(0)
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("end")
        .setDescription("Provide the end level")
        .setMinValue(0)
        .setRequired(true)
    ),
  async execute(interaction) {
    const contentType = interaction.options.get("type")?.value;
    let start = interaction.options.get("start")?.value;
    let end = interaction.options.get("end")?.value;

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle(`**Level ${start} -> Level ${end}**`);

    switch (contentType) {
      case "ht": {
        if (start > end) return this.interactionFail(interaction);

        if (end > 720) end = 720;
        let bovFragAmount = 0;

        const bovAmount = this.calcBoVHT(end).bov - this.calcBoVHT(start).bov;
        if (end > 400 && start <= 400) {
          end = 400;
          bovFragAmount = this.calcBoVHT(end).bovFragment - this.calcBoVHT(start).bovFragment;
        }
        let wizDays = Math.round(bovAmount / 710) + Math.round(bovFragAmount / (710 / 5));

        if (wizDays < 1) wizDays = 1;

        embed
          .setAuthor({ name: "Hero Taining Calculator" })
          .addFields({
            name: "\u200b",
            value: `Required BoV Fragment: ${
              this.emojiIcons.bovFragIcon
            } ${bovFragAmount.toLocaleString()}\nRequired BoV: ${
              this.emojiIcons.bovIcon
            } ${bovAmount.toLocaleString()}\nWizard Lab Entry: ${
              this.emojiIcons.wizlabIcon
            } ${wizDays.toLocaleString()}`,
          })
          .setThumbnail(
            "https://cdn.discordapp.com/attachments/992459474394677369/993246962260398270/BlessingsOfValor.png"
          )
          .setFooter({
            text: `Last Updated January 31, 2025`,
          });

        break;
      }
      case "pets": {
        if (start > end) return this.interactionFail(interaction);

        let petAmount = 0;

        if (end > 80) end = 80;

        for (let x = start + 1; x <= end; x++) {
          petAmount += this.calcPet(x);
        }

        let goldAmount =
          this.calcPetGold(parseInt(end)) - this.calcPetGold(parseInt(start));

        embed
          .setAuthor({ name: "Pet Calculator" })
          .addFields({
            name: "\u200b",
            value: `Pet Dupes Cost: ${
              this.emojiIcons.petIcon
            } ${petAmount.toLocaleString()}\nGold Cost: ${
              this.emojiIcons.goldIcon
            } ${goldAmount.toLocaleString()}`,
          })
          .setThumbnail(
            "https://cdn.discordapp.com/attachments/992459474394677369/993247439349886997/PetSelect.png"
          )
          .setFooter({
            text: `Last Updated January 30, 2025`,
          });

        break;
      }
      case "cs": {
        if (start > end) return this.interactionFail(interaction);

        if (end > 25) end = 25;

        const csCost = this.calcCS(parseInt(start), parseInt(end));

        embed
          .setAuthor({ name: "Chaser Calculator" })
          .addFields({
            name: "\u200b",
            value: `Growth Cubes Cost: ${
              this.emojiIcons.growthCubeIcon
            } ${csCost.csCubes.toLocaleString()}\n Growth Essence Cost: ${
              this.emojiIcons.growthEssenceIcon
            } ${csCost.csEssence}\nGold Cost: ${
              this.emojiIcons.goldIcon
            } ${csCost.csGold.toLocaleString()}`,
          })
          .setThumbnail(
            "https://d3mc4o4mvp1yzj.cloudfront.net/template/materials/growth_cube.png"
          )
          .setFooter({
            text: `Last Updated January 31, 2025`,
          });

        break;
      }
      case "si": {
        if (start > end) return this.interactionFail(interaction);

        if (end > 15) end = 15;

        const siCost = this.calcSI(start, end);

        embed
          .setAuthor({ name: "Soul Imprint Calculator" })
          .addFields({
            name: "\u200b",
            value: `Growth Cubes Cost: ${
              this.emojiIcons.growthCubeIcon
            } ${siCost.growthCubes.toLocaleString()}\nGrowth Essence Cost: ${
              this.emojiIcons.growthEssenceIcon
            } ${siCost.growthEssence}\nGold Cost: ${
              this.emojiIcons.goldIcon
            } ${siCost.siGold.toLocaleString()}`,
          })
          .setThumbnail(
            "https://d3mc4o4mvp1yzj.cloudfront.net/template/materials/growth_cube.png"
          )
          .setFooter({
            text: `Last Updated January 31, 2025`,
          });

        break;
      }
    }

    client.attachSupportMessageToEmbed(embed);

    return interaction.editReply({
      embeds: [embed],
    });
  },
  interactionFail(failedInteraction) {
    failedInteraction.editReply({
      embeds: [
        new EmbedBuilder({
          color: 0xed4245,
          description: "Please make sure you are doing it correctly!",
        }),
      ],
    });
  },
  calcBoVHT(level) {
    let bovValue = 0;
    let bovFrag = 0;
    if (level < 401) {
      bovFrag += ((parseInt(level) + 1) / 2) * (parseInt(level) * 2);
    } 
    if (level > 401) {
      bovValue += ((parseInt(level) + 1) / 2) * (parseInt(level) * 2);
    }
    return {bov: bovValue, bovFragment: bovFrag};
  },
  calcPetGold(lvl) {
    let costOverall = 0;
    let goldCost = 20000;
    for (let x = 2; x <= lvl; x++) {
      if (x <= 21) {
        costOverall += goldCost;
        if (x !== 21) goldCost += 20000;
      } else if (x > 21 && x <= 31) {
        goldCost += 30000;
        costOverall += goldCost;
      } else if (x > 31 && x <= 36) {
        goldCost += 40000;
        costOverall += goldCost;
      } else if (x > 36 && x <= 47) {
        goldCost += 100000;
        costOverall += goldCost;
      } else if (x > 47 && x <= 80) {
        goldCost += 150000;
        costOverall += goldCost;
      }
    }
    return costOverall;
  },
  calcPet(lvl) {
    let val = 1;
    if (lvl > 80) lvl = 80;

    for (let x = 1; x <= lvl; x++) {
      if (x <= 21 && x % 2 == 0) {
        val++;
      } else if (x > 21 && x <= 40) {
        val++;
      } else if (x > 40 && x <= 45) {
        val = val + 2;
      } else if (x > 45 && x <= 50) {
        val = val + 3;
      } else if (x > 50 && x <= 55) {
        val = val + 4;
      } else if (x > 55 && x <= 60) {
        val = val + 5;
      } else if (x > 60 && x <= 64) {
        val = val + 15;
      } else if (x == 65) {
        val = val + 20;
      } else if (x > 65 && x <= 69) {
        val = val + 5;
      } else if (x == 70 || x == 71) {
        val = val + 10;
      } else if (x > 71 && x <= 80) {
        val = val + 5;
      }
    }
    return val;
  },
  calcCS(startLvL, endLvL) {
    let growthCubes = 0;
    let growthEssence = 0;
    let chaserGold = 0;
    let essenceCost = 0;
    let goldCost = 0;

    if (startLvL !== 0) startLvL = startLvL + 1;

    for (let x = startLvL; x <= endLvL; x++) {
      if (x >= 1 && x < 5) {
        essenceCost = 8;
        goldCost = 100000;
      } else if (x >= 6 && x < 10) {
        essenceCost = 15;
        goldCost = 200000;
      } else if (x >= 11 && x < 15) {
        essenceCost = 28;
        goldCost = 300000;
      } else if (x >= 16 && x < 20) {
        essenceCost = 47;
        goldCost = 400000;
      } else if (x >= 21 && x < 25) {
        essenceCost = 72;
        goldCost = 500000;
      }

      growthEssence += essenceCost;
      if (x % 5 == 0) {
        growthCubes += 100;
        chaserGold += (x / 5 * 200000) + 1000000;
        if (x == 0) {
          growthEssence += 30;
        }
      } else {
        chaserGold += goldCost;
      }
    }
    return {
      csEssence: growthEssence,
      csCubes: growthCubes,
      csGold: chaserGold,
    };
  },
  calcSI(startLvl, endLvl) {
    let essenceCost = 0;
    let goldCost = 0;
    let growthCubesCost = 0;
    let essenceCount = 0;
    let memTraitGoldCost = 100000;
    let bodyTraitGoldCost = 400000;
    let soulTraitGoldCost = 800000;
    let memTraitEssenceCost = 15;
    let bodyTraitEssenceCost = 60;
    let soulTraitEssenceCost = 150;

    for (let x = startLvl + 1; x <= endLvl; x++) {
      if (x < 6) {
        goldCost += 800000 * x;
        essenceCount = 1;

        if (x > 3) {
          essenceCount += 1;
        }
        //costs 20 essence per level instead of si cubes
        essenceCost += 20;
        essenceCost += memTraitEssenceCost * essenceCount;
        goldCost += memTraitGoldCost * essenceCount;
      } else if (x < 11) {
        goldCost += 1000000 * (x - 5);
        essenceCount = 1;

        if (x > 8) {
          essenceCount += 1;
        }
        essenceCost += bodyTraitEssenceCost * essenceCount;
        goldCost += bodyTraitGoldCost * essenceCount;
        growthCubesCost += 250;
      } else {
        goldCost += 1500000 * (x - 10);
        essenceCount = 1;

        if (x > 13) {
          essenceCount += 1;
        }
        essenceCost += soulTraitEssenceCost * essenceCount;
        goldCost += soulTraitGoldCost * essenceCount;
        growthCubesCost += 250;
      }
    }
    if (startLvl <= 0 && endLvl >= 1) {
      goldCost += 1500000;
      essenceCost += 20;
    }
    if (startLvl <= 5 && endLvl >= 6) {
      goldCost += 2000000;
      essenceCost += 100;
      growthCubesCost += 250;
    }
    if (startLvl <= 10 && endLvl >= 11) {
      goldCost += 3000000;
      essenceCost += 225;
      growthCubesCost += 250;
    }
    if (endLvl == 15) {
       goldCost +=
        memTraitGoldCost * 2 + bodyTraitGoldCost * 2 + soulTraitGoldCost * 2;
      essenceCost +=
        memTraitEssenceCost * 2 +
        bodyTraitEssenceCost * 2 +
        soulTraitEssenceCost * 2;
    }
    goldCost /= 2;
    return { growthEssence: essenceCost, siGold: goldCost, growthCubes: growthCubesCost };
  },
  emojiIcons: {
    petIcon: "<:pet:1045020933867450539>",
    growthCubeIcon: "<:growth_cube:1334586225025093703>",
    growthEssenceIcon: "<:growth_essence:1334586261750419517>",
    goldIcon: "<:gold:1045020932416229488>",
    wizlabIcon: "<:wizlab_tix:1044675274110939138>",
    bovIcon: "<:bov:1044675273355968612>",
    bovFragIcon: "<:bov_fragment:1334585835265327256>",
  },
};
