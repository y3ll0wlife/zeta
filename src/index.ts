import { Client, Intents, Interaction, Message } from "discord.js";
import sqlite3 from "sqlite3";
import { config } from "dotenv";
import { get } from "./utils/database";

import { betterMessageLinks } from "./modules/bettermessagelinks";
import { betterReplies } from "./modules/betterreplies";

config({ path: `${__dirname}/../src/.env` });

const db = new sqlite3.Database("./src/db.db");

//db.run("DROP TABLE IF EXISTS configuration");

db.serialize(() => {
	db.run("CREATE TABLE if not exists configuration (id INTEGER PRIMARY KEY AUTOINCREMENT, uid TEXT, replies BOOLEAN)");
	console.log("[DATABASE] Database is up and running");
});

const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
	allowedMentions: {
		parse: [],
		repliedUser: false,
		roles: [],
		users: [],
	},
});

client.on("ready", () => {
	console.log(`[CLIENT] Logged in as ${client.user?.tag} (${client.user?.id})`);
	client.user?.setPresence({
		status: "online",
		activities: [
			{
				name: `over ${client.guilds.cache.size} servers`,
				type: "WATCHING",
			},
		],
	});
});

client.on("messageCreate", async (message: Message) => {
	if (message.author.bot) return;

	await betterMessageLinks(client, message);
	await betterReplies(client, message, db);
});

client.on("interactionCreate", async (interaction: Interaction) => {
	if (!interaction.isCommand()) return;

	if (interaction.commandName === "configure") {
		if (!(await get(db, "SELECT id FROM configuration WHERE uid = ?", [interaction.user.id])))
			db.run("INSERT INTO configuration(uid, replies) VALUES (?, ?)", [interaction.user.id, 0]);

		for (let i = 0; i < interaction.options.data.length; i++) {
			const setting = interaction.options.data[i];

			switch (setting.name.toLowerCase()) {
				case "always_ping_in_reply":
					db.run("UPDATE configuration SET replies = ? WHERE uid = ?", [setting.value ? 1 : 0, interaction.user.id]);
					break;
				default:
					break;
			}
		}
	}

	await interaction.reply({
		ephemeral: true,
		content: `Successfully updated your settings`,
	});
});

client.login(process.env.TOKEN);

process.on("unhandledRejection", (err: Error) => console.error(err));
process.on("uncaughtException", (err: Error) => console.error(err));
