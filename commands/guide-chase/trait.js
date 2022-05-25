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

        let heroCode = args.shift();
        if(heroCode == 'update'){
            const GuideChaseBot = message.guild.roles.cache.find(x => x.name === 'GuideChaseBot');

            if (!message.member._roles.includes(GuideChaseBot.id)) {
            
                return message.channel.send({ embeds: [
                    new MessageEmbed({
                        color: 'RED',
                        description: `This command is reserved for members with the <@&${GuideChaseBot.id}> role on the server ${message.author}... try again ? ❌`
                    })
                ]});
            }
            await this.updateHeroTrait(args, message)
            args = args[0].split('.');
            heroCode = args.shift();
            args.push('--refresh')
        }

        const selectedHero = client.heroes.find(x => x.Code == heroCode.toLowerCase());
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
            '&nested[Traits][fields]=Id,Code,UpgradeTypeRead,ContentTypeRead,Config,Image')
        .then(async (response) => {
            const hero = response.data;

            const refreshImage = (args[args.length - 1] == '--refresh')

            const result = await this.getHeroTrait(hero, args, message.author.id, refreshImage);
            if(!result){
                return message.channel.send({ embeds: [
                    new MessageEmbed({
                        color: 'RED',
                        description: `Trait not found ${message.author}... try again ? ❌`
                    })
                ]});
            }

            const reply = await message.channel.send({
                embeds: [result.embed],
                files: result.attachment ? [result.attachment]: [],
                components: result.components ? [result.components]: []
            })

            const traitImageUrl = reply.embeds[0].image.url;
            if((refreshImage || !result.trait.Image) && traitImageUrl){
                api.patch('HeroTrait/' + result.trait.Id, { Image: traitImageUrl })
            }
        })
        .catch(e => {
            message.channel.send(`An Error has occured ${message.author}... try again ? ❌`);
        });
    },
    async getHeroTrait(hero, args, author, refreshImage)
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
            
            if(trait.Image && !refreshImage){
                embed.setImage(trait.Image)
                return {
                    embed: embed,
                    components: row,
                    trait: trait
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

                    this.addWaterMark(ctx, canvas);

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

                    const fileName = `${hero.Code}-${trait.UpgradeTypeRead.Code}-${trait.ContentTypeRead.Code}.png`
                    const attachment = new MessageAttachment(canvas.toBuffer('image/png'), fileName);
                    embed.setImage('attachment://' + fileName)

                    return {
                        embed: embed,
                        attachment: attachment,
                        components: row,
                        trait: trait
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
                    ctx.fillText(`${hero.DisplayName} | ${trait.UpgradeTypeRead.Name} Traits | ${trait.ContentTypeRead.Name}`, canvas.width, canvas.height - 10);

                    this.addWaterMark(ctx, canvas);

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

                    const fileName = `${hero.Code}-${trait.UpgradeTypeRead.Code}-${trait.ContentTypeRead.Code}.png`
                    const attachment = new MessageAttachment(canvas.toBuffer('image/png'), fileName);
                    embed.setImage('attachment://' + fileName)

                    return {
                        embed: embed,
                        attachment: attachment,
                        components: row,
                        trait: trait
                    }
                }
                case 'trans': {
                    const offset = 0;
                    const canvas = createCanvas(883, 831 + offset)
                    const ctx = canvas.getContext('2d')
            
                    const bg = await loadImage('https://i.imgur.com/R0QvvKK.png');

                    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height - offset)
                    
                    ctx.font = 'italic bold 36px Arial';
                    ctx.fillStyle = 'white';
                    ctx.fillText(`${hero.DisplayName} | ${trait.UpgradeTypeRead.Name} Traits | ${trait.ContentTypeRead.Name}`, 30, 70);

                    this.addWaterMark(ctx, canvas);

                    const height = 133;
                    const width = 133;

                    const transTraits = [
                        ['bdi', 'bdr', 'sdi'],
                        ['sdr', 'pvp', 'def'],
                        ['cs', 'si']
                    ]

                    let top = 159;
                    for(const rowTraits of transTraits){
                        let left = 83;
                        for(const rowTrait of rowTraits){
                            if(trait.Config[rowTrait]){
                                let traitConfig = client.traitTypes.find(x => x.Code == `${trait.UpgradeTypeRead.Code}.${rowTrait}`)
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
                            left+= 289;
                        }
                        top+= 236;
                    }

                    const fileName = `${hero.Code}-${trait.UpgradeTypeRead.Code}-${trait.ContentTypeRead.Code}.png`
                    const attachment = new MessageAttachment(canvas.toBuffer('image/png'), fileName);
                    embed.setImage('attachment://' + fileName)

                    return {
                        embed: embed,
                        attachment: attachment,
                        components: row,
                        trait: trait
                    }
                }
            }
        }      
    },
    async updateHeroTrait(args, message)
    {
        if (!args[0]) return message.channel.send(`Trait Code is required ${message.author}... try again ? ❌`);
        
        if (!args[1]) return message.channel.send(`Trait Config is required ${message.author}... try again ? ❌`);
        
        const traitCode = args[0];
        const traitConfig = args[1].split('-');

        await api.get(`HeroTrait?where=(Code,eq,${traitCode})`).then(async response => {
            if(response.status == 200){
                const data = response.data;
                if(data.pageInfo.totalRows > 0){
                    const trait = data.list[0];
                    const configMap = this.getConfigMap(trait.UpgradeTypeRead.Code);

                    let config = [];
                    for(const c of traitConfig){
                        config.push(c.split(''))
                    }

                    let jsonConfig = {};
                    for(let x = 0; x < configMap.length; x++){
                        for(let y = 0; y < configMap[x].length; y++){
                            if(configMap[x][y] && (config[x][y] && config[x][y] != 'x') ){
                                jsonConfig[configMap[x][y]] = config[x][y];
                            }
                        }
                    }

                    await api.patch('HeroTrait/' + trait.Id, { Config: jsonConfig })
                }
            }
        })
        .catch(e => {
            message.channel.send(`An Error has occured ${message.author}... try again ? ❌`);
        });
    },
    addWaterMark(ctx, canvas){
        ctx.save()
        ctx.textAlign = "center";
        ctx.font = 'italic bold 200px Arial';
        ctx.fillStyle = 'rgba(256, 256, 256, 0.1)';
        ctx.fillText('GUIDE\nCHASE', canvas.width / 2, canvas.height/2)
        ctx.restore()
    },
    getConfigMap(upgradeType){
        switch(upgradeType){
            case 'lvl': {
                return [
                    ['crit', 'cdr'],
                    ['aspd', 'bdr'],
                    ['sdr', 'bdi'],
                    ['sdi', 'tdi'],
                    ['heal']
                ]
            }
            case 'cs': {
                return [
                    ['ep', 'll', 'hpr', 'pob'],
                    ['ih', 'dp', 'pl', 'bol'],
                    ['con', 'imp', 'pe', 'sh'],
                    ['csr', null, null, 'csl']
                ]
            }
            case 'trans': {
                return [
                    ['bdi', 'bdr', 'sdi'],
                    ['sdr', 'pvp', 'def'],
                    ['cs', 'si']
                ]
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
        
    },
};