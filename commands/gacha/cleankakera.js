const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'cleankakera',
    aliases: ['resetkakera'],
    description: '(Admin) Reseta os kakeras de alguém ou do servidor inteiro.',
    async execute(message, args) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('⚠️ Apenas administradores podem usar este comando.');
        }

        const target = message.mentions.users.first();
        const kakeraConfig = await getData('kakeraConfig.json');
        const guildId = message.guild.id;

        if (!kakeraConfig[guildId]) {
            return message.reply('⚠️ Não há registros de Kakera neste servidor.');
        }

        if (target) {
            kakeraConfig[guildId][target.id] = 0;
            await saveData('kakeraConfig.json', kakeraConfig);
            return message.reply(`✅ Os Kakeras de **${target.username}** foram resetados para 0.`);
        }

        if (args[0] === 'all' || args[0] === 'todos') {
            kakeraConfig[guildId] = {};
            await saveData('kakeraConfig.json', kakeraConfig);
            return message.reply(`✅ O saldo de Kakera de **TODOS** os membros do servidor foi resetado para 0.`);
        }

        message.reply('⚠️ Para resetar o Kakera de alguém, mencione a pessoa: `n!cleankakera @usuario`. Para resetar todos, use `n!cleankakera all`.');
    }
};
