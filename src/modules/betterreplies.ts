import { Client, Message, TextChannel } from "discord.js";
import { get } from "../utils/database";
import { Database } from "sqlite3";

export async function betterReplies(client: Client, message: Message, db: Database) {
	if (message.channel.type !== "GUILD_TEXT") return;
	if (!message.reference) return;
	if (message.mentions.users.size > 0) return;
	if (!message.guild?.me?.permissions.has("MANAGE_WEBHOOKS") || !message.guild?.me?.permissionsIn(message.channel).has("MANAGE_WEBHOOKS")) return;

	console.log();

	const settings: { replies: number } = (await get(db, "SELECT replies FROM configuration WHERE uid = ?", [message.mentions.repliedUser!.id])) as any;

	if (!settings) return;
	if (settings.replies === 0) return;

	try {
		await message.delete();
		const postChannel: TextChannel = message.channel as TextChannel;
		const webhooks = await postChannel.fetchWebhooks();
		let webhook = webhooks.first();

		if (!webhook)
			webhook = await message.channel.createWebhook("Zeta", {
				avatar: "https://cdn.discordapp.com/avatars/897441411211866113/d639e559c4d58eb49a6c5ff1581a3d54.png?size=4096",
			});

		await webhook.send({
			content: `Replied to <@${message.mentions.repliedUser!.id}> from [here](https://discord.com/channels/${message.reference.guildId}/${
				message.reference.channelId
			}/${message.reference.messageId})\n${message.content}`,
			files: message.attachments.map(attachment => attachment.proxyURL),
			components: message.components,
			embeds: message.embeds,
			username: message.member?.nickname ? `${message.member?.nickname} (${message.author.tag})` : message.author.tag,
			avatarURL:
				message.author.avatarURL({ dynamic: true }) || `https://cdn.discordapp.com/embed/avatars/${Number(message.author.discriminator) % 5}.png`,
		});
	} catch (error) {
		console.error(`[ERROR - Better Replies] ${error}`);
	}
}
