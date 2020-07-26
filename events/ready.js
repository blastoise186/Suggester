const { coreLog } = require("../utils/logs");
const { Suggestion } = require("../utils/schemas");
const { release, lists } = require("../config.json");
const blapi = require("blapi");
const chalk = require("chalk");

module.exports = async (Discord, client) => {
	const team = await client.fetchTeam()
		.catch(() => console.log(chalk`{red [{bold ERROR}] Error fetching team members.}`));

	for (const admin of team) {
		client.admins.add(admin.id);
		console.log(chalk`{blue [{bold INFO}] Found {bold ${admin.tag}}}`);
	}

	coreLog(`🆗 Logged in with ${client.guilds.cache.size} servers! (Shard: ${client.shard.ids[0]})`, client);
	console.log(chalk`{green [{bold INFO}] Logged in as {bold ${client.user.tag}}! (Release: {bold ${release}, Shard: ${client.shard.ids[0]})}}`);

	async function getGuildCount() {
		const guildCounts = await client.shard.fetchClientValues("guilds.cache.size"); // ['1006', '966']
		const totalGuildCount = guildCounts.reduce((total, current) => total + current, 0); // 1972
		return [guildCounts, totalGuildCount];
	}

	let presences = [
		["PLAYING", `See the latest updates by using "@${client.user.username} changelog"`],
		["WATCHING", `${(await Suggestion.countDocuments())} suggestions`],
		["PLAYING", "suggester.js.org"],
		["PLAYING", `Vote for Suggester and get rewards! Use "@${client.user.username} vote" for more info`],
		["PLAYING", `Join our support server! Use "@${client.user.username}" support for more info`]
	];

	let p = 0;
	function setPresence() {
		let presence = presences[p];
		client.user.setActivity(`${presence[1]} • @${client.user.username} help`, { type: presence[0] });
		p = p+1 === presences.length ? 0 : p+1;
	}
	setPresence();
	setInterval(function() {
		setPresence();
	}, 600000); //Change presence every 10 minutes

	//Post to bot lists
	async function post() {
		let [guildCounts, totalGuildCount] = await getGuildCount();

		blapi.manualPost(totalGuildCount, client.user.id, lists, null, guildCounts.length, guildCounts);
	}

	if (client.user.id === "564426594144354315" && client.shard.ids[0] === client.shard.count-1 && process.env.NODE_ENV === "production" && lists) {
		await post();
		setInterval(async function() {
			await post();
		}, 1800000);
	}
};
