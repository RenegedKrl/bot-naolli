const { getData } = require('../../database');
const { EmbedBuilder } = require('discord.js');

function getXpRequired(level) {
    if (level >= 10) return Infinity; // Nível máximo
    // Escala progressiva de XP para cada nível
    const thresholds = [100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000];
    return thresholds[level] || Infinity;
}

module.exports = {
    name: 'level',
    aliases: ['rank', 'xp'],
    async execute(message, args) {
        const targetUser = message.mentions.users.first() || message.author;
        
        const allData = await getData('levelData.json');
        const guildData = allData[message.guild.id] || {};
        const userData = guildData[targetUser.id] || { xp: 0, level: 0 };

        const currentXp = userData.xp;
        const currentLevel = userData.level;
        
        const nextXp = getXpRequired(currentLevel);
        const xpNeeded = nextXp - currentXp;

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setAuthor({ name: targetUser.username, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
            .setTitle(`🏆 Perfil de Nível`)
            .addFields(
                { name: 'Nível Atual', value: `**${currentLevel}** ${currentLevel === 10 ? ' (MÁXIMO)' : ''}`, inline: true },
                { name: 'XP Total', value: `**${currentXp}** XP`, inline: true }
            );

        if (currentLevel < 10) {
            // Barra de progresso visual
            const prevXp = currentLevel === 0 ? 0 : getXpRequired(currentLevel - 1);
            const xpInCurrentLevel = currentXp - prevXp;
            const xpRequiredForThisLevel = nextXp - prevXp;
            const percent = Math.floor((xpInCurrentLevel / xpRequiredForThisLevel) * 10);
            
            const progressBar = '🟦'.repeat(percent) + '⬜'.repeat(10 - percent);
            
            embed.addFields({ 
                name: 'Progresso para o próximo Nível', 
                value: `${progressBar} \n(Faltam **${xpNeeded} XP** para o Nível ${currentLevel + 1})`, 
                inline: false 
            });
        }

        return message.reply({ embeds: [embed] });
    }
};
