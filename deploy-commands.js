const { readdirSync } = require('fs');
const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

require('dotenv').config()

const slashCommands = [];

readdirSync('./commands/').forEach(dirs => {
    const commands = readdirSync(`./commands/${dirs}/`).filter(files => files.endsWith('.js'));
    for (const file of commands) {
        const cmd = require(`./commands/${dirs}/${file}`);

        const slashCmd = new SlashCommandBuilder()
        .setName(cmd.name)
        .setDescription(cmd.description);
        

        if(cmd.type == 'admin'){
            slashCmd.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);
        }
        
        slashCommands.push(slashCmd);
    }
});

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
	try {
		console.log(`Started refreshing ${slashCommands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
			{ body: slashCommands.map(command => command.toJSON()) },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        console.log(slashCommands.map(command => command.name));
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();
