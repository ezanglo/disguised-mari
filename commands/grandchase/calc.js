const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("calc")
    .setDescription("A calculator for all your needs")
    .addStringOption(option =>
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
    .addIntegerOption(option =>
      option
        .setName("start")
        .setDescription("Provide the start level")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("end")
        .setDescription("Provide the end level")
        .setRequired(true)
    ),
  async execute(interaction) {
    const contentType = interaction.options.get("type").value;
    const start = interaction.options.get("start").value;
    const end = interaction.options.get("end").value;

    switch (contentType) {
      case 'ht':

        if (start > end) return interactionFail(interaction);

        const amount = this.calcBoVHT(end) - this.calcBoVHT(start);

        let wizDays = Math.round(amount / 604);

        if (wizDays < 1) wizDays = 1;

        return interaction.editReply({
          embeds: [
            new EmbedBuilder({
              color: 0xed4245,
              title: `**Level ${start} -> Level ${end}**`,
            })
              .setAuthor(
                { name: 'Hero Taining Calculator' }
              )
              .addFields(
                { name: '\u200b', value: `Required BoV: ${this.emojiIcons.bovIcon} ${amount.toLocaleString()}\nWizard Lab Entry: ${this.emojiIcons.wizlabIcon} ${wizDays.toLocaleString()}` }
              )
              .setThumbnail("https://cdn.discordapp.com/attachments/992459474394677369/993246962260398270/BlessingsOfValor.png")
              .setFooter({
                text: `Last Updated November 23, 2022`
              }),
          ],
        });
        break;
      case 'pets':

        if (start > end) return interactionFail(interaction);

        let petAmount = 0;

        for (let x = start; x <= end; x++) {
          petAmount += this.calcPet(x);
        }

        let goldAmount = this.calcPetGold(parseInt(end)) - this.calcPetGold(parseInt(start));

        return interaction.editReply({
          embeds: [
            new EmbedBuilder({
              color: 0xed4245,
              title: `Level ${start} -> Level ${end}`,
            })
              .setAuthor(
                { name: 'Pet Calculator' }
              )
              .addFields(
                { name: '\u200b', value: `Pet Dupes Cost: ${this.emojiIcons.petIcon} ${petAmount.toLocaleString()}\nGold Cost: ${this.emojiIcons.goldIcon} ${goldAmount.toLocaleString()}` }
              )
              .setThumbnail('https://cdn.discordapp.com/attachments/992459474394677369/993247439349886997/PetSelect.png')
              .setFooter({
                text: `Last Updated November 23, 2022`
              }),
          ],
        });
        break;
      case 'cs':

        if (start > end) return interactionFail(interaction);

        let csCubeCalc = this.calcCS(parseInt(start), parseInt(end)).cs_cubes;
        let csGoldCalc = this.calcCS(parseInt(start), parseInt(end)).cs_gold;
        let csCrystalCalc = this.calcCS(parseInt(start), parseInt(end)).cs_crystals;

        return interaction.editReply({
          embeds: [
            new EmbedBuilder({
              color: 0xed4245,
              title: `Level ${start} -> Level ${end}`,
            })
              .setAuthor(
                { name: 'Chaser Calculator' }
              )
              .addFields(
                { name: '\u200b', value: `Chaser Cubes Cost: ${this.emojiIcons.csCubeIcon} ${csCubeCalc.toLocaleString()}\nChaser Crystals Cost: ${this.emojiIcons.cscIcon} ${csCrystalCalc}\nGold Cost: ${this.emojiIcons.goldIcon} ${csGoldCalc.toLocaleString()}` }
              )
              .setThumbnail('https://cdn.discordapp.com/attachments/992459474394677369/993247439685427320/ChaserCube.png')
              .setFooter({
                text: `Last Updated November 28, 2022`
              }),
          ],
        });
        break;
      case 'si':

        if (start > end) return interactionFail(interaction);

        let siCubes = this.calcSI(start, end).si_cube;
        let soulEssence = this.calcSI(start, end).soul_essence;
        let siGoldCost = this.calcSI(start, end).si_gold;

        return interaction.editReply({
          embeds: [
            new EmbedBuilder({
              color: 0xed4245,
              title: `Level ${start} -> Level ${end}`,
            })
              .setAuthor(
                { name: 'Soul Imprint Calculator' }
              )
              .addFields(
                { name: '\u200b', value: `Soul Imprint Cubes Cost: ${this.emojiIcons.siCubeIcon} ${siCubes.toLocaleString()}\nSoul Essence Cost: ${this.emojiIcons.soulEssenceIcon} ${soulEssence}\nGold Cost: ${this.emojiIcons.goldIcon} ${siGoldCost.toLocaleString()}` }
              )
              .setThumbnail('https://cdn.discordapp.com/attachments/992459474394677369/993247440578818219/SoulChaserCube.png')
              .setFooter({
                text: `Last Updated November 28, 2022`
              }),
          ],
        });
        break;
    }
  },
  interactionFail(failedInteraction) {
    failedInteraction.editReply({
      embeds: [
        new EmbedBuilder({
          color: 0xed4245,
          description: 'Please make sure you are doing it correctly!'
        }),
      ],
    });
  },
  calcBoVHT(level) {
    level = ((parseInt(level) + 1) / 2) * (parseInt(level) * 2);
    return level;
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
      } else if (x > 47 && x <= 70) {
        goldCost += 150000;
        costOverall += goldCost;
      }
    }
    return costOverall;
  },
  calcPet(lvl) {
    let val = 1;
    if (lvl > 70) lvl = 70;

    for (let x = 1; x <= lvl; x++) {

      if (x <= 21 && x % 2 == 0) {
        val++;
      }
      else if (x > 21 && x <= 40) {
        val++
      }
      else if (x > 40 && x <= 45) {
        val = val + 2;
      }
      else if (x > 45 && x <= 50) {
        val = val + 3;
      }
      else if (x > 50 && x <= 55) {
        val = val + 4;
      }
      else if (x > 55 && x <= 60) {
        val = val + 5;
      }
      else if (x > 60 && x <= 64) {
        val = val + 15;
      }
      else if (x == 65) {
        val = val + 20;
      }
      else if (x > 65 && x <= 69) {
        val = val + 5;
      }
      else if (x == 70) {
        val = val + 10;
      }
    }
    return val;
  },
  calcCS(startLvL, endLvL) {
    let chaserCubes = 0;
    let chaserCrystals = 0;
    let chaserGold = 0;

    if (startLvL !== 0) startLvL = (startLvL + 1);

    for (var x = startLvL; x <= endLvL; x++) {

      if (x % 5 == 0) {
        if (x == 0) {
          chaserCubes += 200;
          chaserCrystals += 150;
          chaserGold += 5000000;
        } else if (x == 5) {
          chaserCubes += 200;
          chaserCrystals += 40;
          chaserGold += 1500000;
        } else if (x == 10) {
          chaserCubes += 200;
          chaserCrystals += 76;
          chaserGold += 3000000;
        } else if (x == 15) {
          chaserCubes += 200;
          chaserCrystals += 142;
          chaserGold += 6000000;
        } else if (x == 20) {
          chaserCubes += 200;
          chaserCrystals += 238;
          chaserGold += 7500000;
        } else if (x == 25) {
          chaserCubes += 200;
          chaserCrystals += 364;
          chaserGold += 15000000;
        }
      }

      if (x >= 1 && x < 5) {
        chaserCrystals += 40;
        chaserGold += 300000;
      } else if (x >= 6 && x < 10) {
        chaserCrystals += 76;
        chaserGold += 600000;
      } else if (x >= 11 && x < 15) {
        chaserCrystals += 142;
        chaserGold += 1200000;
      } else if (x >= 16 && x < 20) {
        chaserCrystals += 238;
        chaserGold += 1500000;
      } else if (x >= 21 && x < 25) {
        chaserCrystals += 364;
        chaserGold += 3000000;
      }
    }
    return { cs_crystals: chaserCrystals, cs_cubes: chaserCubes, cs_gold: chaserGold };
  },
  calcSI(startLvl, endLvl) {
    let essenceCost = 0;
    let goldCost = 0;
    let siCubesCost = 0;
    let startAmount = startLvl;
    let endAmount = endLvl;
    let memTraitEssenceCost = 15;
    let memTraitGoldCost = 100000;
    let bodyTraitGoldCost = 500000;
    let soulTraitGoldCost = 2000000;
    let bodyTraitEssenceCost = 60;
    let soulTraitEssenceCost = 150;

    if (endLvl > 5) endAmount += 1;
    if (endLvl == 15) endAmount = 17;
    if (startLvl > 0) startAmount += 1;

    for (x = startAmount; x <= endAmount; x++) {

      if (x >= 0 && x <= 5) {
        essenceCost += 20;
        switch (x) {
          case 0: // unlock
            goldCost += 5000000
            break;
          case 1:
            goldCost += 1000000
            essenceCost += memTraitEssenceCost;
            goldCost += memTraitGoldCost;
            break;
          case 2:
            goldCost += 1500000
            essenceCost += memTraitEssenceCost;
            goldCost += memTraitGoldCost;
            break;
          case 3:
            goldCost += 2000000
            essenceCost += memTraitEssenceCost;
            goldCost += memTraitGoldCost;
            break;
          case 4:
            goldCost += 2500000
            essenceCost += memTraitEssenceCost * 2;
            goldCost += memTraitGoldCost * 2;
            break;
          case 5:
            goldCost += 3000000
            essenceCost += memTraitEssenceCost * 2;
            goldCost += memTraitGoldCost * 2;
            break
        }
      } else if (x >= 6 && x <= 11) {
        siCubesCost += 250;
        switch (x) {
          case 6: // unlock
            goldCost += 4000000;
            essenceCost += 100;
            break;
          case 7: // this is supposedly si6
            goldCost += 5000000;
            essenceCost += bodyTraitEssenceCost;
            goldCost += bodyTraitGoldCost;
            break;
          case 8:
            goldCost += 6000000;
            essenceCost += bodyTraitEssenceCost;
            goldCost += bodyTraitGoldCost;
            break;
          case 9:
            goldCost += 7000000;
            essenceCost += bodyTraitEssenceCost;
            goldCost += bodyTraitGoldCost;
            break;
          case 10:
            goldCost += 8000000;
            essenceCost += bodyTraitEssenceCost * 2;
            goldCost += bodyTraitGoldCost * 2;
            break;
          case 11: // si10
            goldCost += 9000000;
            essenceCost += bodyTraitEssenceCost * 2;
            goldCost += bodyTraitGoldCost * 2;
            break;
        }
      } else if (x >= 12 && x <= 17) {
        siCubesCost += 250;
        switch (x) {
          case 12: // unlock
            goldCost += 10000000;
            essenceCost += 225;
            break;
          case 13: // this is supposedly si11
            goldCost += 12000000;
            essenceCost += soulTraitEssenceCost;
            goldCost += soulTraitGoldCost;
            break;
          case 14:
            goldCost += 14000000;
            essenceCost += soulTraitEssenceCost;
            goldCost += soulTraitGoldCost;
            break;
          case 15:
            goldCost += 16000000;
            essenceCost += soulTraitEssenceCost;
            goldCost += soulTraitGoldCost;
            break;
          case 16:
            goldCost += 18000000;
            essenceCost += soulTraitEssenceCost * 2;
            goldCost += soulTraitGoldCost;
            break;
          case 17: // this is supposedly si15
            goldCost += 20000000;
            // essenceCost = 2470;
            // goldCost = 71400000;
            essenceCost += soulTraitEssenceCost * 4;
            essenceCost += bodyTraitEssenceCost * 2;
            essenceCost += memTraitEssenceCost * 2;
            goldCost += soulTraitGoldCost * 4;
            goldCost += bodyTraitGoldCost * 2;
            goldCost += memTraitGoldCost * 2;
            break;
        }
      }
    }
    return { soul_essence: essenceCost, si_gold: goldCost, si_cube: siCubesCost }
  },
  emojiIcons: {
    petIcon: "<:pet:1045020933867450539>",
    siCubeIcon: "<:si_cube:1046833548805546014>",
    soulEssenceIcon: "<:soul_essence:1046833547442405458>",
    csCubeIcon: "<:cs_cube:1045626245376909332>",
    cscIcon: "<:chaser_crystal:1046833546238632098>",
    goldIcon: "<:gold:1045020932416229488>",
    wizlabIcon: "<:wizlab_tix:1044675274110939138>",
    bovIcon: "<:bov:1044675273355968612>",
  },
}