const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'userinfo',
    aliases: ['ui', 'whois'],
    description: 'Mostra informações detalhadas de um usuário.',
    async execute(message, args) {
        const target = message.mentions.members.first() || message.member;
        const user = target.user;

        const guildId = message.guild.id;
        const userId = user.id;

        // Pega dados dos nossos sistemas
        const [levelData, kakeraConfig, rpgData, gachaConfig, repData] = await Promise.all([
            getData('levelData.json'),
            getData('kakeraConfig.json'),
            getData('rpgData.json'),
            getData('gachaConfig.json'),
            getData('repData.json')
        ]);

        const level = levelData?.[guildId]?.[userId];
        const kakera = kakeraConfig?.[guildId]?.[userId]?.balance || 0;
        const rpg = rpgData?.[guildId]?.[userId];
        const rep = repData?.[guildId]?.[userId]?.total || 0;

        // Conta personagens no harem
        let haremCount = 0;
        if (gachaConfig?.[guildId]) {
            haremCount = Object.values(gachaConfig[guildId]).filter(c => c.ownerId === userId).length;
        }

        const roles = target.roles.cache
            .filter(r => r.id !== message.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(r => r.toString())
            .slice(0, 5);

        const joinedAt = Math.floor(target.joinedTimestamp / 1000);
        const createdAt = Math.floor(user.createdTimestamp / 1000);
        const isOwner = message.guild.ownerId === userId;

        const badges = [];
        if (isOwner) badges.push('👑 Dono do Servidor');
        if (user.bot) badges.push('🤖 Bot');
        if (target.permissions.has('Administrator')) badges.push('⚙️ Admin');
        if (target.premiumSince) badges.push('🚀 Booster');

        const embed = new EmbedBuilder()
            .setColor(target.displayHexColor || '#7289DA')
            .setTitle(`👤 ${user.username}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '🆔 ID', value: `\`${user.id}\``, inline: true },
                { name: '🏷️ Apelido', value: target.nickname || '*Nenhum*', inline: true },
                { name: '🎖️ Badges', value: badges.length ? badges.join(' | ') : '*Nenhuma*', inline: false },
                { name: '📅 Conta Criada', value: `<t:${createdAt}:D> (<t:${createdAt}:R>)`, inline: false },
                { name: '📥 Entrou no Servidor', value: `<t:${joinedAt}:D> (<t:${joinedAt}:R>)`, inline: false },
                { name: `🏷️ Cargos (${target.roles.cache.size - 1})`, value: roles.length ? roles.join(', ') + (target.roles.cache.size - 1 > 5 ? `...` : '') : '*Nenhum*', inline: false },
                { name: '━━━━━ Estatísticas Naolli ━━━━━', value: '\u200b', inline: false },
                { name: '💎 Kakeras', value: `${kakera.toLocaleString()} K`, inline: true },
                { name: '⭐ Reputação', value: `${rep} pts`, inline: true },
                { name: '📈 Nível (Chat)', value: level ? `Nível ${level.level}` : '*Sem dados*', inline: true },
                { name: '⚔️ Nível RPG', value: rpg ? `Nível ${rpg.level}` : '*Sem dados*', inline: true },
                { name: '💖 Personagens', value: `${haremCount} no harem`, inline: true },
            )
            .setFooter({ text: `Naolli • Solicitado por ${message.author.username}` });

        message.reply({ embeds: [embed] });
    }
};
