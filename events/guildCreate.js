module.exports = async (client, guild) => {
    console.log("Joined a new guild: " + guild.name);
    const cmd = client.commands.get('slash-deploy');
    
    cmd.deployCommands({ 
        id: guild.id, 
        name: guild.name 
    })
};