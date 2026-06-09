const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'wish',
    aliases: ['w', 'desejo'],
    description: 'Adiciona um personagem à sua lista de desejos.',
    async execute(message, args) {
        if (!args.length) return message.reply('⚠️ Digite o nome do personagem que deseja adicionar! Ex: `n!wish Naruto`');

        const charName = args.join(' ').toLowerCase();
        let wishes = await getData('wishes.json') || {};
        const guildId = message.guild.id;
        const userId = message.author.id;

        if (!wishes[guildId]) wishes[guildId] = {};
        if (!wishes[guildId][userId]) wishes[guildId][userId] = [];

        if (wishes[guildId][userId].includes(charName)) {
            // Remove da wishlist
            wishes[guildId][userId] = wishes[guildId][userId].filter(w => w !== charName);
            await saveData('wishes.json', wishes);
            return message.reply(`🗑️ **${charName}** foi removido da sua lista de desejos!`);
        }

        if (wishes[guildId][userId].length >= 10) {
            return message.reply('❌ Sua lista de desejos já está cheia! (Máx: 10). Use o comando novamente em um personagem salvo para removê-lo.');
        }

        wishes[guildId][userId].push(charName);
        await saveData('wishes.json', wishes);

        message.reply(`🌟 **${charName}** foi adicionado à sua lista de desejos! Você será avisado quando ele cair na roleta.`);
    }
};
