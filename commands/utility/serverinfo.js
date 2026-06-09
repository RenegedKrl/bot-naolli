const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'serverinfo',
    aliases: ['si', 'servidor'],
    description: 'Exibe informações detalhadas sobre o servidor.',
    async execute(message) {
        const guild = message.guild;
        await guild.members.fetch();

        const totalMembers = guild.memberCount;
        const bots = guild.members.cache.filter(m => m.user.bot).size;
        const humans = totalMembers - bots;
        const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
        const roles = guild.roles.cache.size - 1;
        const emojis = guild.emojis.cache.size;
        const boosts = guild.premiumSubscriptionCount;
        const boostLevel = guild.premiumTier;
        const owner = await guild.fetchOwner();

        const verificationLevels = ['Nenhum', 'Baixo', 'Médio', 'Alto', 'Muito Alto'];
        const verificationLevel = verificationLevels[guild.verificationLevel] || 'Desconhecido';

        const createdAt = Math.floor(guild.createdTimestamp / 1000);

        const embed = new EmbedBuilder()
            .setColor('#7289DA')
            .setTitle(`🏰 ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '👑 Dono', value: `${owner.user.tag}`, inline: true },
                { name: '🆔 ID', value: guild.id, inline: true },
                { name: '📅 Criado em', value: `<t:${createdAt}:D> (<t:${createdAt}:R>)`, inline: false },
                { name: '👥 Membros', value: `Total: **${totalMembers}** | Humanos: **${humans}** | Bots: **${bots}**`, inline: false },
                { name: '📢 Canais', value: `💬 Texto: **${textChannels}** | 🔊 Voz: **${voiceChannels}**`, inline: false },
                { name: '🏷️ Cargos', value: `**${roles}**`, inline: true },
                { name: '😄 Emojis', value: `**${emojis}**`, inline: true },
                { name: '🚀 Boosts', value: `**${boosts}** (Nível ${boostLevel})`, inline: true },
                { name: '🛡️ Verificação', value: verificationLevel, inline: true },
            )
            .setImage(guild.bannerURL({ size: 1024 }) || null)
            .setFooter({ text: `Naolli • Informações do Servidor` });

        message.reply({ embeds: [embed] });
    }
};
