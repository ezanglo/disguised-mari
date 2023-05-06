const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  SlashCommandBuilder,
  ButtonStyle,
  ComponentType,
  Collection,
} = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const { DateTime } = require("luxon");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("equip")
    .setDescription("Show hero equip recommendations")
    .addStringOption((option) =>
      option
        .setName("hero")
        .setDescription(
          "Select a hero. (For Job Change Heroes Example: exelesis)"
        )
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
          "?nested[HeroClassRead][fields]=Id,Name,Image,DiscordEmote" +
          "&nested[AttributeTypeRead][fields]=Id,Name,Code,Image,DiscordEmote" +
          "&nested[HeroEquips][fields]=" +
          "Id,Code,ContentTypeRead,WeaponConfig,SubWeaponConfig,ArmorConfig," +
          "SubArmor1Config,SubArmor2Config,ExclusiveWeaponConfig,RingConfig," +
          "NecklaceConfig,EarringConfig,Image,Artifact,Credits,Notes,CreatedAt,UpdatedAt"
      )
      .then(async (response) => {
        const hero = response.data;

        const result = await this.getHeroEquip(hero, interaction);
        if (!result) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder({
                color: 0xed4245,
                description: `Equip not found ${interaction.user}... try again ? ❌`,
              }),
            ],
          });
        }

        client.attachSupportMessageToEmbed(result.embed);

        const reply = await interaction.editReply({
          embeds: [result.embed],
          components: result.components ? result.components : [],
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
  async getHeroEquip(hero, interaction, refreshImage) {
    const embed = new EmbedBuilder().setColor(hero.Color);

    hero.HeroEquips.sort((a, b) => a.ContentTypeRead.Id - b.ContentTypeRead.Id);

    const contentCode = interaction.options.get("content").value;
    let ContentTypeCode = this.getDefaultContent(
      contentCode,
      hero.HeroEquips[0]?.ContentTypeRead.Code
    );
    let EquipCode = ["equip", hero.Code, ContentTypeCode];
    let equip = hero.HeroEquips.find(
      (x) => x.Code == EquipCode.join(".").toLowerCase()
    );
    if (equip) {
      const fileName = `equip-${hero.Code}-${equip.ContentTypeRead.Code}.jpg`;

      embed
        .setThumbnail(hero.Image)
        .setAuthor({ name: "Equipment Recommendation" })
        .addFields([
          {
            name: "Hero Name",
            value: `${hero.DisplayName} ${hero.HeroClassRead.DiscordEmote} ${hero.AttributeTypeRead.DiscordEmote}`,
            inline: true,
          },
          { name: "Content", value: equip.ContentTypeRead.Name, inline: true },
        ]);

      if (equip.Notes) {
        embed.addFields([
          { name: "Notes", value: "```" + `${equip.Notes}` + "```" },
        ]);
      }

      const footerNotes = [];
      let equipDate = equip.UpdatedAt ? equip.UpdatedAt : equip.CreatedAt;
      footerNotes.push(
        `Last updated ${new Date(equipDate).toLocaleDateString()}`
      );
      if (equip.Credits) {
        footerNotes.push(equip.Credits);
      }
      embed.setFooter({
        text: footerNotes.join("\n"),
      });

      const row = new ActionRowBuilder();

      const ContentTypeButtons = [
        ...new Map(
          hero.HeroEquips.map((item) => [
            item["ContentTypeRead"]["Code"],
            item.ContentTypeRead,
          ])
        ).values(),
      ];

      for (const content of ContentTypeButtons) {
        const isCurrentContent = content.Code == equip.ContentTypeRead.Code;
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

      const equipImage = `${
        process.env.AWS_S3_CLOUDFRONT_LINK
      }equips/${fileName}?ts=${Date.now()}`;

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

      const offset = 0;
      const canvas = createCanvas(1260, 1180 + offset);
      const ctx = canvas.getContext("2d");

      const bg = await loadImage(
        "https://media.discordapp.net/attachments/992459267292528710/994804060572111013/equip-base-clear.png"
      );
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height - offset);

      ctx.font = "italic bold 40px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "end";
      ctx.fillText(
        `${hero.DisplayName} Equips | ${equip.ContentTypeRead.Name}`,
        canvas.width - 20,
        canvas.height - 20
      );

      const heroGearList = [
        "weap",
        "subweap",
        "armor",
        "subarmor1",
        "subarmor2",
      ];

      const height = 120;
      const width = 120;

      let left = 40;
      let top = 40;
      // const weaponConfig = equip.WeaponConfig;
      for (const heroGear of heroGearList) {
        // Create gradient
        const gearConfig = this.getGearConfig(equip, heroGear);

        await loadImage(this.getEquipColor(gearConfig.color)).then((img) => {
          ctx.drawImage(img, left - 10, top - 10, 140, 180);
        });

        const weaponCode = [
          hero.HeroClassRead.Name.toLowerCase(),
          "gear",
          heroGear,
        ].join(".");
        const gear = client.heroGearTypes.find((x) => x.Code == weaponCode);
        await loadImage(gear.Image).then((img) => {
          ctx.drawImage(img, left, top, width, height);
        });

        this.drawStrokedText(
          ctx,
          `${gear.Name}`,
          "center",
          left + 60,
          top + 150
        );

        const gearStatValues = this.getStatValues(heroGear);

        if (gearConfig.stat1 && gearStatValues[gearConfig.stat1]) {
          const stat = gearStatValues[gearConfig.stat1];
          ctx.save();
          ctx.font = "italic bold 20px Arial";
          ctx.fillStyle = "white";
          ctx.textAlign = "start";
          ctx.fillText(`${stat.label}`, left + 145, top + 20);
          ctx.restore();
          this.drawStrokedText(
            ctx,
            `+${stat.value}`,
            "center",
            left + 480,
            top + 20
          );
        }

        if (gearConfig.stat2 && gearStatValues[gearConfig.stat2]) {
          const stat = gearStatValues[gearConfig.stat2];
          ctx.save();
          ctx.font = "italic bold 20px Arial";
          ctx.fillStyle = "white";
          ctx.textAlign = "start";
          ctx.fillText(`${stat.label}`, left + 145, top + 50);
          ctx.restore();
          this.drawStrokedText(
            ctx,
            `+${stat.value}`,
            "center",
            left + 480,
            top + 50
          );
        }

        if (
          gearConfig.enchant1 &&
          gearStatValues.enchants[gearConfig.enchant1]
        ) {
          const stat = gearStatValues.enchants[gearConfig.enchant1];
          ctx.save();
          ctx.font = "italic bold 20px Arial";
          ctx.fillStyle = "white";
          ctx.textAlign = "start";
          ctx.fillText(`${stat.label}`, left + 185, top + 100);
          ctx.restore();
          this.drawStrokedText(
            ctx,
            `+${stat.value}`,
            "end",
            left + 555,
            top + 100
          );
        }

        if (
          gearConfig.enchant2 &&
          gearStatValues.enchants[gearConfig.enchant2]
        ) {
          const stat = gearStatValues.enchants[gearConfig.enchant2];
          ctx.save();
          ctx.font = "italic bold 20px Arial";
          ctx.fillStyle = "white";
          ctx.textAlign = "start";
          ctx.fillText(`${stat.label}`, left + 185, top + 130);
          ctx.restore();
          this.drawStrokedText(
            ctx,
            `+${stat.value}`,
            "end",
            left + 555,
            top + 130
          );
        }

        if (
          gearConfig.enchant3 &&
          gearStatValues.enchants[gearConfig.enchant3]
        ) {
          const stat = gearStatValues.enchants[gearConfig.enchant3];
          ctx.save();
          ctx.font = "italic bold 20px Arial";
          ctx.fillStyle = "white";
          ctx.textAlign = "start";
          ctx.fillText(`${stat.label}`, left + 185, top + 160);
          ctx.restore();
          this.drawStrokedText(
            ctx,
            `+${stat.value}`,
            "end",
            left + 555,
            top + 160
          );
        }

        top += 220;
      }

      //Second Gears
      top = 40;
      left = 660;

      //Exlusive Weapon
      await loadImage(this.getEquipColor()).then((img) => {
        ctx.drawImage(img, left - 10, top - 10, 140, 180);
      });

      const ewCode = [
        hero.HeroClassRead.Name.toLowerCase(),
        "ew",
        hero.Code,
      ].join(".");
      const exclusiveWeap = client.heroGearTypes.find((x) => x.Code == ewCode);
      if (exclusiveWeap) {
        await loadImage(exclusiveWeap.Image).then((img) => {
          ctx.drawImage(img, left - 10, top - 10, 140, 140);
        });

        this.drawStrokedText(ctx, `Exclusive`, "center", left + 60, top + 140);
        this.drawStrokedText(ctx, `Weapon`, "center", left + 60, top + 160);

        const fontSize = exclusiveWeap.Name.length < 20 ? "30px" : "27px";
        this.drawStrokedText(
          ctx,
          `${exclusiveWeap.Name}`,
          "start",
          left + 140,
          top + 30,
          fontSize
        );
      }

      const ewConfig = equip.ExclusiveWeaponConfig;
      const ewStatValues = this.getStatValues("ew");

      if (ewConfig.rune1 && ewStatValues[ewConfig.rune1]) {
        const rune1Url = this.getRuneImage("normal", ewConfig.rune1);
        await loadImage(rune1Url).then((img) => {
          ctx.drawImage(img, left + 145, 95, 30, 30);
        });

        const stat = ewStatValues[ewConfig.rune1];
        ctx.save();
        ctx.font = "italic bold 20px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "start";
        ctx.fillText(`${stat.label}`, left + 185, top + 75);
        ctx.restore();
        this.drawStrokedText(
          ctx,
          `+${stat.value}`,
          "end",
          left + 555,
          top + 75
        );
      }

      if (ewConfig.rune2) {
        const rune2 = ewConfig.rune2.slice(-3);
        const attributeRune = hero.AttributeTypeRead.Code + rune2;

        if (ewStatValues[attributeRune]) {
          let runeLabel = "Damage Given Increased";
          if (rune2 == "def") {
            runeLabel = "Reduce Damage Received";
          }

          const rune2Url = this.getRuneImage("special", attributeRune);

          await loadImage(rune2Url).then((img) => {
            ctx.drawImage(img, left + 145, 125, 30, 30);
          });

          const stat = ewStatValues[attributeRune];
          ctx.save();
          ctx.font = "italic bold 20px Arial";
          ctx.fillStyle = "white";
          ctx.textAlign = "start";
          ctx.fillText(`${runeLabel}`, left + 185, top + 105);
          ctx.restore();
          this.drawStrokedText(
            ctx,
            `+${stat.value}`,
            "end",
            left + 555,
            top + 105
          );
        }
      }

      top += 220;

      //Artifact
      await loadImage(this.getEquipColor()).then((img) => {
        ctx.drawImage(img, left - 10, top - 10, 140, 180);
      });

      if (equip.Artifact) {
        const artifactCode = [
          hero.HeroClassRead.Name.toLowerCase(),
          "arti",
          equip.Artifact,
        ].join(".");
        const artifact = client.heroGearTypes.find(
          (x) => x.Code == artifactCode
        );
        await loadImage(artifact.Image).then((img) => {
          ctx.drawImage(img, left, top, width, height);
        });
      }

      this.drawStrokedText(ctx, `Artifact`, "center", left + 60, top + 150);

      this.drawStrokedText(
        ctx,
        `Legendary`,
        "start",
        left + 140,
        top + 30,
        "30px",
        "#bd5175"
      );

      const artiStatValues = this.getStatValues("arti");
      if (equip.Artifact && artiStatValues[equip.Artifact]) {
        const artiStat = artiStatValues[equip.Artifact];
        if (artiStat.stat1) {
          ctx.save();
          ctx.font = "italic bold 20px Arial";
          ctx.fillStyle = "#cf763e";
          ctx.textAlign = "start";
          ctx.fillText(`${artiStat.stat1.label}`, left + 140, top + 60);
          ctx.restore();
          this.drawStrokedText(
            ctx,
            `+${artiStat.stat1.value}`,
            "end",
            left + 555,
            top + 60,
            null,
            "#cf763e"
          );
        }
        if (artiStat.stat2) {
          ctx.save();
          ctx.font = "italic bold 20px Arial";
          ctx.fillStyle = "#cf763e";
          ctx.textAlign = "start";
          ctx.fillText(`${artiStat.stat2.label}`, left + 140, top + 90);
          ctx.restore();
          this.drawStrokedText(
            ctx,
            `+${artiStat.stat2.value}`,
            "end",
            left + 555,
            top + 90,
            null,
            "#cf763e"
          );
        }
        if (artiStat.effect) {
          ctx.save();
          ctx.font = "italic bold 20px Arial";
          ctx.fillStyle = "#c6c6c6";
          ctx.textAlign = "start";
          ctx.fillText(
            `${artiStat.effect} wraps around caster's body\nwhen the skill is used`,
            left + 140,
            top + 120
          );
          ctx.restore();
        }
      }

      //Accesories
      const heroAccesoriesList = ["ring", "neck", "ear"];

      top += 220;

      for (const accesory of heroAccesoriesList) {
        const acceConfig = this.getGearConfig(equip, accesory);

        await loadImage(this.getEquipColor(acceConfig.color)).then((img) => {
          ctx.drawImage(img, left - 10, top - 10, 140, 180);
        });

        if (acceConfig.type) {
          const accesoryCode = ["acce", accesory, acceConfig.type].join(".");
          const acce = client.heroGearTypes.find((x) => x.Code == accesoryCode);
          await loadImage(acce.Image).then((img) => {
            ctx.drawImage(img, left, top, width, height);
          });
        }

        let acceName;
        switch (accesory) {
          case "ring":
            acceName = "Ring";
            break;
          case "neck":
            acceName = "Necklace";
            break;
          case "ear":
            acceName = "Earrings";
            break;
        }
        this.drawStrokedText(
          ctx,
          `${acceName}`,
          "center",
          left + 60,
          top + 150
        );

        const acceStatValues = this.getStatValues(accesory);

        if (acceConfig.stat && acceStatValues[acceConfig.stat]) {
          const stat = acceStatValues[acceConfig.stat];
          ctx.save();
          ctx.font = "italic bold 20px Arial";
          ctx.fillStyle = "white";
          ctx.textAlign = "start";
          ctx.fillText(`${stat.label}`, left + 145, top + 50);
          ctx.restore();
          this.drawStrokedText(
            ctx,
            `+${stat.value}`,
            "center",
            left + 480,
            top + 50
          );
        }

        if (acceConfig.type && acceStatValues[acceConfig.type]) {
          const stat = acceStatValues[acceConfig.type];
          ctx.save();
          ctx.font = "italic bold 20px Arial";
          ctx.fillStyle = "white";
          ctx.textAlign = "start";
          ctx.fillText(`${stat.label}`, left + 145, top + 95);
          ctx.restore();
          this.drawStrokedText(
            ctx,
            `+${stat.value}`,
            "end",
            left + 555,
            top + 95
          );
        }

        if (acceConfig.color && acceStatValues[acceConfig.color]) {
          const stat = acceStatValues[acceConfig.color];
          ctx.save();
          ctx.font = "italic bold 20px Arial";
          ctx.fillStyle = "#cf763e";
          ctx.textAlign = "start";
          ctx.fillText(`(3Set)${stat.label}`, left + 145, top + 125);
          ctx.restore();
          this.drawStrokedText(
            ctx,
            `+${stat.value}`,
            "end",
            left + 555,
            top + 125,
            null,
            "#cf763e"
          );
        }

        top += 220;
      }

      this.addWaterMark(ctx, canvas, -70);

      await s3
        .upload({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: `equips/${fileName}`,
          Body: canvas.toBuffer("image/jpeg"),
        })
        .promise();

      embed.setImage(equipImage);

      return {
        embed: embed,
        components: [row],
        equip: equip,
        refreshImage: true,
      };
    }
  },
  getGearConfig(equip, heroGear) {
    let config = {};
    switch (heroGear) {
      case "weap":
        config = equip.WeaponConfig;
        break;
      case "subweap":
        config = equip.SubWeaponConfig;
        break;
      case "armor":
        config = equip.ArmorConfig;
        break;
      case "subarmor1":
        config = equip.SubArmor1Config;
        break;
      case "subarmor2":
        config = equip.SubArmor2Config;
        break;
      case "ring":
        config = equip.RingConfig;
        break;
      case "neck":
        config = equip.NecklaceConfig;
        break;
      case "ear":
        config = equip.EarringConfig;
        break;
    }
    return config;
  },
  getEquipColor(color) {
    let color_url =
      "https://media.discordapp.net/attachments/992459267292528710/994738968774049882/gray.png";
    switch (color) {
      case "orange":
        color_url =
          "https://media.discordapp.net/attachments/992459267292528710/994738968539177000/orange.png";
        break;
      case "green":
        color_url =
          "https://media.discordapp.net/attachments/992459267292528710/994738970485334086/green.png";
        break;
      case "blue":
        color_url =
          "https://media.discordapp.net/attachments/992459267292528710/994738970183356546/blue.png";
        break;
      case "pink":
        color_url =
          "https://media.discordapp.net/attachments/992459267292528710/994738969822634135/pink.png";
        break;
      case "red":
        color_url =
          "https://media.discordapp.net/attachments/992459267292528710/994738969554194512/red.png";
        break;
      case "cyan":
        color_url =
          "https://media.discordapp.net/attachments/992459267292528710/994738969105408021/cyan.png";
        break;
      case "purple":
        color_url =
          "https://media.discordapp.net/attachments/992459267292528710/994738969323524126/purple.png";
        break;
    }

    return color_url;
  },
  getRuneImage(type, rune) {
    let url;
    if (type == "normal") {
      switch (rune) {
        case "matk":
          url =
            "https://media.discordapp.net/attachments/992459474394677369/994059676645867530/unknown.png";
          break;
        case "mdef":
          url =
            "https://media.discordapp.net/attachments/992459474394677369/994059676918485082/unknown.png";
          break;
        case "patk":
          url =
            "https://media.discordapp.net/attachments/992459474394677369/994059677342117928/unknown.png";
          break;
        case "pdef":
          url =
            "https://media.discordapp.net/attachments/992459474394677369/994059677514080287/unknown.png";
          break;
        case "hp":
          url =
            "https://media.discordapp.net/attachments/992459474394677369/994059677115633716/unknown.png";
          break;
      }
    } else {
      switch (rune) {
        case "reddmg":
          url =
            "https://cdn.discordapp.com/attachments/992459267292528710/996801150877700126/Icon_Equip_eRune_02_eRedAtk.png";
          break;
        case "reddef":
          url =
            "https://cdn.discordapp.com/attachments/992459267292528710/996801151104209018/Icon_Equip_eRune_02_eRedDef.png";
          break;
        case "greendmg":
          url =
            "https://cdn.discordapp.com/attachments/992459267292528710/996801149954957462/Icon_Equip_eRune_02_eGreenAtk.png";
          break;
        case "greendef":
          url =
            "https://cdn.discordapp.com/attachments/992459267292528710/996801150185640056/Icon_Equip_eRune_02_eGreenDef.png";
          break;
        case "bluedmg":
          url =
            "https://cdn.discordapp.com/attachments/992459267292528710/996801149569085440/Icon_Equip_eRune_02_eBlueAtk.png";
          break;
        case "bluedef":
          url =
            "https://cdn.discordapp.com/attachments/992459267292528710/996801149770420334/Icon_Equip_eRune_02_eBlueDef.png";
          break;
        case "darkdmg":
          url =
            "https://cdn.discordapp.com/attachments/992459267292528710/996801150382788648/Icon_Equip_eRune_02_ePurpleAtk.png";
          break;
        case "darkdef":
          url =
            "https://cdn.discordapp.com/attachments/992459267292528710/996801150647009361/Icon_Equip_eRune_02_ePurpleDef.png";
          break;
        case "lightdmg":
          url =
            "https://cdn.discordapp.com/attachments/992459267292528710/996801151334875227/Icon_Equip_eRune_02_eYellowAtk.png";
          break;
        case "lightdef":
          url =
            "https://cdn.discordapp.com/attachments/992459267292528710/996801151548788746/Icon_Equip_eRune_02_eYellowDef.png";
          break;
      }
    }
    return url;
  },
  getStatValues(stat) {
    const EquipConfig = client.EquipConfig.find((x) => x.Code == stat);
    return EquipConfig.Config;
  },
  addWaterMark(ctx, canvas, heightOffset) {
    heightOffset = heightOffset ? heightOffset : 0;
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "italic bold 200px Arial";
    ctx.fillStyle = "rgba(256, 256, 256, 0.1)";
    ctx.fillText(
      "GUIDE\nCHASE",
      canvas.width / 2,
      canvas.height / 2 + heightOffset
    );
    ctx.restore();
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
  },
  drawStrokedText(ctx, text, align, x, y, size, fillColor, strokeColor) {
    ctx.save();
    ctx.font = `italic bold ${size ? size : "20px"} Arial`;
    ctx.fillStyle = fillColor ? fillColor : "white";
    ctx.strokeStyle = strokeColor ? strokeColor : "black";
    ctx.textAlign = align ? align : "start";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
  },
  getConfigMap(config, stats) {
    switch (config) {
      case "weap": {
        if (stats.length != 6) {
          return {};
        }

        return {
          WeaponConfig: {
            color: stats[0],
            stat1: stats[1],
            stat2: stats[2],
            enchant1: stats[3],
            enchant2: stats[4],
            enchant3: stats[5],
          },
        };
      }
      case "subweap": {
        if (stats.length != 5) {
          return {};
        }

        return {
          SubWeaponConfig: {
            stat1: stats[0],
            stat2: stats[1],
            enchant1: stats[2],
            enchant2: stats[3],
            enchant3: stats[4],
          },
        };
      }
      case "armor": {
        if (stats.length != 5) {
          return {};
        }

        return {
          ArmorConfig: {
            color: stats[0],
            stat1: stats[1],
            stat2: stats[2],
            enchant1: stats[3],
            enchant2: stats[4],
          },
        };
      }
      case "subarmor1": {
        if (stats.length != 5) {
          return {};
        }

        return {
          SubArmor1Config: {
            color: stats[0],
            stat1: stats[1],
            stat2: stats[2],
            enchant1: stats[3],
            enchant2: stats[4],
          },
        };
      }
      case "subarmor2": {
        if (stats.length != 5) {
          return {};
        }

        return {
          SubArmor2Config: {
            color: stats[0],
            stat1: stats[1],
            stat2: stats[2],
            enchant1: stats[3],
            enchant2: stats[4],
          },
        };
      }
      case "ew": {
        if (stats.length != 2) {
          return {};
        }

        return {
          ExclusiveWeaponConfig: {
            rune1: stats[0],
            rune2: stats[1],
          },
        };
      }
      case "arti": {
        if (stats.length != 1) {
          return {};
        }

        return {
          Artifact: stats[0],
        };
      }
      case "ring": {
        if (stats.length != 3) {
          return {};
        }

        return {
          RingConfig: {
            color: stats[0],
            type: stats[1],
            stat: stats[2],
          },
        };
      }
      case "neck": {
        if (stats.length != 3) {
          return {};
        }

        return {
          NecklaceConfig: {
            color: stats[0],
            type: stats[1],
            stat: stats[2],
          },
        };
      }
      case "ear": {
        if (stats.length != 3) {
          return {};
        }

        return {
          EarringConfig: {
            color: stats[0],
            type: stats[1],
            stat: stats[2],
          },
        };
      }
    }
  },
  isEquipUpdated(hero, equip) {
    if (!equip.UpdatedAt) {
      return true;
    }

    const equipUpdateAt = DateTime.fromISO(equip.UpdatedAt);

    const heroGearList = ["weap", "subweap", "armor", "subarmor1", "subarmor2"];

    let isUpdated = false;

    for (const heroGear of heroGearList) {
      const weaponCode = [
        hero.HeroClassRead.Name.toLowerCase(),
        "gear",
        heroGear,
      ].join(".");
      const gear = client.heroGearTypes.find((x) => x.Code == weaponCode);

      const equipUpdateDiff = equipUpdateAt.diff(new DateTime(gear.UpdatedAt), [
        "hours",
        "minutes",
        "seconds",
      ]);
      if (equipUpdateDiff.valueOf() > 0) {
        isUpdated = true;
        break;
      }
    }

    for (const equipConfig of client.EquipConfig) {
      const equipUpdateDiff = equipUpdateAt.diff(
        new DateTime(equipConfig.UpdatedAt),
        ["hours", "minutes", "seconds"]
      );
      if (equipUpdateDiff.valueOf() > 0) {
        isUpdated = true;
        break;
      }
    }

    return isUpdated;
  },
};
