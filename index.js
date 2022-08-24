/* eslint-disable no-case-declarations */
/* eslint-disable indent */
// Require the necessary discord.js classes
const { Client, Intents, MessageEmbed } = require('discord.js');
const { token, firebase } = require('./config.json');

const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.cert(firebase),
});

const db = admin.firestore();

// Create a new client instance
const client = new Client({ intents: [
    Intents.FLAGS.GUILDS, 
    Intents.FLAGS.GUILD_MEMBERS, 
    Intents.FLAGS.GUILD_MESSAGES
] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});

client.on('interactionCreate', async interaction => {

	if (!interaction.isCommand()) return;

	const { commandName } = interaction;

    if (commandName === 'mute') {
        const role = interaction.guild.roles.cache.find(r => r.name === 'Mute');
        const member = interaction.options.getMember('target');
        member.roles.add(role);

        const seconds = interaction.options.getInteger('seconds');
        setTimeout(function() {
            member.roles.remove(role);
        }, seconds * 1000);

		await interaction.reply(`User <@${member.user.id}> has been muted for ${seconds} seconds`);
	}
    if (commandName === 'gibaway') {
        const roleName = interaction.options.getString('command');
        switch(roleName){
            case 'Soul Taker':
            case 'Magic Mallet':
            case 'Maverick':
            case 'gibaway':
            case 'Grimoire':
                await interaction.guild.members.fetch();
                const gibawayRole = interaction.guild.roles.cache.find(x => x.name === 'gibaway');

                let users = interaction.guild.roles.cache.find(r => r.name === roleName).members.map(m => {
                    const avatar_url = m.user.displayAvatarURL()
                    return {
                        id: m.user.id,
                        username: m.user.username,
                        discriminator: m.user.discriminator,
                        avatar: m.user.avatar,
                        tag: m.user.tag,
                        nickname: (m.nickname) ? m.nickname: m.user.username,
                        avatar_url: avatar_url,
                        gibaway: m._roles.includes(gibawayRole.id)
                    }
                });

                users = users.filter(user => user.gibaway);

                await clearCollection('gibaway');
                await setCollection('gibaway', users)
                await interaction.reply(`${users.length} user(s) eligeble for gibaway (ROLE: ${roleName})`);
            break;
        }
    }

    if(commandName === 'patchtime'){
        
        const city = interaction.options.getString('city');
        const server = interaction.options.getString('server');
        const continents = [
            'Africa', 'America', 'Antartica', 'Asia', 'Atlantic',
            'Australia', 'Europe', 'Indian', 'Pacific', 'Etc'
        ]
        const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

        let serverTime = '4/5/2022, 00:00 AM'
        let time_zone = 'Asia/Tokyo'
        if(server.toLowerCase() == 'asia'){
            serverTime = '4/5/2022, 00:00 AM'
        }
        else if(server.toLowerCase() == 'kr'){
            serverTime = '4/4/2022, 11:30 PM'
            time_zone = 'Asia/Seoul'
        }
        let patch_time = new Date(serverTime).toLocaleString("en-US", { 
            dateStyle: 'full',
            timeStyle: 'full',
            timeZone: time_zone
        });

        const serverTimeZone = time_zone;
        const serverPatchTime = patch_time;
        continents.every(continent => {
            try {
                patch_time = new Date(serverTime).toLocaleString("en-US", {
                    dateStyle: 'full',
                    timeStyle: 'full',
                    timeZone: `${continent}/${capitalize(city)}`
                });
                time_zone = `${continent}/${capitalize(city)}`
                if(patch_time){
                    return false;
                }
            }
            catch{
                return true;
            }
            return true;
        })

        const hoursRemaining = date_diff(serverTime, 'hour')

        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Grand Chase Patch Time Zone')
            .setThumbnail('https://cdn.discordapp.com/avatars/958152345718513696/f55f2f943482e928f95542f886843b77.png')
            .setDescription('Timezones: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones')
            .addField(`GCDC Server`,`${capitalize(server)}`, true)
            .addField(`Timezone`,`${time_zone}`, true)
            .addField(`Remaining Hours`,`${hoursRemaining}`, true)
            .addField(`SERVER TIMEZONE`,`${serverPatchTime}`)
            .addField(`YOUR TIMEZONE`,`${patch_time}`)
            .setTimestamp()
        await interaction.reply({ embeds: [embed] });
    }
});

client.on('messageCreate', message => {

    if (message.content.toLowerCase().includes("kontol")) {
        message.reply('https://tenor.com/view/awokawok-gif-22311624');
    }

    if (message.content.toLowerCase().includes("memek")) {
        message.reply('http://gifimgs.com/res/0422/625898344d50a738966040.gif');
    }

    if (message.content.toLowerCase().includes("aax")) {
        message.reply(`<@469002475769167872>`);
    }

    if (message.content.toLowerCase().startsWith("im ")) {
        const content = message.content.split(" ");
        if(content.length > 1 && content.length <= 3){
            content.shift();
            message.reply(`Hi ${content.join(' ')}, I'm Disguised Mari`);
        }
    }

    if (message.content.toLowerCase().startsWith(".ud")) {
        const content = message.content.split(" ");
        if(content.length > 1 && content.length <= 3){
            content.shift();
            setTimeout(function(){
                message.reply(`mama mo ${content.join(' ')}`);
            }, 3000)
        }
    }

    if(message.author.id == 172002275412279296){
        message.reply(`Shut up dumb bitch`);
    }

});

async function getCollection(collectionName)
{
    const collection = await db.collection(collectionName).get()
    const collectionData = collection.docs.map(doc => {
        return {
            ...doc.data(),
            id: doc.id
        }
    })
    return collectionData.reduce(function(a,b){
        a[b.id] = b
        return a;
     },{})
}

async function getDocument(collectionName, id)
{
    const document = await db.collection(collectionName).get(id)
    return document.data();
}

function clearCollection(collectionName){
    const batch = db.batch()
    return db.collection(collectionName).get()
    .then(collection => {
        collection.docs.forEach(doc => {
            batch.delete(doc.ref)
        })
        batch.commit()
    })
}

function setCollection(collectionName, items){
    const batch = db.batch()
    items.forEach(item => {
        const newCollectionRef = db.collection(collectionName).doc();
        batch.set(newCollectionRef, item)
    })
    return batch.commit()
}

function date_diff(d1)
{
    let diffTime = Math.abs(new Date().valueOf() - new Date(d1).valueOf());
    let days = diffTime / (24*60*60*1000);
    let hours = (days % 1) * 24;
    let minutes = (hours % 1) * 60;
    let secs = (minutes % 1) * 60;
    [days, hours, minutes, secs] = [Math.floor(days), Math.floor(hours), Math.floor(minutes), Math.floor(secs)]

    return `${days}d ${hours}h ${minutes}m ${secs}s`
    // var date1 = new Date(d1)
    // var date2 = new Date()
    // var Difference_In_Time = date1.getTime() - date2.getTime();
    // switch (get_item) {
    //     case 'month':
    //         return Math.round(Difference_In_Time / (1000 * 3600 * 24 * 30));
    //     case 'day':
    //         return Math.round(Difference_In_Time / (1000 * 3600 * 24));
    //     case 'hour':
    //         return Math.round(Difference_In_Time / (1000 * 3600));
    //     case 'minute':
    //         return Math.round(Difference_In_Time / (1000 * 60));
    //     case 'second':
    //         return Math.round(Difference_In_Time / 1000);    
    //     default:
    //         break;
    // }
}

// Login to Discord with your client's token
client.login(process.env.BOT_TOKEN);