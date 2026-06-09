const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'rep',
    aliases: ['reputacao', 'reputação', 'upvote'],
    description: 'Dê +1 ponto de reputação para outro usuário (1x por dia).',
    async execute(message, args) {
        const target = message.mentions.users.first();
        const guildId = message.guild.id;
        const userId = message.author.id;

        if (!target) return message.reply('⚠️ Use: `n!rep @usuario` | Veja reputação: `n!rep info @usuario`');
        if (args[0]?.toLowerCase() === 'info') {
            const infoTarget = message.mentions.users.first() || message.author;
            let repData = await getData('repData.json') || {};
            const rep = repData[guildId]?.[infoTarget.id]?.total || 0;
            return message.reply(`⭐ **${infoTarget.username}** tem **${rep} pontos** de reputação!`);
        }

        if (target.id === userId) return message.reply('❌ Você não pode se dar reputação!');
        if (target.bot) return message.reply('❌ Bots não podem receber reputação!');

        const today = new Date().toISOString().slice(0, 10);
        let repData = await getData('repData.json') || {};
        if (!repData[guildId]) repData[guildId] = {};

        // Check cooldown
        const senderData = repData[guildId][userId] || {};
        if (senderData.lastGiven === today) {
            return message.reply('⏳ Você já deu reputação hoje! Volte amanhã.');
        }

        if (!repData[guildId][target.id]) repData[guildId][target.id] = { total: 0, lastGiven: null };
        repData[guildId][target.id].total += 1;
        repData[guildId][userId] = { ...senderData, lastGiven: today };
        await saveData('repData.json', repData);

        // Bonus Kakera por rep
        let kakeraConfig = await getData('kakeraConfig.json') || {};
        if (!kakeraConfig[guildId]) kakeraConfig[guildId] = {};
        if (!kakeraConfig[guildId][target.id]) kakeraConfig[guildId][target.id] = { balance: 0, badges: [] };
        kakeraConfig[guildId][target.id].balance += 30;
        await saveData('kakeraConfig.json', kakeraConfig);

        const totalRep = repData[guildId][target.id].total;
        message.reply(`⭐ **${message.author.username}** deu +1 de reputação para **${target.username}**!\nReputation total: **${totalRep}** | +30 Kakeras de bônus!`);
    }
};
