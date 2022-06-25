const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js');

module.exports = {
    name: 'update',
    aliases: ['up'],
    showHelp: false,
    description: 'update hero',
    type: 'gc',
    utilisation: client.config.app.gc + 'update mari',

    async execute(client, message, args) {

        if (!args[0]) return message.channel.send(`Hero name is required ${message.author}... try again ? ❌`);
        
        const heroCode = args.shift();

        let selectedHero = client.heroes.filter(x => x.Code.startsWith(heroCode.toLowerCase()));
        if(selectedHero.length == 0){
            return message.channel.send({ embeds: [
                new MessageEmbed({
                    color: 'RED',
                    description: `Hero not found ${message.author}... try again ? ❌`
                })
            ]});
        }
        else if (selectedHero.length > 1){
            return message.channel.send({ 
                embeds: [new MessageEmbed({
                    color: 'RED',
                    description: `Multiple heroes found!\nplease select: [${selectedHero.map(x => {return x.Code}).join(',')}]`
                })],
            });
        }

        selectedHero = selectedHero.shift();

        await api.get('Hero/' + selectedHero.Id)
        .then(async (response) => {
            const hero = response.data;
            const embed = new MessageEmbed();
            embed.setThumbnail(hero.Image);
            embed.setAuthor(hero.Name);
            embed.setColor(hero.Color);

            const row = new MessageActionRow();
            const customId = ['UPDATE', message.author.id, hero.Id, 'SKILL'];
            row.addComponents(new MessageButton({
                label: 'SKILL',
                customId: customId.join('_'),
                style: 'PRIMARY'
            }))

            message.channel.send({
                embeds: [embed],
                components: [row]
            })
        });
    }
};