const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hero")
    .setDescription("Show hero basic recommendations")
    .addStringOption((option) =>
      option
        .setName("hero")
        .setDescription("Select a hero")
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
          "&nested[Traits][fields]=Id,Code,Config," +
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

        // Equipment
        let EquipCode = ["equip", hero.Code, "pve"];
        let equipPve = hero.HeroEquips.find(
          (x) => x.Code == EquipCode.join(".").toLowerCase()
        );
        EquipCode[2] = "pvp";
        let equipPvp = hero.HeroEquips.find(
          (x) => x.Code == EquipCode.join(".").toLowerCase()
        );
        if (equipPve || equipPvp)
          embed.addFields([
            {
              name: "Equipment `/equip`",
              value: this.getEquipRecommendation(equipPve, equipPvp),
            },
          ]);

        // Enchants
        if (equipPve || equipPvp)
          embed.addFields([
            {
              name: "Enchants `/equip`",
              value: this.getEnchantRecommendation(equipPve, equipPvp),
            },
          ]);

        // Enchants
        if (equipPve || equipPvp)
          embed.addFields([
            {
              name: "Accessories `/equip`",
              value: this.getAccessoryRecommendation(equipPve, equipPvp),
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
        if ((traitPve && traitPve.Config) || (traitPvp && traitPvp.Config))
          embed.addFields([
            {
              name: "Traits `/trait`",
              value: this.getTraitRecommendation(traitPve, traitPvp),
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

        interaction.editReply({
          embeds: [embed],
        });
      })
      .catch((e) => {
        interaction.editReply(
          `An Error has occured ${interaction.author}... try again ? ❌`
        );
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

  getEnchantRecommendation(equipPve, equipPvp) {
    let pveRecommendation = "";
    let pvpRecommendation = "";
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
    return `${pveRecommendation}\n${pvpRecommendation}`;
  },

  getAccessoryRecommendation(equipPve, equipPvp) {
    let pveRecommendation = "";
    let pvpRecommendation = "";

    const ring = client.heroGearTypes.find(
      (x) => x.Code == ["acce", "ring", equipPve.RingConfig.type].join(".")
    );
    const neck = client.heroGearTypes.find(
      (x) => x.Code == ["acce", "neck", equipPve.NecklaceConfig.type].join(".")
    );
    const ear = client.heroGearTypes.find(
      (x) => x.Code == ["acce", "ear", equipPve.EarringConfig.type].join(".")
    );

    if (
      equipPve &&
      equipPve.RingConfig &&
      equipPve.RingConfig.color &&
      equipPve.NecklaceConfig &&
      equipPve.NecklaceConfig.color &&
      equipPve.EarringConfig &&
      equipPve.EarringConfig.color
    ) {
      pveRecommendation = `**PVE:** ${
        this.equipmentColors[equipPve.RingConfig.color]
      } ${ring.DiscordEmote} ${neck.DiscordEmote} ${ear.DiscordEmote}`;
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
      pvpRecommendation = `**PVP:** ${
        this.equipmentColors[equipPve.RingConfig.color]
      } ${ring.DiscordEmote} ${neck.DiscordEmote} ${ear.DiscordEmote}`;
    }
    return `${pveRecommendation}\n${pvpRecommendation}`;
  },

  getTraitRecommendation(traitPve, traitPVP) {
    let pveRecommendation = "";
    let pvpRecommendation = "";
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
    return `${pveRecommendation}\n${pvpRecommendation}`;
  },

  getEquipRecommendation(equipPve, equipPvp) {
    let pveRecommendation = "";
    let pvpRecommendation = "";
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
    return `${pveRecommendation}\n${pvpRecommendation}`;
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
