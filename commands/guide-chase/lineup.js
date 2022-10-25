const { MessageEmbed, MessageButton, MessageActionRow, MessageSelectMenu } = require('discord.js');

module.exports = {
    name: 'lineup',
    aliases: ['lu'],
    args: ['content', 'phase'],
    description: 'Shows the lineup for the selected content',
    type: 'gc',
    utilisation: client.config.app.gc + 'lu wb p1',

    async execute(client, message, args) {

        if (!args[0]) return message.reply(`Content name is required ${message.author}... try again ? ❌`);

        if (!args[1]){
            args.push('p1');
        }

        const contentCode = args.shift();

        let selectedContent = client.contentTypes.filter(x => x.Code.startsWith(contentCode.toLowerCase()));
        if(selectedContent.length != 1){
            return message.reply({ embeds: [
                new MessageEmbed({
                    color: 'RED',
                    description: `Content not found ${message.author}... try again ? ❌`
                })
            ]});
        }

        const lineUpCode = [
            'lu',
            contentCode,
            args[0]
        ].join('.');

        // await api.get(`ContentLineup?where=(Code,eq,${lineUpCode})`)
        await api.get(`ContentLineup?where=(Code,eq,${lineUpCode})` +
        '&nested[ContentTypeRead][fields]=Id,Name,Code,Image,Icon'+
        '&nested[ContentPhaseRead][fields]=Id,Name,Code,Description,Image,AttributeTypeRead,HeroClassRead'
        )
        .then(async (response) => {
            const data = response.data;

            if(data.pageInfo.totalRows != 1){
                return message.reply({ embeds: [
                    new MessageEmbed({
                        color: 'RED',
                        description: `Content not found ${message.author}... try again ? ❌`
                    })
                ]});
            }

            const lineup = await this.getContentLineup(data.list[0], args, message.author.id);
            if(!lineup) {
                return message.reply({ embeds: [
                    new MessageEmbed({
                        color: 'RED',
                        description: `Lineup not found ${message.author}... try again ? ❌`
                    })
                ]});
            }

            await message.reply({
                embeds: lineup.embeds,
                components: lineup.components ? lineup.components: []
            })
        })
        .catch(e => {
            message.reply(`An Error has occured ${message.author}... try again ? ❌`);
            client.errorLog(e, message);
        });

        // return message.reply({ embeds: [
        //     new MessageEmbed({
        //         color: 'RED',
        //         description: `Coming Soon™️ :)`
        //     })
        // ]});
        
    },
    async getContentLineup(data, args, author, refreshImage)
    {
        const embed = new MessageEmbed();
        
        const content = data.ContentTypeRead.Name;
        const phase = data.ContentPhaseRead.Name;
        let authorLabel = `${content} - ${phase}`;
        let fileName = `lineup-${data.ContentTypeRead.Code}-${args[0]}`
        if(args[1]){
            const type = (args[1] == 'freq') ? 'Frequency' : 'Position';
            authorLabel+= ` | ${type}`
            fileName += `-${args[1]}`;
        }

        fileName += '.jpg'

        embed.setThumbnail(data.ContentTypeRead.Icon);
        embed.setAuthor(authorLabel, data.ContentTypeRead.Image);

        const lineupImageLink = `${process.env.AWS_S3_CLOUDFRONT_LINK}lineups/${fileName}?ts=${Date.now()}`;


        await api.get(lineupImageLink)
        .then(response => {
            if(response.status == 200){
                embed.setImage(lineupImageLink)
            }
        })
        .catch(error => {
            console.log(error.response.status, lineupImageLink);
            refreshImage = true;
        })
        .finally(() => {
            
        })
        
        if(!args[1]){
            args.push('lu');
        }

        embed.addField(data.ContentPhaseRead.Name, data.ContentPhaseRead.Description, true)
        embed.addField('Attribute', data.ContentPhaseRead.AttributeTypeRead.Name, true)
        embed.addField('Class', data.ContentPhaseRead.HeroClassRead.Name, true)
        embed.addField('Heroes', data.Heroes.map(h => h.Code).join(','), true)
        embed.addField('Pet', data.HeroPetRead.Name, true)
        embed.addField('Gameplay', data.Video)
        
        const buttonsRow = new MessageActionRow();
        const buttons = [
            { Code: 'lu', Label: 'Line Up' }, 
            { Code: 'pos', Label: 'Position' }, 
            { Code: 'freq', Label: 'Frequency' }
        ];
        buttons.forEach(b => {
            const isCurrentLineup = (b.Code == args[1]);
            const customButtonId = ['LINEUP', author, data.ContentTypeRead.Id, data.ContentPhaseRead.Code, b.Code].join('_');
            buttonsRow.addComponents(new MessageButton({
                label: b.Label,
                customId: customButtonId,
                style: isCurrentLineup ? 'SECONDARY' : 'PRIMARY',
                disabled: isCurrentLineup
            }))
        })
        

        let embeds = [];
        let components = [buttonsRow];

        if(!refreshImage){

            embeds.push(embed);
            return {
                embeds: embeds,
                components: components
            }
        }
        
        embeds.push(embed);
        return {
            embeds: embeds,
            components: components
        }
    }
};