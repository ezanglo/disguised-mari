const { MessageEmbed, MessageButton, MessageActionRow, MessageAttachment, MessageSelectMenu } = require('discord.js');
const { createCanvas, loadImage } = require('canvas')

module.exports = {
    name: 'trait',
    aliases: ['tr'],
    args: ['hero', 'content', 'type'],
    description: 'Shows the selected trait for selected content',
    type: 'gc',
    utilisation: client.config.app.gc + 'trait mari wb cs',

    async execute(client, message, args) {

        if (!args[0]) return message.channel.send(`Hero name is required ${message.author}... try again ? ❌`);
        
        if (!args[1]){
            args.push('lvl');
        }

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
            
            const row = new MessageActionRow();

            for(const hero of selectedHero){
                row.addComponents(new MessageButton({
                    label: hero.Code,
                    customId: ['TRAIT',message.author.id,hero.Id,args[0],args[1]].join('_'),
                    style: 'PRIMARY'
                }))
            }

            const embed = new MessageEmbed({
                color: 'RED',
                description: `Multiple heroes found! please select:`
            });

            return message.channel.send({ 
                embeds: [embed], 
                components: [row]
            });
        }
        
        selectedHero = selectedHero.shift();

        await api.get('Hero/' + selectedHero.Id + 
            '?nested[Upgrades][fields]=Id,Name,Code'+
            '&nested[Skills][fields]=Code,Image,UpgradeTypeRead,SkillTypeRead' +
            '&nested[Traits][fields]=Id,Code,UpgradeTypeRead,ContentTypeRead,Config,Image')
        .then(async (response) => {
            const hero = response.data;

            const refreshImage = (args[args.length - 1] == '--refresh')
            if(refreshImage){
                args.pop()
            }

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
                components: result.components ? result.components: []
            })

            const traitImageUrl = reply.embeds[0].image.url;
            if((refreshImage || !result.trait.Image) && traitImageUrl){
                api.patch('HeroTrait/' + result.trait.Id, { Image: traitImageUrl })
            }
        })
        .catch(e => {
            message.channel.send(`An Error has occured ${message.author}... try again ? ❌`);
            client.errorLog(e, message);
        });
    },
    async getHeroTrait(hero, args, author, refreshImage)
    {
        const embed = new MessageEmbed();
        embed.setColor(hero.Color);

        const isContentTypeTrait = this.getDefaultContent(args[0].toLowerCase());
        const isUpgradeTypeTrait = ['lvl', 'cs', 'si', 'trans'].includes(args[0].toLowerCase());

        hero.Traits.sort((a, b) => 
            a.ContentTypeRead.Id - b.ContentTypeRead.Id ||
            a.UpgradeTypeRead.OrderBy.localeCompare(b.UpgradeTypeRead.OrderBy),
        )

        let traitCommands = [hero.Code];
        if(isContentTypeTrait){
            traitCommands.push(args[0].toLowerCase());
            traitCommands.push(args[1] ? args[1].toLowerCase() : (hero.Traits.length > 0) ? hero.Traits[0].UpgradeTypeRead.Code : 'lvl');
        }
        else if(isUpgradeTypeTrait){
            traitCommands.push(args[1] ? args[1].toLowerCase() : (hero.Traits.length > 0) ? hero.Traits[0].ContentTypeRead.Code : 'pve');
            traitCommands.push(args[0].toLowerCase());
        }

        if(traitCommands.includes('si')){
            traitCommands.push(args[2] ? args[2].toLowerCase(): 'mem')
        }

        let trait = hero.Traits.find(x => x.Code == traitCommands.join('.').toLowerCase());
        if(trait)
        {
            embed.setAuthor(`${hero.DisplayName} | ${trait.UpgradeTypeRead.Name} Traits | ${trait.ContentTypeRead.Name}`, hero.Image);
            
            const row = new MessageActionRow();

            const traitButtons = [
                ...new Map(hero.Traits.map((item) => [item["ContentTypeRead"]['Code']+item["UpgradeTypeRead"]['Code'], item])).values(),
            ];

            let traitCustomId;

            if(isContentTypeTrait){
                for(const t of traitButtons){
                    if(args[0] == t.ContentTypeRead.Code){
                        const isCurrentTrait = (t.UpgradeTypeRead.Code == trait.UpgradeTypeRead.Code);
                        const customId = ['TRAIT', author, hero.Id, t.ContentTypeRead.Code, t.UpgradeTypeRead.Code];
                        if(isCurrentTrait){
                            traitCustomId = customId
                        }
                        row.addComponents(new MessageButton({
                            label: t.UpgradeTypeRead.Name,
                            customId: customId.join('_'),
                            style: isCurrentTrait ? 'SECONDARY' : 'PRIMARY',
                            disabled: isCurrentTrait
                        }))
                    }
                }
            }
            else if (isUpgradeTypeTrait){
                for(const t of traitButtons){
                    if(args[0] == t.UpgradeTypeRead.Code){
                        const isCurrentTrait = (t.ContentTypeRead.Code == trait.ContentTypeRead.Code);
                        const customId = ['TRAIT', author, hero.Id, t.UpgradeTypeRead.Code, t.ContentTypeRead.Code];
                        if(isCurrentTrait){
                            traitCustomId = customId
                        }
                        row.addComponents(new MessageButton({
                            label: t.ContentTypeRead.Name,
                            customId: customId.join('_'),
                            style: isCurrentTrait ? 'SECONDARY' : 'PRIMARY',
                            disabled: isCurrentTrait
                        }))
                    }
                }
            }
            
            if(trait.Image && !refreshImage){
                embed.setImage(trait.Image)

                const rows = [];
                if(trait.UpgradeTypeRead.Code == 'si'){
                    rows.push(this.getSoulImprintCoresMenu(traitCustomId, traitCommands[traitCommands.length - 1]))
                }

                rows.push(row);

                return {
                    embed: embed,
                    components: rows,
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
                        components: [row],
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
                                    traitConfig = hero.Skills.find(x => x.Code == `${hero.Code}.cs.base`)
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
                        components: [row],
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
                        components: [row],
                        trait: trait
                    }
                }
                case 'si': {

                    const core = traitCommands[traitCommands.length - 1];

                    const core_config = {
                        mem: {
                            image: 'https://media.discordapp.net/attachments/966833373865713774/982124942646706236/memory_core_gray.png',
                            top: 40,
                            topInc: 160,
                            left: 60,
                            leftInc: 160,
                            traits: [
                                ['bh', null, 'cdd', 'pi'],
                                [null, 'sa', null, null],
                                [null, null, 'sb', 'ht1'],
                                [null, null, 'pm', null],
                                ['mem', 'ht2', null, null]
                            ]
                        },
                        body: {
                            image: 'https://media.discordapp.net/attachments/966833373865713774/982124942957105192/body_core_gray.png',
                            top: 40,
                            topInc: 160,
                            left: 240,
                            leftInc: 160,
                            traits: [
                                ['uw', 'ed', null, 'pbb'],
                                [null, null, 'ac', null],
                                ['bt', 'ml', null, null],
                                [null, 'am', null,null],
                                [null, null, 'ht2', 'body']
                            ]
                        },
                        soul: {
                            image: 'https://media.discordapp.net/attachments/966833373865713774/982124943271665694/soul_core_gray.png',
                            top: 207,
                            topInc: 160,
                            left: 59,
                            leftInc: 160,
                            traits: [
                                [null, 'hc1', null, 'ht2', null],
                                ['ccw', null, null, 'sb', 'res'],
                                [null, null, 'ac', null, 'cs'],
                                ['hc2', null, null, null, 'soul']
                            ]
                        }
                    }

                    let selectedCore = core_config[core];
                    
                    if(!selectedCore){
                        selectedCore = core_config.mem
                    }

                    const offset = 0;
                    const canvas = createCanvas(883, 910 + offset)
                    const ctx = canvas.getContext('2d')
            
                    const bg = await loadImage(selectedCore.image);

                    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height - offset)
                    
                    ctx.font = 'italic bold 36px Arial';
                    ctx.fillStyle = 'white';
                    ctx.textAlign = "end";
                    ctx.fillText(`${hero.DisplayName} | ${trait.UpgradeTypeRead.Name} Traits | ${trait.ContentTypeRead.Name}`, canvas.width - 20, canvas.height - 30);

                    this.addWaterMark(ctx, canvas, -70);

                    const height = 100;
                    const width = 100;

                    let top = selectedCore.top;
                    for(const rowTraits of selectedCore.traits){
                        let left = selectedCore.left;
                        for(const rowTrait of rowTraits){
                            if(rowTrait && trait.Config[rowTrait]){
                                let traitConfig = client.traitTypes.find(x => x.Code == `${core}.${rowTrait}` || x.Code == core)
                                if(traitConfig){
                                    const traitImage = await loadImage(traitConfig.Image);
                                    ctx.drawImage(traitImage, left, top, width, height)
                                    
                                    const heightOffset = height / 3
                                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                                    ctx.beginPath()
                                    ctx.moveTo(left + width, top + heightOffset)
                                    ctx.lineTo(left + heightOffset, top + height + 1)
                                    ctx.lineTo(left + width, top + height + 1)
                                    ctx.lineTo(left + width, top + heightOffset)
                                    ctx.fill()
                                    ctx.closePath()

                                    ctx.textAlign = "end";
                                    ctx.fillStyle = 'white';
                                    ctx.strokeStyle = 'black';
                                    ctx.font = 'italic bold 40px Arial';
                                    ctx.fillText(trait.Config[rowTrait], (left + width) - 5, (top + height) - 5);
                                    ctx.strokeText(trait.Config[rowTrait], (left + width) - 5, (top + height) - 5);
                                }
                            }
                            left+= selectedCore.leftInc;
                        }
                        top+= selectedCore.topInc;
                    }

                    const fileName = `${hero.Code}-${trait.UpgradeTypeRead.Code}-${trait.ContentTypeRead.Code}.png`
                    const attachment = new MessageAttachment(canvas.toBuffer('image/png'), fileName);
                    embed.setImage('attachment://' + fileName)

                    return {
                        embed: embed,
                        attachment: attachment,
                        components: [this.getSoulImprintCoresMenu(traitCustomId, core), row],
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
                    let configMap = this.getConfigMap(trait.UpgradeTypeRead.Code);
                    if(trait.UpgradeTypeRead.Code == 'si'){
                        const code = traitCode.split('.');
                        configMap = configMap[code[code.length - 1]]
                    }

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
            client.errorLog(e, message);
        });
    },
    addWaterMark(ctx, canvas, heightOffset){
        ctx.save()
        ctx.textAlign = "center";
        ctx.font = 'italic bold 200px Arial';
        ctx.fillStyle = 'rgba(256, 256, 256, 0.1)';
        ctx.fillText('GUIDE\nCHASE', canvas.width / 2, (canvas.height/2) + heightOffset)
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
            case 'si': {
                return {
                    mem: [
                        ['bh', 'cdd', 'pi'],
                        ['sa'],
                        ['sb', 'ht1'],
                        ['pm'],
                        ['mem', 'ht2']
                    ],
                    body: [
                        ['uw', 'ed', 'pbb'],
                        ['ac'],
                        ['bt', 'ml'],
                        ['am'],
                        ['ht2', 'body']
                    ],
                    soul: [
                        ['hc1', 'ht2'],
                        ['ccw', 'sb', 'res'],
                        ['ac', 'cs'],
                        ['hc2', 'soul']
                    ]
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
        
    },
    getSoulImprintCoresMenu(traitCustomId, core)
    {
        return new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId('SELECT_' + traitCustomId.join('_'))
                .setPlaceholder('Select Soul Imprint Core')
                .addOptions([
                    {
                        label: 'Memory Core',
                        description: 'Display Memory Core Traits',
                        value: 'mem',
                        default: core == 'mem'
                    },
                    {
                        label: 'Body Core',
                        description: 'Display Body Core Traits',
                        value: 'body',
                        default: core == 'body'
                    },
                    {
                        label: 'Soul Core',
                        description: 'Display Soul Core Traits',
                        value: 'soul',
                        default: core == 'soul'
                    }
                ]),
        )
    }
};