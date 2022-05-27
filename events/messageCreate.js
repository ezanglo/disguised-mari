const { MessageEmbed } = require('discord.js');

module.exports = (client, message) => {

    try {

        if (message.author.bot || message.channel.type === 'dm') return;

        const musicpx = client.config.app.px;
        const gcpx = client.config.app.gc;

        let prefix;
        if(message.content.indexOf(musicpx) == 0){
            prefix = musicpx;
        }
        else if(message.content.indexOf(gcpx) == 0){
            prefix = gcpx;
        }
        else {
            return;
        }

        // if(message.content.toLowerCase().startsWith('?update')){

        // //     // api.post('HeroTrait', {
        // //     //     Code: 'mari.pvp.base',
        // //     //     nc_16ql__content_type_id: 1,
        // //     //     nc_16ql__upgrade_type_id: 6,
        // //     //     nc_16ql__hero_id: 5,
        // //     //     Config: { }
        // //     // }).then(response => {
        // //     //     console.log(response)
        // //     // }).catch(e => {
        // //     //     console.log(e);
        // //     // });

        //     api.get('Hero?limit=100&nested[Skills][fields]=Id,Name,Code,Image,SP,Description,Cooldown,UpgradeTypeRead,CreatedAt,UpdatedAt').then(async (response) => {
        //         if(response.status == 200){
        //             const heroes = response.data.list
        //             const skillConfig = { s1: 1, s2: 2, pass: 3, cs: 4, ss: 5}
        //             for(const hero of heroes) {
        //                 for(const skill of hero.Skills){
        //                     // let skillCode = skill.Code.split('.');
        //                     // if(skillCode[1] == 'passive'){
        //                     //     skillCode = [hero.Code, 'pass', skill.UpgradeTypeRead.Code].join('.');
        //                     //     const response = await api.patch('HeroSkill/' + skill.Id, {
        //                     //         Code: skillCode,
        //                     //         nc_16ql__skill_type_id: 3
        //                     //     })
        //                     // }
        //                     // else if(skillCode[1] == 'special'){
        //                     //     skillCode = [hero.Code, 'ss', skill.UpgradeTypeRead.Code].join('.');
        //                     //     const response = await api.patch('HeroSkill/' + skill.Id, {
        //                     //         Code: skillCode,
        //                     //         nc_16ql__skill_type_id: 5
        //                     //     })
        //                     // }

        //                     // if(trait.nc_16ql__upgrade_type_id == 6){
        //                     //     let traitCode = trait.Code.split('.');
        //                     //     traitCode = [traitCode[0], traitCode[1], 'lvl'].join('.');
        //                     //     const response = await api.patch('HeroTrait/' + trait.Id, {
        //                     //         Code: traitCode,
        //                     //         nc_16ql__upgrade_type_id: 9,
        //                     //         Config: {
        //                     //             crit: 5,
        //                     //             cdr: 5
        //                     //         }
        //                     //     })
        //                     // }

        //                     // if(trait.nc_16ql__upgrade_type_id == 2){
        //                     //     let traitCode = trait.Code.split('.');
        //                     //     traitCode = [traitCode[0], traitCode[1], 'trans'].join('.');
        //                     //     const response = await api.patch('HeroTrait/' + trait.Id, {
        //                     //         Code: traitCode,
        //                     //         nc_16ql__upgrade_type_id: 8
        //                     //     })
        //                     // }
        //                 }
        //                 // for(const content of hero.Contents){
        //                 //     for(const upgrade of hero.Upgrades){
        //                 //         const traitCode = `${hero.Code}.${content.Code}.${upgrade.Code}`
        //                 //         const existingTrait = hero.Traits.find( x => x.Code == traitCode);
        //                 //         if(!existingTrait){
        //                 //             const response = await api.post('HeroTrait', {
        //                 //                 Code: traitCode,
        //                 //                 nc_16ql__content_type_id: content.Id,
        //                 //                 nc_16ql__upgrade_type_id: upgrade.Id,
        //                 //                 nc_16ql__hero_id: hero.Id,
        //                 //                 Config: {
                                            
        //                 //                 }
        //                 //             })
        //                 //         }
        //                 //     }
        //                 // }
        //             }
        //         }
        //     });
        // }

        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();

        const cmd = client.commands.get(command) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(command));

        if(prefix == musicpx){
            const DJ = client.config.opt.DJ;

            if (cmd && DJ.enabled && DJ.commands.includes(cmd.name)) {
                const roleDJ = message.guild.roles.cache.find(x => x.name === DJ.roleName);

                if (!message.member._roles.includes(roleDJ.id)) {
                
                    return message.channel.send({ embeds: [
                        new MessageEmbed({
                            color: 'RED',
                            description: `This command is reserved for members with the ${DJ.roleName} role on the server ${message.author}... try again ? ❌`
                        })
                    ]});
                }
            }
            if (cmd && cmd.voiceChannel) {
                if (!message.member.voice.channel) return message.channel.send(`You're not in a voice channel ${message.author}... try again ? ❌`);
    
                if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(`You are not in the same voice channel ${message.author}... try again ? ❌`);
            }
        }

        if (cmd) {
            message.channel.sendTyping();
            cmd.execute(client, message, args);
        }
    }
    catch(e){
        message.channel.send(`An Error has occured ${message.author}... try again ? ❌`);
    }
};