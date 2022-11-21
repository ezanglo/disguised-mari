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
    )
    .addStringOption((option) =>
      option
        .setName("trait_type")
        .setDescription("Select a Trait type")
        .setAutocomplete(true)
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
            description: `Hero not found ${interaction.author}... try again ? ❌`,
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
          "&nested[HeroClassRead][fields]=DiscordEmote" +
          "&nested[AttributeTypeRead][fields]=DiscordEmote" +
          "&nested[Skills][fields]=Code,Image,UpgradeTypeRead,SkillTypeRead" +
          "&nested[Traits][fields]=Id,Code,UpgradeTypeRead,ContentTypeRead,Config," +
          "Image,Notes,Credits,CreatedAt,UpdatedAt"
      )
      .then(async (response) => {
        const hero = response.data;

        const result = await this.getHeroTrait(hero, interaction);
        if (!result) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder({
                color: 0xed4245,
                description: `Trait not found ${interaction.author}... try again ? ❌`,
              }),
            ],
          });
        }

        const reply = await interaction.editReply({
          embeds: result.embeds,
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
              int.options.set("trait_type", {
                name: "trait_type",
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
        return interaction.editReply(
          `An Error has occured ${interaction.author}... try again ? ❌`
        );
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
      contentTypeCode = interaction.options.get("content").value;
    }

    if (interaction.options.get("trait_type")) {
      upgradeTypeCode = interaction.options.get("trait_type").value;
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

      const traitImageLink = `${
        process.env.AWS_S3_CLOUDFRONT_LINK
      }traits/${fileName}?ts=${Date.now()}`;

      await api
        .get(traitImageLink)
        .then((response) => {
          if (response.status == 200) {
            embed.setImage(traitImageLink);
          }
        })
        .catch((error) => {
          console.log(error.response.status, traitImageLink);
          refreshImage = true;
        })
        .finally(() => {});

      let embeds = [];
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

        embeds.push(embed);

        return {
          embeds: embeds,
          components: components,
          trait: trait,
        };
      }

      switch (trait.UpgradeTypeRead.Code) {
        case "lvl": {
          const offset = 0;
          const canvas = createCanvas(883, 784 + offset);
          const ctx = canvas.getContext("2d");

          const bg = await loadImage(
            "https://media.discordapp.net/attachments/992458789234163713/995058917224743043/trait-lvl-base.png"
          );
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

          const bg = await loadImage(
            "https://media.discordapp.net/attachments/992458789234163713/995059038746333194/1bg0oWo.png"
          );

          ctx.drawImage(bg, 0, 0, canvas.width, canvas.height - offset);

          ctx.font = "italic bold 36px Arial";
          ctx.fillStyle = "white";
          ctx.textAlign = "end";
          ctx.fillText(
            `${hero.DisplayName} | ${trait.UpgradeTypeRead.Name} Traits | ${trait.ContentTypeRead.Name}`,
            canvas.width,
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
          const canvas = createCanvas(883, 831 + offset);
          const ctx = canvas.getContext("2d");

          const bg = await loadImage(
            "https://media.discordapp.net/attachments/992458789234163713/995059104643022848/R0QvvKK.png"
          );

          ctx.drawImage(bg, 0, 0, canvas.width, canvas.height - offset);

          ctx.font = "italic bold 36px Arial";
          ctx.fillStyle = "white";
          ctx.fillText(
            `${hero.DisplayName} | ${trait.UpgradeTypeRead.Name} Traits | ${trait.ContentTypeRead.Name}`,
            30,
            70
          );

          this.addWaterMark(ctx, canvas, -70);

          const height = 133;
          const width = 133;

          const transTraits = [
            ["bdi", "bdr", "sdi"],
            ["sdr", "pvp", "def"],
            ["cs", "si"],
          ];

          let top = 159;
          for (const rowTraits of transTraits) {
            let left = 83;
            for (const rowTrait of rowTraits) {
              if (trait.Config[rowTrait]) {
                let traitConfig = client.traitTypes.find(
                  (x) => x.Code == `${trait.UpgradeTypeRead.Code}.${rowTrait}`
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
              left += 289;
            }
            top += 236;
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
              image:
                "https://media.discordapp.net/attachments/966833373865713774/982124942646706236/memory_core_gray.png",
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
              image:
                "https://media.discordapp.net/attachments/966833373865713774/982124942957105192/body_core_gray.png",
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
              image:
                "https://media.discordapp.net/attachments/966833373865713774/982124943271665694/soul_core_gray.png",
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
      embeds.push(embed);

      return {
        embeds: embeds,
        components: components,
        trait: trait,
        refreshImage: true,
      };
    }
  },
  addWaterMark(ctx, canvas, heightOffset) {
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
          ["bdi", "bdr", "sdi"],
          ["sdr", "pvp", "def"],
          ["cs", "si"],
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
};
