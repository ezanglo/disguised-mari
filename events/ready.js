module.exports = async (client) => {
    console.log(`Logged to the client ${client.user.username}\n-> Ready on ${client.guilds.cache.size} servers for a total of ${client.users.cache.size} users`);
    const Guilds = client.guilds.cache.map(guild => guild.name)
    console.log(Guilds);

    client.user.setActivity(client.config.app.playing);
};