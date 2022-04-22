const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'save',
    aliases: ['sv'],
    utilisation: client.config.app.px + 'save',
    description: 'Save the current song',
    voiceChannel: true,

    async execute(client, message) {
        const queue = player.getQueue(message.guild.id);

        if (!queue || !queue.playing) return message.channel.send(`No music currently playing ${message.author}... try again ? ❌`);

        message.author.send(`You saved the track ${queue.current.title} | ${queue.current.author} from the server ${message.guild.name} ✅`).then(() => {
            message.channel.send({ embeds: [
                new MessageEmbed({
                    color: 'RED',
                    description: `I have sent you the title of the music by private messages ✅`
                })
            ]});
            
        }).catch(error => {
            message.channel.send({ embeds: [
                new MessageEmbed({
                    color: 'RED',
                    description: `Unable to send you a private message ${message.author}... try again ? ❌`
                })
            ]});
        });
    },
};