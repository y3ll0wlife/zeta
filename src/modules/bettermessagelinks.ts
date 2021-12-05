import { Message, Client, TextChannel } from "discord.js";

const MESSAGE_LINK_REGEX: RegExp = /(?:https?:\/\/)?(?:www\.)?(?:canary\.|ptb\.)?discord.com\/channels\/[0-9]{17,20}\/[0-9]{17,20}\/[0-9]{17,20}/gi;

export async function betterMessageLinks(client: Client, message: Message) {
	if (message.channel.type !== "GUILD_TEXT") return;
	const messageLinkMatch = message.content.match(MESSAGE_LINK_REGEX);
	if (messageLinkMatch) {
		// @ts-ignore
		if (!message.guild?.me?.permissions.has("MANAGE_WEBHOOKS") || !message.guild?.me?.permissionsIn(message.channel).has("MANAGE_WEBHOOKS")) return;

		try {
			const messageLinkSplit = messageLinkMatch[0].split("/");
			const guildId: string = messageLinkSplit[4];
			const channelId: string = messageLinkSplit[5];
			const messageId: string = messageLinkSplit[6];

			if (!guildId || !channelId || !messageId) return;

			const guild = client.guilds.cache.get(guildId);
			if (!guild) return;
			const channel = guild?.channels.cache.get(channelId) as TextChannel;
			if (!channel) return;
			const fetchedMessage = await channel?.messages.fetch(messageId);
			if (!fetchedMessage) return;

			const postChannel: TextChannel = message.channel as TextChannel;
			const webhooks = await postChannel.fetchWebhooks();
			let webhook = webhooks.first();

			if (!webhook)
				webhook = await channel.createWebhook("Zeta", {
					avatar: "https://cdn.discordapp.com/avatars/897441411211866113/d639e559c4d58eb49a6c5ff1581a3d54.png?size=4096",
				});

			await webhook.send({
				content: fetchedMessage.content || "᲼",
				files: fetchedMessage.attachments.map(attachment => attachment.proxyURL),
				components: fetchedMessage.components,
				embeds: fetchedMessage.embeds,
				username: fetchedMessage.member?.nickname ? `${fetchedMessage.member?.nickname} (${fetchedMessage.author.tag})` : fetchedMessage.author.tag,
				avatarURL: fetchedMessage.author.avatarURL({ dynamic: true })!,
			});
		} catch (error) {
			console.error(`[ERROR - Better Message Links] ${error}`);
		}
	}
}
