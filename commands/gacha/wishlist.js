const { EmbedBuilder } = require('discord.js');
const { getData } = require('../../database');

module.exports = {
    name: 'wishlist',
    aliases: ['wl'],
    description: 'Ver sua lista de desejos.',
    async execute(message) {
        const wishes = await getData('wishes.json') || {};
        const guildId = message.guild.id;
        const userId = message.author.id;

        if (!wishes[guildId] || !wishes[guildId][userId] || wishes[guildId][userId].length === 0) {
            return message.reply('📭 Sua lista de desejos está vazia! Adicione personagens com `n!wish <nome>`.');
        }

        const userWishes = wishes[guildId][userId];
        
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(`🌟 Lista de Desejos de ${message.author.username}`)
            .setDescription(userWishes.map((w, i) => `**${i + 1}.** ${w}`).join('\n'))
            .setFooter({ text: `Total: ${userWishes.length}/10` });

        message.reply({ embeds: [embed] });
    }
};
