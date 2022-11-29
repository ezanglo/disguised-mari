const { EmbedBuilder, SlashCommandBuilder, REST, Routes, PermissionFlagsBits } = require('discord.js');

module.exports = {
    showHelp: false,
    type: 'admin',
    data: new SlashCommandBuilder()
      .setName('slash-deploy')
      .setDescription('Deploy /slash commands (Admin Only)')
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    ,
    async execute(interaction) {

        if(interaction.user.id != '481506666727079956'){
            return interaction.editReply('<:KekPoint:955691177628291102>');
        }

        const result = await this.deployCommands(null);

        interaction.editReply({ embeds: [
            new EmbedBuilder({
                color: 0xED4245,
                description: 
                    'Command Deploy...\n' +
                    `[${result.commands}]\n` +
                    `Total Servers: ${result.guilds.length}\n` +
                    `<:worrygibrose:957109353557655602>Success: ${result.success.length}\n` +
                    `<:worryscoot:959148586166276116>Failed: ${result.failed.length}`
            })
        ]});

    },
    async deployCommands(guild)
    {
        let guilds = client.guilds.cache.map(guild => {
            return { id: guild.id, name: guild.name }
        });
        if(guild){
            guilds = [guild];
        }

        let success = [];
        let failed = [];

        let commands = client.commands.filter(x => x.data);

        const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
        for(const guild of guilds){

            try {

                let slashCommands = commands.map(x => x.data);
                if(guild.id != process.env.GUILD_ID){
                    slashCommands = commands.filter(x => x.type != 'admin').map(x => x.data);
                }
                console.log(`${guild.name} | Started refreshing ${slashCommands.length} application (/) commands.`);
        
                // The put method is used to fully refresh all commands in the guild with the current set
                const data = await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id),
                    { body: slashCommands.map(x => x.toJSON()) },
                );
        
                success.push(guild);
                console.log(slashCommands.map(s => `[${s.name}]`).join(', '));
                console.log(`Successfully reloaded ${data.length} application (/) commands.\n`);
            } catch (error) {
                // And of course, make sure you catch and log any errors!
                console.error(error);
                failed.push(guild);
            }
        }

        return {
            guilds: guilds.length,
            commands: client.commands.map(s => s.name).join(','),
            success: success,
            failed: failed
        }
    }
};