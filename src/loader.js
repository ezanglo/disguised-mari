const { readdirSync } = require('fs');
const { Collection } = require('discord.js');

client.commands = new Collection();

const events = readdirSync('./events/').filter(file => file.endsWith('.js'));

console.log(`Loading events...`);

for (const file of events) {
    const event = require(`../events/${file}`);
    console.log(`-> Loaded event ${file.split('.')[0]}`);
    client.on(file.split('.')[0], event.bind(null, client));
    delete require.cache[require.resolve(`../events/${file}`)];
}

console.log(`Loading commands...`);

// readdirSync('./commands/guide-chase').forEach(file => {
//     if(file.endsWith('.js')){
//         const command = require(`../commands/guide-chase/${file}`);
//         console.log(`-> Loaded command ${command.name.toLowerCase()}`);
//         client.commands.set(command.name.toLowerCase(), command);
//         delete require.cache[require.resolve(`../commands/guide-chase/${file}`)];
//     }
// });

client.heroes = [];
api.get('Hero?limit=100&fields=Id,Code').then((response) => {
    if(response.status == 200){
        client.heroes = response.data.list
        // client.heroes.forEach(hero => {
        //     console.log(`-> Loaded command ${hero.Code.toLowerCase()}`);
        //     client.commands.set(hero.Code.toLowerCase(), require(`../commands/guide-chase/hero`))
        // });
    }
});

client.contentTypes = [];
api.get('ContentType?limit=100&fields=Id,Code').then((response) => {
    if(response.status == 200){
        client.contentTypes = response.data.list
    }
})

client.traitTypes = [];
api.get('TraitType?limit=100').then((response) => {
    if(response.status == 200){
        client.traitTypes = response.data.list
    }
})

client.heroGearTypes = [];
api.get('HeroGearType?limit=100&fields=Id,Name,Code,EquipTypeRead,HeroClassRead,Image,UpdatedAt').then((response) => {
    if(response.status == 200){
        client.heroGearTypes = response.data.list
    }
})

client.EquipConfig = [];
api.get('EquipConfig?limit=100&fields=Id,Code,EquipTypeRead,Config,UpdatedAt').then((response) => {
    if(response.status == 200){
        client.EquipConfig = response.data.list
    }
})

readdirSync('./commands/guide-chase').forEach(file => {
    if(file.endsWith('.js')){
        const command = require(`../commands/guide-chase/${file}`);
        console.log(`-> Loaded command ${command.name.toLowerCase()}`);
        client.commands.set(command.name.toLowerCase(), command);
        delete require.cache[require.resolve(`../commands/guide-chase/${file}`)];
    }
});

// readdirSync('./commands/music').forEach(file => {
//     if(file.endsWith('.js')){
//         const command = require(`../commands/music/${file}`);
//         console.log(`-> Loaded command ${command.name.toLowerCase()}`);
//         client.commands.set(command.name.toLowerCase(), command);
//         delete require.cache[require.resolve(`../commands/music/${file}`)];
//     }
// });

// readdirSync('./commands/').forEach(dirs => {
//     const commands = readdirSync(`./commands/${dirs}`).filter(files => files.endsWith('.js'));

//     for (const file of commands) {
//         const command = require(`../commands/${dirs}/${file}`);
//         console.log(`-> Loaded command ${command.name.toLowerCase()}`);
//         client.commands.set(command.name.toLowerCase(), command);
//         delete require.cache[require.resolve(`../commands/${dirs}/${file}`)];
//     }
// });