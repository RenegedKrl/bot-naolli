const { EmbedBuilder } = require('discord.js');
module.exports = {
    name: 'cat',
    aliases: ['gato', 'miau'],
    async execute(message) {
        try {
            const res = await fetch('https://api.thecatapi.com/v1/images/search');
            const data = await res.json();
            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('🐱 Meow!')
                .setImage(data[0].url);
            message.reply({ embeds: [embed] });
        } catch (error) {
            message.reply('❌ Falha ao buscar um gatinho.');
        }
    }
};
