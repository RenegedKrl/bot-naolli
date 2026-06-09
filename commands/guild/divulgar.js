const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'divulgar',
    aliases: ['anunciar', 'live'],
    async execute(message, args) {
        if (!message.member.permissions.has('ManageMessages')) {
            return message.reply('❌ Você precisa ter permissão para gerenciar mensagens para usar isso!');
        }

        const link = args.find(arg => arg.startsWith('http://') || arg.startsWith('https://'));
        if (!link) {
            return message.reply('⚠️ Você precisa colocar um link válido!\n👉 Exemplo: `n!divulgar Corre que a live começou! https://twitch.tv/seu_canal`');
        }

        // Pega todo o texto que não seja o link
        const text = args.filter(arg => arg !== link).join(' ') || '🚨 Novo conteúdo disponível! Clique no botão abaixo para conferir:';

        let platform = 'Link';
        let color = '#2F3136';
        let buttonLabel = 'Acessar Link';
        let image = null;

        if (link.includes('twitch.tv')) {
            platform = 'Twitch';
            color = '#9146FF';
            buttonLabel = 'Assistir Live na Twitch';
        } else if (link.includes('youtube.com') || link.includes('youtu.be')) {
            platform = 'YouTube';
            color = '#FF0000';
            buttonLabel = 'Assistir no YouTube';
        } else if (link.includes('tiktok.com')) {
            platform = 'TikTok';
            color = '#000000';
            buttonLabel = 'Ver no TikTok';
        } else if (link.includes('instagram.com')) {
            platform = 'Instagram';
            color = '#E1306C';
            buttonLabel = 'Ver no Instagram';
        }

        const embed = new EmbedBuilder()
            .setColor(color)
            .setAuthor({ name: `Anúncio de ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
            .setTitle(`📢 Novo conteúdo na área!`)
            .setDescription(`**${text}**`)
            .setFooter({ text: `Plataforma: ${platform}` });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel(buttonLabel)
                .setURL(link)
                .setStyle(ButtonStyle.Link)
        );

        message.delete().catch(() => {});
        message.channel.send({ content: '@everyone', embeds: [embed], components: [row] });
    }
};
