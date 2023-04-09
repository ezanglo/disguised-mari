const { EmbedBuilder, SlashCommandBuilder, AttachmentBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
const axios = require("axios");
const Entities = require('html-entities');

let newsListApi = axios.create({
  baseURL: "https://pim.playkog.com/api/website/board/gcm/UPDATE/en?pageIndex=1&rows=4",
});

let newsPostApi = axios.create({
  baseURL: "https://pim.playkog.com/api/website/board/detail/",
});

function postApi(uid) {
  newsPostApi = axios.create({
    baseURL: `https://pim.playkog.com/api/website/board/detail/${uid}`,
  });
}
function newsListFunctionApi(type) {
  newsListApi = axios.create({
    baseURL: `https://pim.playkog.com/api/website/board/gcm/${type}/en?pageIndex=1&rows=4`,
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("news")
    .setDescription("Shows current patch notes.")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Select the type of news.")
        .addChoices(
          { name: "Notice", value: "notice" },
          { name: "Update", value: "update" },
          { name: "Event", value: "event" }
        )
        .setRequired(true)
    ),
  async execute(interaction) {
    const newsType = interaction.options.get("type")?.value;

    newsListFunctionApi(newsType);

    await newsListApi
      .get()
      .then(async (response) => {
        const data = response.data;

        let latestPost;

        const eventEmbed = new EmbedBuilder()
          .setTitle("Select the event you want to see.");

        let selectMenu = new StringSelectMenuBuilder()
          .setCustomId('select');

        let menuRow = new ActionRowBuilder();
        let i = 1;

        switch (newsType) {
          case 'notice':
            latestPost = data.datalist[0];
            break;
          case 'update':
            latestPost = data.datalist[0];
            break;
          case 'event':
            data.datalist.forEach(x => {
              eventEmbed.addFields([{ name: '\u200b', value: `${i}: ${x.subject}` },])
              selectMenu.addOptions({
                label: i.toString(),
                value: x.boardUID.toString(),
              });
              i++
            });

            menuRow.addComponents(selectMenu);

            break;
        }

        if (newsType === "event") {
          const reply = await interaction.editReply({ embeds: [eventEmbed], components: [menuRow] });

          reply.awaitMessageComponent({
            time: 10000,
          }).then(y => {
            postApi(y.values[0]);
            this.newsPOSTAPI(interaction);

            setTimeout(() => {
              interaction.editReply({ components: [] });
            }, 5000);

          });
        } else {
          postApi(latestPost.boardUID);
          this.newsPOSTAPI(interaction);
        }
      });
  },
  async newsPOSTAPI(interaction) {
    await newsPostApi
      .get()
      .then(async (res) => {
        const data2 = res.data;

        const imgSrcRegex = /<img.*?src=["'](.*?)["']/gi;
        const imgSrcList = [];
        let match;

        while ((match = imgSrcRegex.exec(data2.detailHTML)) !== null) {
          imgSrcList.push(match[1]);
        }

        let fileArray = [];

        for (let i = 0; i < imgSrcList.length; i++) {
          let file = new AttachmentBuilder(imgSrcList[i], { name: `img${i}.png` })
          fileArray.push(file);
        }

        const encodedText = data2.detailTEXT;
        let decodedText = Entities.decode(encodedText).replace(/[\r\n]+/gm, "\n");

        const date = new Date(data2.lstUpdateDate);

        const embed = new EmbedBuilder()
          .setDescription(decodedText)
          .setTitle(data2.subject)
          .setFooter({ text: `Last Posted: ${date.toLocaleDateString()}` })

        await interaction.editReply({
          embeds: [embed],
          files: [fileArray[0]]
        });

        fileArray.shift();

        while (fileArray.length > 0) {

          if (fileArray.length > 10) {
            let fileCheckArray = fileArray.slice(0, 10); // takes the 10 images that can be sent and put them in another array

            await interaction.channel.send({
              files: fileCheckArray
            });

            fileArray = fileArray.slice(10, fileArray.length); // as soon as the images were sent, remove the 10 images from the original array

          } else {
            await interaction.channel.send({
              files: fileArray
            });

            fileArray.splice(0, fileArray.length); // meant to clear empty the array ending the loop
          }
        }
      });
  }
};