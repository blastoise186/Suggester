const { suggestionEditCommandCheck } = require("../../utils/checks");
const { editFeedMessage } = require("../../utils/actions");
const { serverLog } = require("../../utils/logs");
const { dbModify } = require("../../utils/db");
const { string } = require("../../utils/strings");
const { logEmbed } = require("../../utils/misc");
module.exports = {
	controls: {
		name: "removeattachment",
		permission: 3,
		aliases: ["rmattachment", "rmattach", "delattachment", "deleteattachment"],
		usage: "removeattachment <suggestion id>",
		description: "Removes a file from a suggestion",
		enabled: true,
		docs: "staff/removeattachment",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "USE_EXTERNAL_EMOJIS"],
		cooldown: 10
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB, qSuggestionDB, id] = await suggestionEditCommandCheck(locale, message, args);
		if (returned) return message.channel.send(returned);
		let guildLocale = qServerDB.config.locale;

		if (!qSuggestionDB.attachment) return message.channel.send(string(locale, "NO_ATTACHMENT_REMOVE_ERROR", {}, "error"));
		let oldAttachment = qSuggestionDB.attachment;
		qSuggestionDB.attachment = null;
		let editFeed = await editFeedMessage({ guild: guildLocale, user: locale }, qSuggestionDB, qServerDB, client);
		if (editFeed) return message.channel.send(editFeed);

		await dbModify("Suggestion", { suggestionId: id, id: message.guild.id }, qSuggestionDB);

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle(string(locale, "ATTACHMENT_REMOVED_TITLE"))
			.setDescription(oldAttachment)
			.setImage(oldAttachment)
			.setColor(client.colors.orange)
			.setFooter(string(locale, "SUGGESTION_FOOTER", { id: id.toString() }))
			.setTimestamp(qSuggestionDB.submitted);
		message.channel.send(replyEmbed);

		if (qServerDB.config.channels.log) {
			let embedLog = logEmbed(guildLocale, qSuggestionDB, message.author, "ATTACH_REMOVE_LOG", "orange")
				.addField(string(guildLocale, "ATTACHMENT_REMOVED_TITLE"), oldAttachment)
				.setImage(oldAttachment);

			serverLog(embedLog, qServerDB, client);
		}
	}
};
