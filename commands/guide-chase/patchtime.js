const { MessageEmbed } = require('discord.js');
const { DateTime } = require('luxon');

module.exports = {
    name: 'patchtime',
    aliases: ['pt'],
    description: 'check the current server patch time',
    type: 'gc',
    utilisation: client.config.app.gc + 'patchtime <asia|west|kr>',

    async execute(client, message, args) {

        if (!args[0]) return message.channel.send(`Server is required ${message.author}... try again ? ❌`);

        const patchMap = {
            asia: 1,
            west: 2,
            kr: 3
        }
        
        await api.get('PatchTime/' + patchMap[args[0]] ).then(async (response) => {
            
            const patchtime = response.data;

            const patchStartTZ = DateTime.fromISO(patchtime.PatchStart, { zone: patchtime.TimeZone })
            const patchEndTZ = DateTime.fromISO(patchtime.PatchEnd, { zone: patchtime.TimeZone })

            const options = { year: 'numeric', month: 'long', day: 'numeric',  hour: 'numeric',  minute: 'numeric', timeZone: patchtime.TimeZone  };
            const patchTimeString = new Date(patchStartTZ).toLocaleString("en-US", options);
            const patchEndString = new Date(patchEndTZ).toLocaleString("en-US", options);

            const patchStartDiff = patchStartTZ.diff(DateTime.now(), ["hours", "minutes", "seconds"]);
            const patchEndDiff = patchEndTZ.diff(DateTime.now(), ["hours", "minutes", "seconds"]);

            let diff;
            let serverStatus;
            let timeLeftLabel;
            if(patchStartDiff.valueOf() > 0){
                serverStatus = '❌NOT YET STARTED';
                timeLeftLabel = 'Time Until Patch Start';
                diff = patchStartDiff;
            }
            else if(patchStartDiff.valueOf() <= 0 && patchEndDiff.valueOf() >= 0){
                serverStatus = '🔧ON GOING';
                timeLeftLabel = 'Time Until Patch End';
                diff = patchEndDiff;
            }
            else {
                serverStatus = '✅COMPLETE';
            }
            
            const dateUntil = `${diff.values.hours}hrs, ${diff.values.minutes}mins, ${parseInt(diff.values.seconds)}s`;
            const embed = new MessageEmbed({
                color: 'RED'
            });
            
            embed.setThumbnail(patchtime.Image);
            embed.setAuthor(`Patch Time`, client.user.displayAvatarURL({ size: 1024, dynamic: true }));
            embed.addField('Server', `\`${patchtime.Server}\``, true);
            embed.addField('Time Zone', `\`${patchtime.TimeZone}\``, true);
            embed.addField('Status', `\`${serverStatus}\``, true);
            embed.addField('Patch Start', `\`${patchTimeString}\``, true);
            embed.addField('Patch End', `\`${patchEndString}\``, true);
            if(serverStatus != 'COMPLETE'){
                embed.addField(timeLeftLabel, '```⏲' + dateUntil + '```');
            }
            if(patchtime.Notes){
                embed.addField('Notes', '```' + patchtime.Notes + '```');
            }

            return message.channel.send({ embeds: [embed]});

        })
    }
};