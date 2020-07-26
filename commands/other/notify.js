const { dbQuery, dbModify } = require("../../utils/db");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "notify",
		permission: 10,
		aliases: ["notifications"],
		usage: "notify <on|off|toggle>",
		description: "Changes your notification settings",
		enabled: true,
		docs: "all/notify",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5,
		dmAvailable: true
	},
	do: async (locale, message, client, args) => {
		let qUserDB = await dbQuery("User", { id: message.author.id });
		if (!args[0]) return message.channel.send(string(locale, qUserDB.notify ? "NOTIFICATIONS_ENABLED" : "NOTIFICATIONS_DISABLED"));
		switch (args[0].toLowerCase()) {
		case "enable":
		case "on":
		case "true":
		case "yes": {
			if (qUserDB.notify) return message.channel.send(string(locale, "NOTIFICATIONS_ALREADY_ENABLED", {}, "error"));
			qUserDB.notify = true;
			await dbModify("User", {id: qUserDB.id}, qUserDB);
			return message.channel.send(string(locale, "NOTIFICATIONS_ENABLED", {}, "success"));
		}
		case "disable":
		case "off":
		case "false":
		case "no": {
			if (!qUserDB.notify) return message.channel.send(string(locale, "NOTIFICATIONS_ALREADY_DISABLED", {}, "error"));
			qUserDB.notify = false;
			await dbModify("User", {id: qUserDB.id}, qUserDB);
			return message.channel.send(string(locale, "NOTIFICATIONS_DISABLED", {}, "success"));
		}
		case "toggle":
		case "switch": {
			qUserDB.notify = !qUserDB.notify;
			await dbModify("User", {id: qUserDB.id}, qUserDB);
			return message.channel.send(string(locale, qUserDB.notify ? "NOTIFICATIONS_ENABLED" : "NOTIFICATIONS_DISABLED", {}, "success"));
		}
		default:
			return message.channel.send(string(locale, "ON_OFF_TOGGLE_ERROR", {}, "error"));
		}
	}
};
