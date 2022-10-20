const { MessageEmbed, MessageButton, MessageActionRow, MessageSelectMenu } = require('discord.js');

module.exports = {
    name: 'pet',
    aliases: [],
    args: ['hero'],
    description: 'Shows the skill for the selected hero',
    type: 'gc',
    utilisation: client.config.app.gc + 'pet mari',

    async execute(client, message, args) {

        if (!args[0]) return message.reply(`Hero name is required ${message.author}... try again ? ❌`);
        
        let heroCode = args.shift();

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
            
            const row = new MessageActionRow();

            for(const hero of selectedHero){
                row.addComponents(new MessageButton({
                    label: hero.Code,
                    customId: ['PET',message.author.id,hero.Id].join('_'),
                    style: 'PRIMARY'
                }))
            }

            const embed = new MessageEmbed({
                color: 'RED',
                description: `Multiple heroes found! please select:`
            });

            return message.reply({ 
                embeds: [embed], 
                components: [row]
            });
        }

        selectedHero = selectedHero.shift();

        await api.get('Hero/' + selectedHero.Id + 
            '?nested[Pet][fields]=Id,Name,BasicAttack,SkillName,SkillDescription,Image,Code,CreatedAt,UpdatedAt')
        .then(async (response) => {
            const hero = response.data;

            const embed = new MessageEmbed();
            embed.setColor(hero.Color);

            let pet = hero.Pet.find(x => x.Code == `${hero.Code}.pet`);
            if(pet){
                const authorLabel = `${pet.Name} | ${hero.DisplayName} Pet`;
                embed.setThumbnail(pet.Image);
                embed.setAuthor(authorLabel, hero.Image);

                let basicAttack = '*placeholder*';
                if(pet.BasicAttack){
                    basicAttack = pet.BasicAttack;
                }
                embed.addField('Basic Attack', basicAttack)

                let skillDescription = '*placeholder*';
                if(pet.SkillDescription){
                    skillDescription = pet.SkillDescription;
                }
                embed.addField('Skill - ' + pet.SkillName, skillDescription)

                let petDate = (pet.UpdatedAt) ? pet.UpdatedAt : pet.CreatedAt;

                embed.setFooter(`Last updated ${new Date(petDate).toLocaleDateString()}`);

                await message.reply({
                    embeds: [embed],
                })
            }
            else {
                return message.reply({ embeds: [
                    new MessageEmbed({
                        color: 'RED',
                        description: `Pet not found ${message.author}... try again ? ❌`
                    })
                ]});
            }
        })
        .catch(e => {
            message.reply(`An Error has occured ${message.author}... try again ? ❌`);
            client.errorLog(e, message);
        });
    }
};