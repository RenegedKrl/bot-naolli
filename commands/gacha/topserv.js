const { EmbedBuilder } = require('discord.js');
const { getData } = require('../../database');

module.exports = {
    name: 'topserv',
    aliases: ['ts', 'topchars'],
    description: 'Mostra o rank de personagens do servidor.',
    async execute(message, args) {
        const gachaConfig = await getData('gachaConfig.json');
        const guildId = message.guild.id;

        if (!gachaConfig[guildId] || Object.keys(gachaConfig[guildId]).length === 0) {
            return message.reply('⚠️ Ninguém no servidor possui personagens ainda.');
        }

        const counts = {};
        for (const char of Object.values(gachaConfig[guildId])) {
            counts[char.ownerId] = (counts[char.ownerId] || 0) + 1;
        }

        const users = Object.entries(counts)
            .map(([userId, count]) => ({ userId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10

        let description = '';
        for (let i = 0; i < users.length; i++) {
            const userObj = users[i];
            let userTag = 'Usuário Desconhecido';
            
            try {
                const user = await message.client.users.fetch(userObj.userId);
                userTag = user.username;
            } catch (e) {
                // Ignore
            }

            let medal = '';
            if (i === 0) medal = '🥇 ';
            else if (i === 1) medal = '🥈 ';
            else if (i === 2) medal = '🥉 ';
            else medal = `**${i + 1}.** `;

            description += `${medal}${userTag} - **${userObj.count}** Personagens\n`;
        }

        const embed = new EmbedBuilder()
            .setColor('#FF1493')
            .setTitle(`🏆 Rank de Personagens - ${message.guild.name}`)
            .setDescription(description);

        message.reply({ embeds: [embed] });
    }
};
