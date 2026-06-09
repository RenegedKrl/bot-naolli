const { EmbedBuilder } = require('discord.js');
const { getData } = require('../../database');

module.exports = {
    name: 'topservk',
    aliases: ['tsk', 'topkakera'],
    description: 'Mostra o rank de Kakeras do servidor.',
    async execute(message, args) {
        const kakeraConfig = await getData('kakeraConfig.json');
        const guildId = message.guild.id;

        if (!kakeraConfig[guildId] || Object.keys(kakeraConfig[guildId]).length === 0) {
            return message.reply('⚠️ Ninguém no servidor possui Kakeras ainda.');
        }

        const users = Object.entries(kakeraConfig[guildId])
            .map(([userId, balance]) => ({ userId, balance }))
            .filter(u => u.balance > 0)
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 10); // Top 10

        if (users.length === 0) {
            return message.reply('⚠️ Ninguém no servidor possui Kakeras ainda.');
        }

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

            description += `${medal}${userTag} - **${userObj.balance}** Kakeras\n`;
        }

        const embed = new EmbedBuilder()
            .setColor('#4169E1')
            .setTitle(`🏆 Rank de Kakera - ${message.guild.name}`)
            .setDescription(description);

        message.reply({ embeds: [embed] });
    }
};
