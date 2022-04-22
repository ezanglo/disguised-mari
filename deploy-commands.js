const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config.json');

const commands = [
	new SlashCommandBuilder().setName('mute')
		.setDescription('Mute a user')
		.addUserOption(option => option.setName('target').setDescription('Select a user')
			.setRequired(true))
		.addIntegerOption(option => option.setName('seconds').setDescription('how long?')
			.setRequired(true)),
	new SlashCommandBuilder().setName('gibaway')
        .setDescription('for gibaways')
        .addStringOption(option => option.setName('command').setDescription('Give a command')),
    new SlashCommandBuilder().setName('patchtime')
        .setDescription('convert patchtime')
        .addStringOption(option => option.setName('server')
            .setDescription('Your Server')
			.addChoice('Asia', 'Asia')
			.addChoice('Western', 'Western')
			.addChoice('KR', 'KR')
            .setRequired(true))
        .addStringOption(option => option.setName('city')
            .setDescription('give the city of your country')
            .setRequired(true)),
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);