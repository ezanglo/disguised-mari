const { EmbedBuilder } = require('discord.js');

module.exports = (client, message) => {

    try {

        if (message.author.bot || message.channel.type === 'dm') return;

        const gcpx = client.config.app.gc;

        let prefix;
        if(message.content.indexOf(gcpx) == 0){
            prefix = gcpx;
        }
        else {
            return;
        }

        const args = message.content.toLowerCase().slice(prefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();

        let cmd = client.commands.get(command) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(command));

        let hero = client.heroes.filter(x => x.Code.startsWith(command));
        if(hero.length > 0 && command.length >= 3){
            cmd = client.commands.get('hero');
            args.unshift(command);
        }

        if (cmd) {
            message.channel.sendTyping();

            if(process.env.ENVIRONMENT == 'dev'){
                // const GuideChaseBot = message.guild.roles.cache.find(x => x.name === 'GuideChaseBot');
                if (!message.member._roles.includes('978859668426350653')) {
                    return message.reply({ embeds: [
                        new EmbedBuilder({
                            color: 0xED4245,
                            description: `❌ Disguised Mari is under maintenance :( Sorry for the inconvenience\nContact @Ezwa#3117 for urgent matters`
                        })
                    ]});
                }
            }
            cmd.execute(client, message, args);

        }
    }
    catch(e){
        message.reply(`An Error has occured ${message.author}... try again ? ❌`);
    }
};