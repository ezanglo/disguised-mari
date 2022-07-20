/* eslint-disable no-case-declarations */
const { MessageEmbed } = require('discord.js');
const { log } = require('node:console');
const wait = require('node:timers/promises').setTimeout;

module.exports = async (client, int) => {
    
    try {

        if (!int.isButton() && !int.isSelectMenu()) return;

        const queue = player.getQueue(int.guildId);
        
        const args = int.customId.split('_');
        let customId = args.shift();
        if(customId == 'SELECT'){
            customId = args.shift();
        }

        switch (customId) {
            case 'saveTrack': 
                if (!queue || !queue.playing) return int.reply({ content: `No music currently playing... try again ? ❌`, ephemeral: true, components: [] });

                int.member.send(`You saved the track ${queue.current.title} | ${queue.current.author} from the server ${int.member.guild.name} ✅`).then(() => {
                    return int.reply({ content: `I have sent you the title of the music by private messages ✅`, ephemeral: true, components: [] });
                }).catch(error => {
                    return int.reply({ content: `Unable to send you a private message... try again ? ❌`, ephemeral: true, components: [] });
                });
            break;
            case 'skipTrack': 
                if (!queue || !queue.playing) return int.reply({ content: `No music currently playing... try again ? ❌`, ephemeral: true, components: [] });
                
                const member = int.guild.members.cache.get(int.member.user.id);

                if (!member.voice.channel) return int.reply({ content: `You're not in a voice channel ${int.member}... try again ? ❌`, ephemeral: true });

                const channelSize = member.voice.channel.members.size - 1;

                const voteskips = queue.current.skipVotes;
                if(!voteskips.find(id=>id == int.member.user.id)){
                    queue.current.skipVotes.push(int.member.user.id);
                }

                int.reply({ embeds: [
                    new MessageEmbed({
                        color: 'RED',
                        description: `${int.member} voted to skip - ${queue.current.skipVotes.length}/${channelSize}`
                    })
                ], ephemeral: true});
                
                if(queue.current.skipVotes.length > Math.ceil(channelSize/2)){
                    const success = queue.skip();
        
                    const skippers = (queue.current.skipVotes.length > 0) ? `Skipped by ${queue.current.skipVotes.map(id => queue.guild.members.cache.get(id)).join(' ')}` : ''

                    let embedMessage = `Something went wrong ${int.member}... try again ? ❌`
                    if(success){
                        embedMessage = [
                            `Title **[${queue.current.title}](${queue.current.url})**`,
                            `${skippers}`,
                        ].join('\n')
                    }

                    const embed = new MessageEmbed({
                        color: 'RED',
                        description: embedMessage
                    });
                    embed.setAuthor(`SKIPPED`, client.user.displayAvatarURL({ size: 1024, dynamic: true }));
                    return int.channel.send({ embeds: [embed], ephemeral: true});
                }
            break;
            case 'SKILL':
                const author = args.shift();
                if(author != int.member.user.id){
                    return int.reply({ content: `You don't have access to this interaction ${int.member}... ❌`, ephemeral: true });
                }

                const heroId = args.shift();
                await api.get('Hero/' + heroId + 
                    '?nested[Upgrades][fields]=Id,Name,Code' +
                    '&nested[Skills][fields]=Id,Name,Code,Image,SP,Description,Cooldown,UpgradeTypeRead,SkillTypeRead,CreatedAt,UpdatedAt,OrderBy')
                .then((response) => {
                    const hero = response.data;
                    const cmd = client.commands.get('skill')
                    const skill = cmd.getHeroSkill(hero, args, author)
                    return int.update({
                        embeds: [skill.embed],
                        components: skill.components ? [skill.components]: []
                    })
                })
                .catch(e => {
                    int.channel.send({ content: `An Error has occured ${int.member}... try again ? ❌`, ephemeral: true });
                    client.errorLog(e, {
                        author: int.member,
                        channel: int.channel,
                        content: `Interaction: ${customId}`
                    });
                });
                
            break;
            case 'TRAIT':
                const traitAuthor = args.shift();
                if(traitAuthor != int.member.user.id){
                    return int.reply({ content: `You don't have access to this interaction ${int.member}... ❌`, ephemeral: true });
                }

                const traitHeroId = args.shift();
                await api.get('Hero/' + traitHeroId + 
                    '?nested[Upgrades][fields]=Id,Name,Code'+
                    '&nested[Skills][fields]=Code,Image,UpgradeTypeRead,SkillTypeRead' +
                    '&nested[Traits][fields]=Id,Code,UpgradeTypeRead,ContentTypeRead,Config,OrderBy,Note')
                .then(async response => {
                    const hero = response.data;
                    const cmd = client.commands.get('trait')

                    if(int.isSelectMenu() && args.includes('si')){
                        args.push(int.values[0])
                    }

                    const trait = await cmd.getHeroTrait(hero, args, traitAuthor);
                    return int.update({
                        embeds: trait.embeds,
                        files: trait.attachment ? [trait.attachment]: [],
                        components: trait.components ? trait.components: []
                    })
                })
                .catch(e => {
                    int.channel.send({ content: `An Error has occured ${int.member}... try again ? ❌`, ephemeral: true });
                    client.errorLog(e, {
                        author: int.member,
                        channel: int.channel,
                        content: `Interaction: ${customId}`
                    });
                });
                
            break;
            case 'EQUIP':
                const equipAuthor = args.shift();
                if(equipAuthor != int.member.user.id){
                    return int.reply({ content: `You don't have access to this interaction ${int.member}... ❌`, ephemeral: true });
                }

                let hero;

                const equipHeroId = args.shift();
                await api.get('Hero/' + equipHeroId + 
                '?nested[HeroClassRead][fields]=Id,Name,Image'+
                '&nested[HeroEquips][fields]='+
                'Id,Code,ContentTypeRead,WeaponConfig,SubWeaponConfig,ArmorConfig,' +
                'SubArmor1Config,SubArmor2Config,ExclusiveWeaponConfig,RingConfig,' +
                'NecklaceConfig,EarringConfig,Image,Artifact,Notes')
                .then(async response => {
                    hero = response.data;
                    const cmd = client.commands.get('equip')

                    const result = await cmd.getHeroEquip(hero, args, equipAuthor);
                    return int.update({
                        embeds: [result.embed],
                        files: result.attachment ? [result.attachment]: [],
                        components: result.components ? result.components: []
                    })
                })
                .catch(e => {
                    int.channel.send({ content: `An Error has occured ${int.user}... please try command directly \`?equip ${hero.Code} ${args.join(' ')}\` ❌`, ephemeral: true });
                    client.errorLog(e, {
                        author: int.user,
                        channel: int.channel,
                        content: `Interaction: ${customId}`
                    });
                });
                
            break;
        }
    }
    catch(e){
        int.channel.send({ content: `An Error has occured ${int.member}... try again ? ❌`, ephemeral: true });
        client.errorLog(e, {
            author: int.user,
            channel: int.channel,
            content: `Interaction`
        });
    }
};