const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js');

module.exports = {
    name: 'skill',
    aliases: ['sk'],
    args: ['hero', 'skill', 'upgrade'],
    description: 'Shows the skill for the selected hero',
    utilisation: client.config.app.gc + 'skill mari s1 si',

    async execute(client, message, args) {

        if (!args[0]) return message.channel.send(`Hero name is required ${message.author}... try again ? ❌`);
        
        if (!args[1]) return message.channel.send(`Skill is required ${message.author}... try again ? ❌`);

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
            '&nested[Skills][fields]=Id,Name,Code,Image,SP,Description,Cooldown,UpgradeTypeRead,CreatedAt,UpdatedAt')
        .then(async (response) => {
            const hero = response.data;

            const skillCodes = ['s1', 's2', 'passive', 'cs', 'special'];
            if(skillCodes.includes(args[0]))
            {
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
            }
        })
        .catch(e => {
            message.channel.send(`An Error has occured ${message.author}... try again ? ❌`);
        });
    },
    getHeroSkill(hero, args, author)
    {
        const embed = new MessageEmbed();

        const skills = hero.Skills.map(skill => {
            let cmd = skill.Code;
            if(skill.UpgradeTypeRead){
                cmd += ` ${skill.UpgradeTypeRead.Code}`;
            }
            return {
                ...skill,
                cmd: cmd
            }
        })

        if(hero.Color){
            embed.setColor(hero.Color);
        }

        const skillCommands = [
            args[0].toLowerCase(),
            args[1] ? args[1].toLowerCase() : 'base'
        ];


        let skill = skills.find(x => x.cmd == skillCommands.join(' '));
        if(skill){
            let authorLabel = skill.Name;
            if(skill.SP){
                authorLabel += ` | ${skill.SP} SP`;
            }
            embed.setThumbnail(skill.Image);
            embed.setAuthor(authorLabel);

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

            const row = new MessageActionRow();

            const upgradeSkills = hero.Skills.sort((a, b) => (a.UpgradeTypeRead.OrderBy > b.UpgradeTypeRead.OrderBy) ? 1 : -1)

            upgradeSkills.forEach(s => {
                if(args[0] == s.Code){
                    const isCurrentSkill = (s.UpgradeTypeRead.Code == skill.UpgradeTypeRead.Code);
                    row.addComponents(new MessageButton({
                        label: s.UpgradeTypeRead.Name,
                        customId: [
                            'SKILL',
                            author,
                            hero.Id,
                            s.Code,
                            s.UpgradeTypeRead.Code
                        ].join('_'),
                        style: isCurrentSkill ? 'SECONDARY' : 'PRIMARY',
                        disabled: isCurrentSkill
                    }))
                }
            });

            return {
                embed: embed,
                components: row
            }
        }
    },
};