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

		let list = ['ht','pets'];

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

			function calcTotalHt(level) {
				level = ((parseInt(level) + 1) / 2) * (parseInt(level) * 2);
				return level;
			};

			const amount = calcTotalHt(end) - calcTotalHt(start);
			
			let wizDays = Math.round(amount / 604);

			if (wizDays < 1) wizDays = 1;
			return interaction.editReply({
				embeds: [
					new EmbedBuilder({
						color: 0xed4245,
						title: `Level ${start} -> Level ${end}`,
						description: `Required BoV: ${amount.toLocaleString()} <:bov:1044675273355968612>\nAmount of Days Required in Wizard Labyrinth Rank 6: ${wizDays.toLocaleString()} days (${wizDays.toLocaleString()} <:wizlab_tix:1044675274110939138>)`
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

			function calc(lvl) {
				let val = 1;

				for(let x = 1; x <= lvl; x++) {

					if(x <= 21 && x%2 == 0) { 
						val++;
					}
					else if(x > 21 && x <= 40) {
						val++
					}
					else if(x > 40 && x <= 45) {
						val = val+2;
					}
					else if(x > 45 && x <= 50) {
						val = val+3;
					}
					else if(x > 50 && x <= 55) {
						val = val+4;
					}
					else if(x > 55 && x <= 60) {
						val = val+5;
					}
					else if(x > 60 && x <= 64) {
						val = val+15;
					}
					else if(x == 65) {
						val = val+20;
					}
					else if(x > 65 && x <= 69) {
						val = val+5;
					}
					else if(x == 70) {
						val = val+10;
					}
				}
				return val;
			}
			
			let petAmount = 0;

			for (let x = start; x <= end; x++) {
				petAmount += calc(x);
			}

			function goldCalc(lvl) {
				let costOverall = 0;
				let goldCost = 20000;
				for (let x = 2; x <= lvl; x++) {

					if (x <= 21) {
						costOverall += goldCost;
						if (x !== 21) goldCost += 20000;
					} else if (x > 21 && x <= 31) {
						goldCost += 30000;
						costOverall += goldCost;
					} else if (x > 31 && x <= 36) {
						goldCost += 40000;
						costOverall += goldCost;
					} else if (x > 36 && x <= 47) {
						goldCost += 100000;
						costOverall += goldCost;		
					} else if (x > 47 && x <= 70) {
						goldCost += 150000;
						costOverall += goldCost;
					}
				}

				return costOverall; 
			}

			let goldAmount = goldCalc(parseInt(end)) - goldCalc(parseInt(start));

			return interaction.editReply({
				embeds: [
					new EmbedBuilder({
							color: 0xed4245,
							title: `Level ${start} -> Level ${end}`,
							description: `Pet Dupes Cost: ${petAmount.toLocaleString()}\nGold Cost: ${goldAmount.toLocaleString()}`
					})
					.setFooter({
							text: `Pet Calculator`
					}),
				],
			});
		}
  }
}