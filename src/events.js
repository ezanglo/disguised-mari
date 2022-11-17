const { MessageEmbed } = require('discord.js');

player.on('error', (queue, error) => {
    console.log(`Error emitted from the queue ${error.message}`);
});

player.on('connectionError', (queue, error) => {
    console.log(`Error emitted from the connection ${error.message}`);
});

player.on('trackStart', (queue, track) => {
    if (!client.config.opt.loopMessage && queue.repeatMode !== 0) return;

    queue.current.skipVotes = []
    const cmd = client.commands.get('nowplaying');
    const nowPlayingEmbed = cmd.getEmbed(client, queue)
    queue.metadata.send(nowPlayingEmbed);
});

player.on('trackAdd', (queue, track) => {
    const embed = new MessageEmbed();

    embed.setColor('RED');
    embed.setThumbnail(track.thumbnail);
    embed.setAuthor(`ADDED TO QUEUE`, client.user.displayAvatarURL({ size: 1024, dynamic: true }));

    const methods = ['⛔', '🔂', '🔁'];

    const timestamp = queue.getPlayerTimestamp();
    const trackDuration = timestamp.progress == 'Infinity' ? 'infinity (live)' : track.duration;
    
    let position = queue.tracks.findIndex(x => x.id == track.id) + 1;
    if(queue.current.id == track.id){
        position = 'Now Playing'
    }

    embed.setDescription([
        `Title **[${track.title}](${track.url})**`,
        `Position **${position}**`,
        `Duration **${trackDuration}**`,
        `Loop mode **${methods[queue.repeatMode]}**`,
        `Requested by ${track.requestedBy}`,
    ].join('\n'));

    queue.metadata.send({ embeds: [embed]})
        .then((msg) => {
            setTimeout(function(){
                let new_position = queue.tracks.findIndex(x => x.id == track.id) + 1;
                if(queue.current.id == track.id){
                    new_position = 'Now Playing'
                }

                if(new_position != position){
                    embed.setDescription([
                        `Title **[${track.title}](${track.url})**`,
                        `Position **${new_position}**`,
                        `Duration **${trackDuration}**`,
                        `Loop mode **${methods[queue.repeatMode]}**`,
                        `Requested by ${track.requestedBy}`,
                    ].join('\n'));
                    msg.edit({ embeds: [embed]});
                }
              }, 100)
        });
});

player.on('botDisconnect', (queue) => {
    queue.metadata.send('I was manually disconnected from the voice channel, clearing queue... ❌');
});

player.on('channelEmpty', (queue) => {
    queue.metadata.send('Nobody is in the voice channel, leaving the voice channel... ❌');
});

player.on('queueEnd', (queue) => {
    queue.metadata.send('I finished reading the whole queue ✅');
});


client.on("guildCreate", guild => {
    console.log("Joined a new guild: " + guild.name);
    const cmd = client.commands.get('slash-deploy');
    
    cmd.deployCommands({ 
        id: guild.id, 
        name: guild.name 
    })
})
