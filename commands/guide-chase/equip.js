const { MessageEmbed, MessageButton, MessageActionRow, MessageAttachment, MessageSelectMenu } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const { DateTime } = require('luxon');

module.exports = {
    name: 'equip',
    aliases: ['eq'],
    args: ['hero', 'content'],
    description: 'Shows the hero equip for selected content',
    type: 'gc',
    utilisation: client.config.app.gc + 'equip mari wb',

    async execute(client, message, args) {

        if (!args[0]) return message.reply(`Hero name is required ${message.author}... try again ? ❌`);

        let heroCode = args.shift();
        if(heroCode == 'update'){
            const GuideChaseBot = message.guild.roles.cache.find(x => x.name === 'GuideChaseBot');

            if (!message.member._roles.includes(GuideChaseBot.id)) {
            
                return message.reply({ embeds: [
                    new MessageEmbed({
                        color: 'RED',
                        description: `This command is reserved for members with the <@&${GuideChaseBot.id}> role on the server ${message.author}... try again ? ❌`
                    })
                ]});
            }
            const heroEquipCode = args.shift();
            await this.updateHeroEquip(heroEquipCode, args, message).then(()=> {
                const equipCodes = heroEquipCode.split('.');
                heroCode = equipCodes[1];
                args = [equipCodes[2], '--refresh']
            })
        }

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
                    customId: ['TRAIT',message.author.id,hero.Id,args[0],args[1]].join('_'),
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
            '?nested[HeroClassRead][fields]=Id,Name,Image'+
            '&nested[HeroEquips][fields]='+
            'Id,Code,ContentTypeRead,WeaponConfig,SubWeaponConfig,ArmorConfig,' +
            'SubArmor1Config,SubArmor2Config,ExclusiveWeaponConfig,RingConfig,' +
            'NecklaceConfig,EarringConfig,Image,Artifact,Notes,UpdatedAt')
        .then(async (response) => {
            const hero = response.data;

            const refreshImage = (args[args.length - 1] == '--refresh')
            if(refreshImage){
                args.pop()
            }

            const result = await this.getHeroEquip(hero, args, message.author.id, refreshImage);
            if(!result){
                return message.reply({ embeds: [
                    new MessageEmbed({
                        color: 'RED',
                        description: `Equip not found ${message.author}... try again ? ❌`
                    })
                ]});
            }

            await message.reply({
                embeds: [result.embed],
                files: result.attachment ? [result.attachment]: [],
                components: result.components ? result.components: []
            }).then(reply => {
                const equipImageUrl = reply.embeds[0].image.proxyURL;
                if((refreshImage || result.refreshImage || !result.equip.Image) && equipImageUrl){
                    api.patch('HeroEquip/' + result.equip.Id, { Image: equipImageUrl })
                }
            })
            
        })
        .catch(e => {
            message.reply(`An Error has occured ${message.author}... try again ? ❌`);
            client.errorLog(e, message);
        });
    },
    async getHeroEquip(hero, args, author, refreshImage)
    {
        const embed = new MessageEmbed();
        embed.setColor(hero.Color);

        hero.HeroEquips.sort((a, b) => 
            a.ContentTypeRead.Id - b.ContentTypeRead.Id
        )

        let ContentTypeCode = this.getDefaultContent(args[0], hero.HeroEquips[0].ContentTypeRead.Code);
        let EquipCode = ['equip', hero.Code, ContentTypeCode];
        let equip = hero.HeroEquips.find(x => x.Code == EquipCode.join('.').toLowerCase());
        if(equip)
        {
            embed.setAuthor(`${hero.DisplayName} Equips | ${equip.ContentTypeRead.Name}`, hero.Image);
            if(equip.Notes){
                embed.setFooter({ text: 'Note: ' + equip.Notes, iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true }) });
            }

            const row = new MessageActionRow();

            const ContentTypeButtons = [
                ...new Map(hero.HeroEquips.map((item) => [item["ContentTypeRead"]['Code'], item.ContentTypeRead])).values(),
            ];

            for(const content of ContentTypeButtons){
                const isCurrentContent = (content.Code == equip.ContentTypeRead.Code);
                const customId = ['EQUIP', author, hero.Id, content.Code];
                row.addComponents(new MessageButton({
                    label: content.Name,
                    customId: customId.join('_'),
                    style: isCurrentContent ? 'SECONDARY' : 'PRIMARY',
                    disabled: isCurrentContent
                }))
            }


            if(equip.Image){
                await api.get(equip.Image)
                .then(response => {
                    if(response.status == 200){
                        embed.setImage(equip.Image)
                    }
                })
                .catch(error => {
                    console.log(error.response.status, equip.Image);
                    refreshImage = true;
                })
                .finally(() => {
                })
            }
            else {
                refreshImage = true;
            }

            if(this.isEquipUpdated(hero, equip)){
                refreshImage = true;
            }

            if(!refreshImage){
                return {
                    embed: embed,
                    components: [row],
                    equip: equip
                }
            }

            const offset = 0;
            const canvas = createCanvas(1260, 1180 + offset)
            const ctx = canvas.getContext('2d')
    
            const bg = await loadImage('https://media.discordapp.net/attachments/992459267292528710/994804060572111013/equip-base-clear.png');
            ctx.drawImage(bg, 0, 0, canvas.width, canvas.height - offset)

            ctx.font = 'italic bold 40px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = "end";
            ctx.fillText(`${hero.DisplayName} Equips | ${equip.ContentTypeRead.Name}`, canvas.width - 20, canvas.height - 20);

            const heroGearList = [
                'weap', 'subweap', 'armor','subarmor1','subarmor2'
            ]

            const height = 120;
            const width = 120;

            let left = 40;
            let top = 40;
            // const weaponConfig = equip.WeaponConfig;
            for(const heroGear of heroGearList){
                // Create gradient
                const gearConfig = this.getGearConfig(equip, heroGear)
                
                await loadImage(this.getEquipColor(gearConfig.color)).then(img => {
                    ctx.drawImage(img, left-10, top-10, 140, 180)
                });

                const weaponCode = [
                    hero.HeroClassRead.Name.toLowerCase(),
                    'gear',
                    heroGear
                ].join('.');
                const gear = client.heroGearTypes.find(x => x.Code == weaponCode);
                await loadImage(gear.Image).then(img => {
                    ctx.drawImage(img, left, top, width, height)
                });

                this.drawStrokedText(ctx, `${gear.Name}`, 'center', left + 60, top + 150)
                
                const gearStatValues = this.getStatValues(heroGear);

                if(gearConfig.stat1 && gearStatValues[gearConfig.stat1]){
                    const stat = gearStatValues[gearConfig.stat1];
                    ctx.save()
                    ctx.font = 'italic bold 20px Arial';
                    ctx.fillStyle = 'white';
                    ctx.textAlign = "start";
                    ctx.fillText(`${stat.label}`, left + 145, top + 20);
                    ctx.restore()
                    this.drawStrokedText(ctx, `+${stat.value}`, 'center', left + 480, top + 20)
                }

                if(gearConfig.stat2 && gearStatValues[gearConfig.stat2]){
                    const stat = gearStatValues[gearConfig.stat2];
                    ctx.save()
                    ctx.font = 'italic bold 20px Arial';
                    ctx.fillStyle = 'white';
                    ctx.textAlign = "start";
                    ctx.fillText(`${stat.label}`, left + 145, top + 50);
                    ctx.restore()
                    this.drawStrokedText(ctx, `+${stat.value}`, 'center', left + 480, top + 50)
                }

                if(gearConfig.enchant1 && gearStatValues.enchants[gearConfig.enchant1]){
                    const stat = gearStatValues.enchants[gearConfig.enchant1];
                    ctx.save()
                    ctx.font = 'italic bold 20px Arial';
                    ctx.fillStyle = 'white';
                    ctx.textAlign = "start";
                    ctx.fillText(`${stat.label}`, left + 185, top + 100);
                    ctx.restore()
                    this.drawStrokedText(ctx, `+${stat.value}`, 'end', left + 555, top + 100)
                }

                if(gearConfig.enchant2 && gearStatValues.enchants[gearConfig.enchant2]){
                    const stat = gearStatValues.enchants[gearConfig.enchant2];
                    ctx.save()
                    ctx.font = 'italic bold 20px Arial';
                    ctx.fillStyle = 'white';
                    ctx.textAlign = "start";
                    ctx.fillText(`${stat.label}`, left + 185, top + 130);
                    ctx.restore()
                    this.drawStrokedText(ctx, `+${stat.value}`, 'end', left + 555, top + 130)
                }

                if(gearConfig.enchant3 && gearStatValues.enchants[gearConfig.enchant3]){
                    const stat = gearStatValues.enchants[gearConfig.enchant3];
                    ctx.save()
                    ctx.font = 'italic bold 20px Arial';
                    ctx.fillStyle = 'white';
                    ctx.textAlign = "start";
                    ctx.fillText(`${stat.label}`, left + 185, top + 160);
                    ctx.restore()
                    this.drawStrokedText(ctx, `+${stat.value}`, 'end', left + 555, top + 160)
                }

                top+= 220;
            }

            //Second Gears
            top = 40;
            left = 660;
                
            //Exlusive Weapon 
            await loadImage(this.getEquipColor()).then(img => {
                ctx.drawImage(img, left-10, top-10, 140, 180)
            });

            const ewCode = [hero.HeroClassRead.Name.toLowerCase(),'ew',hero.Code].join('.');
            const exclusiveWeap = client.heroGearTypes.find(x => x.Code == ewCode);
            await loadImage(exclusiveWeap.Image).then(img => {
                ctx.drawImage(img, left - 10, top - 10, 140, 140)
            });
            
            this.drawStrokedText(ctx, `Exclusive`, 'center', left + 60, top + 140)
            this.drawStrokedText(ctx, `Weapon`, 'center', left + 60, top + 160)

            const fontSize = (exclusiveWeap.Name.length < 20) ? '30px': '27px';
            this.drawStrokedText(ctx, `${exclusiveWeap.Name}`, 'start', left + 140, top + 30, fontSize)

            const ewConfig = equip.ExclusiveWeaponConfig;
            const ewStatValues = this.getStatValues('ew');

            if(ewConfig.rune1 && ewStatValues[ewConfig.rune1]){
                const rune1Url = this.getRuneImage('normal', ewConfig.rune1);
                await loadImage(rune1Url).then(img => {
                    ctx.drawImage(img, left + 145, 95, 30, 30)
                });

                const stat = ewStatValues[ewConfig.rune1];
                ctx.save()
                ctx.font = 'italic bold 20px Arial';
                ctx.fillStyle = 'white';
                ctx.textAlign = "start";
                ctx.fillText(`${stat.label}`, left + 185, top + 75);
                ctx.restore()
                this.drawStrokedText(ctx, `+${stat.value}`, 'end', left + 555, top + 75)
            }

            if(ewConfig.rune2 && ewStatValues[ewConfig.rune2]){
                const rune2Url = this.getRuneImage('special', ewConfig.rune2);
                await loadImage(rune2Url).then(img => {
                    ctx.drawImage(img, left + 145, 125, 30, 30)
                });

                const stat = ewStatValues[ewConfig.rune2];
                ctx.save()
                ctx.font = 'italic bold 20px Arial';
                ctx.fillStyle = 'white';
                ctx.textAlign = "start";
                ctx.fillText(`${stat.label}`, left + 185, top + 105);
                ctx.restore()
                this.drawStrokedText(ctx, `+${stat.value}`, 'end', left + 555, top + 105)
            }

            
            top+= 220;
            
            //Artifact
            await loadImage(this.getEquipColor()).then(img => {
                ctx.drawImage(img, left-10, top-10, 140, 180)
            });

            if(equip.Artifact){
                const artifactCode = [hero.HeroClassRead.Name.toLowerCase(),'arti',equip.Artifact].join('.');
                const artifact = client.heroGearTypes.find(x => x.Code == artifactCode);
                await loadImage(artifact.Image).then(img => {
                    ctx.drawImage(img, left, top, width, height)
                });
            }
            
            this.drawStrokedText(ctx, `Artifact`, 'center', left + 60, top + 150)
            
            this.drawStrokedText(ctx, `Legendary`, 'start', left + 140, top + 30, '30px', '#bd5175')

            const artiStatValues = this.getStatValues('arti');
            if(equip.Artifact && artiStatValues[equip.Artifact]){
                const artiStat = artiStatValues[equip.Artifact];
                if(artiStat.stat1){
                    ctx.save()
                    ctx.font = 'italic bold 20px Arial';
                    ctx.fillStyle = '#cf763e';
                    ctx.textAlign = "start";
                    ctx.fillText(`${artiStat.stat1.label}`, left + 140, top + 60);
                    ctx.restore()
                    this.drawStrokedText(ctx, `+${artiStat.stat1.value}`, 'end', left + 555, top + 60, null, '#cf763e')
                }
                if(artiStat.stat2){
                    ctx.save()
                    ctx.font = 'italic bold 20px Arial';
                    ctx.fillStyle = '#cf763e';
                    ctx.textAlign = "start";
                    ctx.fillText(`${artiStat.stat2.label}`, left + 140, top + 90);
                    ctx.restore()
                    this.drawStrokedText(ctx, `+${artiStat.stat2.value}`, 'end', left + 555, top + 90, null, '#cf763e')
                }
                if(artiStat.effect){
                    ctx.save()
                    ctx.font = 'italic bold 20px Arial';
                    ctx.fillStyle = '#c6c6c6';
                    ctx.textAlign = "start";
                    ctx.fillText(`${artiStat.effect} wraps around caster's body\nwhen the skill is used`, left + 140, top + 120);
                    ctx.restore()
                }
            }

            //Accesories 
            const heroAccesoriesList = [
                'ring', 'neck', 'ear'
            ]

            top+= 220;

            for(const accesory of heroAccesoriesList){
                const acceConfig = this.getGearConfig(equip, accesory)
                
                await loadImage(this.getEquipColor(acceConfig.color)).then(img => {
                    ctx.drawImage(img, left-10, top-10, 140, 180)
                });

                if(acceConfig.type){
                    const accesoryCode = ['acce',accesory,acceConfig.type].join('.');
                    const acce = client.heroGearTypes.find(x => x.Code == accesoryCode);
                    await loadImage(acce.Image).then(img => {
                        ctx.drawImage(img, left, top, width, height)
                    });
                }
                
                let acceName;
                switch(accesory){
                    case 'ring':
                        acceName = 'Ring';
                        break;
                    case 'neck':
                        acceName = 'Necklace';
                        break;
                    case 'ear':
                        acceName = 'Earrings';
                        break;
                }
                this.drawStrokedText(ctx, `${acceName}`, 'center', left + 60, top + 150)

                const acceStatValues = this.getStatValues(accesory);

                if(acceConfig.stat && acceStatValues[acceConfig.stat]){
                    const stat = acceStatValues[acceConfig.stat];
                    ctx.save()
                    ctx.font = 'italic bold 20px Arial';
                    ctx.fillStyle = 'white';
                    ctx.textAlign = "start";
                    ctx.fillText(`${stat.label}`, left + 145, top + 50);
                    ctx.restore()
                    this.drawStrokedText(ctx, `+${stat.value}`, 'center', left + 480, top + 50)
                }

                if(acceConfig.type && acceStatValues[acceConfig.type]){
                    const stat = acceStatValues[acceConfig.type];
                    ctx.save()
                    ctx.font = 'italic bold 20px Arial';
                    ctx.fillStyle = 'white';
                    ctx.textAlign = "start";
                    ctx.fillText(`${stat.label}`, left + 145, top + 95);
                    ctx.restore()
                    this.drawStrokedText(ctx, `+${stat.value}`, 'end', left + 555, top + 95)
                }

                if(acceConfig.color && acceStatValues[acceConfig.color]){
                    const stat = acceStatValues[acceConfig.color];
                    ctx.save()
                    ctx.font = 'italic bold 20px Arial';
                    ctx.fillStyle = '#cf763e';
                    ctx.textAlign = "start";
                    ctx.fillText(`(3Set)${stat.label}`, left + 145, top + 125);
                    ctx.restore()
                    this.drawStrokedText(ctx, `+${stat.value}`, 'end', left + 555, top + 125, null, '#cf763e')
                }


                top+= 220;
            }
            
            this.addWaterMark(ctx, canvas, -70);

            const fileName = `equip-${hero.Code}-${equip.ContentTypeRead.Code}.png`
            const attachment = new MessageAttachment(canvas.toBuffer('image/png'), fileName);
            embed.setImage('attachment://' + fileName)

            return {
                embed: embed,
                attachment: attachment,
                components: [row],
                equip: equip,
                refreshImage: true
            }
        }      
    },
    getGearConfig(equip, heroGear)
    {
        let config = {};
        switch(heroGear){
            case 'weap':
                config = equip.WeaponConfig;
            break;
            case 'subweap':
                config = equip.SubWeaponConfig;
            break;
            case 'armor':
                config = equip.ArmorConfig;
            break;
            case 'subarmor1':
                config = equip.SubArmor1Config;
            break;
            case 'subarmor2':
                config = equip.SubArmor2Config;
            break;
            case 'ring':
                config = equip.RingConfig;
            break;
            case 'neck':
                config = equip.NecklaceConfig;
            break;
            case 'ear':
                config = equip.EarringConfig;
            break;
        }
        return config;
    },
    getEquipColor(color)
    {
        let color_url = 'https://media.discordapp.net/attachments/992459267292528710/994738968774049882/gray.png';
        switch(color){
            case 'orange':
                color_url = 'https://media.discordapp.net/attachments/992459267292528710/994738968539177000/orange.png';
                break;
            case 'green':
                color_url = 'https://media.discordapp.net/attachments/992459267292528710/994738970485334086/green.png';
                break;
            case 'blue':
                color_url = 'https://media.discordapp.net/attachments/992459267292528710/994738970183356546/blue.png';
                break;
            case 'pink':
                color_url = 'https://media.discordapp.net/attachments/992459267292528710/994738969822634135/pink.png';
                break;
            case 'red':
                color_url = 'https://media.discordapp.net/attachments/992459267292528710/994738969554194512/red.png';
                break;
            case 'cyan':
                color_url = 'https://media.discordapp.net/attachments/992459267292528710/994738969105408021/cyan.png';
                break;
            case 'purple':
                color_url = 'https://media.discordapp.net/attachments/992459267292528710/994738969323524126/purple.png';
                break;
        }

        return color_url;
    },
    getRuneImage(type, rune){
        let url;
        if(type == 'normal'){
            switch(rune){
                case 'matk':
                    url = 'https://media.discordapp.net/attachments/992459474394677369/994059676645867530/unknown.png';
                break;
                case 'mdef':
                    url = 'https://media.discordapp.net/attachments/992459474394677369/994059676918485082/unknown.png';
                break;
                case 'patk':
                    url = 'https://media.discordapp.net/attachments/992459474394677369/994059677342117928/unknown.png';
                break;
                case 'pdef':
                    url = 'https://media.discordapp.net/attachments/992459474394677369/994059677514080287/unknown.png';
                break;
                case 'hp':
                    url = 'https://media.discordapp.net/attachments/992459474394677369/994059677115633716/unknown.png';
                break;
            }
        }
        else{
            switch(rune){
                case 'assaultdmg':
                    url = 'https://media.discordapp.net/attachments/992459474394677369/993248103421460611/IncreaseDamageToAssaultRune.png';
                break;
                case 'assaultdef':
                    url = 'https://media.discordapp.net/attachments/992459474394677369/993248158257774676/ReducedDamageToAssault.png';
                break;
                case 'rangerdmg':
                    url = 'https://media.discordapp.net/attachments/992459474394677369/993248104017051648/IncreaseDamageToRangerRune.png';
                break;
                case 'rangerdef':
                    url = 'https://media.discordapp.net/attachments/992459474394677369/993248158979215451/ReducedDamageToRanger.png';
                break;
                case 'magedmg':
                    url = 'https://media.discordapp.net/attachments/992459474394677369/993248103815729194/IncreaseDamageToMageRune.png';
                break;
                case 'magedef':
                    url = 'https://media.discordapp.net/attachments/992459474394677369/993248158790463548/ReducedDamageToMage.png';
                break;
                case 'tankdmg':
                    url = 'https://media.discordapp.net/attachments/992459474394677369/993248103085899786/IncreaseDamageToToTankRune.png';
                break;
                case 'tankdef':
                    url = 'https://media.discordapp.net/attachments/992459474394677369/993248158048063538/ReducedDamageToTank.png';
                break;
                case 'healerdmg':
                    url = 'https://media.discordapp.net/attachments/992459474394677369/993248103639547944/IncreaseDamageToHealerRune.png';
                break;
                case 'healerdef':
                    url = 'https://media.discordapp.net/attachments/992459474394677369/993248158530420803/ReducedDamageToHealer.png';
                break;
            }
        }
        return url;
    },
    getStatValues(stat)
    {
        const EquipConfig = client.EquipConfig.find(x => x.Code == stat);
        return EquipConfig.Config;
        // const values = {
        //     weap: {
        //         "patk": { "label": "Physical Attack", "value": "4,000" },
        //         "matk": { "label": "Magic Attack", "value": "4,000" },
        //         "pdef": { "label": "Physical Defense", "value": "4,000" },
        //         "mdef": { "label": "Magic Defense", "value": "4,000" },
        //         "hp": { "label": "Max Health", "value": "20,000" },
        //         "td": { "label": "True Damage Chance", "value": "10.00%" },
        //         "ddi": { "label": "Debuff Duration Inc", "value": "20.00%" },
        //         "ddd": { "label": "Debuff Duration Dec", "value": "20.00%" },
        //         "critdef": { "label": "Critical Defense Chance", "value": "5.00%" },
        //         "enchants": {
        //             "matk": { "label": "Magic Attack", "value": "570" },
        //             "patk": { "label": "Physical Attack", "value": "570" },
        //             "mdef": { "label": "Magic Defense", "value": "570" },
        //             "pdef": { "label": "Physical Defense", "value": "570" },
        //             "hp": { "label": "Max Health", "value": "2,860" },
        //             "crit": { "label": "Crit Chance", "value": "4.00%" },
        //             "cdr": { "label": "Skill Cooldown", "value": "4.00%" },
        //             "aspd": { "label": "Attack Speed", "value": "4.00%" },
        //             "sscdr": { "label": "SS Cooldown", "value": "4.00%" },
        //         }
        //     },
        //     subweap: {
        //         "patk": { "label": "Physical Attack", "value": "4,000" },
        //         "matk": { "label": "Magic Attack", "value": "4,000" },
        //         "pdef": { "label": "Physical Defense", "value": "4,000" },
        //         "mdef": { "label": "Magic Defense", "value": "4,000" },
        //         "hp": { "label": "Max Health", "value": "20,000" },
        //         "pvpdmg": { "label": "PVP Damage Increase", "value": "10.00%" },
        //         "pvpdef": { "label": "PVP Damage Decrease", "value": "10.00%" },
        //         "bossdmg": { "label": "Boss Damage Increase", "value": "10.00%" },
        //         "enchants": {
        //             "matk": { "label": "Magic Attack", "value": "570" },
        //             "patk": { "label": "Physical Attack", "value": "570" },
        //             "mdef": { "label": "Magic Defense", "value": "570" },
        //             "pdef": { "label": "Physical Defense", "value": "570" },
        //             "hp": { "label": "Max Health", "value": "2,860" },
        //             "crit": { "label": "Crit Chance", "value": "4.00%" },
        //             "cdr": { "label": "Skill Cooldown", "value": "4.00%" },
        //             "aspd": { "label": "Attack Speed", "value": "4.00%" },
        //             "sscdr": { "label": "SS Cooldown", "value": "4.00%" },
        //         }
        //     },
        //     armor: {
        //         "patk": { "label": "Physical Attack", "value": "1,670" },
        //         "matk": { "label": "Magic Attack", "value": "1,670" },
        //         "pdef": { "label": "Physical Defense", "value": "1,670" },
        //         "mdef": { "label": "Magic Defense", "value": "1,670" },
        //         "hp": { "label": "Max Health", "value": "8,330" },
        //         "crit": { "label": "Critical Chance", "value": "4.00%" },
        //         "critdef": { "label": "Critical Defense Chance", "value": "5.00%" },
        //         "heal": { "label": "Healing Increase", "value": "5.00%" },
        //         "enchants": {
        //             "matk": { "label": "Magic Attack", "value": "570" },
        //             "patk": { "label": "Physical Attack", "value": "570" },
        //             "mdef": { "label": "Magic Defense", "value": "570" },
        //             "pdef": { "label": "Physical Defense", "value": "570" },
        //             "hp": { "label": "Max Health", "value": "2,860" }
        //         }
        //     },
        //     subarmor1: {
        //         "patk": { "label": "Physical Attack", "value": "1,670" },
        //         "matk": { "label": "Magic Attack", "value": "1,670" },
        //         "pdef": { "label": "Physical Defense", "value": "1,670" },
        //         "mdef": { "label": "Magic Defense", "value": "1,670" },
        //         "hp": { "label": "Max Health", "value": "8,330" },
        //         "crit": { "label": "Critical Damage", "value": "8.00%" },
        //         "critdef": { "label": "Critical Damage Decrease", "value": "8.00%" },
        //         "heal": { "label": "Healing Increase", "value": "5.00%" },
        //         "enchants": {
        //             "matk": { "label": "Magic Attack", "value": "570" },
        //             "patk": { "label": "Physical Attack", "value": "570" },
        //             "mdef": { "label": "Magic Defense", "value": "570" },
        //             "pdef": { "label": "Physical Defense", "value": "570" },
        //             "hp": { "label": "Max Health", "value": "2,860" },
        //             "bdi": { "label": "Basic Damage Increase", "value": "4.00%" },
        //             "sdi": { "label": "Skill Damage Increase", "value": "4.00%" },
        //             "bdr": { "label": "Basic Damage Decrease", "value": "4.00%" },
        //             "sdr": { "label": "Skill Damage Decrease", "value": "4.00%" }
        //         }
        //     },
        //     subarmor2: {
        //         "patk": { "label": "Physical Attack", "value": "1,670" },
        //         "matk": { "label": "Magic Attack", "value": "1,670" },
        //         "pdef": { "label": "Physical Defense", "value": "1,670" },
        //         "mdef": { "label": "Magic Defense", "value": "1,670" },
        //         "hp": { "label": "Max Health", "value": "8,330" },
        //         "crit": { "label": "Critical Damage", "value": "8.00%" },
        //         "critdef": { "label": "Critical Damage Decrease", "value": "8.00%" },
        //         "heal": { "label": "Healing Increase", "value": "5.00%" },
        //         "enchants": {
        //             "matk": { "label": "Magic Attack", "value": "570" },
        //             "patk": { "label": "Physical Attack", "value": "570" },
        //             "mdef": { "label": "Magic Defense", "value": "570" },
        //             "pdef": { "label": "Physical Defense", "value": "570" },
        //             "hp": { "label": "Max Health", "value": "2,860" },
        //             "bdi": { "label": "Basic Damage Increase", "value": "4.00%" },
        //             "sdi": { "label": "Skill Damage Increase", "value": "4.00%" },
        //             "bdr": { "label": "Basic Damage Decrease", "value": "4.00%" },
        //             "sdr": { "label": "Skill Damage Decrease", "value": "4.00%" }
        //         }
        //     },
        //     ew: {
        //         "matk": { "label": "Magic Attack", "value": "1,140" },
        //         "patk": { "label": "Physical Attack", "value": "1,140" },
        //         "mdef": { "label": "Magic Defense", "value": "1,140" },
        //         "pdef": { "label": "Physical Defense", "value": "1,140" },
        //         "hp": { "label": "Health", "value": "4,200" },
        //         "assaultdmg": { "label": "Assault Damage", "value": "30.00%" },
        //         "rangerdmg": { "label": "Ranger Damage", "value": "30.00%" },
        //         "magedmg": { "label": "Mage Damage", "value": "30.00%" },
        //         "tankdmg": { "label": "Tank Damage", "value": "30.00%" },
        //         "healerdmg": { "label": "Healer Damage", "value": "30.00%" },
        //         "assaultdef": { "label": "Assault Defense", "value": "30.00%" },
        //         "rangerdef": { "label": "Ranger Defense", "value": "30.00%" },
        //         "magedef": { "label": "Mage Defense", "value": "30.00%" },
        //         "tankdef": { "label": "Tank Defense", "value": "30.00%" },
        //         "healerdef": { "label": "Healer Defense", "value": "30.00%" }
        //     },
        //     arti: {
        //         "crit": {
        //             "effect": "Darkness",
        //             "stat1": { "label": "+4 Crit Chance", "value": "3.20%" },
        //             "stat2": { "label": "+7 Basic Attack Reduction", "value": "3.20%" }
        //         },
        //         "bdi": {
        //             "effect": "Frost",
        //             "stat1": { "label": "+4 Basic Damage Increase", "value": "3.20%" },
        //             "stat2": { "label": "+7 Skill Damage Reduction", "value": "3.20%" }
        //         },
        //         "aspd": {
        //             "effect": "Flame",
        //             "stat1": { "label": "+4 Attack Speed Increase", "value": "3.20%" },
        //             "stat2": { "label": "+7 Skill Damage Reduction", "value": "3.20%" }
        //         }
        //     },
        //     ring: {
        //         "aspd": { "label": "Attack Speed Increase", "value": "6.00%" },
        //         "crit": { "label": "Crit Chance", "value": "4.00%" },
        //         "bdr": { "label": "Basic Damage Reduction", "value": "4.00%" },
        //         "sscdr": { "label": "SS Cooldown Reduction", "value": "4.00%" },
        //         "bdi": { "label": "Basic Damage Increase", "value": "4.00%" },
        //         "sdi": { "label": "Skill Damage Increase", "value": "4.00%" },
        //         "critdef": { "label": "Critical Defense", "value": "5.00%" },
        //         "purple": { "label": "True Damage Increase", "value": "30.00%" },
        //         "orange": { "label": "PVP Atk/Def", "value": "5.00%" },
        //         "cyan": { "label": "Null Damage Chance", "value": "3.00%" }
        //     },
        //     neck: {
        //         "cdr": { "label": "Skill Cooldown Reduction", "value": "4.00%" },
        //         "crit": { "label": "Crit Chance", "value": "4.00%" },
        //         "sdr": { "label": "Skill Damage Reduction", "value": "4.00%" },
        //         "sscdr": { "label": "SS Cooldown Reduction", "value": "4.00%" },
        //         "bdi": { "label": "Basic Damage Increase", "value": "4.00%" },
        //         "sdi": { "label": "Skill Damage Increase", "value": "4.00%" },
        //         "critdef": { "label": "Critical Defense", "value": "5.00%" },
        //         "purple": { "label": "True Damage Increase", "value": "30.00%" },
        //         "orange": { "label": "PVP Atk/Def", "value": "5.00%" },
        //         "cyan": { "label": "Null Damage Chance", "value": "3.00%" }
        //     },
        //     ear: {
        //         "aspd": { "label": "Attack Speed Increase", "value": "6.00%" },
        //         "cdr": { "label": "Skill Cooldown Reduction", "value": "4.00%" },
        //         "sdr": { "label": "Skill Damage Reduction", "value": "4.00%" },
        //         "bdr": { "label": "Basic Damage Reduction", "value": "4.00%" },
        //         "crit": { "label": "Critical Damage", "value": "8.00%" },
        //         "critdef": { "label": "Critical Damage Decrease", "value": "8.00%" },
        //         "heal": { "label": "Healing Increase", "value": "5.00%" },
        //         "purple": { "label": "True Damage Increase", "value": "30.00%" },
        //         "orange": { "label": "PVP Atk/Def", "value": "5.00%" },
        //         "cyan": { "label": "Null Damage Chance", "value": "3.00%" }
        //     }
        // }
        // return values[stat];
    },
    addWaterMark(ctx, canvas, heightOffset){
        heightOffset = heightOffset ? heightOffset : 0;
        ctx.save()
        ctx.textAlign = "center";
        ctx.font = 'italic bold 200px Arial';
        ctx.fillStyle = 'rgba(256, 256, 256, 0.1)';
        ctx.fillText('GUIDE\nCHASE', canvas.width / 2, (canvas.height/2) + heightOffset)
        ctx.restore()
    },
    getDefaultContent(content, defaultContent){
        const isPVP = ['pvp','arena','gw','gt','ht'];
        const isPVE = [
            'pve', 'gb','db','hf','dr',
            'wb','dc', 'bl','ba','aot',
            'ah','nm','tt'
        ];

        if(!content){
            return defaultContent;
        }
        else if(isPVP.includes(content.toLowerCase()) || isPVE.includes(content.toLowerCase())){
            return content;
        }
        else {
            return defaultContent;
        }
    },
    drawStrokedText(ctx, text, align ,x, y, size, fillColor, strokeColor)
    {
            ctx.save();
            ctx.font = `italic bold ${size ? size: '20px'} Arial`;
            ctx.fillStyle = fillColor? fillColor : 'white';
            ctx.strokeStyle = strokeColor ? strokeColor : 'black';
            ctx.textAlign = align ? align : 'start';
            ctx.lineWidth = 3;
            ctx.lineJoin="round";
            ctx.miterLimit=2;
            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);
            ctx.restore();
    },
    getConfigMap(config, stats){
        switch(config){
            case 'weap': {
                if(stats.length != 6){
                    return {};
                }

                return {
                    WeaponConfig : {
                        color: stats[0],
                        stat1: stats[1],
                        stat2: stats[2],
                        enchant1: stats[3],
                        enchant2: stats[4],
                        enchant3: stats[5]
                    }
                }
            }
            case 'subweap': {
                if(stats.length != 5){
                    return {};
                }

                return {
                    SubWeaponConfig : {
                        stat1: stats[0],
                        stat2: stats[1],
                        enchant1: stats[2],
                        enchant2: stats[3],
                        enchant3: stats[4]
                    }
                }
            }
            case 'armor': {
                if(stats.length != 5){
                    return {};
                }

                return {
                    ArmorConfig : {
                        color: stats[0],
                        stat1: stats[1],
                        stat2: stats[2],
                        enchant1: stats[3],
                        enchant2: stats[4]
                    }
                }
            }
            case 'subarmor1': {
                if(stats.length != 5){
                    return {};
                }

                return {
                    SubArmor1Config : {
                        color: stats[0],
                        stat1: stats[1],
                        stat2: stats[2],
                        enchant1: stats[3],
                        enchant2: stats[4]
                    }
                }
            }
            case 'subarmor2': {
                if(stats.length != 5){
                    return {};
                }

                return {
                    SubArmor2Config : {
                        color: stats[0],
                        stat1: stats[1],
                        stat2: stats[2],
                        enchant1: stats[3],
                        enchant2: stats[4]
                    }
                }
            }
            case 'ew': {
                if(stats.length != 2){
                    return {};
                }

                return {
                    ExclusiveWeaponConfig : {
                        rune1: stats[0],
                        rune2: stats[1]
                    }
                }
            }
            case 'arti': {
                if(stats.length != 1){
                    return {};
                }

                return {
                    Artifact : stats[0]
                }
            }
            case 'ring': {
                if(stats.length != 3){
                    return {};
                }

                return {
                    RingConfig : {
                        color: stats[0],
                        type: stats[1],
                        stat: stats[2]
                    }
                }
            }
            case 'neck': {
                if(stats.length != 3){
                    return {};
                }

                return {
                    NecklaceConfig : {
                        color: stats[0],
                        type: stats[1],
                        stat: stats[2]
                    }
                }
            }
            case 'ear': {
                if(stats.length != 3){
                    return {};
                }

                return {
                    EarringConfig : {
                        color: stats[0],
                        type: stats[1],
                        stat: stats[2]
                    }
                }
            }
        }
    },
    isEquipUpdated(hero, equip)
    {
        if(!equip.UpdatedAt){
            return true;
        }

        const equipUpdateAt = DateTime.fromISO(equip.UpdatedAt)
        
        const heroGearList = [
            'weap', 'subweap', 'armor','subarmor1','subarmor2'
        ]

        let isUpdated = false;

        for(const heroGear of heroGearList)
        {
            const weaponCode = [
                hero.HeroClassRead.Name.toLowerCase(),
                'gear',
                heroGear
            ].join('.');
            const gear = client.heroGearTypes.find(x => x.Code == weaponCode);

            const equipUpdateDiff = equipUpdateAt.diff(new DateTime(gear.UpdatedAt), ["hours", "minutes", "seconds"]);
            if(equipUpdateDiff.valueOf() > 0){
                isUpdated = true;
                break;
            }
        }

        for(const equipConfig of client.EquipConfig)
        {
            const equipUpdateDiff = equipUpdateAt.diff(new DateTime(equipConfig.UpdatedAt), ["hours", "minutes", "seconds"]);
            if(equipUpdateDiff.valueOf() > 0){
                isUpdated = true;
                break;
            }
        }
        
        return isUpdated;
    },
    async updateHeroEquip(heroEquipCode, args, message)
    {
        if (!args[0]) return message.reply(`Equip Config is required ${message.author}... try again ? ❌`);

        await api.get(`HeroEquip?where=(Code,eq,${heroEquipCode})`).then(async response => {
            if(response.status == 200){
                const data = response.data;
                if(data.pageInfo.totalRows > 0){
                    const heroEquip = data.list[0];

                    let configData = {};
                    for(const arg of args){
                        const config = arg.split('[');
                        const configType = config[0];
                        const configStats = config[1].replace(']','').split(',');
                        configData = {
                            ...configData,
                            ...this.getConfigMap(configType, configStats)
                        }
                    }

                    await api.patch('HeroEquip/' + heroEquip.Id, configData)
                }
            }
        })
        .catch(e => {
            message.reply(`An Error has occured ${message.author}... try again ? ❌`);
            client.errorLog(e, message);
        });
    },
};
