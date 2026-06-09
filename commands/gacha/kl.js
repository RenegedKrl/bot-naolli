const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'kakeraloot',
    aliases: ['kl', 'loot'],
    description: 'Abre uma caixa de Loot de Kakera (Custa 1000 K).',
    async execute(message) {
        const guildId = message.guild.id;
        const userId = message.author.id;

        let kakeraConfig = await getData('kakeraConfig.json') || {};
        if (!kakeraConfig[guildId]) kakeraConfig[guildId] = {};
        if (!kakeraConfig[guildId][userId]) kakeraConfig[guildId][userId] = { balance: 0, badges: [] };

        if (kakeraConfig[guildId][userId].balance < 1000) {
            return message.reply('❌ Você não tem 1000 Kakeras para abrir um Kakera Loot!');
        }

        // Desconta
        kakeraConfig[guildId][userId].balance -= 1000;
        await saveData('kakeraConfig.json', kakeraConfig);

        // RNG
        const rand = Math.random();
        let rewardText = '';
        let embedColor = '#8A2BE2';

        if (rand < 0.1) {
            // Jackpot! 5000 Kakera
            kakeraConfig[guildId][userId].balance += 5000;
            await saveData('kakeraConfig.json', kakeraConfig);
            rewardText = '🎉 **JACKPOT!** Você encontrou **5000 Kakeras**!';
            embedColor = '#FFD700';
        } else if (rand < 0.3) {
            // XP Profile
            let profiles = await getData('userProfile.json') || {};
            if (!profiles[guildId]) profiles[guildId] = {};
            if (!profiles[guildId][userId]) profiles[guildId][userId] = { xp: 0, level: 1 };
            
            profiles[guildId][userId].xp += 2500;
            let leveledUp = false;
            while (profiles[guildId][userId].xp >= profiles[guildId][userId].level * 1000) {
                profiles[guildId][userId].xp -= profiles[guildId][userId].level * 1000;
                profiles[guildId][userId].level++;
                leveledUp = true;
            }
            await saveData('userProfile.json', profiles);
            rewardText = '🆙 Poção de Experiência: Você ganhou **+2500 XP** de Colecionador!' + (leveledUp ? `\nVocê subiu para o nível **${profiles[guildId][userId].level}**!` : '');
        } else if (rand < 0.6) {
            // Kakera Back
            kakeraConfig[guildId][userId].balance += 1500;
            await saveData('kakeraConfig.json', kakeraConfig);
            rewardText = '💎 Saco de Pedras: Você ganhou **1500 Kakeras**! (Lucro de 500)';
        } else if (rand < 0.8) {
            // Reset Claim Timer
            let limits = await getData('gachaLimits.json') || {};
            const key = `${guildId}_${userId}`;
            if (!limits[key]) limits[key] = { rolls: 10, lastRollReset: Date.now(), claims: 1, lastClaimReset: Date.now() };
            
            limits[key].claims += 1;
            await saveData('gachaLimits.json', limits);
            rewardText = '💖 Ticket do Amor: Você ganhou **+1 Claim** extra imediato!';
        } else {
            // Bad luck
            rewardText = '🗑️ Lixo Cósmico: A caixa estava vazia... Que azar.';
            embedColor = '#b0b0b0';
        }

        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle('🎁 Kakera Loot Aberto!')
            .setDescription(rewardText)
            .setFooter({ text: `Saldo atual: ${kakeraConfig[guildId][userId].balance} K` });

        message.reply({ embeds: [embed] });
    }
};
