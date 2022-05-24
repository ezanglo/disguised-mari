const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'hero',
    aliases: [],
    description: 'Show basic hero information',
    utilisation: client.config.app.gc + 'hero mari',

    async execute(client, message, args) {

        const selectedHero = client.heroes.find(x => x.Code == args[0]);
        if(!selectedHero){
            return message.channel.send({ embeds: [
                new MessageEmbed({
                    color: 'RED',
                    description: `Hero not found ${message.author}... try again ? ❌`
                })
            ]});
        }

        await api.get('Hero/' + selectedHero.Id)
        .then(async (response) => {
            const hero = response.data;
            const embed = new MessageEmbed();
            embed.setThumbnail(hero.Image);
            embed.setAuthor(hero.Name);
            embed.setColor(hero.Color);
            message.channel.send({
                embeds: [embed]
            })
        });
    }
};