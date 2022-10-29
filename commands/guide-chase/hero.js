const { MessageEmbed, MessageButton, MessageActionRow, MessageAttachment, MessageSelectMenu } = require('discord.js');
const { createCanvas, loadImage } = require('canvas')

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
            embed.addField(`Hero Name`, `${hero.Name} ${hero.HeroClassRead.DiscordEmote} ${hero.AttributeTypeRead.DiscordEmote}`);

            const details = [
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
            })

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