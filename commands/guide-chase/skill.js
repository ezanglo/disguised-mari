const { MessageEmbed, MessageButton, MessageActionRow, MessageSelectMenu } = require('discord.js');

module.exports = {
    name: 'skill',
    aliases: ['sk'],
    args: ['hero', 'skill', 'upgrade'],
    description: 'Shows the skill for the selected hero',
    type: 'gc',
    utilisation: client.config.app.gc + 'skill mari s1 si',
    slashArgs: [
        { name: 'hero', description: 'Select a hero', required: true, type: 'StringOption' },
        { name: 'skill', description: 'Select a skill', required: true, type: 'StringOption', choices: ['s1', 's2', 'pass', 'cs', 'ss'] },
        { name: 'upgrade', description: 'Select a Upgrade type', required: false, type: 'StringOption', choices: ['base', 'lb', 'si'] }
    ],

    async execute(client, message, args) {

        if (!args[0]) return message.reply(`Hero name is required ${message.author}... try again ? ❌`);
        
        if (!args[1]){
            args.push('base');
        }

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
            
            const actionRows = [];

            const rows = Math.ceil(selectedHero.length/5);
            for(let i = 0; i < rows; i++){
                const row = new MessageActionRow();

                const heroList = selectedHero.slice(i*5, (i*5) + 5)


                for(const hero of heroList){
                    row.addComponents(new MessageButton({
                        label: hero.Code,
                        customId: ['SKILL',message.author.id,hero.Id,args[0]].join('_'),
                        style: 'PRIMARY'
                    }))
                }

                actionRows.push(row);
            }

            const embed = new MessageEmbed({
                color: 'RED',
                description: `Multiple heroes found! please select:`
            });

            return message.reply({ 
                embeds: [embed], 
                components: actionRows
            });
        }

        selectedHero = selectedHero.shift();

        await api.get('Hero/' + selectedHero.Id + 
            '?nested[Upgrades][fields]=Id,Name,Code'+
            '&nested[Skills][fields]=Id,Name,Code,Image,SP,Description,Cooldown,UpgradeTypeRead,SkillTypeRead,CreatedAt,UpdatedAt')
        .then(async (response) => {
            const hero = response.data;

            const skill = this.getHeroSkill(hero, args, message.author.id)
            if(!skill) {
                return message.reply({ embeds: [
                    new MessageEmbed({
                        color: 'RED',
                        description: `Skill not found ${message.author}... try again ? ❌`
                    })
                ]});
            }

            await message.reply({
                embeds: [skill.embed],
                components: skill.components ? skill.components: []
            })
        })
        .catch(e => {
            message.reply(`An Error has occured ${message.author}... try again ? ❌`);
            client.errorLog(e, message);
        });
    },
    getHeroSkill(hero, args, author)
    {
        const embed = new MessageEmbed();
        embed.setColor(hero.Color);

        const isSkill = ['s1', 's2', 'pass', 'cs', 'ss'].includes(args[0].toLowerCase());
        const isUpgradeType = ['base', 'lb', 'si'].includes(args[0].toLowerCase());
        
        hero.Skills.sort((a, b) => 
            a.SkillTypeRead.OrderBy - b.SkillTypeRead.OrderBy ||
            a.UpgradeTypeRead.OrderBy.localeCompare(b.UpgradeTypeRead.OrderBy),
        )

        let heroCode = hero.Code;
        let skillTypeCode = 's1';
        let upgradeTypeCode = 'base';
        if(hero.Skills.length > 0){
            skillTypeCode = hero.Skills[0].SkillTypeRead.Code;
            upgradeTypeCode = hero.Skills[0].UpgradeTypeRead.Code;
        }

        if(isSkill){
            skillTypeCode = args[0].toLowerCase();
            if(args[1]) upgradeTypeCode = args[1].toLowerCase();
            
        }
        else if(isUpgradeType){
            if(args[1]) skillTypeCode = args[1].toLowerCase();
            upgradeTypeCode = args[0].toLowerCase();
        }

        let skill = hero.Skills.find(x => x.Code == [heroCode, skillTypeCode, upgradeTypeCode].join('.').toLowerCase());
        if(skill){
            let authorLabel = skill.Name;
            if(skill.SP){
                authorLabel += ` | ${skill.SP} SP`;
            }
            embed.setThumbnail(skill.Image);
            embed.setAuthor(authorLabel, hero.Image);

            const buttonsRow = new MessageActionRow();
            const selectMenu = new MessageSelectMenu();
            const customId = ['SKILL', author, hero.Id, skill.SkillTypeRead.Code].join('_');
            selectMenu.setCustomId(customId)
            hero.Skills.forEach(s => {
                if(upgradeTypeCode == s.UpgradeTypeRead.Code){
                    const isCurrentSkill = (s.SkillTypeRead.Code == skill.SkillTypeRead.Code);
                    const customButtonId = ['SKILL', author, hero.Id, s.SkillTypeRead.Code, s.UpgradeTypeRead.Code].join('_');
                    buttonsRow.addComponents(new MessageButton({
                        label: s.SkillTypeRead.Name,
                        customId: customButtonId,
                        style: isCurrentSkill ? 'SECONDARY' : 'PRIMARY',
                        disabled: isCurrentSkill
                    }))
                }

                if(skillTypeCode == s.SkillTypeRead.Code){
                    const isCurrentUpgradeType = (s.UpgradeTypeRead.Code == skill.UpgradeTypeRead.Code);
                    selectMenu.addOptions({
                        label: s.UpgradeTypeRead.Name,
                        value: s.UpgradeTypeRead.Code,
                        default: isCurrentUpgradeType
                    })
                }
            })

            const menuRow = new MessageActionRow().addComponents(selectMenu);

            if(skill.UpgradeTypeRead){
                embed.addField('Upgrade Type', skill.UpgradeTypeRead.Name, true)
            }
            if(skill.Cooldown){
                embed.addField('Cooldown',`${skill.Cooldown}s`, true)
            }
            const description = skill.Description.split('[Title]')
            
            for(let x = 0; x < description.length; x++){
                const desc = description[x];
                if(x == 0){
                    embed.addField('Skill Description', desc.substring(0, 1024))
                }
                else {
                    const descSplit = desc.split('\n');
                    const title = descSplit.shift();
                    embed.addField(title, descSplit.join('\n').substring(0, 1024))
                    if(descSplit.join('\n').length > 1024){
                        embed.addField('Cont...', descSplit.join('\n').substring(1024))
                    }
                }
            }

            let skillDate = (skill.UpdatedAt) ? skill.UpdatedAt : skill.CreatedAt;

            embed.setFooter(`Last updated ${new Date(skillDate).toLocaleDateString()}`);

            return {
                embed: embed,
                components: [menuRow, buttonsRow]
            }
        }
    },
};