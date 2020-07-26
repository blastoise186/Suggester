const { dbQuery } = require("../../utils/db");
const { prefix, support_invite } = require("../../config.json");
const { string } = require("../../utils/strings");

module.exports = {
	controls: {
		name: "tutorial",
		permission: 10,
		usage: "tutorial",
		description: "Shows information about setting up the bot and using it",
		enabled: true,
		docs: "all/tutorial",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 10
	},
	do: async (locale, message, client, args, Discord) => {
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		let serverPrefix = (qServerDB && qServerDB.config && qServerDB.config.prefix) || prefix;

		let embed = new Discord.MessageEmbed()
			.setAuthor(string(locale, "TUTORIAL_HEADER"), client.user.displayAvatarURL({format: "png"}))
			.setColor(client.colors.default)
			.setDescription(string(locale, "TUTORIAL_DESC", { prefix: prefix }))
			.addField(string(locale, "TUTORIAL_GET_STARTED_HEADER"), string(locale, "TUTORIAL_GET_STARTED_DESCRIPTION", { prefix: serverPrefix }))
			.addField(string(locale, "TUTORIAL_NEXT_HEADER"), string(locale, "TUTORIAL_NEXT_DESCRIPTION", { prefix: serverPrefix, invite: `https://discord.gg/${support_invite}` }));
		return message.channel.send(embed);
	}
};
