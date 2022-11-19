const { MessageEmbed, MessageButton, MessageActionRow, MessageAttachment, MessageSelectMenu } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const trait = require('./trait');

module.exports = {
    name: 'hero',
    aliases: [],
    description: 'Show basic hero information',
    type: 'gc',
    utilisation: client.config.app.gc + 'hero mari or ' + client.config.app.gc + 'mari',
    slashArgs: [
        { name: 'hero', description: 'Select a hero', required: true, type: 'StringOption' }
    ],

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
        '?nested[HeroClassRead][fields]=Name,Image'+
        '&nested[HeroClassRead][fields]=DiscordEmote'+
        '&nested[AttributeTypeRead][fields]=DiscordEmote'+
        '&nested[Skills][fields]=Name,UpgradeTypeRead,SkillTypeRead'+
        '&nested[Traits][fields]=Id,Code,Config,'+
        '&nested[HeroMMList][fields]=Heroes,ContentTypeRead,ContentPhaseRead'+
        '&nested[HeroEquips][fields]='+
        'Id,Code,ContentTypeRead,WeaponConfig,SubWeaponConfig,ArmorConfig,' +
        'SubArmor1Config,SubArmor2Config,ExclusiveWeaponConfig,RingConfig,' +
        'NecklaceConfig,EarringConfig,Artifact,Credits,Notes,CreatedAt,UpdatedAt'+
        '&nested[Images][fields]=Code,Name,Image')
        .then(async (response) => {
            const hero = response.data;

            if(args[0]){
                if(args[0].startsWith('class')){
                    return message.reply(hero.HeroClassRead.DiscordEmote)
                }
    
                if(args[0].startsWith('attr')){
                    return message.reply(hero.AttributeTypeRead.DiscordEmote)
                }
            }

            const embed = new MessageEmbed();
            embed.setColor(hero.Color);
            embed.setThumbnail(hero.Image);
            embed.setImage(hero.Banner);
            embed.addField(`Hero Name`, `${hero.Name} ${hero.HeroClassRead.DiscordEmote} ${hero.AttributeTypeRead.DiscordEmote}`);

            //content
            let contentDetails = 'None';
            if(hero.HeroMMList.length > 0){
                contentDetails = this.getContent(hero.HeroMMList);
            }
            embed.addField('Content `/lineup`', contentDetails);
            /*const details = [
                { code: 'status', display: 'Status' }, 
                { code: 'species', display: 'Species'  }, 
                { code: 'age', display: 'Age'  }, 
                { code: 'birthday', display: 'Birthday'  }, 
                { code: 'height', display: 'Height'  }, 
                { code: 'blood_type', display: 'Blood Type'  }, 
                { code: 'hometown', display: 'Home Town'  }, 
                { code: 'affiliations', display: 'Affiliations'  }, 
                { code: 'family', display: 'Family'  }
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
                embed.addField(data.display, value, true);
            })*/

            // Equipment
            let EquipCode = ['equip', hero.Code, 'pve'];
            let equipPve = hero.HeroEquips.find(x => x.Code == EquipCode.join('.').toLowerCase());
            EquipCode[2] = 'pvp';
            let equipPvp = hero.HeroEquips.find(x => x.Code == EquipCode.join('.').toLowerCase());
            if(equipPve || equipPvp) embed.addField('Equipment `/equip`', this.getEquipRecommendation(equipPve, equipPvp));

            // Enchants
            if(equipPve || equipPvp) embed.addField('Enchants `/equip`', this.getEnchantRecommendation(equipPve, equipPvp));

            // Enchants
            if(equipPve || equipPvp) embed.addField('Accessories `/equip`', this.getAccessoryRecommendation(equipPve, equipPvp));

            // Traits
            let traitCommands = [hero.Code, 'pve', 'lvl'];
            let traitPve = hero.Traits.find(x => x.Code == traitCommands.join('.').toLowerCase());
            traitCommands[1] = 'pvp';
            let traitPvp = hero.Traits.find(x => x.Code == traitCommands.join('.').toLowerCase());
            if((traitPve && traitPve.Config) || (traitPvp && traitPvp.Config)) embed.addField('Traits `/trait`', this.getTraitRecommendation(traitPve, traitPvp));

            //cs
            traitCommands = [hero.Code, 'pve', 'cs'];
            traitPve = hero.Traits.find(x => x.Code == traitCommands.join('.').toLowerCase());
            traitCommands[1] = 'pvp';
            traitPvp = hero.Traits.find(x => x.Code == traitCommands.join('.').toLowerCase());
            if((traitPve && traitPve.Config) || (traitPvp && traitPvp.Config)) embed.addField('Chaser `/trait`', this.getChaserRecommendation(traitPve, traitPvp));
            
            message.reply({
                embeds: [embed]
            })

            // const canvas = createCanvas(500, 400)
            // const ctx = canvas.getContext('2d')

            // ctx.save();
            // this.roundedRect(ctx, 0, 0, canvas.width, canvas.height, 30);

            // var grd = ctx.createLinearGradient(0,0,0,200);
            // if(!hero.Color){
            //     hero.Color = '#36393f';
            // }
            // grd.addColorStop(0, hero.Color);
            // grd.addColorStop(1,"rgba(54, 57, 63, 0.8)");
            // ctx.fillStyle = grd;
            // ctx.fillRect(0, 0, canvas.width, canvas.height);

            // ctx.clip();

            // const heroBGImage =hero.Images.find(i => i.Code == `${hero.Code}.coordi.si`)
            // if(heroBGImage){
            //     const heroBG = await loadImage(heroBGImage.Image);
            //     ctx.drawImage(heroBG, 0, 0, 800, 848)
            // }

            // const bg = await loadImage('https://media.discordapp.net/attachments/992458631104700467/999840299671101450/herocardbase.png');
            // ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)
            // ctx.restore();

            // ctx.save();
            // this.roundedRect(ctx, 20, 80, 80, 80, 10)
            // ctx.clip();
            // const heroImage = await loadImage(hero.Image);
            // ctx.drawImage(heroImage, 20, 80, 80, 80);
            // ctx.restore();

            // const heroClassImage = await loadImage(hero.HeroClassRead.Image);
            // ctx.drawImage(heroClassImage, 105, 85, 35, 35);

            // ctx.save();
            // ctx.font = 'bold 24px Arial';
            // ctx.fillStyle = 'white';
            // ctx.fillText(hero.Name, 110, 145);
            // ctx.restore();

            // const heroDetails = [
            //     ['status', 'species', 'age'],
            //     ['birthday', 'height', 'blood_type'],
            //     ['hometown', 'affiliations', 'family']
            // ]

            // let top = 220;
            // for(const rowDetails of heroDetails){
            //     let left = 40;
            //     for(const rowDetail of rowDetails){
            //         if(hero.Description[rowDetail]){
            //             ctx.save();
            //             ctx.font = '12px Arial';
            //             ctx.fillStyle = 'white';
            //             ctx.fillText(hero.Description[rowDetail], left, top);
            //             ctx.restore();
            //         }
            //         left+= 100;
            //     }
            //     top+= 60;
            // }

            // const fileName = `${hero.Code}-card.png`
            // const imgAttachment = new MessageAttachment(canvas.toBuffer('image/png'), fileName);
            // embed.setImage('attachment://' + fileName)
            // message.reply({
            //     embeds: [embed],
            //     files: [imgAttachment]
            // })
        })
        .catch(e => {
            message.reply(`An Error has occured ${message.author}... try again ? ❌`);
            client.errorLog(e, message);
        });
    },

    getContent(list) {
      return list.map( (content) => `${content.ContentTypeRead.Name} - ${content.ContentPhaseRead.Name}`).join('\n');
    },

    getEnchantRecommendation(equipPve, equipPvp) {
      let pveRecommendation = '';
      let pvpRecommendation = '';
      const greyEnchant = '<:greyenchant:1043324859037536329>';
      const pinkEnchant = '<:pinkenchant:1043324859968663603>';
      const blueEnchant = '<:blueenchant:1043324861814161419>';
      if(equipPve && equipPve.WeaponConfig && equipPve.WeaponConfig.enchant1 && equipPve.WeaponConfig.enchant2 && equipPve.SubArmor1Config && equipPve.SubArmor1Config.enchant2) {
        pveRecommendation = `**PVE:** ${greyEnchant} ${equipPve.WeaponConfig.enchant1.toUpperCase()} ${pinkEnchant} ${equipPve.WeaponConfig.enchant2.toUpperCase()} ${blueEnchant} ${equipPve.SubArmor1Config.enchant2.toUpperCase()}`;
      }
      if(equipPvp && equipPvp.WeaponConfig && equipPvp.WeaponConfig.enchant1 && equipPvp.WeaponConfig.enchant2 && equipPvp.SubArmor1Config && equipPvp.SubArmor1Config.enchant2) {
        pvpRecommendation = `**PVP:** ${greyEnchant} ${equipPvp.WeaponConfig.enchant1.toUpperCase()} ${pinkEnchant}  ${equipPvp.WeaponConfig.enchant2.toUpperCase()} ${blueEnchant}  ${equipPvp.SubArmor1Config.enchant2.toUpperCase()}`;
      }
      return `${pveRecommendation}\n${pvpRecommendation}`;
    },

    getAccessoryRecommendation(equipPve, equipPvp) {
      let pveRecommendation = '';
      let pvpRecommendation = '';

      const ring = client.heroGearTypes.find(x => x.Code == ['acce', 'ring', equipPve.RingConfig.type].join('.'));
      const neck = client.heroGearTypes.find(x => x.Code == ['acce', 'neck', equipPve.NecklaceConfig.type].join('.'));
      const ear = client.heroGearTypes.find(x => x.Code == ['acce', 'ear', equipPve.EarringConfig.type].join('.'));

      if(equipPve && equipPve.RingConfig && equipPve.RingConfig.color && equipPve.NecklaceConfig && equipPve.NecklaceConfig.color && equipPve.EarringConfig && equipPve.EarringConfig.color) {
        pveRecommendation = `**PVE:** ${this.equipmentColors[equipPve.RingConfig.color]} ${ring.DiscordEmote} ${neck.DiscordEmote} ${ear.DiscordEmote}`;
      }
      if(equipPvp && equipPvp.RingConfig && equipPvp.RingConfig.color && equipPvp.NecklaceConfig && equipPvp.NecklaceConfig.color && equipPvp.EarringConfig && equipPvp.EarringConfig.color) {
        pvpRecommendation = `**PVP:** ${this.equipmentColors[equipPve.RingConfig.color]} ${ring.DiscordEmote} ${neck.DiscordEmote} ${ear.DiscordEmote}`;
      }
      return `${pveRecommendation}\n${pvpRecommendation}`;
    },

    getTraitRecommendation(traitPve, traitPVP) {
      let pveRecommendation = '';
      let pvpRecommendation = '';
      if(traitPve && traitPve.Config) {
        let traits = [];
        let keys = Object.keys(traitPve.Config)
        keys.map((trait) => traitPve.Config[trait] < 5 ? traits.push(trait.toUpperCase()) : traits.unshift(trait.toUpperCase()));
        if(traits.length > 0){
          pveRecommendation = `**PVE:** ${traits.join(', ')}`;
        }
      }
      if(traitPVP && traitPVP.Config) {
        let traits = [];
        let keys = Object.keys(traitPVP.Config)
        keys.map((trait) => traitPVP.Config[trait] < 5 ? traits.push(trait.toUpperCase()) : traits.unshift(trait.toUpperCase()));
        if(traits.length > 0){
          pvpRecommendation = `**PVP:** ${traits.join(', ')}`;
        }
      }
      return `${pveRecommendation}\n${pvpRecommendation}`;
    },

    getEquipRecommendation(equipPve, equipPvp) {
      let pveRecommendation = '';
      let pvpRecommendation = '';
      let items = ['WeaponConfig', 'ArmorConfig', 'SubArmor1Config', 'SubArmor2Config'];
      if(equipPve) {
        let gear = [];
        items.map((item) => equipPve[item] && equipPve[item].color && gear.push(equipPve[item].color));
        if(gear.length > 0){
          pveRecommendation = `**PVE:** ${gear.map((color) => `${this.equipmentColors[color]} `).join('')}`;
        }
      }
      if(equipPvp) {
        let gear = [];
        items.map((item) => equipPvp[item] && equipPvp[item].color && gear.push(equipPvp[item].color));
        if(gear.length > 0){
          pvpRecommendation = `**PVP:** ${gear.map((color) => `${this.equipmentColors[color]} `).join('')}`;
        }
      }
      return `${pveRecommendation}\n${pvpRecommendation}`;
    },

    getChaserRecommendation(traitPve, traitPvp){
      const chaserTraits = [
        ['ep', 'll', 'hpr', 'pob'],
        ['ih', 'dp', 'pl', 'bol'],
        ['con', 'imp', 'pe', 'sh'],
        ['csr', null, null, 'csl']
    ];
      const traitObj = traitPve && traitPve.Config ? traitPve : traitPvp;
      const csTraits = traitObj.Config;
      const rows = [];
      chaserTraits.map((row, index) => {
        rows[index] = [];
        row.map((trait) => {
          if(trait){
            csTraits[trait] ? rows[index].push(this.numbers[csTraits[trait]]) : rows[index].push(':x:');
          }
          else{
            rows[index].push(':heavy_multiplication_x:')
          }
        });
      });
      return rows.map((row) => `` + row.join(" ")).join("\n");
    },

    numbers: {
      '1' : ':one:',
      '2' : ':two:',
      '3' : ':three:',
      '4' : ':four:',
      '5' : ':five:',
    },

    equipmentColors: {
      red: '<:color_red:1043332365113638952>',
      blue: '<:color_blue:1043332362391527434>',
      cyan: '<:color_cyan:1043332367504396328>',
      green: '<:color_green:1043332360093053030>',
      orange: '<:color_orange:1043332361263255562>',
      purple: '<:color_purple:1043332366317408296>',
      pink: '<:color_pink:1043332363188449321>',
    },

    roundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      }
};