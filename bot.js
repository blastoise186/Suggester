require("dotenv").config();

const Discord = require("discord.js");
const Client = require("./utils/Client");
const chalk = require("chalk");
const { errorLog } = require("./utils/logs");
const { fileLoader } = require("./utils/misc.js");
const { connect, connection } = require("mongoose");
const autoIncrement = require("mongoose-sequence");
const { basename } = require("path");
const fs = require("fs");
if (process.env.SENTRY_DSN) {
	const {init} = require("@sentry/node");
	if (process.env.NODE_ENV === "production") init({dsn: process.env.SENTRY_DSN});
}

const intents = new Discord.Intents(["GUILDS", "GUILD_EMOJIS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "DIRECT_MESSAGES"]);

const client = new Client({
	ws: { intents: intents },
	disableMentions: "everyone",
	messageCacheLifetime: 120,
	messageSweepInterval: 300,
	partials: ["MESSAGE", "REACTION", "USER"]
});

if (!process.env.TOKEN) return console.log(chalk`{yellowBright [{bold MISSING}] Missing {bold process.env.TOKEN}}\n{red {bold Shutting Down}}`);
if (!process.env.MONGO) return console.log(chalk`{yellowBright [{bold MISSING}] Missing {bold process.env.MONGO}}\n{red {bold Shutting Down}}`);


connect(process.env.MONGO, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false
})
	.catch((err) => {
		console.log(chalk`{red [{bold DATABASE}] Connection error: ${err.stack}}`);
	});

autoIncrement(connection);

connection.on("open", () => {
	console.log(chalk`{gray [{bold DATABASE}] {bold Connected} to {bold MongoDB}!}`);
});

connection.on("error", (err) => {
	console.log(chalk`{red [{bold DATABASE}] Error: ${err.stack}}`);
});

(async () => {
	let eventFiles = await fileLoader("events");
	let events = [];
	for await (let file of eventFiles) {
		const exclude = [];
		if (exclude.includes(basename(file))) {
			console.log("Skipping excluded file:", file);
			continue;
		}
		if (!file.endsWith(".js")) continue;

		let event = require(file);
		let eventName = basename(file).split(".")[0];

		client.on(eventName, (...args) => {
			try {
				event(Discord, client, ...args);
			}
			catch (err) {
				errorLog(err, "Event Handler", `Event: ${eventName}`);
			}
		});
		events.push(eventName);
		//console.log(chalk`{yellow [{bold EVENT}] Loaded {bold ${eventName}}}`);
	}
	console.log(chalk`{yellow [{bold EVENT}] Loaded {bold ${events.length} events}}`);

	let commandFiles = await fileLoader("commands");
	for await (let file of commandFiles) {
		if (!file.endsWith(".js")) return;

		let command = require(file);
		let commandName = basename(file).split(".")[0];

		client.commands.set(commandName, command);
		//console.log(chalk`{magenta [{bold COMMAND}] Loaded {bold ${command.controls.name}} ${file}}`);
	}
	console.log(chalk`{magenta [{bold COMMAND}] Loaded {bold ${client.commands.size} commands}}`);

	fs.access("i18n", async function(error) {
		if (error) console.log("Locales folder missing, please run `locales pull`");
		else {
			fs.readdir("i18n", (err, files) => {
				files.forEach(file => {
					if (!file.endsWith(".json")) return;
					const localeCode = file.split(".")[0]; //Command to check against
					const locale = require("./i18n/" + localeCode); //Command file
					client.locales.set(localeCode, locale);
				});
			});
		}
	});
})();

client.login(process.env.TOKEN)
	.catch((err) => console.log(chalk`{cyan [{bold DISCORD}] Error logging in: ${err.stack}}`));

client.on("error", (err) => {
	errorLog(err, "error", "something happened and idk what");
});
client.on("warn", (warning) => {
	console.warn(warning);
});
process.on("unhandledRejection", (err) => { // this catches unhandledPromiserejectionWarning and other unhandled rejections
	errorLog(err, "unhandledRejection", "oof something is broken x.x");
});

/**
 * Define the chunk method in the prototype of an array
 * that returns an array with arrays of the given size.
 *
 * @param chunkSize {Integer} Size of every group
 */
Object.defineProperty(Array.prototype, "chunk", {
	value: function(chunkSize){
		let temporal = [];
		for (let i = 0; i < this.length; i+= chunkSize){
			temporal.push(this.slice(i,i+chunkSize));
		}
		return temporal;
	}
});
