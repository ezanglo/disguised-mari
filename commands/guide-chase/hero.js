const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js');

module.exports = {
    name: 'hero',
    aliases: [],
    description: 'Show basic hero information',
    type: 'gc',
    utilisation: client.config.app.gc + 'hero mari or ' + client.config.app.gc + 'mari',

    async execute(client, message, args) {

        if (!args[0]) return message.reply(`Hero name is required ${message.author}... try again ? ❌`);
        
        const heroCode = args.shift();

        let selectedHero = client.heroes.filter(x => x.Code.startsWith(heroCode.toLowerCase()));
        if(selectedHero.length == 0){
            return message.reply({ embeds: [
                new MessageEmbed({
                    color: 'RED',
                    description: `Hero not found ${message.author}... try again ? ❌`
                })
            ]});
        }
        else if (selectedHero.length > 1){
            return message.reply({ 
                embeds: [new MessageEmbed({
                    color: 'RED',
                    description: `Multiple heroes found!\nplease select: [${selectedHero.map(x => {return x.Code}).join(',')}]`
                })],
            });
        }

        selectedHero = selectedHero.shift();

        await api.get('Hero/' + selectedHero.Id + 
        '?nested[HeroClassRead][fields]=Name'+
        '&nested[Skills][fields]=Name,UpgradeTypeRead,SkillTypeRead')
        .then(async (response) => {
            const hero = response.data;
            const embed = new MessageEmbed();

            const details = [
                { code: 'type', display: 'Type', inline: true}, 
                { code: 'species', display: 'Species', inline: true }, 
                { code: 'status', display: 'Status', inline: true}, 
                { code: 'gender', display: 'Gender', inline: true }, 
                { code: 'age', display: 'Age', inline: true }, 
                { code: 'birthday', display: 'Birthday', inline: true }, 
                { code: 'height', display: 'Height', inline: true }, 
                { code: 'blood_type', display: 'Blood Type', inline: true }, 
                { code: 'hometown', display: 'Home Town', inline: true }, 
                { code: 'affiliations', display: 'Affiliations', inline: true },
                { code: 'family', display: 'Family', inline: true },
                { code: 'hobbies', display: 'Hobbies', inline: true }, 
                { code: 'likes', display: 'Likes', inline: true }, 
                { code: 'dislikes', display: 'Dislikes', inline: true }, 
                { code: 'weakness', display: 'Weakness', inline: true } 
            ]

            details.forEach(data => {
                let value = '--';
                switch(data.code){
                    case 'type':
                        value = hero.HeroClassRead.Name;
                    break;
                    case 'skip':
                        value = '\u200b';
                    break;
                    default:
                        if(hero.Description[data.code]){
                            value = hero.Description[data.code]
                        }
                    break;
                }
                embed.addField(data.display, value, data.inline);
            })

            embed.setThumbnail(hero.Image);
            embed.setAuthor(hero.Name, hero.Image);
            embed.setColor(hero.Color);
            message.reply({
                embeds: [embed]
            })
        });
    }
};