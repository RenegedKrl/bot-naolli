const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'dailykakera',
    aliases: ['dk', 'daily'],
    description: 'Resgata seus Kakeras diários.',
    async execute(message, args) {
        const kakeraConfig = await getData('kakeraConfig.json');
        const guildId = message.guild.id;
        const userId = message.author.id;

        if (!kakeraConfig[guildId]) kakeraConfig[guildId] = {};
        if (!kakeraConfig['lastDaily']) kakeraConfig['lastDaily'] = {};
        if (!kakeraConfig['lastDaily'][guildId]) kakeraConfig['lastDaily'][guildId] = {};

        const lastClaim = kakeraConfig['lastDaily'][guildId][userId] || 0;
        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000; // 24 hours

        if (now - lastClaim < cooldown) {
            const timeLeft = cooldown - (now - lastClaim);
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            return message.reply(`⏳ Você já resgatou seu Daily Kakera! Tente novamente em **${hours}h e ${minutes}m**.`);
        }

        const amount = Math.floor(Math.random() * 200) + 100; // 100 to 300 kakera
        
        kakeraConfig[guildId][userId] = (kakeraConfig[guildId][userId] || 0) + amount;
        kakeraConfig['lastDaily'][guildId][userId] = now;

        await saveData('kakeraConfig.json', kakeraConfig);

        const embed = new EmbedBuilder()
            .setColor('#4169E1')
            .setTitle('💎 Daily Kakera')
            .setDescription(`Você resgatou **${amount}** Kakeras diários!\nAgora você tem **${kakeraConfig[guildId][userId]}** Kakeras.`);

        message.reply({ embeds: [embed] });
    }
};
