const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hero")
    .setDescription("Show hero basic recommendations")
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

    let selectedHero = interaction.client.heroes.filter((x) =>
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
          "?nested[HeroClassRead][fields]=Name,Image" +
          "&nested[HeroClassRead][fields]=DiscordEmote" +
          "&nested[AttributeTypeRead][fields]=DiscordEmote" +
          "&nested[Skills][fields]=Name,UpgradeTypeRead,SkillTypeRead" +
          "&nested[Traits][fields]=Id,UpgradeTypeRead,Code,Config," +
          "&nested[HeroMMList][fields]=Heroes,ContentTypeRead,ContentPhaseRead" +
          "&nested[HeroEquips][fields]=" +
          "Id,Code,ContentTypeRead,WeaponConfig,SubWeaponConfig,ArmorConfig," +
          "SubArmor1Config,SubArmor2Config,ExclusiveWeaponConfig,RingConfig," +
          "NecklaceConfig,EarringConfig,Artifact,Credits,Notes,CreatedAt,UpdatedAt" +
          "&nested[Images][fields]=Code,Name,Image"
      )
      .then(async (response) => {
        const hero = response.data;

        //content
        let contentDetails = "None";
        if (hero.HeroMMList.length > 0) {
          contentDetails = this.getContent(hero.HeroMMList);
        }

        const embed = new EmbedBuilder()
          .setColor(hero.Color)
          .setThumbnail(hero.Image)
          .setImage(hero.Banner)
          .addFields([
            {
              name: "Hero Name",
              value: `${hero.Name} ${hero.HeroClassRead.DiscordEmote} ${hero.AttributeTypeRead.DiscordEmote}`,
            },
            { name: "Content `/lineup`", value: contentDetails },
          ]);

        //Transcendence
        let TransCode = [hero.Code, "pve", "trans"];
        let transPve = hero.Traits.find(
          (x) => x.Code == TransCode.join(".").toLowerCase()
        );
        TransCode[1] = "pvp";
        let transPvp = hero.Traits.find(
          (x) => x.Code == TransCode.join(".").toLowerCase()
        );
        TransCode[1] = "wb";
        let transWb = hero.Traits.find(
          (x) => x.Code == TransCode.join(".").toLowerCase()
        );
        if ((transPve && transPve.Config) || (transPvp && transPvp.Config) || (transWb && transWb.Config))
          embed.addFields([
            {
              name: "Transcendence `/trait`",
              value: this.getTraitTransRecommendation(transPve, transPvp, transWb),
            },
          ]);

        // Equipment
        let EquipCode = ["equip", hero.Code, "pve"];
        let equipPve = hero.HeroEquips.find(
          (x) => x.Code == EquipCode.join(".").toLowerCase()
        );
        EquipCode[2] = "pvp";
        let equipPvp = hero.HeroEquips.find(
          (x) => x.Code == EquipCode.join(".").toLowerCase()
        );
        EquipCode[2] = "wb";
        let equipWb = hero.HeroEquips.find(
          (x) => x.Code == EquipCode.join(".").toLowerCase()
        );
        if (equipPve || equipPvp || equipWb)
          embed.addFields([
            {
              name: "Equipment `/equip`",
              value: this.getEquipRecommendation(equipPve, equipPvp, equipWb),
            },
          ]);

        // Enchants
        if (equipPve || equipPvp || equipWb)
          embed.addFields([
            {
              name: "Enchants `/equip`",
              value: this.getEnchantRecommendation(equipPve, equipPvp, equipWb),
            },
          ]);

        // Accessories
        if (equipPve || equipPvp || equipWb)
          embed.addFields([
            {
              name: "Accessories `/equip`",
              value: this.getAccessoryRecommendation(equipPve, equipPvp, equipWb),
            },
          ]);

        // Traits
        let traitCommands = [hero.Code, "pve", "lvl"];
        let traitPve = hero.Traits.find(
          (x) => x.Code == traitCommands.join(".").toLowerCase()
        );
        traitCommands[1] = "pvp";
        let traitPvp = hero.Traits.find(
          (x) => x.Code == traitCommands.join(".").toLowerCase()
        );
        traitCommands[1] = "wb";
        let traitWb = hero.Traits.find(
          (x) => x.Code == traitCommands.join(".").toLowerCase()
        );
        if ((traitPve && traitPve.Config) || (traitPvp && traitPvp.Config) || (traitWb && traitWb.Config))
          embed.addFields([
            {
              name: "Traits `/trait`",
              value: this.getTraitRecommendation(traitPve, traitPvp, traitWb),
            },
          ]);

        //cs
        traitCommands = [hero.Code, "pve", "cs"];
        traitPve = hero.Traits.find(
          (x) => x.Code == traitCommands.join(".").toLowerCase()
        );
        traitCommands[1] = "pvp";
        traitPvp = hero.Traits.find(
          (x) => x.Code == traitCommands.join(".").toLowerCase()
        );
        if ((traitPve && traitPve.Config) || (traitPvp && traitPvp.Config))
          embed.addFields([
            {
              name: "Chaser `/trait`",
              value: this.getChaserRecommendation(traitPve, traitPvp),
            },
          ]);

        if (hero.Notes) {
          embed.addFields([
            {
              name: "Note",
              value: "```" + hero.Notes + "```",
            },
          ]);
        }

        client.attachSupportMessageToEmbed(embed);

        interaction.editReply({
          embeds: [embed],
        });
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
        interaction.client.errorLog(e, interaction);
      });
  },
  getContent(list) {
    return list
      .map(
        (content) =>
          `${content.ContentTypeRead.Name} - ${content.ContentPhaseRead.Name}`
      )
      .join("\n");
  },

  getEnchantRecommendation(equipPve, equipPvp, equipWb) {
    let pveRecommendation = "";
    let pvpRecommendation = "";
    let wbRecommendation = "";
    let recommendation = [];
    const greyEnchant = "<:greyenchant:1043324859037536329>";
    const pinkEnchant = "<:pinkenchant:1043324859968663603>";
    const blueEnchant = "<:blueenchant:1043324861814161419>";
    if (
      equipPve &&
      equipPve.WeaponConfig &&
      equipPve.WeaponConfig.enchant1 &&
      equipPve.WeaponConfig.enchant2 &&
      equipPve.SubArmor1Config &&
      equipPve.SubArmor1Config.enchant2
    ) {
      pveRecommendation = `**PVE:** ${greyEnchant} ${equipPve.WeaponConfig.enchant1.toUpperCase()} ${pinkEnchant} ${equipPve.WeaponConfig.enchant2.toUpperCase()} ${blueEnchant} ${equipPve.SubArmor1Config.enchant2.toUpperCase()}`;
    }
    if (
      equipPvp &&
      equipPvp.WeaponConfig &&
      equipPvp.WeaponConfig.enchant1 &&
      equipPvp.WeaponConfig.enchant2 &&
      equipPvp.SubArmor1Config &&
      equipPvp.SubArmor1Config.enchant2
    ) {
      pvpRecommendation = `**PVP:** ${greyEnchant} ${equipPvp.WeaponConfig.enchant1.toUpperCase()} ${pinkEnchant}  ${equipPvp.WeaponConfig.enchant2.toUpperCase()} ${blueEnchant}  ${equipPvp.SubArmor1Config.enchant2.toUpperCase()}`;
    }

    if (
      equipWb &&
      equipWb.WeaponConfig &&
      equipWb.WeaponConfig.enchant1 &&
      equipWb.WeaponConfig.enchant2 &&
      equipWb.SubArmor1Config &&
      equipWb.SubArmor1Config.enchant2
    ) {
      wbRecommendation = `**WB:** ${greyEnchant} ${equipWb.WeaponConfig.enchant1.toUpperCase()} ${pinkEnchant}  ${equipWb.WeaponConfig.enchant2.toUpperCase()} ${blueEnchant}  ${equipWb.SubArmor1Config.enchant2.toUpperCase()}`;
    }
    if (pveRecommendation.length !== 0) {
      recommendation.push(pveRecommendation);
    }
    if (pvpRecommendation.length !== 0) {
      recommendation.push(pvpRecommendation);
    }
    if (wbRecommendation.length !== 0) {
      recommendation.push(wbRecommendation);
    }
    return recommendation.join("\n");
  },

  getAccessoryRecommendation(equipPve, equipPvp, equipWb) {
    let pveRecommendation = "";
    let pvpRecommendation = "";
    let wbRecommendation = "";
    let recommendation = [];

    if (
      equipPve &&
      equipPve.RingConfig &&
      equipPve.RingConfig.color &&
      equipPve.NecklaceConfig &&
      equipPve.NecklaceConfig.color &&
      equipPve.EarringConfig &&
      equipPve.EarringConfig.color
    ) {
      const ring = client.heroGearTypes.find(
        (x) => x.Code == ["acce", "ring", equipPve.RingConfig.type].join(".")
      );
      const neck = client.heroGearTypes.find(
        (x) =>
          x.Code == ["acce", "neck", equipPve.NecklaceConfig.type].join(".")
      );
      const ear = client.heroGearTypes.find(
        (x) => x.Code == ["acce", "ear", equipPve.EarringConfig.type].join(".")
      );
      pveRecommendation = `**PVE:** ${
        this.equipmentColors[equipPve.RingConfig.color]
      } ${ring.DiscordEmote} ${equipPve.RingConfig.type.toUpperCase()} ${
        neck.DiscordEmote
      } ${equipPve.NecklaceConfig.type.toUpperCase()} ${
        ear.DiscordEmote
      } ${equipPve.EarringConfig.type.toUpperCase()}`;
    }
    if (
      equipPvp &&
      equipPvp.RingConfig &&
      equipPvp.RingConfig.color &&
      equipPvp.NecklaceConfig &&
      equipPvp.NecklaceConfig.color &&
      equipPvp.EarringConfig &&
      equipPvp.EarringConfig.color
    ) {
      const ring = client.heroGearTypes.find(
        (x) => x.Code == ["acce", "ring", equipPvp.RingConfig.type].join(".")
      );
      const neck = client.heroGearTypes.find(
        (x) =>
          x.Code == ["acce", "neck", equipPvp.NecklaceConfig.type].join(".")
      );
      const ear = client.heroGearTypes.find(
        (x) => x.Code == ["acce", "ear", equipPvp.EarringConfig.type].join(".")
      );
      pvpRecommendation = `**PVP:** ${
        this.equipmentColors[equipPvp.RingConfig.color]
      } ${ring.DiscordEmote} ${equipPvp.RingConfig.type.toUpperCase()} ${
        neck.DiscordEmote
      } ${equipPvp.NecklaceConfig.type.toUpperCase()} ${
        ear.DiscordEmote
      } ${equipPvp.EarringConfig.type.toUpperCase()}`;
    }

    if (
      equipWb &&
      equipWb.RingConfig &&
      equipWb.RingConfig.color &&
      equipWb.NecklaceConfig &&
      equipWb.NecklaceConfig.color &&
      equipWb.EarringConfig &&
      equipWb.EarringConfig.color
    ) {
      const ring = client.heroGearTypes.find(
        (x) => x.Code == ["acce", "ring", equipWb.RingConfig.type].join(".")
      );
      const neck = client.heroGearTypes.find(
        (x) =>
          x.Code == ["acce", "neck", equipWb.NecklaceConfig.type].join(".")
      );
      const ear = client.heroGearTypes.find(
        (x) => x.Code == ["acce", "ear", equipWb.EarringConfig.type].join(".")
      );
      wbRecommendation = `**WB:** ${
        this.equipmentColors[equipWb.RingConfig.color]
      } ${ring.DiscordEmote} ${equipWb.RingConfig.type.toUpperCase()} ${
        neck.DiscordEmote
      } ${equipWb.NecklaceConfig.type.toUpperCase()} ${
        ear.DiscordEmote
      } ${equipWb.EarringConfig.type.toUpperCase()}`;
    }

    if (pveRecommendation.length !== 0) {
      recommendation.push(pveRecommendation);
    }
    if (pvpRecommendation.length !== 0) {
      recommendation.push(pvpRecommendation);
    }
    if (wbRecommendation.length !== 0) {
      recommendation.push(wbRecommendation);
    }
    return recommendation.join("\n");
  },

  getTraitTransRecommendation(transPve, transPvp, transWb) {
    let pveRecommendation = "";
    let pvpRecommendation = "";
    let wbRecommendation = "";
    let recommendation = [];
    if (transPve && transPve.Config) {
      let traits = [];
      let keys = Object.keys(transPve.Config);
      keys.map(x => {
        let wordSplit = x.split("T");
        let transType = wordSplit[1].slice(0,1);
        let transTraitType = wordSplit[1].slice(1,2);
        traits.push(`T${transType}: ${transTraitType}`);
      });
      let transFullName = transPve.UpgradeTypeRead.Name;
      let transName = transFullName.substr(10, transFullName.length);

      pveRecommendation = `**PVE:** ${transName} ${traits.join(", ")}`
    }
    if (transPvp && transPvp.Config) {
      let traits = [];
      let keys = Object.keys(transPvp.Config);
      keys.map(x => {
        let wordSplit = x.split("T");
        let transType = wordSplit[1].slice(0,1);
        let transTraitType = wordSplit[1].slice(1,2);
        traits.push(`T${transType}: ${transTraitType}`);
      });
      let transFullName = transPvp.UpgradeTypeRead.Name;
      let transName = transFullName.substr(10, transFullName.length);

      pvpRecommendation = `**PVP:** ${transName} ${traits.join(", ")}`
    }
    if (transWb && transWb.Config) {
      let traits = [];
      let keys = Object.keys(transWb.Config);
      keys.map(x => {
        let wordSplit = x.split("T");
        let transType = wordSplit[1].slice(0,1);
        let transTraitType = wordSplit[1].slice(1,2);
        traits.push(`T${transType}: ${transTraitType}`);
      });
      let transFullName = transWb.UpgradeTypeRead.Name;
      let transName = transFullName.substr(10, transFullName.length);

      wbRecommendation = `**WB:** ${transName} ${traits.join(", ")}`
    }
    if (pveRecommendation.length !== 0) {
      recommendation.push(pveRecommendation);
    }
    if (pvpRecommendation.length !== 0) {
      recommendation.push(pvpRecommendation);
    }
    if (wbRecommendation.length !== 0) {
      recommendation.push(wbRecommendation);
    }
    return recommendation.join("\n");  },
  getTraitRecommendation(traitPve, traitPVP, traitWb) {
    let pveRecommendation = "";
    let pvpRecommendation = "";
    let wbRecommendation = "";
    let recommendation = [];
    if (traitPve && traitPve.Config) {
      let traits = [];
      let keys = Object.keys(traitPve.Config);
      keys.map((trait) =>
        traitPve.Config[trait] < 5
          ? traits.push(trait.toUpperCase())
          : traits.unshift(trait.toUpperCase())
      );
      if (traits.length > 0) {
        pveRecommendation = `**PVE:** ${traits.join(", ")}`;
      }
    }
    if (traitPVP && traitPVP.Config) {
      let traits = [];
      let keys = Object.keys(traitPVP.Config);
      keys.map((trait) =>
        traitPVP.Config[trait] < 5
          ? traits.push(trait.toUpperCase())
          : traits.unshift(trait.toUpperCase())
      );
      if (traits.length > 0) {
        pvpRecommendation = `**PVP:** ${traits.join(", ")}`;
      }
    }
    if (traitWb && traitWb.Config) {
      let traits = [];
      let keys = Object.keys(traitWb.Config);
      keys.map((trait) =>
        traitWb.Config[trait] < 5
          ? traits.push(trait.toUpperCase())
          : traits.unshift(trait.toUpperCase())
      );
      if (traits.length > 0) {
        wbRecommendation = `**WB:** ${traits.join(", ")}`;
      }
    }
    if (pveRecommendation.length !== 0) {
      recommendation.push(pveRecommendation);
    }
    if (pvpRecommendation.length !== 0) {
      recommendation.push(pvpRecommendation);
    }
    if (wbRecommendation.length !== 0) {
      recommendation.push(wbRecommendation);
    }
    return recommendation.join("\n");
  },

  getEquipRecommendation(equipPve, equipPvp, equipWb) {
    let pveRecommendation = "";
    let pvpRecommendation = "";
    let wbRecommendation = "";
    let recommendation = [];
    let items = [
      "WeaponConfig",
      "ArmorConfig",
      "SubArmor1Config",
      "SubArmor2Config",
    ];
    if (equipPve) {
      let gear = [];
      items.map(
        (item) =>
          equipPve[item] &&
          equipPve[item].color &&
          gear.push(equipPve[item].color)
      );
      if (gear.length > 0) {
        pveRecommendation = `**PVE:** ${gear
          .map((color) => `${this.equipmentColors[color]} `)
          .join("")}`;
      }
    }
    if (equipPvp) {
      let gear = [];
      items.map(
        (item) =>
          equipPvp[item] &&
          equipPvp[item].color &&
          gear.push(equipPvp[item].color)
      );
      if (gear.length > 0) {
        pvpRecommendation = `**PVP:** ${gear
          .map((color) => `${this.equipmentColors[color]} `)
          .join("")}`;
      }
    }
    if (equipWb) {
      let gear = [];
      items.map(
        (item) =>
          equipWb[item] &&
        equipWb[item].color &&
          gear.push(equipWb[item].color)
      );
      if (gear.length > 0) {
        wbRecommendation = `**WB:** ${gear
          .map((color) => `${this.equipmentColors[color]} `)
          .join("")}`;
      }
    }
    if (pveRecommendation.length !== 0) {
      recommendation.push(pveRecommendation);
    }
    if (pvpRecommendation.length !== 0) {
      recommendation.push(pvpRecommendation);
    }
    if (wbRecommendation.length !== 0) {
      recommendation.push(wbRecommendation);
    }
    return recommendation.join("\n");
  },

  getChaserRecommendation(traitPve, traitPvp) {
    const chaserTraits = [
      ["ep", "ll", "hpr", "pob"],
      ["ih", "dp", "pl", "bol"],
      ["con", "imp", "pe", "sh"],
      ["csr", null, null, "csl"],
    ];
    const traitObj = traitPve && traitPve.Config ? traitPve : traitPvp;
    const csTraits = traitObj.Config;
    const rows = [];
    chaserTraits.map((row, index) => {
      rows[index] = [];
      row.map((trait) => {
        if (trait) {
          csTraits[trait]
            ? rows[index].push(this.numbers[csTraits[trait]])
            : rows[index].push(":x:");
        } else {
          rows[index].push(":heavy_multiplication_x:");
        }
      });
    });
    return rows.map((row) => `` + row.join(" ")).join("\n");
  },

  numbers: {
    1: ":one:",
    2: ":two:",
    3: ":three:",
    4: ":four:",
    5: ":five:",
  },

  equipmentColors: {
    red: "<:color_red:1043332365113638952>",
    blue: "<:color_blue:1043332362391527434>",
    cyan: "<:color_cyan:1043332367504396328>",
    green: "<:color_green:1043332360093053030>",
    orange: "<:color_orange:1043332361263255562>",
    purple: "<:color_purple:1043332366317408296>",
    pink: "<:color_pink:1043332363188449321>",
  },
};