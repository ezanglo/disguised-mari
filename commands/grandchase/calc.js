const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("calc")
    .setDescription("Calculates Hero Training Levels")
    .addStringOption((option) =>
      option
        .setName("calc_type")
        .setDescription("Choose which kind of calculator")
        .setRequired(true)
				.setAutocomplete(true)
    )    
    .addStringOption((option) =>
      option
        .setName("start")
        .setDescription("Provide the start level")
        .setRequired(true)
  )
    .addStringOption((option) =>
      option
        .setName("end")
        .setDescription("Provide the end level")
        .setRequired(true)
    ),      
    async execute(interaction) {
			const contentType = interaction.options.get("calc_type").value;

			let list = ['ht', 'pets'];

			let selectedContent = list.filter((x) =>
					x.startsWith(contentType.toLowerCase())
			);
			
			if (selectedContent.length == 0) {
				return interaction.editReply({
					embeds: [
						new EmbedBuilder({
							color: 0xed4245,
							description: `Provide the type of calculator you want me to calculate!`,
						}),
					],
				});
			}
			if (contentType == 'ht') {
				const start = interaction.options.get("start").value;
				const end = interaction.options.get("end").value;

				if (isNaN(start) || isNaN(end) || start > end) return interaction.editReply({
					embeds: [
						new EmbedBuilder({
							color: 0xed4245,
							description: 'Please make sure you are doing it correctly!'
						}),
					],
				});

				let amount = 0;

				for (var x = start; x <= end; x++) {
					amount += x * 2;
					if (x == start && x !== 1) amount = 0;
				}

				let wizDays = Math.round(amount / 604);

				if (wizDays < 1) wizDays = 1;
				return interaction.editReply({
					embeds: [
						new EmbedBuilder({
							color: 0xed4245,
							title: `Level ${start} -> Level ${end}`,
							description: `Required BoV: ${amount.toLocaleString()}\nAmount of Days Required in Wizard Labyrinth Rank 6: ${wizDays.toLocaleString()} days`
						})
						.setFooter({
							text: `Hero Training Calculator`
						}),
					],
				});
			} else if (contentType == 'pets') {
				const start = interaction.options.get("start").value;
				const end = interaction.options.get("end").value;
				
				if (isNaN(start) || isNaN(end) || start > end) return interaction.editReply({
					embeds: [
						new EmbedBuilder({
							color: 0xed4245,
							description: 'Please make sure you are doing it correctly!'
						}),
					],
				});

				let amount = 0;
				let gold = 0;

				for (var x = start; x <= end; x++) {
					if (x == 0) amount = 0;
					if (x == 1) amount += 1;
					if (x == 2) {
						amount += 2;
						gold += 20000;
					}
					if (x >= 3 && x <= 4) {
						amount += x-1;
						if (x == 3) gold += 40000;
						if (x == 4) gold += 60000;
					}
					if (x >= 5 && x <= 6) {
						amount += x-2;
						if (x == 5) gold += 80000;
						if (x == 6) gold += 100000;
					}
					if (x >= 7 && x <= 8) {
						amount += x-3;
						if (x == 7) gold += 120000;
						if (x == 8) gold += 140000;
					}
					if (x >= 9 && x <= 10) {
						amount += x-4;
						if (x == 9) gold += 160000;
						if (x == 10) gold += 180000;
					}
					if (x >= 11 && x <= 12) {
						amount += x-5;
						if (x == 11) gold += 200000;
						if (x == 12) gold += 220000;
					}
					if (x >= 13 && x <= 14) {
						amount += x-6;
						if (x == 13) gold += 240000;
						if (x == 14) gold += 260000;
					}
					if (x >= 15 && x <= 16) {
						amount += x-7;
						if (x == 15) gold += 280000;
						if (x == 16) gold += 300000;
					}
					if (x >= 17 && x <= 18) {
						amount += x-8;
						if (x == 17) gold += 320000;
						if (x == 18) gold += 340000;
					}
					if (x >= 19 && x <= 20) {
						amount += x-9;
						if (x == 19) gold += 360000;
						if (x == 20) gold += 380000;
					}
					if (x >= 21 && x <= 40) {
						amount += x-10;
						if (x == 21) gold += 400000;
						if (x == 22) gold += 430000;
						if (x == 23) gold += 460000;
						if (x == 24) gold += 490000;
						if (x == 25) gold += 520000;
						if (x == 26) gold += 550000;
						if (x == 27) gold += 580000;
						if (x == 28) gold += 610000;
						if (x == 29) gold += 640000;
						if (x == 30) gold += 670000;
						if (x == 31) gold += 700000;
						if (x == 32) gold += 740000;
						if (x == 33) gold += 780000;
						if (x == 34) gold += 820000;
						if (x == 35) gold += 860000;
						if (x == 36) gold += 900000;
						if (x == 37) gold += 1000000;
						if (x == 38) gold += 1100000;
						if (x == 39) gold += 1200000;
						if (x == 40) gold += 1300000;
					}
					if (x >= 41 && x <= 46) {
						if (x == 41) {
							amount += x-9;
							gold += 1400000;
						}
						if (x == 42) {
							amount += x-8;
							gold += 1500000;
						}
						if (x == 43) {
							amount += x-7;
							gold += 1600000;
						}
						if (x == 44) {
							amount += x-6;
						 	gold += 1700000;
						}
						if (x == 45) {
							amount += x-5;
							gold += 1800000;
						}
						if (x == 46) {
							amount += x-3;
							gold += 1900000;
						}
					}
					if (x == 47) {
						amount += x-1;
						gold += 2000000;
					}
					if (x == 48) {
						amount += x+1;
						gold += 2150000;
					}
					if (x == 49) {
						amount += x+3;
						gold += 2300000;
					}
					if (x == 50) {
						amount += x+5;
						gold += 2450000;
					}
					if (x == 51) {
						amount += x+8;
						gold += 2600000;
					}
					if (x == 52) {
						amount += x+11;
						gold += 2750000;
					}
					if (x == 53) {
						amount += x+14;
						gold += 2900000;
					}
					if (x == 54) {
						amount += x+17;
						gold += 3050000;
					}
					if (x == 55) {
						amount += x+20;
						gold += 3200000;
					}
					if (x == 56) { 
						amount += x+24;
						gold += 3350000;
					}
					if (x == 57) {
						amount += x+28;
						gold += 3500000;
					}
					if (x == 58) {
						amount += x+32;
						gold += 3650000;
					}
					if (x == 59) {
						amount += x+36;
						gold += 3800000;
					}
					if (x == 60) {
						amount += x+40;
						gold += 3950000;
					}
					if (x == 61) {
						amount += x+54;
						gold += 4100000;
					}
					if (x == 62) {
						amount += x+68;
						gold += 4250000;
					}
					if (x == 63) {
						amount += x+82;
						gold += 4400000;
					}
					if (x == 64) {
						amount += x+96;
						gold += 4550000;
					}
					if (x == 65) {
						amount += x+115;
						gold += 4700000;
					}
					if (x == 66) {
						amount += x+119;
						gold += 4850000;
					}
					if (x == 67) {
						amount += x+123;
						gold += 5000000;
					}
					if (x == 68) {
						amount += x+127;
						gold += 5150000;
					}
					if (x == 69) {
						amount += x+131;
						gold += 5300000;
					}
					if (x == 70) {
						amount += x+140;
						gold += 5450000;
					}
				}

				return interaction.editReply({
					embeds: [
						new EmbedBuilder({
							color: 0xed4245,
							title: `Level ${start} -> Level ${end}`,
							description: `Pet Dupes Cost: ${amount.toLocaleString()}\nGold Cost: ${gold.toLocaleString()}`
						})
						.setFooter({
							text: `Pet Calculator`
						}),
					],
				});
			}
    }
}