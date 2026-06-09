const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'givekakera',
    aliases: ['gk', 'doarkakera'],
    description: 'Dá seus Kakeras para outro usuário.',
    async execute(message, args) {
        const target = message.mentions.users.first();
        if (!target) return message.reply('⚠️ Você precisa mencionar o usuário para quem deseja dar Kakeras. Ex: `n!gk @usuario 100`');
        
        if (target.id === message.author.id) return message.reply('⚠️ Você não pode dar Kakeras para si mesmo.');
        if (target.bot) return message.reply('⚠️ Você não pode dar Kakeras para bots.');

        const amountStr = args[1];
        const amount = parseInt(amountStr);

        if (!amountStr || isNaN(amount) || amount <= 0) {
            return message.reply('⚠️ Você precisa especificar uma quantidade válida de Kakeras maior que zero. Ex: `n!gk @usuario 100`');
        }

        const kakeraConfig = await getData('kakeraConfig.json');
        const guildId = message.guild.id;

        if (!kakeraConfig[guildId]) kakeraConfig[guildId] = {};
        
        const senderBalance = kakeraConfig[guildId][message.author.id] || 0;

        if (senderBalance < amount) {
            return message.reply(`❌ Você não possui Kakeras suficientes. Seu saldo: **${senderBalance}**.`);
        }

        kakeraConfig[guildId][message.author.id] -= amount;
        kakeraConfig[guildId][target.id] = (kakeraConfig[guildId][target.id] || 0) + amount;

        await saveData('kakeraConfig.json', kakeraConfig);

        const embed = new EmbedBuilder()
            .setColor('#4169E1')
            .setTitle('💎 Transferência de Kakera')
            .setDescription(`**${message.author.username}** transferiu **${amount}** Kakeras para **${target.username}**!`);

        message.reply({ embeds: [embed] });
    }
};
