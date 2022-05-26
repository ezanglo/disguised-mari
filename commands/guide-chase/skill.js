const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js');

module.exports = {
    name: 'skill',
    aliases: ['sk'],
    args: ['hero', 'skill', 'upgrade'],
    description: 'Shows the skill for the selected hero',
    utilisation: client.config.app.gc + 'skill mari s1 si',

    async execute(client, message, args) {

        if (!args[0]) return message.channel.send(`Hero name is required ${message.author}... try again ? ❌`);
        
        if (!args[1]){
            args.push('base');
        }

        const heroCode = args.shift();

        const selectedHero = client.heroes.find(x => x.Code == heroCode);
        if(!selectedHero){
            return message.channel.send({ embeds: [
                new MessageEmbed({
                    color: 'RED',
                    description: `Hero not found ${message.author}... try again ? ❌`
                })
            ]});
        }

        await api.get('Hero/' + selectedHero.Id + 
            '?nested[Upgrades][fields]=Id,Name,Code'+
            '&nested[Skills][fields]=Id,Name,Code,Image,SP,Description,Cooldown,UpgradeTypeRead,SkillTypeRead,CreatedAt,UpdatedAt')
        .then(async (response) => {
            const hero = response.data;

            const skill = this.getHeroSkill(hero, args, message.author.id)
            if(!skill) {
                return message.channel.send({ embeds: [
                    new MessageEmbed({
                        color: 'RED',
                        description: `Skill not found ${message.author}... try again ? ❌`
                    })
                ]});
            }

            return message.channel.send({
                embeds: [skill.embed],
                components: skill.components ? [skill.components]: []
            })
        })
        .catch(e => {
            message.channel.send(`An Error has occured ${message.author}... try again ? ❌`);
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

        let skillCommands = [hero.Code];
        if(isSkill){
            skillCommands.push(args[0].toLowerCase());
            skillCommands.push(args[1] ? args[1].toLowerCase() : (hero.Skills.length > 0) ? hero.Skills[0].UpgradeTypeRead.Code : 'base');
        }
        else if(isUpgradeType){
            skillCommands.push(args[1] ? args[1].toLowerCase() : (hero.Skills.length > 0) ? hero.Skills[0].SkillTypeRead.Code : 's1');
            skillCommands.push(args[0].toLowerCase());
        }

        let skill = hero.Skills.find(x => x.Code == skillCommands.join('.'));
        if(skill){
            let authorLabel = skill.Name;
            if(skill.SP){
                authorLabel += ` | ${skill.SP} SP`;
            }
            embed.setThumbnail(skill.Image);
            embed.setAuthor(authorLabel);

            const row = new MessageActionRow();

            if(isSkill){
                hero.Skills.forEach(s => {
                    if(args[0] == s.SkillTypeRead.Code){
                        const isCurrentSkill = (s.UpgradeTypeRead.Code == skill.UpgradeTypeRead.Code);
                        row.addComponents(new MessageButton({
                            label: s.UpgradeTypeRead.Name,
                            customId: [
                                'SKILL',
                                author,
                                hero.Id,
                                s.SkillTypeRead.Code,
                                s.UpgradeTypeRead.Code
                            ].join('_'),
                            style: isCurrentSkill ? 'SECONDARY' : 'PRIMARY',
                            disabled: isCurrentSkill
                        }))
                    }
                });
            }
            else if(isUpgradeType){
                hero.Skills.forEach(s => {
                    if(args[0] == s.UpgradeTypeRead.Code){
                        const isCurrentSkill = (s.SkillTypeRead.Code == skill.SkillTypeRead.Code);
                        row.addComponents(new MessageButton({
                            label: s.SkillTypeRead.Name,
                            customId: [
                                'SKILL',
                                author,
                                hero.Id,
                                s.UpgradeTypeRead.Code,
                                s.SkillTypeRead.Code
                            ].join('_'),
                            style: isCurrentSkill ? 'SECONDARY' : 'PRIMARY',
                            disabled: isCurrentSkill
                        }))
                    }
                })
            }

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
                        embed.addField('Cont...', descSplit.join('\n').substring(1025))
                    }
                }
            }

            let skillDate = (skill.UpdatedAt) ? skill.UpdatedAt : skill.CreatedAt;

            embed.setFooter(`Last updated ${new Date(skillDate).toLocaleDateString()}`);

            return {
                embed: embed,
                components: row
            }
        }
    },
};