const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

const ACHIEVEMENTS = [
    { id: 'first_roll', name: '🎲 Primeiro Roll', desc: 'Faça o seu primeiro roll!', xpReward: 0, kReward: 50 },
    { id: 'first_claim', name: '💍 Primeiro Casamento', desc: 'Case com seu primeiro personagem.', xpReward: 0, kReward: 100 },
    { id: 'collector_10', name: '📦 Colecionador Iniciante', desc: 'Tenha 10 personagens no harem.', xpReward: 0, kReward: 300 },
    { id: 'collector_50', name: '📦 Colecionador Avançado', desc: 'Tenha 50 personagens no harem.', xpReward: 0, kReward: 1000 },
    { id: 'battle_10', name: '⚔️ Guerreiro', desc: 'Vença 10 batalhas RPG.', xpReward: 0, kReward: 500 },
    { id: 'level_10', name: '🆙 Veterano', desc: 'Alcance o nível 10 no RPG.', xpReward: 0, kReward: 800 },
    { id: 'rich_1000', name: '💎 Milionário Iniciante', desc: 'Acumule 1000 Kakeras.', xpReward: 0, kReward: 200 },
    { id: 'rich_10000', name: '💎 Grande Empresário', desc: 'Acumule 10.000 Kakeras.', xpReward: 0, kReward: 500 },
    { id: 'gambler', name: '🎰 Viciado em Jogo', desc: 'Use o Caça-Níqueis 10 vezes.', xpReward: 0, kReward: 300 },
    { id: 'legendary', name: '🟡 Caçador Lendário', desc: 'Pegue um personagem Lendário no roll.', xpReward: 0, kReward: 2000 },
];

module.exports = {
    name: 'conquistas',
    aliases: ['achievements', 'trofeus', 'ach'],
    description: 'Veja todas as conquistas disponíveis e as suas.',
    async execute(message, args) {
        const guildId = message.guild.id;
        const userId = message.author.id;

        let achData = await getData('achievements.json') || {};
        const userAchs = achData[guildId]?.[userId] || [];

        const embed = new EmbedBuilder()
            .setColor('#C0A050')
            .setTitle(`🏆 Conquistas de ${message.author.username}`)
            .setDescription(`**${userAchs.length}/${ACHIEVEMENTS.length}** conquistadas.\n\n` +
                ACHIEVEMENTS.map(a => {
                    const done = userAchs.includes(a.id);
                    return `${done ? '✅' : '🔒'} **${a.name}**\n${a.desc}\n💎 Recompensa: ${a.kReward} Kakeras`;
                }).join('\n\n'))
            .setFooter({ text: 'Conquistas são verificadas automaticamente!' });

        message.reply({ embeds: [embed] });
    }
};

// Exporta a lista para ser usada em outros módulos
module.exports.ACHIEVEMENTS = ACHIEVEMENTS;
module.exports.checkAchievement = async function(guildId, userId, achievementId, channel) {
    let achData = await getData('achievements.json') || {};
    if (!achData[guildId]) achData[guildId] = {};
    if (!achData[guildId][userId]) achData[guildId][userId] = [];

    if (!achData[guildId][userId].includes(achievementId)) {
        const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!ach) return;

        achData[guildId][userId].push(achievementId);
        await saveData('achievements.json', achData);

        // Dar recompensa
        let kakeraConfig = await getData('kakeraConfig.json') || {};
        if (!kakeraConfig[guildId]) kakeraConfig[guildId] = {};
        if (!kakeraConfig[guildId][userId]) kakeraConfig[guildId][userId] = { balance: 0, badges: [] };
        kakeraConfig[guildId][userId].balance += ach.kReward;
        await saveData('kakeraConfig.json', kakeraConfig);

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(`🏆 Conquista Desbloqueada!`)
            .setDescription(`<@${userId}> desbloqueou: **${ach.name}**\n*${ach.desc}*\n\n💎 +${ach.kReward} Kakeras de recompensa!`);

        if (channel) channel.send({ embeds: [embed] }).catch(() => {});
    }
};
