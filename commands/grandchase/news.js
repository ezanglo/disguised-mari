const { EmbedBuilder, SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const axios = require("axios");
const Entities = require('html-entities');

let newsListApi = axios.create({
  baseURL: "https://pim.playkog.com/api/website/board/gcm/UPDATE/en?pageIndex=1&rows=10",
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
    baseURL: `https://pim.playkog.com/api/website/board/gcm/${type}/en?pageIndex=1&rows=10`,
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

        let latestPost = data.datalist[0];

        postApi(latestPost.boardUID);

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
            const decodedText = Entities.decode(encodedText);

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
      });
  },
};