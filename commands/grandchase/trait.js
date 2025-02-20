const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  SelectMenuBuilder,
  SlashCommandBuilder,
  ButtonStyle,
  Collection,
} = require("discord.js");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("trait")
    .setDescription("Show hero trait recommendations")
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
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Select a Trait type") //["lvl", "cs", "si", "trans"];
        .addChoices(
          { name: "lvl", value: "lvl" },
          { name: "cs", value: "cs" },
          { name: "si", value: "si" },
          { name: "trans", value: "trans" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("core")
        .setDescription("Select a Soul Imprint Core")
        .addChoices(
          { name: "mem", value: "mem" },
          { name: "body", value: "body" },
          { name: "soul", value: "soul" }
        )
    ),
  async execute(interaction, refresh) {
    const heroCode = interaction.options.get("hero").value.toLowerCase();
    let selectedHero = client.heroes.filter((x) =>
      x.Code.startsWith(heroCode)
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
        "&nested[HeroClassRead][fields]=Name,DiscordEmote" +
        "&nested[AttributeTypeRead][fields]=DiscordEmote" +
        "&nested[Skills][fields]=Code,Image,UpgradeTypeRead,SkillTypeRead" +
        "&nested[Traits][fields]=Id,Code,UpgradeTypeRead,ContentTypeRead,Config," +
        "Image,Notes,Credits,CreatedAt,UpdatedAt"
      )
      .then(async (response) => {
        const hero = response.data;

        if (refresh == null || refresh == true) {
          result = await this.getHeroTrait(hero, interaction);
        } else if (refresh == false) {
          result = await this.getHeroTrait(hero, interaction, true);
        }
        if (!result) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder({
                color: 0xed4245,
                description: `Trait not found ${interaction.user}... try again ? ❌`,
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
            const intType = args.shift();

            int.options = new Collection();
            int.options.set("hero", { name: "hero", value: args.shift() });

            const content = args.shift();
            if (content) {
              int.options.set("content", {
                name: "content",
                value: content,
              });
            }

            const traitType = args.shift();
            if (traitType) {
              int.options.set("type", {
                name: "type",
                value: traitType,
              });
              if (traitType == "si") {
                const core = args.shift();
                if (core) {
                  int.options.set("core", {
                    name: "core",
                    value: core,
                  });
                }
              }
            }

            if (int.isSelectMenu()) {
              if (intType == "CONTENT") {
                int.options.set("content", {
                  name: "content",
                  value: int.values[0],
                });
              }
              if (intType == "CORE") {
                int.options.set("core", {
                  name: "core",
                  value: int.values[0],
                });
              }
            }

            await this.execute(int);
          })
          .catch((err) => {
            interaction.editReply({ components: [] });
          });
      })
      .catch((e) => {
        client.errorLog(e, interaction);
        interaction.editReply({
          embeds: [
            new EmbedBuilder({
              color: 0xed4245,
              description: `An Error has occured ${interaction.user}... try again ? ❌`,
            }),
          ],
        });
      });
  },
  async getHeroTrait(hero, interaction, refreshImage) {
    hero.Traits.sort(
      (a, b) =>
        a.ContentTypeRead.Id - b.ContentTypeRead.Id ||
        a.UpgradeTypeRead.OrderBy.localeCompare(b.UpgradeTypeRead.OrderBy)
    );

    let heroCode = hero.Code;
    let contentTypeCode = "pve";
    let upgradeTypeCode = "lvl";
    if (hero.Traits.length > 0) {
      contentTypeCode = hero.Traits[0].ContentTypeRead.Code;
      upgradeTypeCode = hero.Traits[0].UpgradeTypeRead.Code;
    }

    if (interaction.options.get("content")) {
      contentTypeCode = interaction.options.get("content").value.toLowerCase();
    }

    if (interaction.options.get("type")) {
      upgradeTypeCode = interaction.options.get("type").value.toLowerCase();
    }

    let traitCommands = [heroCode, contentTypeCode, upgradeTypeCode];
    if (upgradeTypeCode == "si") {
      traitCommands.push(
        interaction.options.get("core")
          ? interaction.options.get("core").value.toLowerCase()
          : "mem"
      );
    }

    let trait = hero.Traits.find(
      (x) => x.Code == traitCommands.join(".").toLowerCase()
    );

    if (trait && trait.Config) {
      let fileName = `${hero.Code}-${trait.UpgradeTypeRead.Code}-${trait.ContentTypeRead.Code}.jpg`;
      const embed = new EmbedBuilder()
        .setColor(hero.Color)
        .setAuthor({
          name: `${trait.UpgradeTypeRead.Name} Traits Recommendation`,
        })
        .setThumbnail(hero.Image)
        .addFields([
          {
            name: `Hero Name`,
            value: `${hero.DisplayName} ${hero.HeroClassRead.DiscordEmote} ${hero.AttributeTypeRead.DiscordEmote}`,
            inline: true,
          },
          { name: "Content", value: trait.ContentTypeRead.Name, inline: true },
        ]);

      if (trait.Notes) {
        embed.addFields([
          { name: "Notes", value: "```" + `${trait.Notes}` + "```" },
        ]);
      }

      const footerNotes = [];
      let traitDate = trait.UpdatedAt ? trait.UpdatedAt : trait.CreatedAt;
      footerNotes.push(
        `Last updated ${new Date(traitDate).toLocaleDateString()}`
      );
      if (trait.Credits) {
        footerNotes.push(trait.Credits);
      }
      embed.setFooter({
        text: footerNotes.join("\n"),
      });

      let traitCustomId;

      const buttonsRow = new ActionRowBuilder();
      const selectMenu = new SelectMenuBuilder();

      const menuCustomId = traitCommands;
      if (trait.UpgradeTypeRead.Code == "si") {
        const core = traitCommands[traitCommands.length - 1];
        fileName = `${hero.Code}-${trait.UpgradeTypeRead.Code}-${core}-${trait.ContentTypeRead.Code}.jpg`;
      }

      selectMenu.setCustomId("CONTENT_" + menuCustomId.join("_"));

      const traitButtons = [
        ...new Map(
          hero.Traits.map((item) => [
            item["ContentTypeRead"]["Code"] + item["UpgradeTypeRead"]["Code"],
            item,
          ])
        ).values(),
      ];

      for (const t of traitButtons) {
        if (contentTypeCode == t.ContentTypeRead.Code) {
          const isCurrentUpgradeType =
            t.UpgradeTypeRead.Code == trait.UpgradeTypeRead.Code;
          const buttonCustomId = [
            hero.Code,
            t.ContentTypeRead.Code,
            t.UpgradeTypeRead.Code,
          ];
          if (isCurrentUpgradeType) {
            traitCustomId = buttonCustomId;
          }
          buttonsRow.addComponents(
            new ButtonBuilder({
              label: t.UpgradeTypeRead.Name,
              customId: "TRAIT_" + buttonCustomId.join("_"),
              style: isCurrentUpgradeType
                ? ButtonStyle.Secondary
                : ButtonStyle.Primary,
              disabled: isCurrentUpgradeType,
            })
          );
        }

        if (upgradeTypeCode == t.UpgradeTypeRead.Code) {
          const isCurrentContent =
            t.ContentTypeRead.Code == trait.ContentTypeRead.Code;
          if (isCurrentContent) {
            menuCustomId[1] = trait.ContentTypeRead.Code;
            traitCustomId = menuCustomId;
          }
          selectMenu.addOptions({
            label: t.ContentTypeRead.Name,
            value: t.ContentTypeRead.Code,
            default: isCurrentContent,
          });
        }
      }

      const menuRow = new ActionRowBuilder().addComponents(selectMenu);

      const traitImageLink = `${process.env.AWS_S3_CLOUDFRONT_LINK
        }traits/${fileName}?ts=${Date.now()}`;

      await api
        .get(traitImageLink)
        .then((response) => {
          if (!refreshImage) {
            if (response.status == 200) {
              embed.setImage(traitImageLink);
            }
          }
        })
        .catch((error) => {
          console.log(error.response.status, traitImageLink);
          refreshImage = true;
        })
        .finally(() => { });

      let components = [menuRow, buttonsRow];

      if (!refreshImage) {
        if (trait.UpgradeTypeRead.Code == "si") {
          components.push(
            this.getSoulImprintCoresMenu(
              traitCustomId,
              traitCommands[traitCommands.length - 1]
            )
          );
        }

        return {
          embed: embed,
          components: components,
          trait: trait,
        };
      }

      switch (trait.UpgradeTypeRead.Code) {
        case "lvl": {
          const offset = 0;
          const canvas = createCanvas(883, 784 + offset);
          const ctx = canvas.getContext("2d");

          const bg = await loadImage(`${process.env.AWS_S3_CLOUDFRONT_LINK}base/lvl-trait-base.png`);
          ctx.drawImage(bg, 0, 0, canvas.width, canvas.height - offset);

          ctx.font = "italic bold 36px Arial";
          ctx.fillStyle = "white";
          ctx.textAlign = "end";
          ctx.fillText(
            `${hero.DisplayName} | ${trait.UpgradeTypeRead.Name} Traits | ${trait.ContentTypeRead.Name}`,
            canvas.width - 20,
            canvas.height - 20
          );

          this.addWaterMark(ctx, canvas, -70);

          const height = 120;
          const width = 120;

          const levelTraits = [
            ["crit", "cdr"],
            ["aspd", "bdr"],
            ["sdr", "bdi"],
            ["sdi", "tdi"],
            ["heal"],
          ];

          let top = 28;
          for (const rowTraits of levelTraits) {
            let left = 33;
            for (const rowTrait of rowTraits) {
              if (rowTrait && trait.Config[rowTrait]) {
                let traitConfig = client.traitTypes.find(
                  (x) => x.Code == rowTrait
                );
                if (traitConfig) {
                  const traitImage = await loadImage(traitConfig.Image);
                  ctx.drawImage(traitImage, left, top, width, height);

                  const heightOffset = height / 3;
                  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
                  ctx.beginPath();
                  ctx.moveTo(left + width, top + heightOffset);
                  ctx.lineTo(left + heightOffset, top + height);
                  ctx.lineTo(left + width, top + height);
                  ctx.lineTo(left + width, top + heightOffset);
                  ctx.fill();
                  ctx.closePath();

                  ctx.textAlign = "end";
                  ctx.fillStyle = "white";
                  ctx.strokeStyle = "black";
                  ctx.font = "italic bold 50px Arial";
                  ctx.fillText(
                    trait.Config[rowTrait],
                    left + width - 10,
                    top + height - 10
                  );
                  ctx.strokeText(
                    trait.Config[rowTrait],
                    left + width - 10,
                    top + height - 10
                  );
                }
              }
              left += 421;
            }
            top += 141;
          }

          await s3
            .upload({
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: `traits/${fileName}`,
              Body: canvas.toBuffer("image/jpeg"),
            })
            .promise();

          break;
        }
        case "cs": {
          const offset = 50;
          const canvas = createCanvas(900, 781 + offset);
          const ctx = canvas.getContext("2d");

          const bg = await loadImage(`${process.env.AWS_S3_CLOUDFRONT_LINK}base/chaser-trait-base.png`);

          ctx.drawImage(bg, 0, 0, canvas.width, canvas.height - offset);

          ctx.font = "italic bold 36px Arial";
          ctx.fillStyle = "white";
          ctx.textAlign = "end";
          ctx.fillText(
            `${hero.DisplayName} | ${trait.UpgradeTypeRead.Name} Traits | ${trait.ContentTypeRead.Name}`,
            canvas.width - 10,
            canvas.height - 10
          );

          this.addWaterMark(ctx, canvas, -70);

          const height = 130;
          const width = 130;

          const chaserTraits = [
            ["ep", "ll", "hpr", "pob"],
            ["ih", "dp", "pl", "bol"],
            ["con", "imp", "pe", "sh"],
            ["csr", null, null, "csl"],
          ];

          let top = 40;
          for (const rowTraits of chaserTraits) {
            let left = 315;
            for (const rowTrait of rowTraits) {
              if (rowTrait && trait.Config[rowTrait]) {
                let traitConfig = client.traitTypes.find(
                  (x) => x.Code == rowTrait
                );
                if (["csr", "csl"].includes(rowTrait)) {
                  traitConfig = hero.Skills.find(
                    (x) => x.Code == `${hero.Code}.cs.base`
                  );
                }
                if (traitConfig) {
                  const traitImage = await loadImage(traitConfig.Image);
                  ctx.drawImage(traitImage, left, top, width, height);

                  const heightOffset = height / 3;
                  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
                  ctx.beginPath();
                  ctx.moveTo(left + width, top + heightOffset);
                  ctx.lineTo(left + heightOffset, top + height);
                  ctx.lineTo(left + width, top + height);
                  ctx.lineTo(left + width, top + heightOffset);
                  ctx.fill();
                  ctx.closePath();

                  ctx.textAlign = "end";
                  ctx.fillStyle = "white";
                  ctx.strokeStyle = "black";
                  ctx.font = "italic bold 60px Arial";
                  ctx.fillText(
                    trait.Config[rowTrait],
                    left + width - 10,
                    top + height - 10
                  );
                  ctx.strokeText(
                    trait.Config[rowTrait],
                    left + width - 10,
                    top + height - 10
                  );
                }
              }
              left += 142;
            }
            top += 190;
          }

          await s3
            .upload({
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: `traits/${fileName}`,
              Body: canvas.toBuffer("image/jpeg"),
            })
            .promise();

          break;
        }

        case "trans": {
          const offset = 0;
          const canvas = createCanvas(713, 926 + offset); 
          const ctx = canvas.getContext("2d");
          let bg;

          let transTraitTypes;

          const transTraitType = trait.UpgradeTypeRead.Name;
          const heroClass = hero.HeroClassRead.Name;

          if (transTraitType.includes("Guardian")) {
            bg = await loadImage(this.addTransTraitTemplate(heroClass, "Guardian"));
            transTraitTypes = "Guard";
            console.log("loaded");

          } else if (transTraitType.includes("Helper")) {
            bg = await loadImage(this.addTransTraitTemplate(heroClass, "Helper"));
            transTraitTypes = "Helper";
            console.log("loaded");

          } else if (transTraitType.includes("Executor")) {
            bg = await loadImage(this.addTransTraitTemplate(heroClass, "Executor"));
            transTraitTypes = "Executor";
            console.log("loaded");
          }
          ctx.drawImage(bg, 0, 0, canvas.width, canvas.height - offset);

          ctx.font = "italic bold 28px Arial";
          ctx.fillStyle = "white";
          ctx.textAlign = "end";
          ctx.fillText(
            `${hero.DisplayName} | Transcendence Traits | ${trait.ContentTypeRead.Name}`,
            canvas.width - 10,
            canvas.height - 20,

          );
          ctx.fillText()
          this.addWaterMark(ctx, canvas, -60);

          const transTraits = [
            ["tankT31", "tankT32", "tankT33", "assaultT31", "assaultT32", "assaultT33", "healerT31", "healerT32", "healerT33", "rangerT31", "rangerT32", "rangerT33", "mageT31", "mageT32", "mageT33"],
            ["tankT61", "tankT62", "tankT63", "assaultT61", "assaultT62", "assaultT63", "healerT61", "healerT62", "healerT63", "rangerT61", "rangerT62", "rangerT63", "mageT61", "mageT62", "mageT63"],
          ];


          let width = 110;
          let height = 110;

          let top = 295;
          let left = 535;

          for (const rowTraits of transTraits) {
            for (const rowTrait of rowTraits) {
              if (trait.Config[rowTrait]) {
                let traitConfig = client.traitTypes.find(
                  (x) => x.Code == `${trait.UpgradeTypeRead.Code + transTraitTypes}.${rowTrait}`
                );
                if (traitConfig) {
                  const traitImage = await loadImage(traitConfig.Image);
                  ctx.drawImage(traitImage, left, top, width, height);

                  top += 450;
                  left -= 295;
                }
              }
            }
          }
          await s3
            .upload({
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: `traits/${fileName}`,
              Body: canvas.toBuffer("image/jpeg"),
            })
            .promise();

          break;
        }

        case "si": {
          const core = traitCommands[traitCommands.length - 1];

          const core_config = {
            mem: {
              image: `${process.env.AWS_S3_CLOUDFRONT_LINK}base/memory-trait-base.png`,
              top: 40,
              topInc: 160,
              left: 60,
              leftInc: 160,
              traits: [
                ["bh", null, "cdd", "pi"],
                [null, "sa", null, null],
                [null, null, "sb", "ht1"],
                [null, null, "pm", null],
                ["mem", "ht2", null, null],
              ],
            },
            body: {
              image: `${process.env.AWS_S3_CLOUDFRONT_LINK}base/body-trait-base.png`,
              top: 40,
              topInc: 160,
              left: 240,
              leftInc: 160,
              traits: [
                ["uw", "ed", null, "pbb"],
                [null, null, "ac", null],
                ["bt", "ml", null, null],
                [null, "am", null, null],
                [null, null, "ht2", "body"],
              ],
            },
            soul: {
              image: `${process.env.AWS_S3_CLOUDFRONT_LINK}base/soul-trait-base.png`,
              top: 207,
              topInc: 160,
              left: 59,
              leftInc: 160,
              traits: [
                [null, "hc1", null, "ht2", null],
                ["ccw", null, null, "sb", "res"],
                [null, null, "ac", null, "cs"],
                ["hc2", null, null, null, "soul"],
              ],
            },
          };

          let selectedCore = core_config[core];

          if (!selectedCore) {
            selectedCore = core_config.mem;
          }

          const offset = 0;
          const canvas = createCanvas(883, 910 + offset);
          const ctx = canvas.getContext("2d");

          const bg = await loadImage(selectedCore.image);

          ctx.drawImage(bg, 0, 0, canvas.width, canvas.height - offset);

          ctx.font = "italic bold 36px Arial";
          ctx.fillStyle = "white";
          ctx.textAlign = "end";
          ctx.fillText(
            `${hero.DisplayName} | ${trait.UpgradeTypeRead.Name} Traits | ${trait.ContentTypeRead.Name}`,
            canvas.width - 20,
            canvas.height - 30
          );

          this.addWaterMark(ctx, canvas, -70);

          const height = 100;
          const width = 100;

          let top = selectedCore.top;
          for (const rowTraits of selectedCore.traits) {
            let left = selectedCore.left;
            for (const rowTrait of rowTraits) {
              if (rowTrait && trait.Config[rowTrait]) {
                let traitConfig = client.traitTypes.find(
                  (x) => x.Code == `${core}.${rowTrait}` || x.Code == core
                );
                if (traitConfig) {
                  const traitImage = await loadImage(traitConfig.Image);
                  ctx.drawImage(traitImage, left, top, width, height);

                  const heightOffset = height / 3;
                  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
                  ctx.beginPath();
                  ctx.moveTo(left + width, top + heightOffset);
                  ctx.lineTo(left + heightOffset, top + height + 1);
                  ctx.lineTo(left + width, top + height + 1);
                  ctx.lineTo(left + width, top + heightOffset);
                  ctx.fill();
                  ctx.closePath();

                  ctx.textAlign = "end";
                  ctx.fillStyle = "white";
                  ctx.strokeStyle = "black";
                  ctx.font = "italic bold 40px Arial";
                  ctx.fillText(
                    trait.Config[rowTrait],
                    left + width - 5,
                    top + height - 5
                  );
                  ctx.strokeText(
                    trait.Config[rowTrait],
                    left + width - 5,
                    top + height - 5
                  );
                }
              }
              left += selectedCore.leftInc;
            }
            top += selectedCore.topInc;
          }

          await s3
            .upload({
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: `traits/${fileName}`,
              Body: canvas.toBuffer("image/jpeg"),
            })
            .promise();

          components.push(this.getSoulImprintCoresMenu(traitCustomId, core));

          break;
        }
      }

      embed.setImage(traitImageLink);

      return {
        embed: embed,
        components: components,
        trait: trait,
        refreshImage: true,
      };
    }
  },
  addTransTraitTemplate(heroClass, transTraitType) {

    switch (heroClass) {
      case "Assault":
        if (transTraitType == "Guardian") {
          return "https://d3mc4o4mvp1yzj.cloudfront.net/base/protectorTransTraitBase_assault.png";
        }
        if (transTraitType == "Helper") {
          return "https://d3mc4o4mvp1yzj.cloudfront.net/base/helperTransTraitBase_assault.png"
        }
        if (transTraitType == "Executor") {
          return "https://d3mc4o4mvp1yzj.cloudfront.net/base/exeTransTraitBase_assault.png"
        }
        break;

      case "Tank":
        if (transTraitType == "Guardian") {
          return "https://d3mc4o4mvp1yzj.cloudfront.net/base/protectorTransTraitBase_tank.png";
        }
        if (transTraitType == "Helper") {
          return "https://d3mc4o4mvp1yzj.cloudfront.net/base/helperTransTraitBase_tank.png"
        }
        if (transTraitType == "Executor") {
          return "https://d3mc4o4mvp1yzj.cloudfront.net/base/exeTransTraitBase_tank.png"
        }
        break;

      case "Healer":
        if (transTraitType == "Guardian") {
          return "https://d3mc4o4mvp1yzj.cloudfront.net/base/protectorTransTraitBase_healer.png";
        }
        if (transTraitType == "Helper") {
          return "https://d3mc4o4mvp1yzj.cloudfront.net/base/helperTransTraitBase_healer.png"
        }
        if (transTraitType == "Executor") {
          return "https://d3mc4o4mvp1yzj.cloudfront.net/base/exeTransTraitBase_healer.png"
        }
        break;

      case "Ranger":
        if (transTraitType == "Guardian") {
          return "https://d3mc4o4mvp1yzj.cloudfront.net/base/protectorTransTraitBase_rangerMage.png";
        }
        if (transTraitType == "Helper") {
          return "https://d3mc4o4mvp1yzj.cloudfront.net/base/helperTransTraitBase_ranger.png"
        }
        if (transTraitType == "Executor") {
          return "https://d3mc4o4mvp1yzj.cloudfront.net/base/exeTransTraitBase_ranger.png"
        }
        break;

      case "Mage":
        if (transTraitType == "Guardian") {
          return "https://d3mc4o4mvp1yzj.cloudfront.net/base/protectorTransTraitBase_rangerMage.png";
        }
        if (transTraitType == "Helper") {
          return "https://d3mc4o4mvp1yzj.cloudfront.net/base/helperTransTraitBase_mage.png"
        }
        if (transTraitType == "Executor") {
          return "https://d3mc4o4mvp1yzj.cloudfront.net/base/exeTransTraitBase_mage.png"
        }
        break;
    }
  },
  addWaterMark(ctx, canvas, heightOffset) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "italic bold 180px Arial";
    ctx.fillStyle = "rgba(256, 256, 256, 0.1)";
    ctx.fillText(
      "GUIDE\nCHASE",
      canvas.width / 2,
      canvas.height / 2 + heightOffset
    );
    ctx.restore();
  },
  getConfigMap(upgradeType) {
    switch (upgradeType) {
      case "lvl": {
        return [
          ["crit", "cdr"],
          ["aspd", "bdr"],
          ["sdr", "bdi"],
          ["sdi", "tdi"],
          ["heal"],
        ];
      }
      case "cs": {
        return [
          ["ep", "ll", "hpr", "pob"],
          ["ih", "dp", "pl", "bol"],
          ["con", "imp", "pe", "sh"],
          ["csr", null, null, "csl"],
        ];
      }
      case "trans": {
        return [
          ["tankT31", "tankT32", "tankT33", "assaultT31", "assaultT32", "assaultT33", "healerT31", "healerT32", "healerT33", "rangerT31", "rangerT32", "rangerT33", "mageT31", "mageT32", "mageT33"],
          ["tankT61", "tankT62", "tankT63", "assaultT61", "assaultT62", "assaultT63", "healerT61", "healerT62", "healerT63", "rangerT61", "rangerT62", "rangerT63", "mageT61", "mageT62", "mageT63"],
        ];
      }
      case "si": {
        return {
          mem: [
            ["bh", "cdd", "pi"],
            ["sa"],
            ["sb", "ht1"],
            ["pm"],
            ["mem", "ht2"],
          ],
          body: [
            ["uw", "ed", "pbb"],
            ["ac"],
            ["bt", "ml"],
            ["am"],
            ["ht2", "body"],
          ],
          soul: [
            ["hc1", "ht2"],
            ["ccw", "sb", "res"],
            ["ac", "cs"],
            ["hc2", "soul"],
          ],
        };
      }
    }
  },
  getDefaultContent(content) {
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

    if (isPVP.includes(content.toLowerCase())) {
      return "pvp";
    } else if (isPVE.includes(content.toLowerCase())) {
      return "pve";
    } else {
      return null;
    }
  },
  getSoulImprintCoresMenu(traitCustomId, core) {
    return new ActionRowBuilder().addComponents(
      new SelectMenuBuilder()
        .setCustomId("CORE_" + traitCustomId.join("_"))
        .setPlaceholder("Select Soul Imprint Core")
        .addOptions([
          {
            label: "Memory Core",
            description: "Display Memory Core Traits",
            value: "mem",
            default: core == "mem",
          },
          {
            label: "Body Core",
            description: "Display Body Core Traits",
            value: "body",
            default: core == "body",
          },
          {
            label: "Soul Core",
            description: "Display Soul Core Traits",
            value: "soul",
            default: core == "soul",
          },
        ])
    );
  },
  async update(interaction, traitCode, traitConfig) {
    if (traitCode == "all") {
      for (var x = 0; x < client.heroes.length - 2; x++) {
        traitCode = client.heroes[x].Code;
        interaction.options = new Collection();

        interaction.options.set("hero", {
          name: "hero",
          value: traitCode
        });
        interaction.options.set("content", {
          name: "content",
          value: traitConfig
        });

        interaction.options.set("type", {
          name: "type",
          value: "trans",
        });

        await this.execute(interaction, false)
          .catch((e) => {
            client.errorLog(e, interaction);
            interaction.editReply({
              embeds: [
                new EmbedBuilder({
                  color: 0xed4245,
                  description: `An Error has occured ${interaction.user}... try again ? ❌`,
                }),
              ],
            });
          });
      }
    } else {
      await api
        .get(`HeroTrait?where=(Code,eq,${traitCode})`)
        .then(async (response) => {
          if (response.status == 200) {
            const data = response.data;
            if (data.pageInfo.totalRows > 0) {
              const trait = data.list[0];
              let configMap = this.getConfigMap(trait.UpgradeTypeRead.Code);
              if (!configMap) {
                interaction.editReply({
                  embeds: [
                    new EmbedBuilder({
                      color: 0xed4245,
                      description: `Wrong Code ${interaction.user}... try again ? ❌`,
                    }),
                  ],
                });
              }
              if (trait.UpgradeTypeRead.Code == "si") {
                const code = traitCode.split(".");
                configMap = configMap[code[code.length - 1]];
              }

              let config = [];
              let jsonConfig = {};

              if (trait.UpgradeTypeRead.Code != "trans") {

                for (const c of traitConfig.split('-')) {
                  config.push(c.split(''));
                }

                for (let x = 0; x < configMap.length; x++) {
                  for (let y = 0; y < configMap[x].length; y++) {
                    if (configMap[x][y] && config[x][y] && config[x][y] != "x") {
                      jsonConfig[configMap[x][y]] = config[x][y];
                    }
                  }
                }
              } else {
                config = traitConfig.split("-");
                for (let x = 0; x < configMap.length; x++) {
                  for (let y = 0; y < configMap[x].length; y++) {
                    if (traitConfig.includes(configMap[x][y]) == true) {
                      jsonConfig[configMap[x][y]] = "1";
                    }
                  }
                }
              }

              await api.patch("HeroTrait/" + trait.Id, { Config: jsonConfig });

              interaction.options = new Collection();

              const args = traitCode.split(".");
              if (args[0]) {
                interaction.options.set("hero", {
                  name: "hero",
                  value: args[0],
                });
              }
              if (args[1]) {
                interaction.options.set("content", {
                  name: "content",
                  value: args[1],
                });
              }
              if (args[2]) {
                interaction.options.set("type", {
                  name: "type",
                  value: args[2],
                });
              }
              if (args[3]) {
                interaction.options.set("core", {
                  name: "core",
                  value: args[3],
                });
              }
              this.execute(interaction, false);
            }
          }
        })
        .catch((e) => {
          client.errorLog(e, interaction);
          interaction.editReply({
            embeds: [
              new EmbedBuilder({
                color: 0xed4245,
                description: `An Error has occured ${interaction.user}... try again ? ❌`,
              }),
            ],
          });
        });
    }
  },
  async updateAll(interaction, allHeroes, contentType) {
    if (allHeroes == "all") {
      for (var x = 0; x < client.heroes.length - 2; x++) {
        allHeroes = client.heroes[x].Code;
        interaction.options = new Collection();

        interaction.options.set("hero", {
          name: "hero",
          value: allHeroes
        });
        interaction.options.set("content", {
          name: "content",
          value: contentType
        });

        interaction.options.set("type", {
          name: "type",
          value: "trans",
        });

        await this.execute(interaction, false)
          .catch((e) => {
            client.errorLog(e, interaction);
            interaction.editReply({
              embeds: [
                new EmbedBuilder({
                  color: 0xed4245,
                  description: `An Error has occured ${interaction.user}... try again ? ❌`,
                }),
              ],
            });
          });
      }
    }
  },
};
