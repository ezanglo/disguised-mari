const { readdirSync } = require("fs");
const { Collection, REST, Routes } = require("discord.js");

client.commands = new Collection();

const events = readdirSync("./events/").filter((file) => file.endsWith(".js"));

console.log(`Loading events...`);

for (const file of events) {
  const event = require(`../events/${file}`);
  console.log(`-> Loaded event ${file.split(".")[0]}`);
  client.on(file.split(".")[0], event.bind(null, client));
  delete require.cache[require.resolve(`../events/${file}`)];
}

console.log(`Refreshing data...`);
client.heroes = [];
api
  .get("Hero?limit=200&fields=Id,Code,DiscordEmote,HeroEquips,Traits")
  .then((response) => {
    if (response.status == 200) {
      client.heroes = response.data.list;
    }
    console.log(`Loaded Heroes: ${client.heroes.length}`);
  });

client.contentTypes = [];
api.get("ContentType?limit=200&fields=Id,Code").then((response) => {
  if (response.status == 200) {
    client.contentTypes = response.data.list;
  }
  console.log(`Loaded Content Types: ${client.contentTypes.length}`);
});

client.traitTypes = [];
api.get("TraitType?limit=200").then((response) => {
  if (response.status == 200) {
    client.traitTypes = response.data.list;
  }
  console.log(`Loaded Trait Types: ${client.traitTypes.length}`);
});

client.heroGearTypes = [];
api
  .get(
    "HeroGearType?limit=200&fields=Id,Name,Code,EquipTypeRead,HeroClassRead,Image,UpdatedAt,DiscordEmote"
  )
  .then((response) => {
    if (response.status == 200) {
      client.heroGearTypes = response.data.list;
    }
    console.log(`Loaded Hero Gear Types: ${client.heroGearTypes.length}`);
  });

client.EquipConfig = [];
api
  .get("EquipConfig?limit=200&fields=Id,Code,EquipTypeRead,Config,UpdatedAt")
  .then((response) => {
    if (response.status == 200) {
      client.EquipConfig = response.data.list;
    }
    console.log(`Loaded Equip Configs: ${client.EquipConfig.length}`);
  });

client.ContentLineups = [];
api
  .get(
    "ContentLineup?limit=200&fields=Id,Code,ContentTypeRead,ContentPhaseRead,UpdatedAt"
  )
  .then((response) => {
    if (response.status == 200) {
      client.ContentLineups = response.data.list;
    }
    console.log(`Loaded Content Lineups: ${client.ContentLineups.length}`);
  });

console.log(`Loading commands...`);

readdirSync("./commands/").forEach((dirs) => {
  const commands = readdirSync(`./commands/${dirs}`).filter((files) =>
    files.endsWith(".js")
  );

  for (const file of commands) {
    const command = require(`../commands/${dirs}/${file}`);

    if (command.data) {
      client.commands.set(command.data.name.toLowerCase(), command);
      console.log(`-> Loaded command /${command.data.name.toLowerCase()}`);
    }

    delete require.cache[require.resolve(`../commands/${dirs}/${file}`)];
  }
});

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log(
      `Started refreshing ${client.commands.size} application (/) commands.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: client.commands.map((command) => command.data.toJSON()) }
    );

    console.log(
      client.commands.map((command) => `[${command.data.name}]`).join(",")
    );
    console.log(
      `Successfully reloaded ${data.length} application (/) commands.\n`
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
