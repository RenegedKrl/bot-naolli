const { EmbedBuilder } = require('discord.js');
const { getData } = require('../../database');

module.exports = {
    name: 'left',
    aliases: ['restantes'],
    description: 'Mostra quantos personagens já foram pegos e quantos faltam.',
    async execute(message, args) {
        const config = await getData('gachaConfig.json');
        const guildId = message.guild.id;

        const claimedCount = config[guildId] ? Object.keys(config[guildId]).length : 0;
        
        // Anilist has around 130,000+ characters, but we can't know the exact number dynamically without a complex query
        const totalEstimatedCharacters = 130000;
        const leftCount = totalEstimatedCharacters - claimedCount;

        const embed = new EmbedBuilder()
            .setColor('#FF1493')
            .setTitle('📊 Estatísticas do Servidor')
            .addFields(
                { name: 'Personagens Pegos', value: `**${claimedCount.toLocaleString()}**`, inline: true },
                { name: 'Restantes (Estimado)', value: `**${leftCount.toLocaleString()}**`, inline: true }
            )
            .setFooter({ text: 'O total de personagens é uma estimativa baseada no banco de dados do Anilist.' });

        message.reply({ embeds: [embed] });
    }
};
