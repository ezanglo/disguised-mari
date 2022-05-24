const { MessageEmbed, MessageButton, MessageActionRow, MessageAttachment } = require('discord.js');
const { createCanvas, loadImage } = require('canvas')

module.exports = {
    name: 'trait',
    aliases: ['tr'],
    args: ['hero', 'content', 'type'],
    description: 'Shows the selected trait for selected content',
    utilisation: client.config.app.gc + 'trait mari wb cs',

    async execute(client, message, args) {

        if (!args[0]) return message.channel.send(`Hero name is required ${message.author}... try again ? ❌`);
        
        if (!args[1]) return message.channel.send(`Content or Upgrade Type is required ${message.author}... try again ? ❌`);
        
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
            '&nested[Skills][fields]=Code,Image,UpgradeTypeRead' +
            '&nested[Traits][fields]=Id,Code,UpgradeTypeRead,ContentTypeRead,Config')
        .then(async (response) => {
            const hero = response.data;

            const trait = await this.getHeroTrait(hero, args, message.author.id);
            if(!trait){
                return message.channel.send({ embeds: [
                    new MessageEmbed({
                        color: 'RED',
                        description: `Trait not found ${message.author}... try again ? ❌`
                    })
                ]});
            }

            return message.channel.send({
                embeds: [trait.embed],
                files: trait.attachment ? [trait.attachment]: [],
                components: trait.components ? [trait.components]: []
            })
        })
        .catch(e => {
            message.channel.send(`An Error has occured ${message.author}... try again ? ❌`);
        });
    },
    async getHeroTrait(hero, args, author)
    {
        const embed = new MessageEmbed();
        embed.setColor(hero.Color);

        const traits = hero.Traits.map(trait => {
            let cmd = trait.ContentTypeRead.Code;
            if(trait.UpgradeTypeRead) cmd += ` ${trait.UpgradeTypeRead.Code}`;
            return { ...trait, cmd: cmd }
        })

        const isContentTypeTrait = this.getDefaultContent(args[0].toLowerCase());
        const isUpgradeTypeTrait = ['lvl', 'cs', 'si', 'trans'].includes(args[0].toLowerCase());

        let traitCommands = [hero.Code];
        if(isContentTypeTrait){
            traitCommands.push(args[0].toLowerCase());
            traitCommands.push(args[1] ? args[1].toLowerCase() : (hero.Traits.length > 0) ? hero.Traits[0].UpgradeTypeRead.Code : 'lvl');
        }
        else if(isUpgradeTypeTrait){
            traitCommands.push(args[1] ? args[1].toLowerCase() : (hero.Traits.length > 0) ? hero.Traits[0].ContentTypeRead.Code : 'pve');
            traitCommands.push(args[0].toLowerCase());
        }

        let trait = traits.find(x => x.Code == traitCommands.join('.'));
        if(trait)
        {
            embed.setAuthor(`${hero.DisplayName} | ${trait.UpgradeTypeRead.Name} Traits | ${trait.ContentTypeRead.Name}`, hero.Image);
            
            const row = new MessageActionRow();

            if(isContentTypeTrait){
                const traitUpgradeTypes = hero.Traits.sort((a, b) => (a.UpgradeTypeRead.OrderBy > b.UpgradeTypeRead.OrderBy) ? 1 : -1)
                for(const t of traitUpgradeTypes){
                    if(args[0] == t.ContentTypeRead.Code){
                        const isCurrentTrait = (t.UpgradeTypeRead.Code == trait.UpgradeTypeRead.Code);
                        row.addComponents(new MessageButton({
                            label: t.UpgradeTypeRead.Name,
                            customId: [
                                'TRAIT',
                                author,
                                hero.Id,
                                t.ContentTypeRead.Code,
                                t.UpgradeTypeRead.Code
                            ].join('_'),
                            style: isCurrentTrait ? 'SECONDARY' : 'PRIMARY',
                            disabled: isCurrentTrait
                        }))
                    }
                }
            }
            else if (isUpgradeTypeTrait){
                const traitContentTypes = hero.Traits.sort((a, b) => (a.ContentTypeRead.Id > b.ContentTypeRead.Id) ? 1 : -1)
                for(const t of traitContentTypes){
                    if(args[0] == t.UpgradeTypeRead.Code){
                        const isCurrentTrait = (t.ContentTypeRead.Code == trait.ContentTypeRead.Code);
                        row.addComponents(new MessageButton({
                            label: t.ContentTypeRead.Name,
                            customId: [
                                'TRAIT',
                                author,
                                hero.Id,
                                t.UpgradeTypeRead.Code,
                                t.ContentTypeRead.Code
                            ].join('_'),
                            style: isCurrentTrait ? 'SECONDARY' : 'PRIMARY',
                            disabled: isCurrentTrait
                        }))
                    }
                }
            }


            switch(trait.UpgradeTypeRead.Code)
            {
                case 'lvl': {
                    const offset = 0;
                    const canvas = createCanvas(883, 784 + offset)
                    const ctx = canvas.getContext('2d')
            
                    const bg = await loadImage('https://i.imgur.com/79U1BZF.png');
                    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height - offset)

                    ctx.font = 'italic bold 36px Arial';
                    ctx.fillStyle = 'white';
                    ctx.textAlign = "end";
                    ctx.fillText(`${hero.DisplayName} | ${trait.UpgradeTypeRead.Name} Traits | ${trait.ContentTypeRead.Name}`, canvas.width - 20, canvas.height - 20);

                    const height = 120;
                    const width = 120;
                    
                    const levelTraits = [
                        ['crit', 'cdr'],
                        ['aspd', 'bdr'],
                        ['sdr', 'bdi'],
                        ['sdi', 'tdi'],
                        ['heal']
                    ]

                    let top = 28;
                    for(const rowTraits of levelTraits){
                        let left = 33;
                        for(const rowTrait of rowTraits){
                            if(rowTrait && trait.Config[rowTrait]){
                                let traitConfig = client.traitTypes.find(x => x.Code == rowTrait)
                                if(traitConfig){
                                    // const traitImage = await loadImage(traitConfig.Image);
                                    // ctx.drawImage(traitImage, left, top, width, height)
                                    // ctx.fillText(trait.Config[rowTrait], left + 25, top + 95);
                                    // ctx.strokeText(trait.Config[rowTrait], left + 25, top + 95);

                                    const traitImage = await loadImage(traitConfig.Image);
                                    ctx.drawImage(traitImage, left, top, width, height)
                                    
                                    const heightOffset = height / 3
                                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                                    ctx.beginPath()
                                    ctx.moveTo(left + width, top + heightOffset)
                                    ctx.lineTo(left + heightOffset, top + height)
                                    ctx.lineTo(left + width, top + height)
                                    ctx.lineTo(left + width, top + heightOffset)
                                    ctx.fill()
                                    ctx.closePath()

                                    ctx.textAlign = "end";
                                    ctx.fillStyle = 'white';
                                    ctx.strokeStyle = 'black';
                                    ctx.font = 'italic bold 50px Arial';
                                    ctx.fillText(trait.Config[rowTrait], (left + width) - 10, (top + height) - 10);
                                    ctx.strokeText(trait.Config[rowTrait], (left + width) - 10, (top + height) - 10);

                                }
                            }
                            left+= 421;
                        }
                        top+= 141;
                    }

                    const attachment = new MessageAttachment(canvas.toBuffer('image/png'), 'bufferedtraits.png');
                    embed.setImage('attachment://bufferedtraits.png')

                    return {
                        embed: embed,
                        attachment: attachment,
                        components: row
                    }
                }
                case 'cs': {

                    const offset = 50;
                    const canvas = createCanvas(900, 781 + offset)
                    const ctx = canvas.getContext('2d')
            
                    const bg = await loadImage('https://i.imgur.com/1bg0oWo.png');

                    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height - offset)

                    ctx.font = 'italic bold 36px Arial';
                    ctx.fillStyle = 'white';
                    ctx.textAlign = "end";
                    ctx.fillText(`${hero.DisplayName} | ${trait.UpgradeTypeRead.Name} Traits | ${trait.ContentTypeRead.Name}`, canvas.width, canvas.height);

                    const height = 130;
                    const width = 130;

                    const chaserTraits = [
                        ['ep', 'll', 'hpr', 'pob'],
                        ['ih', 'dp', 'pl', 'bol'],
                        ['con', 'imp', 'pe', 'sh'],
                        ['csr', null, null, 'csl']
                    ]

                    let top = 40;
                    for(const rowTraits of chaserTraits){
                        let left = 315;
                        for(const rowTrait of rowTraits){
                            if(rowTrait && trait.Config[rowTrait]){
                                let traitConfig = client.traitTypes.find(x => x.Code == rowTrait)
                                if(['csr', 'csl'].includes(rowTrait)){
                                    traitConfig = hero.Skills.find(x => x.Code == 'cs' && x.UpgradeTypeRead.Code == 'base')
                                }
                                if(traitConfig){
                                    const traitImage = await loadImage(traitConfig.Image);
                                    ctx.drawImage(traitImage, left, top, width, height)
                                    
                                    const heightOffset = height / 3
                                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                                    ctx.beginPath()
                                    ctx.moveTo(left + width, top + heightOffset)
                                    ctx.lineTo(left + heightOffset, top + height)
                                    ctx.lineTo(left + width, top + height)
                                    ctx.lineTo(left + width, top + heightOffset)
                                    ctx.fill()
                                    ctx.closePath()

                                    ctx.textAlign = "end";
                                    ctx.fillStyle = 'white';
                                    ctx.strokeStyle = 'black';
                                    ctx.font = 'italic bold 60px Arial';
                                    ctx.fillText(trait.Config[rowTrait], (left + width) - 10, (top + height) - 10);
                                    ctx.strokeText(trait.Config[rowTrait], (left + width) - 10, (top + height) - 10);
                                }
                            }
                            left+= 142;
                        }
                        top+= 190;
                    }

                    const attachment = new MessageAttachment(canvas.toBuffer('image/png'), 'bufferedtraits.png');
                    embed.setImage('attachment://bufferedtraits.png')

                    return {
                        embed: embed,
                        attachment: attachment,
                        components: row
                    }
                }

            }
        }      
    },
    getDefaultContent(content){
        const isPVP = ['pvp','arena','gw','gt','ht'];
        const isPVE = [
            'pve', 'gb','db','hf','dr',
            'wb','dc', 'bl','ba','aot',
            'ah','nm','tt'
        ];

        if(isPVP.includes(content.toLowerCase())){
            return 'pvp'
        }
        else if(isPVE.includes(content.toLowerCase())){
            return 'pve'
        }
        else {
            return null;
        }
        
    }
};