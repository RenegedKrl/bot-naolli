const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'givescrap',
    aliases: ['darscrap'],
    description: '(Admin) Dá kakera scraps para o servidor ou usuário.',
    async execute(message, args) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('⚠️ Apenas administradores podem usar este comando.');
        }

        const amountStr = args[0];
        const amount = parseInt(amountStr);

        if (!amountStr || isNaN(amount) || amount <= 0) {
            return message.reply('⚠️ Especifique uma quantidade válida de scraps. Ex: `n!givescrap 500`');
        }

        const kakeraConfig = await getData('kakeraConfig.json');
        const guildId = message.guild.id;

        if (!kakeraConfig['scraps']) kakeraConfig['scraps'] = {};
        kakeraConfig['scraps'][guildId] = (kakeraConfig['scraps'][guildId] || 0) + amount;

        await saveData('kakeraConfig.json', kakeraConfig);

        message.reply(`✅ Foram adicionados **${amount}** Kakera Scraps ao banco de dados deste servidor!`);
    }
};
