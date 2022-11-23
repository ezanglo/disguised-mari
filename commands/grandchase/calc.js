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

		let list = ['ht'];

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
		}
  }
}