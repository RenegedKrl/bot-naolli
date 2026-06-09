const { EmbedBuilder } = require('discord.js');
const { getData } = require('../../database');

module.exports = {
    name: 'profile',
    aliases: ['pr', 'perfil'],
    description: 'Mostra o seu perfil do servidor.',
    async execute(message, args) {
        const target = message.mentions.users.first() || message.author;
        const guildId = message.guild.id;
        
        const gachaConfig = await getData('gachaConfig.json');
        const kakeraConfig = await getData('kakeraConfig.json');
        const userProfileConfig = await getData('userProfile.json') || {};

        const harem = gachaConfig[guildId] ? Object.values(gachaConfig[guildId]).filter(c => c.ownerId === target.id) : [];
        const kakera = kakeraConfig[guildId]?.[target.id] || 0;
        
        let favCharText = 'Nenhum definido (Use `n!fm`)';
        let favImage = target.displayAvatarURL({ dynamic: true });
        
        let gachaLevel = 1;
        let gachaXp = 0;
        let nextXp = 1000;
        
        if (userProfileConfig[guildId] && userProfileConfig[guildId][target.id]) {
            const favData = userProfileConfig[guildId][target.id];
            if (favData.favoriteName) {
                favCharText = `⭐ **${favData.favoriteName}**`;
                favImage = favData.favoriteImage || favImage;
            }
            gachaLevel = favData.level || 1;
            gachaXp = favData.xp || 0;
            nextXp = gachaLevel * 1000;
        }

        const embed = new EmbedBuilder()
            .setColor('#FF1493')
            .setTitle(`👤 Perfil de ${target.username}`)
            .setThumbnail(favImage)
            .addFields(
                { name: '🌟 Nível Colecionador', value: `Lvl **${gachaLevel}** (${gachaXp}/${nextXp} XP)`, inline: false },
                { name: '💍 Harém', value: `${harem.length} personagens`, inline: true },
                { name: '💎 Kakera', value: `${kakera}`, inline: true },
                { name: '⭐ Favorito', value: favCharText, inline: false }
            );

        message.reply({ embeds: [embed] });
    }
};
