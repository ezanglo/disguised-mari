const { SlashCommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'slash-deploy',
    aliases: ['sd'],
    showHelp: false,
    description: 'Admin accessible slash command deployment',
    type: 'gc',
    utilisation: client.config.app.gc + 'sd',

    async execute(client, message, args) {

        if(message.author.id != '481506666727079956'){
            return message.reply('<:KekPoint:955691177628291102>');
        }
        
        const slashCommands = [];

        const commands = client.commands.filter(x => x.showHelp !== false && x.type == 'gc');
        for(const [name, cmd] of commands){
            const slashCmd = new SlashCommandBuilder()
                .setName(cmd.name)
                .setDescription(cmd.description);
            if(cmd.slashArgs){
                for(const option of cmd.slashArgs){
                    switch(option.type)
                    {
                        case 'StringOption': {
                            const slashOption = new SlashCommandStringOption()
                            .setName(option.name)
                            .setDescription(option.description)
                            .setRequired(option.required)

                            let choices = option.choices;
                            if(choices){
                                if(typeof option.choices == 'string' ){
                                    choices = client[option.choices].map(x => x[option.choiceIdentifier]);
                                }
    
                                for(const choice of choices){
                                    slashOption.addChoice(choice, choice)
                                }
                            }

                            slashCmd.addStringOption(slashOption);
                        }
                    }
                }

                slashCommands.push(slashCmd);
            }

        }

        const guilds = client.guilds.cache.map(guild => {
            return { id: guild.id, name: guild.name }
        });

        let success = [];
        let failed = [];

        const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);
        for(const guild of guilds){
            await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id), { body: slashCommands.map(command => command.toJSON()) })
            .then(response => {
                success.push(guild);
            })
            .catch(e => {
                failed.push(guild);
                message.reply(`An Error has occured ${message.author}... try again ? ❌`);
                client.errorLog(e, message);
            });
        }

        message.reply({ embeds: [
            new MessageEmbed({
                color: 'RED',
                description: 
                    'Command Deploy...\n' +
                    `[${slashCommands.map(s => s.name).join(',')}]\n` +
                    `Total Servers: ${guilds.length}\n` +
                    `<:worrygibrose:957109353557655602>Success: ${success.length}\n` +
                    `<:worryscoot:959148586166276116>Failed: ${failed.length}`
            })
        ]});

        console.log(`Success`, success);
        console.log(`Failed`, failed);

    },
};