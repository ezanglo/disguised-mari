const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
      .setName('leaderboard')
      .setDescription('Show command usage leaderboards')
      .addStringOption((option) =>
        option
            .setName("type")
            .setDescription("Select a type")
            .setRequired(false)
            .addChoices(
                { name: "user", value: "user" },
                { name: "command", value: "command" }
            )
        )
    ,
    async execute(interaction) {

        const type = interaction.options.get("type")?.value ?? 'user';


        if(type == 'user'){
            await api.get(`User?sort=-CommandCount&limit=10`)
            .then(async (response) => {
                if (response.status == 200) {
                    const data = response.data;
                    const users = data.list;

                    const usersFormatted = [];
                    for(let x = 0; x < users.length; x++){

                        let rankEmote = '<:rankchall:1051333161574998148>';
                        if(x > 2){
                            rankEmote = '<:rankdia1:1051333163311431832>';
                        }

                        usersFormatted.push(
                            `${rankEmote} ${users[x].Username} • ${users[x].CommandCount}`
                        )
                    }

                    const embed = new EmbedBuilder()
                        .setThumbnail(client.user.displayAvatarURL({ size: 1024, dynamic: true }))
                        .setAuthor({ 
                            name: "Disguised Mari Leaderboard",
                            iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true })
                        })
                        .setDescription(usersFormatted.join('\n'))
                        .setTimestamp()
                    ;

                    interaction.editReply({ embeds: [ embed ]});
                }
            })
        }
        else {
            await api.get(`Command?sort=-UsageCount&limit=10`)
            .then(async (response) => {
                if (response.status == 200) {
                    const data = response.data;
                    const commands = data.list;

                    const commandsFormatted = [];
                    for(let x = 0; x < commands.length; x++){

                        let rankEmote = '<:rankchall:1051333161574998148>';
                        if(x > 2){
                            rankEmote = '<:rankdia1:1051333163311431832>';
                        }

                        commandsFormatted.push(
                            `${rankEmote} /${commands[x].SlashCommand} • ${commands[x].UsageCount}`
                        )
                    }

                    const embed = new EmbedBuilder()
                        .setAuthor({ 
                            name: "Disguised Mari Leaderboard",
                            iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true })
                        })
                        .setDescription(commandsFormatted.join('\n'))
                        .setTimestamp()
                    ;

                    interaction.editReply({ embeds: [ embed ]});
                }
            })
        }
    }
};