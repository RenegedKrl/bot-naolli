const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'kakerascrap',
    aliases: ['ks', 'scrap'],
    description: 'Mostra a quantidade de Kakera Scraps do servidor.',
    async execute(message, args) {
        const kakeraConfig = await getData('kakeraConfig.json');
        const guildId = message.guild.id;

        if (!kakeraConfig['scraps']) kakeraConfig['scraps'] = {};
        const scraps = kakeraConfig['scraps'][guildId] || 0;

        const embed = new EmbedBuilder()
            .setColor('#A9A9A9')
            .setTitle('⚙️ Kakera Scraps')
            .setDescription(`Este servidor possui **${scraps}** Kakera Scraps acumulados.\n*(Scraps podem ser usados para recompensas globais de servidor)*`);

        message.reply({ embeds: [embed] });
    }
};
